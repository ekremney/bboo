import { fetchPlaceholders, readBlockConfig } from '../../scripts/scripts.js';

// eslint-disable-next-line no-unused-vars
function createResultCard(result, prefix, ph) {
  const card = document.createElement('div');
  card.className = `${prefix}-card`;
  card.innerHTML = /* html */`
    <a><img src="${result.image}" alt="${result.title}" width="150" height="150"/></a>
     <div class="${prefix}-card-body">
      <h4><a href="${result.path}">${result.title}</a></h4>
    </div>`;
  return (card);
}

function getBlockHTML(ph) {
  return /* html */`
  <div class="listing-controls"><input id="fulltext" placeholder="${ph.typeToSearch}">
    <p class="listing-results-count"><span id="listing-results-count"></span> ${ph.results}</p>
    <button class="listing-filter-button secondary">${ph.filter}</button>
    <button class="listing-sort-button secondary">${ph.sort}</button>
  </div>
  <div class="listing-facets">
  </div>
  <div class="listing-sortby">
    <p>${ph.sortBy} <span data-sort="best" id="listing-sortby">${ph.bestMatch}</span></p>
    <ul>
      <li data-sort="best">${ph.bestMatch}</li>
      <li data-sort="name">${ph.name}</li>
    </ul>
  </div>
  </div>
  <div class="listing-results">
  </div>`;
}

function getFacetHTML(ph) {
  return /* html */`
  <div><div class="listing-filters"><h2>${ph.filters}</h2>
    <div class="listing-filters-selected"></div>
    <p><button class="listing-filters-clear secondary">${ph.clearAll}</button></p>
    <div class="listing-filters-facetlist"></div>
    </div>
    <div class="listing-apply-filters">
      <button>${ph.seeResults}</button>
  </div></div>`;
}

export async function filterResults(config, facets = {}) {
  /* load index */
  if (!window.listingIndex) {
    const resp = await fetch('/marketplace/query-index.json');
    const json = await resp.json();
    const lookup = {};
    json.data.forEach((row) => {
      lookup[row.path] = row;
    });
    window.listingIndex = { data: json.data, lookup };
  }

  /* simple array lookup */
  if (Array.isArray(config)) {
    const pathnames = config;
    return (pathnames.map((path) => window.pageIndex.lookup[path]).filter((e) => e));
  }

  /* setup config */
  const facetKeys = Object.keys(facets);
  const keys = Object.keys(config);
  const tokens = {};
  keys.forEach((key) => {
    tokens[key] = config[key].split(',').map((t) => t.trim());
  });

  /* filter */
  const results = window.listingIndex.data.filter((row) => {
    const filterMatches = {};
    let matchedAll = keys.every((key) => {
      let matched = false;
      if (row[key]) {
        const rowValues = row[key].split(',').map((t) => t.trim());
        matched = tokens[key].some((t) => rowValues.includes(t));
      }
      if (key === 'fulltext') {
        const fulltext = row.title.toLowerCase();
        matched = fulltext.includes(config.fulltext.toLowerCase());
      }
      filterMatches[key] = matched;
      return matched;
    });

    const isListing = () => !!row.publisher;

    if (!isListing()) matchedAll = false;

    /* facets */
    facetKeys.forEach((facetKey) => {
      let includeInFacet = true;
      Object.keys(filterMatches).forEach((filterKey) => {
        if (filterKey !== facetKey && !filterMatches[filterKey]) includeInFacet = false;
      });
      if (includeInFacet) {
        if (row[facetKey]) {
          const rowValues = row[facetKey].split(',').map((t) => t.trim());
          rowValues.forEach((val) => {
            if (facets[facetKey][val]) {
              facets[facetKey][val] += 1;
            } else {
              facets[facetKey][val] = 1;
            }
          });
        }
      }
    });
    return (matchedAll);
  });
  return results;
}

