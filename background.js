// Service worker pour l'extension Image Downloader

// Installation de l'extension
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension Image Downloader installée');
  
  if (details.reason === 'install') {
    // Première installation
    console.log('Première installation de l\'extension');
  } else if (details.reason === 'update') {
    // Mise à jour de l'extension
    console.log('Extension mise à jour');
  }
});

// Gestion des messages entre les différentes parties de l'extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message reçu dans le background:', request);
  
  switch (request.action) {
    case 'downloadImage':
      handleImageDownload(request.data, sendResponse);
      return true; // Indique une réponse asynchrone
      
    case 'downloadMultipleImages':
      handleMultipleImageDownload(request.data, sendResponse);
      return true;
      
    case 'getStoredImages':
      handleGetStoredImages(sendResponse);
      return true;

    case 'openViewer':
      handleOpenViewer();
      return true;
      
    default:
      sendResponse({ success: false, error: 'Action non reconnue' });
  }
});

// Gérer le téléchargement d'une image individuelle
async function handleImageDownload(imageData, sendResponse) {
  try {
    const downloadId = await chrome.downloads.download({
      url: imageData.url,
      filename: imageData.filename || `image_${Date.now()}.${imageData.format || 'jpg'}`,
      saveAs: false
    });
    
    sendResponse({ success: true, downloadId: downloadId });
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Gérer le téléchargement de plusieurs images
async function handleMultipleImageDownload(imagesData, sendResponse) {
  try {
    const downloadIds = [];
    const timestamp = Date.now();
    
    for (let i = 0; i < imagesData.length; i++) {
      const image = imagesData[i];
      const filename = `images_batch_${timestamp}/image_${i + 1}_${image.width}x${image.height}.${image.format || 'jpg'}`;
      
      try {
        const downloadId = await chrome.downloads.download({
          url: image.url,
          filename: filename,
          saveAs: false
        });
        
        downloadIds.push(downloadId);
        
        // Petit délai entre les téléchargements pour éviter de surcharger
        if (i < imagesData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (downloadError) {
        console.error(`Erreur lors du téléchargement de l'image ${i + 1}:`, downloadError);
      }
    }
    
    sendResponse({ 
      success: true, 
      downloadIds: downloadIds,
      totalDownloaded: downloadIds.length,
      totalRequested: imagesData.length
    });
  } catch (error) {
    console.error('Erreur lors du téléchargement multiple:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Ouvrir la page de visualisation
async function handleOpenViewer() {
  const viewerUrl = chrome.runtime.getURL('viewer.html');
  await chrome.tabs.create({ url: viewerUrl });
}

// Récupérer les images stockées
async function handleGetStoredImages(sendResponse) {
  try {
    const data = await chrome.storage.local.get(['detectedImages', 'groupedImages', 'pageUrl', 'pageTitle']);
    sendResponse({ success: true, data: data });
  } catch (error) {
    console.error('Erreur lors de la récupération des images stockées:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Nettoyer les données anciennes du storage (optionnel)
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension démarrée');
  
  // Nettoyer les données de plus de 24 heures (désactivé pour le moment)
  // cleanOldStorageData();
});

// Fonction pour nettoyer les anciennes données
async function cleanOldStorageData() {
  try {
    const data = await chrome.storage.local.get();
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // Supprimer les données anciennes (cette logique peut être adaptée selon les besoins)
    const keysToRemove = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('temp_') && value.timestamp && (now - value.timestamp) > oneDayMs) {
        keysToRemove.push(key);
      }
    }
    
    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
      console.log(`Nettoyage effectué: ${keysToRemove.length} entrées supprimées`);
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage du storage:', error);
  }
}

// Gestion des erreurs de téléchargement
chrome.downloads.onChanged.addListener((downloadDelta) => {
  if (downloadDelta.error) {
    console.error('Erreur de téléchargement:', downloadDelta.error);
  } else if (downloadDelta.state && downloadDelta.state.current === 'complete') {
    console.log('Téléchargement terminé:', downloadDelta.id);
  }
});

// Gestion des clics sur l'icône de l'extension (optionnel)
chrome.action.onClicked.addListener((tab) => {
  // Cette fonction sera appelée si aucun popup n'est défini
  console.log('Clic sur l\'icône de l\'extension pour l\'onglet:', tab.url);
});

// Fonction utilitaire pour valider les URLs d'images
function isValidImageUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    
    return imageExtensions.some(ext => pathname.endsWith(ext)) || 
           url.includes('image') || 
           url.includes('img');
  } catch {
    return false;
  }
}

// Fonction pour générer un nom de fichier sécurisé
function sanitizeFilename(filename) {
  // Remplacer les caractères non autorisés par des underscores
  return filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
}