// Script pour la page de visualisation des images

let allImages = [];
let groupedImages = [];
let selectedImages = new Set();
let pageInfo = {};
let selectedFormat = 'original';

// Initialisation de la page
document.addEventListener('DOMContentLoaded', async () => {
  await loadImagesData();
  setupEventListeners();
  renderImages();
  
  // Initialiser les fonctionnalités supplémentaires
  addCollapseFeature();
  
  // Restaurer l'état après un délai pour laisser le temps aux groupes de se charger
  setTimeout(restoreCollapsedState, 500);
});

// Charger les données des images depuis le storage
async function loadImagesData() {
  try {
    const data = await chrome.storage.local.get(['detectedImages', 'groupedImages', 'pageUrl', 'pageTitle']);
    
    if (data.detectedImages && data.groupedImages) {
      allImages = data.detectedImages;
      groupedImages = data.groupedImages;
      pageInfo = {
        url: data.pageUrl || 'Page inconnue',
        title: data.pageTitle || 'Titre inconnu'
      };
    } else {
      // Si pas de données, essayer de récupérer depuis l'onglet actif
      await getImagesFromActiveTab();
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
  }
}

// Récupérer les images depuis l'onglet actif
async function getImagesFromActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getAllImages' });
    
    if (response && response.success) {
      allImages = response.images;
      groupedImages = response.groups;
      pageInfo = {
        url: tab.url,
        title: tab.title
      };
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des images:', error);
  }
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
  const selectAllBtn = document.getElementById('selectAllBtn');
  const downloadZipBtn = document.getElementById('downloadZipBtn');
  
  selectAllBtn.addEventListener('click', toggleSelectAll);
  downloadZipBtn.addEventListener('click', downloadSelectedAsZip);
  
  // Gérer les boutons de format
  document.querySelectorAll('.format-option').forEach(button => {
    button.addEventListener('click', (e) => {
      updateDownloadFormat(e.target.dataset.format);
    });
  });
}

// Rendu des images
function renderImages() {
  const loadingDiv = document.getElementById('loading');
  const noImagesDiv = document.getElementById('noImages');
  const imagesContainer = document.getElementById('imagesContainer');
  const pageInfoElement = document.getElementById('pageInfo');
  const totalImagesElement = document.getElementById('totalImages');
  
  // Masquer le loading
  loadingDiv.style.display = 'none';
  
  // Mettre à jour les informations de la page
  pageInfoElement.textContent = pageInfo.title || 'Page inconnue';
  totalImagesElement.textContent = `${allImages.length} image(s) détectée(s)`;
  
  if (allImages.length === 0) {
    noImagesDiv.style.display = 'block';
    return;
  }
  
  // Afficher le conteneur d'images
  imagesContainer.style.display = 'block';
  
  // Générer le HTML pour chaque groupe
  imagesContainer.innerHTML = groupedImages.map(group => `
    <div class="group">
      <div class="group-header">
        <div>
          <div class="group-title">
            <span class="collapse-icon"></span>
            ${group.dimension}
          </div>
          <div class="group-info">${group.images.length} image(s) • ${group.width}×${group.height} pixels</div>
        </div>
        <div class="group-controls">
          <button class="group-select-btn" data-group="${group.dimension}">
            📋 Sélectionner le groupe
          </button>
        </div>
      </div>
      <div class="images-grid">
        ${group.images.map(image => `
          <div class="image-item" data-image-id="${image.id}">
            <div class="image-container">
              <img src="${image.src}" alt="${image.alt}" loading="lazy">
              <div class="image-overlay">
                <button class="download-single" data-image-id="${image.id}">
                  📥 Télécharger
                </button>
              </div>
            </div>
            <div class="image-info">
              <div>${image.width}×${image.height}</div>
              <div>${image.type}</div>
              ${image.isBackground ? '<div>Image de fond</div>' : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
  
  // Ajouter les écouteurs d'événements pour les checkboxes et boutons
  setupImageEventListeners();
  
  // Ajouter la classe 'loaded' aux images après un court délai pour déclencher l'animation
  setTimeout(() => {
    document.querySelectorAll('.image-item').forEach(item => {
      item.classList.add('loaded');
    });
  }, 100);
}

// Configuration des écouteurs pour les images
function setupImageEventListeners() {
  // Boutons de sélection de groupe
  document.querySelectorAll('.group-select-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const groupDimension = e.target.dataset.group;
      const group = groupedImages.find(g => g.dimension === groupDimension);
      if (!group) return;
      
      const selectedInGroup = group.images.filter(img => selectedImages.has(img.id)).length;
      const shouldSelect = selectedInGroup === 0;
      
      toggleGroupSelection(groupDimension, shouldSelect);
    });
  });
  
  // Boutons de téléchargement individuel
  document.querySelectorAll('.download-single').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const imageId = e.target.dataset.imageId;
      downloadSingleImage(imageId);
    });
  });
  
  // Clic sur l'image pour sélection
  document.querySelectorAll('.image-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // Éviter la sélection si on clique sur le bouton de téléchargement
      if (e.target.closest('.download-single')) return;
      
      const imageId = item.dataset.imageId;
      const isSelected = selectedImages.has(imageId);
      toggleImageSelection(imageId, !isSelected);
    });
  });
}