export default async function decorate(block) {
  const ph = await fetchPlaceholders('/marketplace');

  const addEventListeners = (elements, event, callback) => {
    elements.forEach((e) => {
      e.addEventListener(event, callback);
    });
  };

  let config = [...document.querySelectorAll('a')].map((a) => new URL(a.href).pathname);
  if (!config.length) config = readBlockConfig(block);

  block.innerHTML = getBlockHTML(ph);

  const resultsElement = block.querySelector('.listing-results');
  const facetsElement = block.querySelector('.listing-facets');
  block.querySelector('.listing-filter-button').addEventListener('click', () => {
    block.querySelector('.listing-facets').classList.toggle('visible');
  });

  addEventListeners([
    block.querySelector('.listing-sort-button'),
    block.querySelector('.listing-sortby p'),
  ], 'click', () => {
    block.querySelector('.listing-sortby ul').classList.toggle('visible');
  });

  const sortList = block.querySelector('.listing-sortby ul');
  const selectSort = (selected) => {
    [...sortList.children].forEach((li) => li.classList.remove('selected'));
    selected.classList.add('selected');
    const sortBy = document.getElementById('listing-sortby');
    sortBy.textContent = selected.textContent;
    sortBy.dataset.sort = selected.dataset.sort;
    document.getElementById('listing-sortby').textContent = selected.textContent;
    block.querySelector('.listing-sortby ul').classList.remove('visible');
    // eslint-disable-next-line no-use-before-define
    runSearch(createFilterConfig());
  };

  sortList.addEventListener('click', (event) => {
    selectSort(event.target);
  });

  const highlightResults = (res) => {
    const fulltext = document.getElementById('fulltext').value;
    if (fulltext) {
      res.querySelectorAll('h4').forEach((title) => {
        const content = title.textContent;
        const offset = content.toLowerCase().indexOf(fulltext.toLowerCase());
        if (offset >= 0) {
          title.innerHTML = `${content.substr(0, offset)}<span class="highlight">${content.substr(offset, fulltext.length)}</span>${content.substr(offset + fulltext.length)}`;
        }
      });
    }
  };

  const displayResults = async (results) => {
    resultsElement.innerHTML = '';
    results.forEach((product) => {
      resultsElement.append(createResultCard(product, 'listing', ph));
    });
    highlightResults(resultsElement);
  };

  const getSelectedFilters = () => [...block.querySelectorAll('input[type="checkbox"]:checked')];

  const createFilterConfig = () => {
    const filterConfig = { ...config };
    getSelectedFilters().forEach((checked) => {
      const facetKey = checked.name;
      const facetValue = checked.value;
      if (filterConfig[facetKey]) filterConfig[facetKey] += `, ${facetValue}`;
      else filterConfig[facetKey] = facetValue;
    });
    filterConfig.fulltext = document.getElementById('fulltext').value;
    return (filterConfig);
  };

  const displayFacets = (facets, filters) => {
    const selected = getSelectedFilters().map((check) => check.value);
    facetsElement.innerHTML = getFacetHTML(ph);

    addEventListeners([
      facetsElement.querySelector('.listing-apply-filters button'),
      facetsElement.querySelector(':scope > div'),
      facetsElement,
    ], 'click', (event) => {
      if (event.currentTarget === event.target) block.querySelector('.listing-facets').classList.remove('visible');
    });

    const selectedFilters = block.querySelector('.listing-filters-selected');
    selected.forEach((tag) => {
      const span = document.createElement('span');
      span.className = 'listing-filters-tag';
      span.textContent = tag;
      span.addEventListener('click', () => {
        document.getElementById(`listing-filter-${tag}`).checked = false;
        const filterConfig = createFilterConfig();
        // eslint-disable-next-line no-use-before-define
        runSearch(filterConfig);
      });
      selectedFilters.append(span);
    });

    facetsElement.querySelector('.listing-filters-clear').addEventListener('click', () => {
      selected.forEach((tag) => {
        document.getElementById(`listing-filter-${tag}`).checked = false;
      });
      const filterConfig = createFilterConfig();
      // eslint-disable-next-line no-use-before-define
      runSearch(filterConfig);
    });

    /* list facets */
    const facetsList = block.querySelector('.listing-filters-facetlist');
    const facetKeys = Object.keys(facets);
    facetKeys.forEach((facetKey) => {
      const filter = filters[facetKey];
      const filterValues = filter ? filter.split(',').map((t) => t.trim()) : [];
      const facetValues = Object.keys(facets[facetKey]);
      if (facetValues.length) {
        const div = document.createElement('div');
        div.className = 'listing-facet';
        const h3 = document.createElement('h3');
        h3.innerHTML = ph[facetKey];
        div.append(h3);
        facetValues.forEach((facetValue) => {
          const input = document.createElement('input');
          input.type = 'checkbox';
          input.value = facetValue;
          input.checked = filterValues.includes(facetValue);
          input.id = `listing-filter-${facetValue}`;
          input.name = facetKey;
          const label = document.createElement('label');
          label.setAttribute('for', input.id);
          label.textContent = `${facetValue} (${facets[facetKey][facetValue]})`;
          div.append(input, label);
          input.addEventListener('change', () => {
            const filterConfig = createFilterConfig();
            // eslint-disable-next-line no-use-before-define
            runSearch(filterConfig);
          });
        });
        facetsList.append(div);
      }
    });
  };

  const getPrice = (string) => +string.substr(1);

  const runSearch = async (filterConfig = config) => {
    const facets = {
      category: {},
      listingType: {},
      discoverApps: {},
      businessSize: {},
      dataFlow: {},
      industryServed: {},
      locationRestrictions: {},
    };
    const sorts = {
      name: (a, b) => a.title.localeCompare(b.title),
      'price-asc': (a, b) => getPrice(a.price) - getPrice(b.price),
      'price-desc': (a, b) => getPrice(b.price) - getPrice(a.price),
    };
    const results = await filterResults(filterConfig, facets);
    const sortBy = document.getElementById('listing-sortby') ? document.getElementById('listing-sortby').dataset.sort : 'best';
    if (sortBy && sorts[sortBy]) results.sort(sorts[sortBy]);
    block.querySelector('#listing-results-count').textContent = results.length;
    displayResults(results, null);
    displayFacets(facets, filterConfig);
  };

  const fulltextElement = block.querySelector('#fulltext');
  fulltextElement.addEventListener('input', () => {
    runSearch(createFilterConfig());
  });

  if (!Object.keys(config).includes('fulltext')) {
    fulltextElement.style.display = 'none';
  }

  runSearch(config);
}
