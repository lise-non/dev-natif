// renderer.js
let simulation;
let canvas;
let ctx;
const cellSize = 5;
let simulationInterval = null;
let isPaused = false;

document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("forestGrid");
  ctx = canvas.getContext("2d");

  setupCanvas();
  setupEventListeners();
});

function setupCanvas() {
  const containerWidth = document.querySelector(".container").clientWidth - 300;
  canvas.width = Math.floor(containerWidth / cellSize) * cellSize;
  canvas.height = Math.floor(600 / cellSize) * cellSize;

  const gridWidth = Math.floor(canvas.width / cellSize);
  const gridHeight = Math.floor(canvas.height / cellSize);
  simulation = new ForestSimulation(gridWidth, gridHeight);

  renderGrid();
}

function setupEventListeners() {
  document
    .getElementById("startSimulation")
    .addEventListener("click", startSimulation);
  document
    .getElementById("pauseSimulation")
    .addEventListener("click", togglePause);

  window.addEventListener(
    "resize",
    debounce(() => {
      setupCanvas();
    }, 250)
  );
}

function startSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
  }

  const humidity = document.getElementById("humidity").value;
  const terrain = document.getElementById("terrain").value;
  const iterations = parseInt(document.getElementById("iterations").value);

  simulation.setParameters(humidity, terrain);
  isPaused = false;
  document.getElementById("pauseSimulation").textContent = "Pause";

  let currentIteration = 0;
  simulationInterval = setInterval(() => {
    if (!isPaused) {
      simulation.step();
      renderGrid();
      updateStatistics();

      currentIteration++;
      if (currentIteration >= iterations) {
        clearInterval(simulationInterval);
        simulationInterval = null;
      }
    }
  }, 100);
}

function togglePause() {
  isPaused = !isPaused;
  const pauseButton = document.getElementById("pauseSimulation");
  pauseButton.textContent = isPaused ? "Reprendre" : "Pause";
}

function renderGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < simulation.height; y++) {
    for (let x = 0; x < simulation.width; x++) {
      const cell = simulation.grid[y][x];
      ctx.fillStyle = getCellColor(cell.state);
      ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
    }
  }
}

function getCellColor(state) {
  const colors = {
    vegetation: "#2E7D32", // Vert foncé
    burning: "#FF5722", // Orange-rouge
    "burned-hot": "#795548", // Marron
    "burned-cold": "#424242", // Gris foncé
    inert: "#BDBDBD", // Gris clair
  };
  return colors[state];
}

function updateStatistics() {
  const stats = simulation.getStatistics();
  const statsContent = document.getElementById("stats-content");

  statsContent.innerHTML = `
        <p>Cases en feu: ${stats.percentBurning.toFixed(1)}%</p>
        <p>Cases brûlées: ${stats.percentBurned.toFixed(1)}%</p>
        <p>Végétation restante: ${stats.percentVegetation.toFixed(1)}%</p>
        <p>Cases inertes: ${stats.percentInert.toFixed(1)}%</p>
    `;
}

// Fonction utilitaire pour débouncer le redimensionnement
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Fonction pour exporter l'état actuel en image
function exportAsImage() {
  const link = document.createElement("a");
  link.download = "forest-fire-simulation.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// Ajout d'un raccourci clavier pour la pause (espace)
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault(); // Empêche le défilement de la page
    togglePause();
  }
});
