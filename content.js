(function() {
  // --- Garde d'idempotence ---
  if (window.imageDownloaderScriptLoaded) {
    return; // Script déjà injecté, on ne fait rien.
  }
  window.imageDownloaderScriptLoaded = true;

  // --- Variables globales du script ---
  let lastUrl = window.location.href;

  // --- Fonctions principales ---

  function getImageType(src) {
    const extension = src.split('.').pop().toLowerCase().split('?')[0];
    switch (extension) {
      case 'jpg': case 'jpeg': return 'JPEG';
      case 'png': return 'PNG';
      case 'gif': return 'GIF';
      case 'webp': return 'WEBP';
      case 'svg': return 'SVG';
      case 'bmp': return 'BMP';
      default: return 'UNKNOWN';
    }
  }

  function detectImages() {
    const images = [];
    const imgElements = document.querySelectorAll('img');
    imgElements.forEach((img, index) => {
      const imgSrc = img.src || img.dataset.src || img.getAttribute('data-src');
      if (imgSrc && (imgSrc.startsWith('http') || imgSrc.startsWith('data:'))) {
        const imageData = {
          id: `img_${index}`,
          src: imgSrc,
          alt: img.alt || '',
          width: img.naturalWidth || img.width || 0,
          height: img.naturalHeight || img.height || 0,
          type: getImageType(imgSrc),
        };
        if (imageData.width > 1 && imageData.height > 1) {
          images.push(imageData);
        }
      }
    });
    return images;
  }

  function groupImagesByDimensions(images) {
    const groups = {};
    images.forEach(image => {
      const key = `${image.width}x${image.height}`;
      if (!groups[key]) {
        groups[key] = { dimension: key, width: image.width, height: image.height, images: [] };
      }
      groups[key].images.push(image);
    });
    return Object.values(groups).sort((a, b) => b.images.length - a.images.length);
  }

  function storeImagesData() {
    const images = detectImages();
    const groupedImages = groupImagesByDimensions(images);
    chrome.storage.local.set({
      'detectedImages': images,
      'groupedImages': groupedImages,
      'pageUrl': window.location.href,
      'pageTitle': document.title
    });
  }

  function handlePageUpdate(source) {
    console.log(`Image Downloader: Page update triggered by: ${source}`);
    setTimeout(storeImagesData, 500); // Delay to allow images to load
  }

  function interceptMangaDexRequests() {
    const processMangaDexData = (data) => {
      if (data && data.chapter && (data.chapter.data || data.chapter.dataSaver)) {
        handlePageUpdate('MangaDex API Intercept');
      }
    };
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const response = await originalFetch.apply(this, args);
      if (response.url.includes('mangadex.org/api')) {
        const clonedResponse = response.clone();
        try {
          const data = await clonedResponse.json();
          processMangaDexData(data);
        } catch (e) {}
      }
      return response;
    };
  }

  // --- Initialisation de l'extension ---

  function initializeExtension() {
    console.log('Image Downloader: Initializing content script.');

    if (window.location.hostname.includes('mangadex.org')) {
      console.log('Image Downloader: MangaDex site detected.');
      interceptMangaDexRequests();
    }

    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        handlePageUpdate('MutationObserver URL change');
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    handlePageUpdate('Initialisation');
  }

  // --- Listeners d'événements ---

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getImageCount') {
      const images = detectImages();
      sendResponse({ success: true, count: images.length });
    } else if (request.action === 'getAllImages') {
      const images = detectImages();
      const groupedImages = groupImagesByDimensions(images);
      sendResponse({ success: true, images: images, groups: groupedImages });
    }
    return true; // Keep message channel open for async response
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
  } else {
    initializeExtension();
  }

})();