// Basculer la sélection d'une image avec animations fluides
function toggleImageSelection(imageId, selected) {
  const imageItem = document.querySelector(`[data-image-id="${imageId}"]`);
  
  if (selected) {
    selectedImages.add(imageId);
    imageItem.classList.add('selected');
  } else {
    selectedImages.delete(imageId);
    imageItem.classList.remove('selected');
  }
  
  updateSelectionInfo();
  updateGroupCheckboxes();
}

// Basculer la sélection d'un groupe
function toggleGroupSelection(groupDimension, selected) {
  const group = groupedImages.find(g => g.dimension === groupDimension);
  if (!group) return;
  
  group.images.forEach(image => {
    toggleImageSelection(image.id, selected);
  });
}

// Mettre à jour les boutons de sélection de groupe
function updateGroupCheckboxes() {
  groupedImages.forEach(group => {
    const groupButton = document.querySelector(`.group-select-btn[data-group="${group.dimension}"]`);
    if (!groupButton) return;
    
    const selectedInGroup = group.images.filter(img => selectedImages.has(img.id)).length;
    
    // Supprimer toutes les classes d'état
    groupButton.classList.remove('selected', 'partial');
    
    if (selectedInGroup === 0) {
      // Aucune image sélectionnée
      groupButton.textContent = '📋 Sélectionner le groupe';
    } else if (selectedInGroup === group.images.length) {
      // Toutes les images sélectionnées
      groupButton.classList.add('selected');
      groupButton.textContent = '✅ Groupe sélectionné';
    } else {
      // Sélection partielle
      groupButton.classList.add('partial');
      groupButton.textContent = `📋 ${selectedInGroup}/${group.images.length} sélectionnées`;
    }
  });
}

// Basculer sélection globale
function toggleSelectAll() {
  // Ne rien faire s'il n'y a pas d'images
  if (allImages.length === 0) {
    return;
  }
  
  const selectAllBtn = document.getElementById('selectAllBtn');
  const allSelected = selectedImages.size === allImages.length;
  
  if (allSelected) {
    // Désélectionner tout
    selectedImages.clear();
    document.querySelectorAll('.image-item').forEach(item => item.classList.remove('selected'));
    selectAllBtn.textContent = 'Tout sélectionner';
  } else {
    // Sélectionner tout
    allImages.forEach(image => selectedImages.add(image.id));
    document.querySelectorAll('.image-item').forEach(item => item.classList.add('selected'));
    selectAllBtn.textContent = 'Tout désélectionner';
  }
  
  updateSelectionInfo();
  updateGroupCheckboxes();
}

// Mettre à jour les informations de sélection
function updateSelectionInfo() {
  const selectionInfo = document.getElementById('selectionInfo');
  const downloadZipBtn = document.getElementById('downloadZipBtn');
  const selectAllBtn = document.getElementById('selectAllBtn');
  
  const count = selectedImages.size;
  selectionInfo.textContent = `${count} image(s) sélectionnée(s)`;
  
  // Désactiver le bouton de téléchargement selon les sélections
  downloadZipBtn.disabled = count === 0;
  
  // Désactiver le bouton si aucune image n'est disponible
  if (allImages.length === 0) {
    selectAllBtn.disabled = true;
    selectAllBtn.textContent = 'Aucune image';
  } else {
    selectAllBtn.disabled = false;
    if (count === 0) {
      selectAllBtn.textContent = 'Tout sélectionner';
    } else if (count === allImages.length) {
      selectAllBtn.textContent = 'Tout désélectionner';
    } else {
      selectAllBtn.textContent = 'Tout sélectionner';
    }
  }
}

