export function createGame({ canvas, minimapCanvas, statsRoot }) {
  const ctx = canvas.getContext("2d");
  const minimapCtx = minimapCanvas.getContext("2d");

  const TILE_W = 64;
  const TILE_H = 32;
  const MAP_W = 18;
  const MAP_H = 18;
  const DIRECTIONS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  const BUILDINGS = {
    path: {
      id: "path",
      name: "산책로",
      category: "infra",
      cost: 40,
      upkeep: 1,
      revenue: 0,
      footprint: [1, 1],
      queueCap: 0,
      cleanHit: 0,
      wearHit: 0,
      colors: ["#d2dce8", "#aab7c8", "#909fb3"],
    },
    rideFerris: {
      id: "rideFerris",
      name: "스카이휠",
      category: "ride",
      cost: 8500,
      upkeep: 28,
      revenue: 120,
      footprint: [2, 2],
      queueCap: 6,
      cleanHit: 0.12,
      wearHit: 0.15,
      colors: ["#ffd168", "#e1aa50", "#ce7d3e"],
    },
    rideCoaster: {
      id: "rideCoaster",
      name: "썬셋 코스터",
      category: "ride",
      cost: 14000,
      upkeep: 45,
      revenue: 180,
      footprint: [3, 2],
      queueCap: 8,
      cleanHit: 0.18,
      wearHit: 0.2,
      colors: ["#ff9a7a", "#df6f59", "#bc4e49"],
    },
    shopSnack: {
      id: "shopSnack",
      name: "캔디 카트",
      category: "shop",
      cost: 4200,
      upkeep: 14,
      revenue: 65,
      footprint: [1, 1],
      queueCap: 4,
      cleanHit: 0.06,
      wearHit: 0.05,
      colors: ["#6ce1c3", "#44b39a", "#2d8b77"],
    },
    facilityRestroom: {
      id: "facilityRestroom",
      name: "가든 화장실",
      category: "facility",
      cost: 3000,
      upkeep: 9,
      revenue: 0,
      footprint: [1, 1],
      queueCap: 2,
      cleanHit: -0.2,
      wearHit: 0.04,
      colors: ["#9cc4ff", "#7096d7", "#496eb0"],
    },
    facilityJanitor: {
      id: "facilityJanitor",
      name: "정비 창고",
      category: "facility",
      cost: 5200,
      upkeep: 10,
      revenue: 0,
      footprint: [1, 1],
      queueCap: 0,
      cleanHit: -0.15,
      wearHit: -0.22,
      colors: ["#c69cff", "#9b74d4", "#7a58b0"],
    },
  };

  const BUILD_ORDER = ["path", "rideFerris", "rideCoaster", "shopSnack", "facilityRestroom", "facilityJanitor"];

  const state = {
    time: 8,
    day: 1,
    weather: "Sunny",
    weatherTimer: 0,
    cash: 50000,
    dayIncome: 0,
    cleanliness: 84,
    maintenance: 88,
    stars: 1.4,
    bankruptcyWarning: false,
    selectedBuild: "path",
    hoverTile: null,
    camera: { x: canvas.width / 2, y: 140, zoom: 1 },
    dragging: false,
    lastMouse: { x: 0, y: 0 },
    nextId: 1,
    builds: [],
    visitors: [],
    grid: Array.from({ length: MAP_W }, () => Array(MAP_H).fill("grass")),
    occupancy: Array.from({ length: MAP_W }, () => Array(MAP_H).fill(null)),
    undoStack: [],
    redoStack: [],
    toasts: [],
    tutorialSteps: [
      { id: "buildRide", text: "놀이기구를 하나 배치해 첫 손님을 끌어오세요.", done: false },
      { id: "buildShop", text: "상점을 지어 손님 만족도와 수익을 올리세요.", done: false },
      { id: "reachTwoStars", text: "청결과 정비를 관리해 별점 2.0을 달성하세요.", done: false },
      { id: "survive", text: "현금을 유지하며 파산 경고 없이 운영하세요.", done: false },
    ],
    audio: null,
    lastEconomyTick: 0,
    spawnTick: 0,
  };

  seedPaths();
  addInitialBuildings();
  buildUi();
  bindEvents();
  startAudio();

  let lastFrame = performance.now();
  requestAnimationFrame(loop);

  function seedPaths() {
    for (let x = 2; x < 15; x += 1) {
      placeBuilding("path", x, 9, false);
    }
    for (let y = 5; y < 14; y += 1) {
      placeBuilding("path", 5, y, false);
      placeBuilding("path", 11, y, false);
    }
  }

  function addInitialBuildings() {
    placeBuilding("facilityRestroom", 4, 8, false);
    placeBuilding("shopSnack", 6, 10, false);
    placeBuilding("rideFerris", 8, 7, false);
    placeBuilding("facilityJanitor", 12, 10, false);
  }

  function buildUi() {
    const buildGrid = statsRoot.querySelector("[data-build-grid]");
    BUILD_ORDER.forEach((id) => {
      const config = BUILDINGS[id];
      const button = document.createElement("button");
      button.dataset.build = id;
      button.innerHTML = `${config.name}<small>$${config.cost.toLocaleString()} · 유지비 ${config.upkeep}/tick</small>`;
      button.classList.toggle("active", id === state.selectedBuild);
      buildGrid.appendChild(button);
    });
    renderTutorial();
    syncHud();
  }

  function bindEvents() {
    canvas.addEventListener("mousemove", onPointerMove);
    canvas.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mouseup", () => {
      state.dragging = false;
    });
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    statsRoot.querySelectorAll("[data-build]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedBuild = button.dataset.build;
        syncBuildButtons();
        syncHud();
      });
    });

    statsRoot.querySelector("[data-action='undo']").addEventListener("click", undo);
    statsRoot.querySelector("[data-action='redo']").addEventListener("click", redo);
    statsRoot.querySelector("[data-action='clean']").addEventListener("click", () => {
      state.cash -= 400;
      state.cleanliness = clamp(state.cleanliness + 10, 0, 100);
      addToast("청소 인력이 공원을 정돈했습니다.");
      playSfx("clean");
    });
    statsRoot.querySelector("[data-action='repair']").addEventListener("click", () => {
      state.cash -= 650;
      state.maintenance = clamp(state.maintenance + 12, 0, 100);
      addToast("정비 팀이 주요 시설을 점검했습니다.");
      playSfx("repair");
    });
  }

  function onPointerMove(event) {
    const { x, y } = eventToCanvas(event);
    if (state.dragging) {
      state.camera.x += x - state.lastMouse.x;
      state.camera.y += y - state.lastMouse.y;
      state.lastMouse = { x, y };
      return;
    }
    state.hoverTile = screenToGrid(x, y);
  }

  function onPointerDown(event) {
    const { x, y } = eventToCanvas(event);
    if (event.button === 1 || event.shiftKey) {
      state.dragging = true;
      state.lastMouse = { x, y };
      return;
    }

    const tile = screenToGrid(x, y);
    if (!tile) {
      return;
    }

    if (event.button === 2) {
      state.selectedBuild = "path";
      syncBuildButtons();
      syncHud();
      return;
    }

    placeBuilding(state.selectedBuild, tile.x, tile.y, true);
  }

  function onWheel(event) {
    event.preventDefault();
    state.camera.zoom = clamp(state.camera.zoom + (event.deltaY > 0 ? -0.08 : 0.08), 0.6, 1.5);
  }

  function loop(now) {
    const delta = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    updateTime(delta);
    updateWeather(delta);
    updateEconomy(now);
    spawnVisitors(now);
    updateVisitors(delta);
    updateRating();
    updateTutorial();
    syncHud();
    render();
    requestAnimationFrame(loop);
  }

  function updateTime(delta) {
    state.time += delta * 0.45;
    if (state.time >= 24) {
      state.time -= 24;
      state.day += 1;
      state.dayIncome = 0;
    }
  }

  function updateWeather(delta) {
    state.weatherTimer += delta;
    if (state.weatherTimer < 18) {
      return;
    }
    state.weatherTimer = 0;
    const roll = Math.random();
    state.weather = roll < 0.58 ? "Sunny" : roll < 0.8 ? "Cloudy" : roll < 0.93 ? "Rainy" : "Windy";
    addToast(`날씨 변화: ${weatherLabel(state.weather)}`);
  }

  function updateEconomy(now) {
    if (now - state.lastEconomyTick < 1000) {
      return;
    }
    state.lastEconomyTick = now;

    let upkeep = 0;
    let dirt = 0;
    let wear = 0;
    state.builds.forEach((build) => {
      const config = BUILDINGS[build.kind];
      upkeep += config.upkeep;
      dirt += config.cleanHit;
      wear += config.wearHit;
    });

    if (state.weather === "Rainy") {
      dirt += 0.4;
    }
    if (state.weather === "Windy") {
      wear += 0.25;
    }

    state.cash -= upkeep;
    state.dayIncome -= upkeep;
    state.cleanliness = clamp(state.cleanliness - dirt, 0, 100);
    state.maintenance = clamp(state.maintenance - wear, 0, 100);
    state.bankruptcyWarning = state.cash < 4000;

    if (state.cash < 0) {
      addToast("파산 경고: 수익을 확보하거나 비용을 줄이세요.");
    }
  }

  function spawnVisitors(now) {
    const rideCount = state.builds.filter((build) => BUILDINGS[build.kind].category === "ride").length;
    if (!rideCount) {
      return;
    }
    const interval = state.weather === "Rainy" ? 2800 : 1600;
    if (now - state.spawnTick < interval) {
      return;
    }
    state.spawnTick = now;

    const targets = state.builds.filter((build) => BUILDINGS[build.kind].queueCap > 0);
    if (!targets.length) {
      return;
    }
    const target = targets[Math.floor(Math.random() * targets.length)];
    const queueEntry = getQueueEntry(target);
    const path = findPath({ x: 2, y: 9 }, queueEntry);
    if (!path.length) {
      return;
    }

    state.visitors.push({
      id: state.nextId++,
      x: 2,
      y: 9,
      mood: 62 + Math.random() * 18,
      emotion: "curious",
      speed: 1.9 + Math.random() * 0.7,
      spendBias: 0.8 + Math.random() * 0.6,
      path,
      pathIndex: 0,
      targetId: target.id,
      queueTicks: 0,
    });
  }

  function updateVisitors(delta) {
    const survivors = [];
    state.visitors.forEach((visitor) => {
      const target = state.builds.find((build) => build.id === visitor.targetId);
      if (target) {
        const queueEntry = getQueueEntry(target);
        const reachedQueue = Math.abs(visitor.x - queueEntry.x) + Math.abs(visitor.y - queueEntry.y) < 0.08;
        if (reachedQueue && target.queue.length < BUILDINGS[target.kind].queueCap) {
          if (!target.queue.includes(visitor.id)) {
            target.queue.push(visitor.id);
            playSfx("queue");
          }
          processQueue(visitor, target, delta);
        } else if (reachedQueue) {
          visitor.mood -= 5;
          sendVisitorHome(visitor, queueEntry, "annoyed");
        } else {
          followPath(visitor, delta);
        }
      } else {
        followPath(visitor, delta);
      }

      if (visitor.targetId === null) {
        followPath(visitor, delta);
        if (Math.abs(visitor.x - 2) + Math.abs(visitor.y - 9) < 0.08) {
          return;
        }
      }

      survivors.push(visitor);
    });
    state.visitors = survivors;
  }

  function processQueue(visitor, target, delta) {
    visitor.queueTicks += delta;
    visitor.emotion = visitor.queueTicks > 6 ? "impatient" : "excited";
    visitor.mood -= delta * (visitor.queueTicks > 6 ? 2.2 : 0.2);
    if (visitor.queueTicks > 9) {
      target.queue = target.queue.filter((id) => id !== visitor.id);
      sendVisitorHome(visitor, getQueueEntry(target), "annoyed");
      return;
    }
    if (visitor.queueTicks > 3.5) {
      serveVisitor(visitor, target);
      target.queue = target.queue.filter((id) => id !== visitor.id);
      sendVisitorHome(visitor, getQueueEntry(target), "delighted");
    }
  }

  function serveVisitor(visitor, target) {
    const config = BUILDINGS[target.kind];
    const weatherBoost = state.weather === "Sunny" ? 1.1 : state.weather === "Rainy" ? 0.75 : 1;
    const income = Math.round(config.revenue * visitor.spendBias * weatherBoost);
    state.cash += income;
    state.dayIncome += income;
    state.cleanliness = clamp(state.cleanliness - 0.25 + (config.category === "facility" ? 0.12 : 0), 0, 100);
    visitor.mood = clamp(visitor.mood + (config.category === "ride" ? 16 : config.category === "shop" ? 8 : 5), 0, 100);
    target.lastServed = performance.now();
    addToast(`${config.name} 수익 +$${income}`);
    playSfx("coin");
  }

  function sendVisitorHome(visitor, from, emotion) {
    visitor.path = findPath(from, { x: 2, y: 9 });
    visitor.pathIndex = 0;
    visitor.targetId = null;
    visitor.queueTicks = 0;
    visitor.emotion = emotion;
  }

  function followPath(visitor, delta) {
    const next = visitor.path[visitor.pathIndex];
    if (!next) {
      return;
    }
    const dx = next.x - visitor.x;
    const dy = next.y - visitor.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.03) {
      visitor.x = next.x;
      visitor.y = next.y;
      visitor.pathIndex += 1;
      return;
    }
    const step = Math.min(visitor.speed * delta, distance);
    visitor.x += (dx / distance) * step;
    visitor.y += (dy / distance) * step;
    if (visitor.mood > 74) {
      visitor.emotion = "happy";
    } else if (visitor.mood < 42) {
      visitor.emotion = "tired";
    }
  }

  function updateRating() {
    const attractions = state.builds.filter((build) => ["ride", "shop"].includes(BUILDINGS[build.kind].category)).length;
    const attractionScore = attractions * 0.22;
    const operations = (state.cleanliness + state.maintenance) / 100;
    const moodScore = state.visitors.length
      ? state.visitors.reduce((sum, visitor) => sum + visitor.mood, 0) / state.visitors.length / 100
      : 0.74;
    state.stars = clamp(1 + attractionScore + operations + moodScore, 0.5, 5);
  }

  function updateTutorial() {
    const previous = JSON.stringify(state.tutorialSteps.map((step) => step.done));
    findTutorial("buildRide").done = state.builds.some((build) => BUILDINGS[build.kind].category === "ride");
    findTutorial("buildShop").done = state.builds.some((build) => BUILDINGS[build.kind].category === "shop");
    findTutorial("reachTwoStars").done = state.stars >= 2;
    findTutorial("survive").done = !state.bankruptcyWarning;
    if (previous !== JSON.stringify(state.tutorialSteps.map((step) => step.done))) {
      renderTutorial();
    }
  }

  function renderTutorial() {
    const stack = statsRoot.querySelector("[data-tutorial]");
    stack.innerHTML = "";
    state.tutorialSteps.forEach((step) => {
      const card = document.createElement("div");
      card.className = `tutorial-card${step.done ? " done" : ""}`;
      card.innerHTML = `<strong>${step.done ? "완료" : "가이드"}</strong><p>${step.text}</p>`;
      stack.appendChild(card);
    });
  }

  function syncHud() {
    setStat("cash", money(state.cash));
    setStat("profit", money(state.dayIncome));
    setStat("cleanliness", `${state.cleanliness.toFixed(0)}%`);
    setStat("maintenance", `${state.maintenance.toFixed(0)}%`);
    setStat("stars", `${state.stars.toFixed(1)} ★`);
    setStat("weather", weatherLabel(state.weather));
    setStat("visitors", `${state.visitors.length}명`);
    setStat(
      "queues",
      `${state.builds.reduce((sum, build) => sum + build.queue.length, 0)} / ${state.builds.reduce(
        (sum, build) => sum + BUILDINGS[build.kind].queueCap,
        0,
      )}`,
    );
    setStat("bankruptcy", state.bankruptcyWarning ? "주의" : "안정");
    setStat(
      "goal",
      state.stars < 2 ? "별점 2.0 달성" : state.cleanliness < 70 ? "청결 회복" : state.maintenance < 70 ? "정비 회복" : "확장 운영",
    );
    statsRoot.querySelector("[data-selected-build]").textContent = `선택된 건물: ${BUILDINGS[state.selectedBuild].name}`;

    const strip = statsRoot.querySelector("[data-overlay='top']");
    const visibleToasts = state.toasts.slice(-4);
    strip.innerHTML = visibleToasts.map((toast) => `<div class="toast">${toast.message}</div>`).join("");

    const clock = statsRoot.querySelector("[data-overlay='clock']");
    const hour = String(Math.floor(state.time)).padStart(2, "0");
    const minute = String(Math.floor((state.time % 1) * 60)).padStart(2, "0");
    clock.textContent = `Day ${state.day} · ${hour}:${minute}`;
  }

  function render() {
    const nightFactor = Math.abs(12 - state.time) / 12;
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, mixColors("#8fd7ff", "#09101d", nightFactor * 0.85));
    sky.addColorStop(1, mixColors("#4c8a55", "#070d18", nightFactor));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    renderWeatherBackdrop();
    renderGrid();
    renderBuildings();
    renderVisitors();
    renderHover();
    renderMinimap();
  }

  function renderWeatherBackdrop() {
    if (state.weather === "Cloudy") {
      ctx.fillStyle = "rgba(220, 233, 255, 0.08)";
      for (let i = 0; i < 7; i += 1) {
        ctx.beginPath();
        ctx.ellipse(150 + i * 160, 110 + (i % 2) * 24, 85, 28, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (state.weather === "Rainy") {
      ctx.strokeStyle = "rgba(185, 220, 255, 0.22)";
      for (let i = 0; i < 60; i += 1) {
        const x = (i * 37 + performance.now() * 0.15) % canvas.width;
        const y = (i * 23 + performance.now() * 0.25) % canvas.height;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 10, y + 16);
        ctx.stroke();
      }
    }
  }

  function renderGrid() {
    for (let y = 1; y < MAP_H - 1; y += 1) {
      for (let x = 1; x < MAP_W - 1; x += 1) {
        const screen = gridToScreen(x, y);
        const path = state.grid[x][y] === "path";
        drawPrism(screen.x, screen.y, TILE_W / 2, TILE_H / 2, 8, path ? "#c9d3df" : "#6dbb6e", path ? "#aab8c9" : "#4f8f52", path ? "#95a4b5" : "#3e7641");
      }
    }
  }

  function renderBuildings() {
    [...state.builds]
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .forEach((build) => {
        const config = BUILDINGS[build.kind];
        const center = gridToScreen(build.x + config.footprint[0] / 2 - 0.5, build.y + config.footprint[1] / 2 - 0.5);
        const size = 18 + (config.footprint[0] + config.footprint[1]) * 10;
        drawPrism(center.x, center.y - 24, size, size * 0.6, 24 + config.footprint[1] * 8, ...config.colors);

        if (config.category === "ride") {
          ctx.strokeStyle = "rgba(255,255,255,0.52)";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(center.x, center.y - 48, size * 0.7, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (performance.now() - build.lastServed < 1600) {
          ctx.fillStyle = "rgba(247,198,106,0.15)";
          ctx.beginPath();
          ctx.arc(center.x, center.y - 52, 32, 0, Math.PI * 2);
          ctx.fill();
        }

        if (build.queue.length) {
          ctx.fillStyle = "rgba(8,17,31,0.8)";
          ctx.fillRect(center.x - 18, center.y - 88, 36, 18);
          ctx.fillStyle = "#fff";
          ctx.font = "12px DM Sans";
          ctx.textAlign = "center";
          ctx.fillText(`${build.queue.length}`, center.x, center.y - 75);
        }
      });
  }

  function renderVisitors() {
    state.visitors.forEach((visitor) => {
      const screen = gridToScreen(visitor.x, visitor.y);
      const color =
        visitor.emotion === "delighted"
          ? "#f7c66a"
          : visitor.emotion === "impatient" || visitor.emotion === "annoyed"
            ? "#ff7d6d"
            : visitor.emotion === "happy"
              ? "#5fd1b8"
              : "#d6e4ff";
      ctx.fillStyle = "#17314f";
      ctx.beginPath();
      ctx.ellipse(screen.x, screen.y - 4, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y - 16, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.24)";
      ctx.fillRect(screen.x - 10, screen.y - 32, 20, 4);
      ctx.fillStyle = color;
      ctx.fillRect(screen.x - 10, screen.y - 32, Math.max(4, visitor.mood / 5), 4);
    });
  }

  function renderHover() {
    if (!state.hoverTile || !insideMap(state.hoverTile.x, state.hoverTile.y)) {
      return;
    }
    const screen = gridToScreen(state.hoverTile.x, state.hoverTile.y);
    const valid = canPlace(state.selectedBuild, state.hoverTile.x, state.hoverTile.y);
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = valid ? "#5fd1b8" : "#ff7d6d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(screen.x, screen.y - (TILE_H / 2) * state.camera.zoom);
    ctx.lineTo(screen.x + (TILE_W / 2) * state.camera.zoom, screen.y);
    ctx.lineTo(screen.x, screen.y + (TILE_H / 2) * state.camera.zoom);
    ctx.lineTo(screen.x - (TILE_W / 2) * state.camera.zoom, screen.y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function renderMinimap() {
    minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    minimapCtx.fillStyle = "#0c1628";
    minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);

    const tileW = minimapCanvas.width / MAP_W;
    const tileH = minimapCanvas.height / MAP_H;
    for (let y = 0; y < MAP_H; y += 1) {
      for (let x = 0; x < MAP_W; x += 1) {
        minimapCtx.fillStyle = state.grid[x][y] === "path" ? "#bfcfe2" : "#3c7e49";
        minimapCtx.fillRect(x * tileW, y * tileH, tileW - 1, tileH - 1);
      }
    }

    state.builds.forEach((build) => {
      minimapCtx.fillStyle =
        BUILDINGS[build.kind].category === "ride"
          ? "#ffbf69"
          : BUILDINGS[build.kind].category === "shop"
            ? "#5fd1b8"
            : "#8ab4ff";
      minimapCtx.fillRect(
        build.x * tileW,
        build.y * tileH,
        BUILDINGS[build.kind].footprint[0] * tileW,
        BUILDINGS[build.kind].footprint[1] * tileH,
      );
    });

    state.visitors.slice(0, 50).forEach((visitor) => {
      minimapCtx.fillStyle = "#fff8d3";
      minimapCtx.fillRect(visitor.x * tileW, visitor.y * tileH, 3, 3);
    });
  }

  function placeBuilding(kind, x, y, trackHistory) {
    if (!canPlace(kind, x, y)) {
      if (trackHistory) {
        addToast("이 위치에는 배치할 수 없습니다.");
        playSfx("error");
      }
      return null;
    }

    const config = BUILDINGS[kind];
    if (trackHistory && state.cash < config.cost) {
      addToast("자금이 부족합니다.");
      playSfx("error");
      return null;
    }

    const build = {
      id: state.nextId++,
      kind,
      x,
      y,
      queue: [],
      lastServed: 0,
    };

    state.builds.push(build);
    stampBuilding(build, true);
    if (trackHistory) {
      state.cash -= config.cost;
      state.dayIncome -= config.cost;
      state.undoStack.push({ type: "place", kind, x, y, cost: config.cost });
      state.redoStack = [];
      addToast(`${config.name} 배치 완료`);
      playSfx("build");
    }
    return build;
  }

  function stampBuilding(build, occupied) {
    const [width, height] = BUILDINGS[build.kind].footprint;
    for (let dx = 0; dx < width; dx += 1) {
      for (let dy = 0; dy < height; dy += 1) {
        state.occupancy[build.x + dx][build.y + dy] = occupied ? build.id : null;
        if (build.kind === "path") {
          state.grid[build.x + dx][build.y + dy] = occupied ? "path" : "grass";
        }
      }
    }
  }

  function canPlace(kind, x, y) {
    const [width, height] = BUILDINGS[kind].footprint;
    for (let dx = 0; dx < width; dx += 1) {
      for (let dy = 0; dy < height; dy += 1) {
        const tx = x + dx;
        const ty = y + dy;
        if (!insideMap(tx, ty) || state.occupancy[tx][ty]) {
          return false;
        }
      }
    }
    if (kind === "path") {
      return true;
    }
    const entry = getQueueEntry({ kind, x, y });
    return DIRECTIONS.some(([dx, dy]) => {
      const nx = entry.x + dx;
      const ny = entry.y + dy;
      return insideMap(nx, ny) && state.grid[nx][ny] === "path";
    });
  }

  function undo() {
    const action = state.undoStack.pop();
    if (!action) {
      return;
    }
    if (action.type === "place") {
      const removed = removeBuildingAt(action.kind, action.x, action.y);
      if (!removed) {
        return;
      }
      state.cash += action.cost;
      state.dayIncome += action.cost;
      state.redoStack.push(action);
      addToast("배치를 되돌렸습니다.");
    }
  }

  function redo() {
    const action = state.redoStack.pop();
    if (!action) {
      return;
    }
    const rebuilt = placeBuilding(action.kind, action.x, action.y, false);
    if (!rebuilt) {
      return;
    }
    state.cash -= action.cost;
    state.dayIncome -= action.cost;
    state.undoStack.push(action);
    addToast("배치를 다시 적용했습니다.");
  }

  function removeBuildingAt(kind, x, y) {
    const index = state.builds.findIndex((build) => build.kind === kind && build.x === x && build.y === y);
    if (index < 0) {
      return false;
    }
    const [build] = state.builds.splice(index, 1);
    stampBuilding(build, false);
    return true;
  }

  function screenToGrid(screenX, screenY) {
    const x = (screenX - state.camera.x) / state.camera.zoom;
    const y = (screenY - state.camera.y) / state.camera.zoom;
    const gridX = (x / (TILE_W / 2) + y / (TILE_H / 2)) / 2;
    const gridY = (y / (TILE_H / 2) - x / (TILE_W / 2)) / 2;
    return { x: Math.floor(gridX), y: Math.floor(gridY) };
  }

  function gridToScreen(gridX, gridY) {
    return {
      x: state.camera.x + (gridX - gridY) * (TILE_W / 2) * state.camera.zoom,
      y: state.camera.y + (gridX + gridY) * (TILE_H / 2) * state.camera.zoom,
    };
  }

  function findPath(start, end) {
    const frontier = [start];
    const key = (point) => `${point.x},${point.y}`;
    const visited = new Set([key(start)]);
    const cameFrom = new Map();

    while (frontier.length) {
      const current = frontier.shift();
      if (current.x === end.x && current.y === end.y) {
        break;
      }
      DIRECTIONS.forEach(([dx, dy]) => {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const tileKey = `${nx},${ny}`;
        if (!insideMap(nx, ny) || visited.has(tileKey)) {
          return;
        }
        if (state.grid[nx][ny] !== "path" && !(nx === end.x && ny === end.y)) {
          return;
        }
        visited.add(tileKey);
        frontier.push({ x: nx, y: ny });
        cameFrom.set(tileKey, current);
      });
    }

    const result = [];
    let current = end;
    while (current && !(current.x === start.x && current.y === start.y)) {
      result.unshift({ x: current.x, y: current.y });
      current = cameFrom.get(key(current));
      if (!current) {
        return [];
      }
    }
    return result;
  }

  function getQueueEntry(build) {
    const [width, height] = BUILDINGS[build.kind].footprint;
    return { x: build.x + Math.floor(width / 2), y: build.y + height };
  }

  function syncBuildButtons() {
    statsRoot.querySelectorAll("[data-build]").forEach((node) => {
      node.classList.toggle("active", node.dataset.build === state.selectedBuild);
    });
  }

  function findTutorial(id) {
    return state.tutorialSteps.find((step) => step.id === id);
  }

  function addToast(message) {
    state.toasts.push({ message, createdAt: performance.now() });
    state.toasts = state.toasts.filter((toast) => performance.now() - toast.createdAt < 4200);
  }

  function setStat(key, value) {
    const node = statsRoot.querySelector(`[data-stat='${key}']`);
    if (node) {
      node.textContent = value;
    }
  }

  function eventToCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function drawPrism(x, y, halfW, halfH, height, top, left, right) {
    ctx.beginPath();
    ctx.moveTo(x, y - halfH * state.camera.zoom);
    ctx.lineTo(x + halfW * state.camera.zoom, y);
    ctx.lineTo(x, y + halfH * state.camera.zoom);
    ctx.lineTo(x - halfW * state.camera.zoom, y);
    ctx.closePath();
    ctx.fillStyle = top;
    ctx.fill();
    ctx.strokeStyle = "rgba(10, 16, 30, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - halfW * state.camera.zoom, y);
    ctx.lineTo(x, y + halfH * state.camera.zoom);
    ctx.lineTo(x, y + (halfH + height) * state.camera.zoom);
    ctx.lineTo(x - halfW * state.camera.zoom, y + height * state.camera.zoom);
    ctx.closePath();
    ctx.fillStyle = left;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + halfW * state.camera.zoom, y);
    ctx.lineTo(x, y + halfH * state.camera.zoom);
    ctx.lineTo(x, y + (halfH + height) * state.camera.zoom);
    ctx.lineTo(x + halfW * state.camera.zoom, y + height * state.camera.zoom);
    ctx.closePath();
    ctx.fillStyle = right;
    ctx.fill();
  }

  function startAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }
    state.audio = new AudioContextClass();
    const resume = () => {
      if (state.audio.state === "suspended") {
        state.audio.resume();
      }
      if (!state.audio._musicStarted) {
        startMusic();
        state.audio._musicStarted = true;
      }
      window.removeEventListener("pointerdown", resume);
    };
    window.addEventListener("pointerdown", resume);
  }

  function startMusic() {
    const master = state.audio.createGain();
    master.gain.value = 0.028;
    master.connect(state.audio.destination);

    [220, 277.18, 329.63].forEach((freq, index) => {
      const osc = state.audio.createOscillator();
      const gain = state.audio.createGain();
      const now = state.audio.currentTime;
      osc.type = index === 1 ? "triangle" : "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 1.4 + index * 0.2);
      gain.gain.linearRampToValueAtTime(0.15, now + 6 + index * 0.4);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
    });
  }

  function playSfx(type) {
    if (!state.audio || state.audio.state !== "running") {
      return;
    }
    const oscillator = state.audio.createOscillator();
    const gain = state.audio.createGain();
    const now = state.audio.currentTime;
    const notes = {
      build: [620, 330],
      coin: [780, 1040],
      queue: [340, 420],
      clean: [510, 610],
      repair: [220, 360],
      error: [180, 120],
    };
    const [start, end] = notes[type] || [400, 520];
    oscillator.type = type === "error" ? "sawtooth" : "triangle";
    oscillator.frequency.setValueAtTime(start, now);
    oscillator.frequency.exponentialRampToValueAtTime(end, now + 0.18);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    oscillator.connect(gain);
    gain.connect(state.audio.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.25);
  }

  function weatherLabel(value) {
    return {
      Sunny: "맑음",
      Cloudy: "흐림",
      Rainy: "비",
      Windy: "바람",
    }[value];
  }

  function money(value) {
    return `$${Math.round(value).toLocaleString()}`;
  }

  function insideMap(x, y) {
    return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function mixColors(a, b, amount) {
    const colorA = hexToRgb(a);
    const colorB = hexToRgb(b);
    const mix = {
      r: Math.round(colorA.r + (colorB.r - colorA.r) * amount),
      g: Math.round(colorA.g + (colorB.g - colorA.g) * amount),
      b: Math.round(colorA.b + (colorB.b - colorA.b) * amount),
    };
    return `rgb(${mix.r}, ${mix.g}, ${mix.b})`;
  }

  function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    const n = Number.parseInt(clean, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
}
