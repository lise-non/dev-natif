class ForestCell {
  constructor() {
    this.state = "vegetation"; // vegetation, burning, burned-hot, burned-cold, inert
    this.burningTime = 0;
    this.burnedHotTime = 0;
  }

  clone() {
    const newCell = new ForestCell();
    newCell.state = this.state;
    newCell.burningTime = this.burningTime;
    newCell.burnedHotTime = this.burnedHotTime;
    return newCell;
  }
}

class ForestSimulation {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = this.initializeGrid();
    this.humidity = "normal";
    this.terrainType = "continuous";
  }

  initializeGrid() {
    const grid = [];
    for (let y = 0; y < this.height; y++) {
      grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        grid[y][x] = new ForestCell();
      }
    }
    return grid;
  }

  setParameters(humidity, terrainType) {
    this.humidity = humidity;
    this.terrainType = terrainType;
    this.initializeTerrain();
  }

  initializeTerrain() {
    const coverageMap = {
      continuous: 1.0,
      sparse: 0.95,
      spaced: 0.8,
      scattered: 0.5,
    };

    const coverage = coverageMap[this.terrainType];

    // Reset grid
    this.grid = this.initializeGrid();

    // Apply terrain coverage
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (Math.random() > coverage) {
          this.grid[y][x].state = "inert";
        }
      }
    }

    // Initialize two burning cells in the center
    const midY = Math.floor(this.height / 2);
    const midX = Math.floor(this.width / 2);
    if (this.grid[midY][midX].state !== "inert") {
      this.grid[midY][midX].state = "burning";
    }
    if (this.grid[midY][midX + 1].state !== "inert") {
      this.grid[midY][midX + 1].state = "burning";
    }
  }

  getIgnitionProbability() {
    const probabilities = {
      humid: 0.1,
      normal: 0.3,
      dry: 0.6,
      "very-dry": 0.9,
    };
    return probabilities[this.humidity];
  }

  step() {
    const newGrid = this.grid.map((row) => row.map((cell) => cell.clone()));

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];

        switch (cell.state) {
          case "burning":
            this.handleBurningCell(x, y, newGrid);
            break;
          case "burned-hot":
            this.handleBurnedHotCell(x, y, newGrid);
            break;
          case "vegetation":
            this.handleVegetationCell(x, y, newGrid);
            break;
        }
      }
    }

    this.grid = newGrid;
  }

  handleBurningCell(x, y, newGrid) {
    newGrid[y][x].burningTime++;
    if (newGrid[y][x].burningTime >= 2) {
      newGrid[y][x].state = "burned-hot";
      newGrid[y][x].burnedHotTime = 0;
    }
    this.spreadFire(x, y);
  }

  handleBurnedHotCell(x, y, newGrid) {
    if (Math.random() < 0.4) {
      newGrid[y][x].state = "burned-cold";
    } else {
      newGrid[y][x].burnedHotTime++;
      if (Math.random() < 0.005) {
        this.spreadFire(x, y);
      }
    }
  }

  handleVegetationCell(x, y, newGrid) {
    // Check neighbors for fire spread
    const neighbors = this.getNeighbors(x, y);
    const burningNeighbors = neighbors.filter(
      (n) => n.state === "burning" || n.state === "burned-hot"
    );

    if (
      burningNeighbors.length > 0 &&
      Math.random() < this.getIgnitionProbability()
    ) {
      newGrid[y][x].state = "burning";
    }
  }

  getNeighbors(x, y) {
    const neighbors = [];
    const directions = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ];

    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;

      if (newX >= 0 && newX < this.width && newY >= 0 && newY < this.height) {
        neighbors.push(this.grid[newY][newX]);
      }
    }

    return neighbors;
  }

  spreadFire(x, y) {
    const neighbors = this.getNeighbors(x, y);
    neighbors.forEach((neighbor) => {
      if (
        neighbor.state === "vegetation" &&
        Math.random() < this.getIgnitionProbability()
      ) {
        neighbor.state = "burning";
      }
    });
  }

  getStatistics() {
    let stats = {
      burning: 0,
      burnedHot: 0,
      burnedCold: 0,
      vegetation: 0,
      inert: 0,
    };

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const state = this.grid[y][x].state;
        switch (state) {
          case "burning":
            stats.burning++;
            break;
          case "burned-hot":
            stats.burnedHot++;
            break;
          case "burned-cold":
            stats.burnedCold++;
            break;
          case "vegetation":
            stats.vegetation++;
            break;
          case "inert":
            stats.inert++;
            break;
        }
      }
    }

    const total = this.width * this.height;
    return {
      percentBurning: (stats.burning / total) * 100,
      percentBurned: ((stats.burnedHot + stats.burnedCold) / total) * 100,
      percentVegetation: (stats.vegetation / total) * 100,
      percentInert: (stats.inert / total) * 100,
    };
  }

  saveState() {
    return {
      grid: this.grid,
      humidity: this.humidity,
      terrainType: this.terrainType,
    };
  }

  loadState(state) {
    this.grid = state.grid;
    this.humidity = state.humidity;
    this.terrainType = state.terrainType;
  }
}
