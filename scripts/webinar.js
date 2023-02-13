import { buildBlock, getMetadata, toClassName } from './scripts.js';

function isUpcomingWebinar() {
  const eventDate = new Date(getMetadata('event-date'));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  return eventDate > today;
}

function buildForm(main) {
  const blockContent = [];
  blockContent.push(main.querySelector(':scope > div').innerHTML);

  const formTitle = isUpcomingWebinar() ? 'Register for the Webinar' : 'Watch Now';
  const formSubheading = getMetadata('form-subheading') || 'All you need to do is complete the form below.';

  let partners = getMetadata('partner');
  let logos = '';
  if (partners) {
    partners = [...partners.split(', ')];
    let partnerLogos = '<img src="/assets/partner-logos/bamboohr.svg" alt="BambooHR logo" />';
    partners.forEach((partner) => {
      partnerLogos += `<img src="/assets/partner-logos/${toClassName(partner)}.svg" alt="${partner} logo" />`;
    });
    logos = `<p class="form-logos">${partnerLogos}</p>`;
  }

  blockContent.push(`<p><strong>${formTitle}</strong></p><p>${formSubheading}</p>${logos}<p>form</p>`);
  
  const section = document.createElement('div');
  const block = buildBlock('form', [blockContent]);
  block?.classList?.add('grid-7-5', 'has-content', 'old-style');
  section.prepend(block);
  main.innerHTML = section.outerHTML;
}

async function buildSpeaker(main) {
  const speakers = getMetadata('speaker');
  if (speakers) {
    const container = buildBlock('speaker-container', []);
    main.append(container);

    const title = 'About the speakers';
    const titleBlock = buildBlock('title', title);
    titleBlock?.classList.add('title1', 'color-gray-12');
    titleBlock?.querySelector('div').setAttribute('data-align', 'center');
    main.querySelector('.speaker-container').append(titleBlock);

    const speakerBlock = buildBlock('speaker', []);
    speakerBlock.classList.add('style-2-columns');
    main.querySelector('.speaker-container').append(speakerBlock);
  }
}

function onDemandSuccess(main, webinarTitle) {
  let partners = getMetadata('partner');
  const successPartnerLogos = document.createElement('p');
  if (partners) {
    partners = [...partners.split(', ')];
    let partnerLogos = '<img src="/assets/partner-logos/bamboohr.svg" alt="BambooHR logo" />';
    partners.forEach((partner) => {
      partnerLogos += `<img src="/assets/partner-logos/${toClassName(partner)}.svg" alt="${partner} logo" />`;
    });
    successPartnerLogos.innerHTML = partnerLogos;
    successPartnerLogos.classList.add('success-partner-logos');
  }

  const titleBlock = buildBlock('title', webinarTitle);
  titleBlock.classList.add('hero-header', 'color-1');
  const section = document.createElement('div');
  section.prepend(titleBlock);
  main.prepend(section);

  const subheading = getMetadata('success-subheading');
  if (subheading) {
    const subheadingBlock = buildBlock('title', subheading);
    subheadingBlock.classList.add('hero-subhead', 'color-gray-8');
    main.querySelector('.title')?.after(subheadingBlock);
    main.querySelector('.hero-subhead').after(successPartnerLogos);
  } else {
    main.querySelector('.title').after(successPartnerLogos);
  }

 

  const wistiaVideoId = getMetadata('wistia-video-id');
  const wistiaVideoUrl = `https://bamboohr.wistia.com/medias/${wistiaVideoId}`;
  const wistiaData = [];
  if (wistiaVideoId) {
    wistiaData.push(`<p><a href="${wistiaVideoUrl}"></a></p>`);
    wistiaData.push(`<h3>Watch on demand</h3><p>Please note if this webinar was approved for professional certification, those credits are only sent to registrants who attended the live session and were logged on for the amount of time required by the certification vendor.</p>`);
  }
  if (wistiaData.length > 0) {
    const wistiaBlock = buildBlock('columns', [wistiaData]);
    wistiaBlock?.classList?.add('7-5', 'wistia-columns');
    const wistiaSection = document.createElement('div');
    wistiaSection.prepend(wistiaBlock);
    main.append(wistiaSection);
  }

  const slideShareId = getMetadata('slide-share-id');
  const slideShareData = [];
  if (slideShareId) {
    slideShareData.push(`<h3>Download the slide deck</h3><p>To download a copy of the slides, click on the LinkedIn icon. This will redirect you to the SlideShare site. From there, you can clip your favorite slides or download the entire deck to your computer.</p>`);
    slideShareData.push(`<iframe src="https://www.slideshare.net/slideshow/embed_code/key/${slideShareId}?wmode=opaque" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" allowfullscreen="" width="100%" height="100%" loading="lazy"></iframe>`);
  }
  if (slideShareData.length > 0) {
    const slideShareBlock = buildBlock('columns', [slideShareData]);
    slideShareBlock?.classList?.add('5-7', 'slide-share-columns');
    const slideShareSection = document.createElement('div');
    slideShareSection.prepend(slideShareBlock);
    main.append(slideShareSection);
  }

  const bottomCta = [];
  bottomCta.push('<p class="typ-section-header">Love this webinar? Check out more!</p><p>BambooHR sets you free to do great work. Find out how to keep growing your organization by building your culture, encouraging engagement, choosing strategic benefits and much more.</p>');
  bottomCta.push('<a class="button accent" href="/webinars/" aira-label="Click here to check out our webinar library">Webinar Library</a>');

  const bottomCtaBlock = buildBlock('title', [bottomCta]);
  bottomCtaBlock.classList.add('color-white', 'bottom-cta');
  main.append(bottomCtaBlock);
}

