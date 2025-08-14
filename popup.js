// Script pour le popup principal de l'extension

document.addEventListener('DOMContentLoaded', async () => {
  const loadingDiv = document.getElementById('loading');
  const contentDiv = document.getElementById('content');
  const imageCountElement = document.getElementById('imageCount');
  const downloadBtn = document.getElementById('downloadBtn');
  
  try {
    // Obtenir l'onglet actif
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Demander le nombre d'images à la page. Tenter d'abord d'envoyer un message.
    let response;
    try {
        response = await chrome.tabs.sendMessage(tab.id, { action: 'getImageCount' });
    } catch (error) {
        // Si le script ne répond pas, il n'est probablement pas injecté.
        if (error.message.includes('Receiving end does not exist')) {
            // Injecter le script de contenu.
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
            // Attendre que le script s'initialise.
            await new Promise(resolve => setTimeout(resolve, 200));
            // Renvoyer le message.
            response = await chrome.tabs.sendMessage(tab.id, { action: 'getImageCount' });
        } else {
            // Gérer les autres erreurs.
            throw error;
        }
    }
    
    if (response && response.success) {
      // Afficher le nombre d'images
      imageCountElement.textContent = response.count;
      
      // Masquer le loading et afficher le contenu
      loadingDiv.style.display = 'none';
      contentDiv.style.display = 'block';
      
      // Activer/désactiver le bouton selon le nombre d'images
      if (response.count === 0) {
        downloadBtn.disabled = true;
        downloadBtn.textContent = 'Aucune image trouvée';
      } else {
        downloadBtn.disabled = false;
        
        // Gestionnaire de clic pour le bouton de téléchargement
        downloadBtn.addEventListener('click', async () => {
          try {
            // Demander au background script d'ouvrir la page de visualisation
            await chrome.runtime.sendMessage({ action: 'openViewer' });
            
            // Fermer le popup
            window.close();
          } catch (error) {
            console.error('Erreur lors de l\'ouverture de la page de visualisation:', error);
          }
        });
      }
    } else {
      throw new Error('Impossible de détecter les images');
    }
  } catch (error) {
    console.error('Erreur dans le popup:', error);
    
    // Afficher un message d'erreur
    loadingDiv.innerHTML = `
      <div style="color: #ff6b6b; text-align: center;">
        <div>❌</div>
        <div>Erreur de détection</div>
        <div style="font-size: 12px; margin-top: 5px;">Veuillez actualiser la page</div>
      </div>
    `;
  }
});

// Fonction utilitaire pour formater le nombre d'images
function formatImageCount(count) {
  if (count === 0) return 'Aucune';
  if (count === 1) return '1';
  return count.toString();
}