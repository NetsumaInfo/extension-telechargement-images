# Image Downloader - Extension Chrome

Une extension Chrome puissante pour détecter, visualiser et télécharger toutes les images d'une page web avec des options avancées de tri et de format.

## 🚀 Fonctionnalités

### Détection automatique
- Détecte automatiquement toutes les images présentes sur la page web active
- Inclut les images `<img>` et les images de fond CSS
- Affiche le nombre total d'images dans une interface épurée

### Interface utilisateur intuitive
- Popup principal accessible depuis l'icône de l'extension
- Page de visualisation dédiée avec toutes les images détectées
- Images automatiquement regroupées et classées par dimensions
- Sélection individuelle ou par groupe selon les dimensions

### Options de téléchargement
- Téléchargement des images sélectionnées sous forme de fichier ZIP
- Choix du format de téléchargement (PNG, JPEG ou format original)
- Téléchargement individuel de chaque image
- Noms de fichiers automatiques avec dimensions et timestamp

### Sécurité et confidentialité
- Aucune collecte de données utilisateur
- Traitement local des images
- Respect des bonnes pratiques de sécurité Chrome

## 📦 Installation

### Installation en mode développeur

1. **Télécharger l'extension**
   - Clonez ou téléchargez ce dossier sur votre ordinateur

2. **Ouvrir Chrome et accéder aux extensions**
   - Ouvrez Google Chrome
   - Tapez `chrome://extensions/` dans la barre d'adresse
   - Ou allez dans Menu → Plus d'outils → Extensions

3. **Activer le mode développeur**
   - Activez le bouton "Mode développeur" en haut à droite

4. **Charger l'extension**
   - Cliquez sur "Charger l'extension non empaquetée"
   - Sélectionnez le dossier contenant les fichiers de l'extension
   - L'extension apparaîtra dans votre liste d'extensions

5. **Épingler l'extension (optionnel)**
   - Cliquez sur l'icône puzzle dans la barre d'outils
   - Épinglez "Image Downloader" pour un accès rapide

## 🎯 Utilisation

### Étape 1: Détecter les images
1. Naviguez vers une page web contenant des images
2. Cliquez sur l'icône de l'extension dans la barre d'outils
3. Le popup affiche le nombre d'images détectées

### Étape 2: Visualiser et sélectionner
1. Cliquez sur "Télécharger les images" dans le popup
2. Une nouvelle page s'ouvre avec toutes les images groupées par dimensions
3. Sélectionnez les images individuellement ou par groupe
4. Utilisez "Tout sélectionner" pour sélectionner toutes les images

### Étape 3: Télécharger
1. Choisissez le format de téléchargement (PNG, JPEG ou original)
2. Cliquez sur "Télécharger ZIP" pour télécharger toutes les images sélectionnées
3. Ou utilisez le bouton de téléchargement individuel sur chaque image

## 🛠️ Structure du projet

```
image-downloader/
├── manifest.json          # Configuration de l'extension
├── popup.html             # Interface du popup principal
├── popup.js               # Logique du popup
├── viewer.html            # Page de visualisation des images
├── viewer.js              # Logique de la page de visualisation
├── content.js             # Script de détection des images
├── background.js          # Service worker
├── icons/                 # Icônes de l'extension
│   ├── icon16.svg
│   ├── icon32.svg
│   ├── icon48.svg
│   └── icon128.svg
└── README.md              # Documentation
```

## 🔧 Technologies utilisées

- **HTML5** - Structure des interfaces
- **CSS3** - Styles et animations
- **JavaScript ES6+** - Logique de l'application
- **Chrome Extension API** - Intégration avec Chrome
- **Chrome Storage API** - Stockage local des données
- **Chrome Downloads API** - Gestion des téléchargements

## 📋 Permissions requises

- `activeTab` - Accès à l'onglet actif pour détecter les images
- `downloads` - Téléchargement des images
- `storage` - Stockage temporaire des données d'images

## 🐛 Dépannage

### L'extension ne détecte pas d'images
- Actualisez la page web
- Vérifiez que la page contient des images visibles
- Certaines images peuvent être chargées dynamiquement

### Erreur de téléchargement
- Vérifiez les paramètres de téléchargement de Chrome
- Certaines images peuvent être protégées par CORS
- Essayez de télécharger les images individuellement

### L'extension ne s'affiche pas
- Vérifiez que le mode développeur est activé
- Rechargez l'extension dans chrome://extensions/
- Vérifiez la console pour les erreurs

## 🔄 Mises à jour futures

- Support des formats d'image supplémentaires
- Filtrage par taille d'image
- Prévisualisation des images avant téléchargement
- Export en véritable fichier ZIP
- Historique des téléchargements

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou soumettre une pull request.

---

**Note**: Cette extension est conçue pour un usage personnel et éducatif. Respectez les droits d'auteur et les conditions d'utilisation des sites web lors du téléchargement d'images.