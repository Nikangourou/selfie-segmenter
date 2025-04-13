import { ImageSegmenter, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2";

// Get DOM elements
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("canvas");
const canvasCtx = canvasElement.getContext("2d");
const demosSection = document.getElementById("demos");
let enableWebcamButton;
let webcamRunning = false;
let runningMode = "IMAGE";

// Set canvas to full screen
canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;
canvasElement.style.position = 'absolute';
canvasElement.style.top = '0';
canvasElement.style.left = '0';
canvasElement.style.width = '100%';
canvasElement.style.height = '100%';

// Style the video element to match canvas
video.style.position = 'absolute';
video.style.top = '0';
video.style.left = '0';
video.style.width = '100%';
video.style.height = '100%';
video.style.objectFit = 'cover';

let imageSegmenter;
let labels;

// Grid system variables
let grid = [];
let starsPerCell = 10;
let debugMode = true;

// Paramètres contrôlables
let params = {
    columns: 20,
    rows: 20,
    tailleEtoiles: 2,
    debug: true,
    seuilDetection: 30, // Pourcentage minimum de la case qui doit être couverte par le masque
    starColor: '#FFFFFF', // Couleur des étoiles en format hexadécimal
    starsPerCell: 10 // Nombre d'étoiles par cellule
};

const legendColors = [
  [255, 197, 0, 255], // Vivid Yellow
  [128, 62, 117, 255], // Strong Purple
  [255, 104, 0, 255], // Vivid Orange
  [166, 189, 215, 255], // Very Light Blue
  [193, 0, 32, 255], // Vivid Red
  [206, 162, 98, 255], // Grayish Yellow
  [129, 112, 102, 255], // Medium Gray
  [0, 125, 52, 255], // Vivid Green
  [246, 118, 142, 255], // Strong Purplish Pink
  [0, 83, 138, 255], // Strong Blue
  [255, 112, 92, 255], // Strong Yellowish Pink
  [83, 55, 112, 255], // Strong Violet
  [255, 142, 0, 255], // Vivid Orange Yellow
  [179, 40, 81, 255], // Strong Purplish Red
  [244, 200, 0, 255], // Vivid Greenish Yellow
  [127, 24, 13, 255], // Strong Reddish Brown
  [147, 170, 0, 255], // Vivid Yellowish Green
  [89, 51, 21, 255], // Deep Yellowish Brown
  [241, 58, 19, 255], // Vivid Reddish Orange
  [35, 44, 22, 255], // Dark Olive Green
  [0, 161, 194, 255] // Vivid Blue
];

const createImageSegmenter = async () => {
  const audio = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
  );

  imageSegmenter = await ImageSegmenter.createFromOptions(audio, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite",
      delegate: "GPU"
    },
    runningMode: runningMode,
    outputCategoryMask: true,
    outputConfidenceMasks: false
  });
  labels = imageSegmenter.getLabels();
  demosSection.classList.remove("invisible");
  
  // Create the grid after segmenter is initialized
  createGrid();
  
  // Setup controls
  setupControls();

  // Auto-start webcam
  enableCam();
};
createImageSegmenter();

// Create the grid system
function createGrid() {
    grid = [];
    const width = canvasElement.width;
    const height = canvasElement.height;
    
    for (let i = 0; i < params.columns; i++) {
        grid[i] = [];
        for (let j = 0; j < params.rows; j++) {
            grid[i][j] = new Cell(i, j);
        }
    }
}

