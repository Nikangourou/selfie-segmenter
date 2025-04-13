# Frame Definition Mask

Une application interactive qui utilise la segmentation d'image en temps réel pour créer un effet visuel avec des étoiles. L'application utilise la webcam pour détecter la silhouette de l'utilisateur et anime des étoiles en fonction de cette détection.

## Fonctionnalités

- Détection en temps réel de la silhouette via la webcam
- Grille d'étoiles interactive
- Mode debug pour visualiser la détection
- Contrôles personnalisables :
  - Nombre de colonnes et lignes
  - Taille des étoiles
  - Nombre d'étoiles par cellule
  - Seuil de détection
  - Couleur des étoiles
  - Mode debug on/off

## Technologies utilisées

- JavaScript vanilla
- MediaPipe pour la segmentation d'image
- Canvas API pour le rendu
- WebRTC pour l'accès à la webcam

## Installation

1. Clonez le repository :
```bash
git clone [votre-repo-url]
cd frame_definition_mask
```

2. Ouvrez le projet dans un serveur web local. Par exemple avec Python :
```bash
# Python 3
python -m http.server 8000
```

3. Ouvrez votre navigateur et accédez à :
```
http://localhost:8000
```

## Utilisation

1. Autorisez l'accès à votre webcam lorsque le navigateur le demande
2. Utilisez les contrôles sur la droite de l'écran pour ajuster les paramètres :
   - Ajustez le nombre de colonnes et de lignes
   - Modifiez la taille des étoiles
   - Changez le nombre d'étoiles par cellule
   - Réglez le seuil de détection
   - Choisissez la couleur des étoiles
   - Activez/désactivez le mode debug

## Prérequis

- Un navigateur web moderne avec support de WebRTC
- Une webcam
- Un serveur web local pour le développement

## Licence

MIT 