// Télécharger une image individuelle
async function downloadSingleImage(imageId) {
  const image = allImages.find(img => img.id === imageId);
  if (!image) return;
  
  try {
    const filename = generateFilename(image, selectedFormat);
    
    await chrome.downloads.download({
      url: image.src,
      filename: filename
    });
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    alert('Erreur lors du téléchargement de l\'image');
  }
}

// Télécharger les images sélectionnées en ZIP
async function downloadSelectedAsZip() {
  if (selectedImages.size === 0) return;
  
  const downloadZipBtn = document.getElementById('downloadZipBtn');
  const originalText = downloadZipBtn.textContent;
  
  try {
    downloadZipBtn.textContent = '⏳ Création du ZIP...';
    downloadZipBtn.disabled = true;
    
    const format = selectedFormat;
    const selectedImagesList = allImages.filter(img => selectedImages.has(img.id));
    
    const zip = new JSZip();
    const imageFolder = zip.folder('images');
    
    // Télécharger et ajouter chaque image au ZIP
    for (let i = 0; i < selectedImagesList.length; i++) {
      const image = selectedImagesList[i];
      downloadZipBtn.textContent = `⏳ Traitement ${i + 1}/${selectedImagesList.length}...`;
      
      try {
        const response = await fetch(image.src);
        const blob = await response.blob();
        const filename = generateFilename(image, format);
        imageFolder.file(filename, blob);
      } catch (error) {
        console.warn(`Impossible de télécharger l'image: ${image.src}`, error);
      }
    }
    
    downloadZipBtn.textContent = '⏳ Génération du ZIP...';
    
    // Générer le fichier ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Créer un lien de téléchargement
    const url = URL.createObjectURL(zipBlob);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const zipFilename = `images_${timestamp}.zip`;
    
    await chrome.downloads.download({
      url: url,
      filename: zipFilename
    });
    
    // Nettoyer l'URL
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    alert(`ZIP créé avec succès! ${selectedImagesList.length} images incluses.`);
  } catch (error) {
    console.error('Erreur lors de la création du ZIP:', error);
    alert('Erreur lors de la création du fichier ZIP');
  } finally {
    downloadZipBtn.textContent = originalText;
    downloadZipBtn.disabled = selectedImages.size === 0;
  }
}



// Générer un nom de fichier
function generateFilename(image, format) {
  const timestamp = Date.now();
  const dimension = `${image.width}x${image.height}`;
  
  let extension;
  if (format === 'original') {
    extension = image.type.toLowerCase();
  } else {
    extension = format;
  }
  
  return `image_${dimension}_${timestamp}.${extension}`;
}

// Mettre à jour le format de téléchargement
function updateDownloadFormat(format) {
  selectedFormat = format;
  
  // Mettre à jour l'apparence des boutons
  document.querySelectorAll('.format-option').forEach(button => {
    button.classList.remove('active');
  });
  
  document.querySelector(`[data-format="${format}"]`).classList.add('active');
  
  console.log('Format de téléchargement mis à jour:', format);
}



// Fonction pour ajouter la fonctionnalité de pliage/dépliage
function addCollapseFeature() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('.group-header')) {
      const groupHeader = e.target.closest('.group-header');
      const group = groupHeader.closest('.group');
      
      // Ne pas plier si on clique sur un bouton de sélection
      if (e.target.classList.contains('group-select-btn')) {
        return;
      }
      
      group.classList.toggle('collapsed');
      
      // Sauvegarder l'état des groupes pliés
      const collapsedGroups = Array.from(document.querySelectorAll('.group.collapsed'))
        .map(g => g.querySelector('.group-title').textContent.trim());
      localStorage.setItem('collapsedGroups', JSON.stringify(collapsedGroups));
    }
  });
}

// Fonction pour restaurer l'état des groupes pliés
function restoreCollapsedState() {
  const collapsedGroups = JSON.parse(localStorage.getItem('collapsedGroups') || '[]');
  collapsedGroups.forEach(groupTitle => {
    const group = Array.from(document.querySelectorAll('.group'))
      .find(g => g.querySelector('.group-title').textContent.trim() === groupTitle);
    if (group) {
      group.classList.add('collapsed');
    }
  });
}