// Setup UI controls
function setupControls() {
    // Create controls container if it doesn't exist
    if (!document.getElementById('controls')) {
        const controlsDiv = document.createElement('div');
        controlsDiv.id = 'controls';
        controlsDiv.style.position = 'absolute';
        controlsDiv.style.top = '10px';
        controlsDiv.style.right = '10px';
        controlsDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
        controlsDiv.style.padding = '10px';
        controlsDiv.style.borderRadius = '5px';
        controlsDiv.style.color = 'white';
        controlsDiv.style.zIndex = '1000';
        
        // Create controls content
        controlsDiv.innerHTML = `
            <div>
                <label for="columns">Columns: <span id="columnsValue">${params.columns}</span></label>
                <input type="range" id="columns" min="5" max="50" value="${params.columns}">
            </div>
            <div>
                <label for="rows">Rows: <span id="rowsValue">${params.rows}</span></label>
                <input type="range" id="rows" min="5" max="50" value="${params.rows}">
            </div>
            <div>
                <label for="starSize">Star Size: <span id="starSizeValue">${params.tailleEtoiles}</span></label>
                <input type="range" id="starSize" min="0.5" max="5" step="0.5" value="${params.tailleEtoiles}">
            </div>
            <div>
                <label for="starsPerCell">Stars per Cell: <span id="starsPerCellValue">${params.starsPerCell}</span></label>
                <input type="range" id="starsPerCell" min="1" max="30" value="${params.starsPerCell}">
            </div>
            <div>
                <label for="threshold">Detection Threshold: <span id="thresholdValue">${params.seuilDetection}%</span></label>
                <input type="range" id="threshold" min="1" max="100" value="${params.seuilDetection}">
            </div>
            <div>
                <label for="starColor">Star Color:</label>
                <input type="color" id="starColor" value="${params.starColor}" style="width: 50px;">
            </div>
            <div>
                <button id="debugToggle">Debug: ON</button>
            </div>
        `;
        
        document.body.appendChild(controlsDiv);
        
        // Add event listeners
        document.getElementById('columns').addEventListener('input', function(e) {
            params.columns = parseInt(e.target.value);
            document.getElementById('columnsValue').textContent = params.columns;
            createGrid();
        });
        
        document.getElementById('rows').addEventListener('input', function(e) {
            params.rows = parseInt(e.target.value);
            document.getElementById('rowsValue').textContent = params.rows;
            createGrid();
        });
        
        document.getElementById('starSize').addEventListener('input', function(e) {
            params.tailleEtoiles = parseFloat(e.target.value);
            document.getElementById('starSizeValue').textContent = params.tailleEtoiles;
            createGrid();
        });

        document.getElementById('starsPerCell').addEventListener('input', function(e) {
            params.starsPerCell = parseInt(e.target.value);
            document.getElementById('starsPerCellValue').textContent = params.starsPerCell;
            createGrid();
        });

        document.getElementById('threshold').addEventListener('input', function(e) {
            params.seuilDetection = parseInt(e.target.value);
            document.getElementById('thresholdValue').textContent = params.seuilDetection + '%';
        });

        document.getElementById('starColor').addEventListener('input', function(e) {
            params.starColor = e.target.value;
        });
        
        document.getElementById('debugToggle').addEventListener('click', function() {
            params.debug = !params.debug;
            this.textContent = 'Debug: ' + (params.debug ? 'ON' : 'OFF');
        });
    }
}

const imageContainers = document.getElementsByClassName(
  "segmentOnClick"
);

// Add click event listeners for the img elements.
for (let i = 0; i < imageContainers.length; i++) {
  imageContainers[i]
    .getElementsByTagName("img")[0]
    .addEventListener("click", handleClick);
}

// Get segmentation from the webcam
let lastWebcamTime = -1;
async function predictWebcam() {
  if (video.currentTime === lastWebcamTime) {
    if (webcamRunning === true) {
      window.requestAnimationFrame(predictWebcam);
    }
    return;
  }
  lastWebcamTime = video.currentTime;
  
  // Ajuster le dessin pour couvrir tout l'écran
  canvasCtx.save();
  canvasCtx.scale(canvasElement.width / video.videoWidth, canvasElement.height / video.videoHeight);
  canvasCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
  canvasCtx.restore();
  
  // Do not segmented if imageSegmenter hasn't loaded
  if (imageSegmenter === undefined) {
    return;
  }
  // if image mode is initialized, create a new segmented with video runningMode
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await imageSegmenter.setOptions({
      runningMode: runningMode
    });
  }
  let startTimeMs = performance.now();

  // Start segmenting the stream.
  imageSegmenter.segmentForVideo(video, startTimeMs, callbackForVideo);
}