function upcomingSuccess(main, webinarTitle) {
  const imageSrc = getMetadata('og:image');
  const columnData = [];
  if (imageSrc) {
    columnData.push(`<p class="typ-hero-header color-1">See you at the webinar!</p><p>Thanks for registering for our webinar. You should receive an email with the details.
    </p>`);
    columnData.push(`<img src="${imageSrc}" alt="${webinarTitle.textContent}" />`);
  }
  if (columnData.length > 0) {
    const upcomingInfoBlock = buildBlock('columns', [columnData]);
    upcomingInfoBlock?.classList?.add('5-7', 'upcoming-columns');
    const section = document.createElement('div');
    section.prepend(upcomingInfoBlock);
    main.prepend(section);
  }

  const upcomingCta = [];
  upcomingCta.push('<h2 class="typ-section-header color-gray-11">Do you know about BambooHR?</h2><p class="typ-subhead-1">HR is for the people, not the paperwork. That\'s why we created BambooHR</p><p>An online Human Resources Information System that makes time for the work you were meant to do. We invite you to test drive the BambooHR experience completely FREE. See for yourself how simple and easy managing can truly be.</p>');
  upcomingCta.push('<a class="button accent" href="/signup/" aira-label="Try it FREE">Try it FREE</a><a class="button accent" href="/tour/" aira-label="Take the Full Tour">Take the Full Tour</a>');

  const upcomingCtaBlock = buildBlock('title', [upcomingCta]);
  upcomingCtaBlock.classList.add('upcoming-cta');
  const upcomingCtasection = document.createElement('div');
  upcomingCtasection.prepend(upcomingCtaBlock);
  main.append(upcomingCtasection);
}

export default async function decorateTemplate(main) {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const formSubmit = urlParams.get('formSubmit');
  const webinarTitle = main.querySelector('h1');

  if (formSubmit && formSubmit === 'success') {
    if (isUpcomingWebinar()) {
      main.innerHTML = '';
      document.body.classList.add('webinar-success-upcoming');
      upcomingSuccess(main, webinarTitle);
    } else {
      document.body.classList.add('webinar-success-ondemand');
      webinarTitle.remove();
      const aboutWebinar = 'About this webinar';
      const aboutWebinarBlock = buildBlock('title', aboutWebinar);
      aboutWebinarBlock?.classList.add('section-header', 'color-gray-11');
      main.querySelector('picture').replaceWith(aboutWebinarBlock);
      onDemandSuccess(main, webinarTitle);
    }
  } else {
    buildForm(main);
    buildSpeaker(main);
  }
}