function callbackForVideo(result) {
    // Ajuster les dimensions pour correspondre au canvas
    const width = canvasElement.width;
    const height = canvasElement.height;
    
    // Effacer le canvas
    canvasCtx.clearRect(0, 0, width, height);
    
    // Dessiner la vidéo uniquement en mode debug
    if (params.debug) {
        // Dessiner d'abord la vidéo mise à l'échelle avec effet miroir
        canvasCtx.save();
        canvasCtx.scale(-width / video.videoWidth, height / video.videoHeight);
        canvasCtx.drawImage(video, -video.videoWidth, 0, video.videoWidth, video.videoHeight);
        canvasCtx.restore();

        // Dessiner le masque avec effet miroir
        const mask = result.categoryMask.getAsFloat32Array();
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = video.videoWidth;
        maskCanvas.height = video.videoHeight;
        const maskCtx = maskCanvas.getContext('2d');
        const maskImageData = maskCtx.createImageData(video.videoWidth, video.videoHeight);
        
        // Remplir les données du masque
        for (let i = 0; i < mask.length; i++) {
            const value = Math.round(mask[i] * 255.0);
            const pixelIndex = i * 4;
            maskImageData.data[pixelIndex] = value === 0 ? 255 : 0;     // Rouge
            maskImageData.data[pixelIndex + 1] = 0;                     // Vert
            maskImageData.data[pixelIndex + 2] = 0;                     // Bleu
            maskImageData.data[pixelIndex + 3] = value === 0 ? 128 : 0; // Alpha
        }
        
        maskCtx.putImageData(maskImageData, 0, 0);
        
        // Dessiner le masque avec effet miroir
        canvasCtx.save();
        canvasCtx.scale(-width / video.videoWidth, height / video.videoHeight);
        canvasCtx.drawImage(maskCanvas, -video.videoWidth, 0, video.videoWidth, video.videoHeight);
        canvasCtx.restore();
    } else {
        // Si le debug est désactivé, remplir le canvas en noir
        canvasCtx.fillStyle = 'black';
        canvasCtx.fillRect(0, 0, width, height);
    }
    
    // Update grid cells based on segmentation mask
    updateGridFromMask(result.categoryMask.getAsFloat32Array(), width, height);
    
    // Draw the grid
    drawGrid();
    
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}

// Update grid cells based on segmentation mask
function updateGridFromMask(mask, width, height) {
    const cellWidth = width / params.columns;
    const cellHeight = height / params.rows;
    const scaleX = width / video.videoWidth;
    const scaleY = height / video.videoHeight;
    
    // Reset all cells
    for (let i = 0; i < params.columns; i++) {
        for (let j = 0; j < params.rows; j++) {
            if (!grid[i] || !grid[i][j]) continue;
            grid[i][j].active = false;
            grid[i][j].maskDetected = false;
            grid[i][j].maskCoverage = 0; // Pourcentage de la case couverte par le masque
        }
    }
    
    // Créer un tableau pour compter les pixels du masque dans chaque cellule
    let cellCounts = Array(params.columns).fill().map(() => 
        Array(params.rows).fill().map(() => ({
            total: 0,      // Nombre total de pixels dans la cellule
            masked: 0      // Nombre de pixels masqués dans la cellule
        }))
    );
    
    // Check each pixel in the mask
    for (let y = 0; y < video.videoHeight; y++) {
        for (let x = 0; x < video.videoWidth; x++) {
            const maskIndex = y * video.videoWidth + x;
            const maskVal = Math.round(mask[maskIndex] * 255.0);
            
            // Convertir les coordonnées du masque en coordonnées d'écran
            const screenX = width - (x * scaleX);
            const screenY = y * scaleY;
            
            // Calculate which cell this pixel belongs to
            const cellI = Math.floor(screenX / cellWidth);
            const cellJ = Math.floor(screenY / cellHeight);
            
            // Si le pixel est dans une cellule valide
            if (cellI >= 0 && cellI < params.columns && cellJ >= 0 && cellJ < params.rows) {
                cellCounts[cellI][cellJ].total++;
                if (maskVal === 0) { // Si le pixel fait partie du masque
                    cellCounts[cellI][cellJ].masked++;
                }
            }
        }
    }
    
    // Activer les cellules qui dépassent le seuil de détection
    for (let i = 0; i < params.columns; i++) {
        for (let j = 0; j < params.rows; j++) {
            if (!grid[i] || !grid[i][j]) continue;
            
            const coverage = (cellCounts[i][j].masked / cellCounts[i][j].total) * 100;
            grid[i][j].maskCoverage = coverage;
            
            if (coverage >= params.seuilDetection) {
                grid[i][j].active = true;
                grid[i][j].maskDetected = true;
            }
        }
    }
}

// Draw the grid with stars
function drawGrid() {
    const width = canvasElement.width;
    const height = canvasElement.height;
    
    // Draw debug overlay if enabled
    if (params.debug) {
        // Draw grid lines
        canvasCtx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        canvasCtx.lineWidth = 1;
        
        for (let i = 0; i <= params.columns; i++) {
            const x = i * (width / params.columns);
            canvasCtx.beginPath();
            canvasCtx.moveTo(x, 0);
            canvasCtx.lineTo(x, height);
            canvasCtx.stroke();
        }
        
        for (let j = 0; j <= params.rows; j++) {
            const y = j * (height / params.rows);
            canvasCtx.beginPath();
            canvasCtx.moveTo(0, y);
            canvasCtx.lineTo(width, y);
            canvasCtx.stroke();
        }
        
        // Highlight active cells
        for (let i = 0; i < params.columns; i++) {
            for (let j = 0; j < params.rows; j++) {
                if (!grid[i] || !grid[i][j]) continue;
                
                if (grid[i][j].maskDetected) {
                    // Utiliser l'opacité en fonction du pourcentage de couverture
                    const opacity = Math.min(0.8, grid[i][j].maskCoverage / 100);
                    canvasCtx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
                    canvasCtx.fillRect(
                        i * (width / params.columns),
                        j * (height / params.rows),
                        width / params.columns,
                        height / params.rows
                    );
                }
            }
        }
    }
    
    // Draw stars
    for (let i = 0; i < params.columns; i++) {
        for (let j = 0; j < params.rows; j++) {
            if (!grid[i] || !grid[i][j]) continue;
            
            const cellX = i * (width / params.columns);
            const cellY = j * (height / params.rows);
            const cellWidth = width / params.columns;
            const cellHeight = height / params.rows;
            
            grid[i][j].display(cellX, cellY, cellWidth, cellHeight);
        }
    }
}

// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Enable the live webcam view and start imageSegmentation.
async function enableCam(event) {
  if (imageSegmenter === undefined) {
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    if (enableWebcamButton) {
      enableWebcamButton.innerText = "ENABLE SEGMENTATION";
    }
  } else {
    webcamRunning = true;
    if (enableWebcamButton) {
      enableWebcamButton.innerText = "DISABLE SEGMENTATION";
    }
  }

  // getUsermedia parameters.
  const constraints = {
    video: true
  };

  // Activate the webcam stream.
  video.srcObject = await navigator.mediaDevices.getUserMedia(constraints);
  video.addEventListener("loadeddata", predictWebcam);
}

// If webcam supported, add event listener to button.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById(
    "webcamButton"
  );
  if (enableWebcamButton) {
    enableWebcamButton.addEventListener("click", enableCam);
  }
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

// Cell class for the grid
class Cell {
    constructor(i, j) {
        this.i = i;
        this.j = j;
        this.stars = [];
        this.active = false;
        this.maskDetected = false;
        this.maskCoverage = 0; // Pourcentage de la case couverte par le masque
        
        // Create stars for this cell
        this.createStars();
    }

    createStars() {
        this.stars = [];
        for (let k = 0; k < params.starsPerCell; k++) {
            this.stars.push(new Star());
        }
    }
    
    display(x, y, width, height) {
        // Display all stars in this cell
        for (let star of this.stars) {
            star.display(x, y, width, height, this.maskDetected);
        }
    }
}

// Star class to display stars in each cell
class Star {
    constructor() {
        this.resetProperties();
    }

    resetProperties() {
        this.offsetX = Math.random() * 0.8 + 0.1; // Position within cell (0.1-0.9)
        this.offsetY = Math.random() * 0.8 + 0.1;
        this.size = Math.random() * params.tailleEtoiles + 1; // Size between 1 and params.tailleEtoiles + 1
        this.angle = Math.random() * Math.PI * 2; // Random rotation
        this.rotationSpeed = (Math.random() - 0.5) * 0.04; // Random rotation speed
    }
    
    display(cellX, cellY, cellWidth, cellHeight, isActive) {
        // Calculate position
        const x = cellX + this.offsetX * cellWidth;
        const y = cellY + this.offsetY * cellHeight;
        
        // Update rotation
        this.angle += this.rotationSpeed;
        
        // Set opacity based on cell active state
        const opacity = isActive ? 1.0 : 0.2;
        
        // Draw star
        canvasCtx.save();
        canvasCtx.translate(x, y);
        canvasCtx.rotate(this.angle);
        
        // Convertir la couleur hexadécimale en RGB
        const r = parseInt(params.starColor.slice(1,3), 16);
        const g = parseInt(params.starColor.slice(3,5), 16);
        const b = parseInt(params.starColor.slice(5,7), 16);
        canvasCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        
        // Draw a 5-pointed star
        canvasCtx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
            const px = Math.cos(angle) * this.size;
            const py = Math.sin(angle) * this.size;
            
            if (i === 0) {
                canvasCtx.moveTo(px, py);
            } else {
                canvasCtx.lineTo(px, py);
            }
        }
        canvasCtx.closePath();
        canvasCtx.fill();
        
        canvasCtx.restore();
    }
}

// Add window resize event handler
window.addEventListener('resize', function() {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    createGrid();
});
