import { WEATHER, ZONES } from "./gameData.js";
import { avg, blendColor, clamp, shadeColor } from "./gameUtils.js";

export function drawScene(state, periodInfo, weatherKey, zoneHeat, bloomStrength) {
  const { ctx, canvas } = state;
  const weather = WEATHER[weatherKey];
  const night = periodInfo.shift === "night";
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, night ? "#0b1322" : weather.top);
  sky.addColorStop(1, night ? "#121a2b" : weather.bot);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (weatherKey === "rain") {
    ctx.strokeStyle = "rgba(219,234,247,.24)";
    ctx.lineWidth = 1.2;
    for (let index = 0; index < 80; index += 1) {
      const x = (index * 37 + state.frame * 140) % canvas.width;
      const y = (index * 23 + state.frame * 80) % canvas.height;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 9, y + 18);
      ctx.stroke();
    }
  }
  for (let x = 0; x < 22; x += 1) {
    for (let y = 0; y < 18; y += 1) {
      const road = y === 11 || x === 9 || (x > 10 && y === 7);
      const base = road ? "#c8d6e2" : blendColor("#74b36a", "#e7c7d7", bloomStrength * (x < 10 && y > 11 ? 0.26 : 0));
      const point = iso(state, x, y, 0);
      tile(ctx, point.x, point.y, 32, 16, base, shadeColor(base, -18), shadeColor(base, -30), 8);
    }
  }
  [["control", "cracker"], ["cracker", "olefins"], ["cracker", "utilities"], ["utilities", "tankFarm"], ["olefins", "aromatics"]].forEach(([fromId, toId]) => {
    const from = ZONES.find((zone) => zone.id === fromId);
    const to = ZONES.find((zone) => zone.id === toId);
    const start = iso(state, from.x + from.w * 0.6, from.y + from.d * 0.5, from.h + 10);
    const end = iso(state, to.x + to.w * 0.2, to.y + to.d * 0.5, to.h + 10);
    ctx.strokeStyle = "rgba(141,161,182,.95)";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo((start.x + end.x) * 0.5, start.y - 20);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  });
  [...ZONES].sort((a, b) => a.x + a.y - (b.x + b.y)).forEach((zone) => drawZone(state, zone, zoneHeat[zone.id] ?? 0.64, bloomStrength));
  if (night) {
    ctx.fillStyle = "rgba(8,14,24,.26)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

export function drawMinimap(state, zoneHeat) {
  const { mini, minimapCanvas } = state;
  const tileW = minimapCanvas.width / 22;
  const tileH = minimapCanvas.height / 18;
  mini.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  mini.fillStyle = "#0d1729";
  mini.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  for (let x = 0; x < 22; x += 1) {
    for (let y = 0; y < 18; y += 1) {
      mini.fillStyle = y === 11 || x === 9 ? "#8ea3b8" : "#395f3d";
      mini.fillRect(x * tileW, y * tileH, tileW - 1, tileH - 1);
    }
  }
  ZONES.forEach((zone) => {
    mini.fillStyle = heatColor(zoneHeat[zone.id] ?? 0.64);
    mini.fillRect(zone.x * tileW, zone.y * tileH, zone.w * tileW, zone.d * tileH);
  });
  const focus = state.focus === "blossom" ? ZONES.find((zone) => zone.id === "blossom") : ZONES.find((zone) => zone.id === "control");
  mini.strokeStyle = state.focus === "blossom" ? "#efb7cd" : "#6dd0ff";
  mini.lineWidth = 3;
  mini.strokeRect(focus.x * tileW, focus.y * tileH, focus.w * tileW, focus.d * tileH);
}

function drawZone(state, zone, heat, bloomStrength) {
  const { ctx } = state;
  const highlight = state.focus === "blossom" ? zone.id === "blossom" : ["control", "cracker", "olefins", "aromatics", "utilities", "tankFarm"].includes(zone.id);
  const top = blendColor(zone.c, heatColor(heat), 0.42);
  box(state, zone.x, zone.y, zone.w, zone.d, zone.h, top, shadeColor(top, highlight ? -12 : -18), shadeColor(top, highlight ? -22 : -30));
  if (zone.t === "stack") drawStacks(state, zone, heat);
  if (zone.t === "tank") drawTanks(state, zone, heat);
  if (zone.t === "control") drawGlow(state, zone, heat);
  if (zone.t === "utility") drawTower(state, zone);
  if (zone.t === "blossom") drawBlossoms(state, zone, bloomStrength);
  const label = iso(state, zone.x + zone.w * 0.5, zone.y + zone.d * 0.5, zone.h + 20);
  ctx.fillStyle = "rgba(8,20,36,.86)";
  ctx.fillRect(label.x - 50, label.y - 10, 100, 20);
  ctx.fillStyle = "#f5fbff";
  ctx.font = "12px Chakra Petch";
  ctx.textAlign = "center";
  ctx.fillText(zone.label, label.x, label.y + 4);
}

function drawStacks(state, zone, heat) { for (let index = 0; index < 3; index += 1) { const p = iso(state, zone.x + 0.6 + index * 0.8, zone.y + 0.6 + (index % 2) * 0.7, zone.h + 18 + index * 6); state.ctx.fillStyle = blendColor("#7f8ea1", heatColor(heat), 0.12); state.ctx.fillRect(p.x - 8, p.y - 36, 16, 36); for (let puff = 0; puff < 3; puff += 1) { state.ctx.fillStyle = `rgba(240,244,249,${0.15 - puff * 0.03})`; state.ctx.beginPath(); state.ctx.arc(p.x + Math.sin(state.frame * 2 + puff) * 4, p.y - 42 - puff * 12, 12 - puff * 2, 0, Math.PI * 2); state.ctx.fill(); } } }
function drawTanks(state, zone, heat) { for (let index = 0; index < 3; index += 1) { const p = iso(state, zone.x + 0.6 + index * 0.7, zone.y + 0.8 + (index % 2) * 0.5, zone.h + 6); state.ctx.fillStyle = blendColor("#ece9e1", heatColor(heat), 0.24); state.ctx.beginPath(); state.ctx.ellipse(p.x, p.y, 16, 8, 0, 0, Math.PI * 2); state.ctx.fill(); state.ctx.fillRect(p.x - 16, p.y, 32, 18); } }
function drawGlow(state, zone, heat) { const p = iso(state, zone.x + 0.6, zone.y + 0.9, zone.h + 10); state.ctx.fillStyle = `rgba(91,211,191,${0.18 + heat * 0.18})`; state.ctx.fillRect(p.x - 22, p.y - 10, 44, 20); }
function drawTower(state, zone) { const p = iso(state, zone.x + 1, zone.y + 0.8, zone.h + 6); state.ctx.fillStyle = "rgba(232,237,242,.95)"; state.ctx.beginPath(); state.ctx.moveTo(p.x - 14, p.y + 10); state.ctx.lineTo(p.x - 6, p.y - 28); state.ctx.lineTo(p.x + 6, p.y - 28); state.ctx.lineTo(p.x + 14, p.y + 10); state.ctx.closePath(); state.ctx.fill(); }
function drawBlossoms(state, zone, bloomStrength) { for (let index = 0; index < 7; index += 1) { const p = iso(state, zone.x + 0.4 + index * 0.85, zone.y + 0.4 + (index % 2) * 0.45, zone.h + 10); state.ctx.strokeStyle = "#86624d"; state.ctx.lineWidth = 3; state.ctx.beginPath(); state.ctx.moveTo(p.x, p.y + 6); state.ctx.lineTo(p.x, p.y - 16); state.ctx.stroke(); state.ctx.fillStyle = `rgba(236,191,214,${0.45 + bloomStrength * 0.35})`; state.ctx.beginPath(); state.ctx.arc(p.x - 8, p.y - 20, 10, 0, Math.PI * 2); state.ctx.arc(p.x + 8, p.y - 22, 10, 0, Math.PI * 2); state.ctx.arc(p.x, p.y - 28, 11, 0, Math.PI * 2); state.ctx.fill(); } const gate = iso(state, zone.x + 5.4, zone.y + 0.8, zone.h + 12); state.ctx.fillStyle = "rgba(255,250,245,.95)"; state.ctx.fillRect(gate.x - 18, gate.y - 20, 36, 20); state.ctx.fillStyle = "#c98097"; state.ctx.fillRect(gate.x - 24, gate.y - 26, 48, 8); }

function heatColor(value) { return blendColor("#d85b51", "#48b589", clamp(value, 0, 1)); }
function iso(state, x, y, z) { return { x: state.canvas.width * 0.48 + (x - y) * 54 + state.pan.x, y: 170 + (x + y) * 13.5 + state.pan.y - z }; }
function tile(ctx, x, y, halfW, halfH, top, left, right, height) { ctx.beginPath(); ctx.moveTo(x, y - halfH); ctx.lineTo(x + halfW, y); ctx.lineTo(x, y + halfH); ctx.lineTo(x - halfW, y); ctx.closePath(); ctx.fillStyle = top; ctx.fill(); ctx.beginPath(); ctx.moveTo(x - halfW, y); ctx.lineTo(x, y + halfH); ctx.lineTo(x, y + halfH + height); ctx.lineTo(x - halfW, y + height); ctx.closePath(); ctx.fillStyle = left; ctx.fill(); ctx.beginPath(); ctx.moveTo(x + halfW, y); ctx.lineTo(x, y + halfH); ctx.lineTo(x, y + halfH + height); ctx.lineTo(x + halfW, y + height); ctx.closePath(); ctx.fillStyle = right; ctx.fill(); }
function box(state, x, y, w, d, h, top, left, right) { const p1 = iso(state, x, y, h), p2 = iso(state, x + w, y, h), p3 = iso(state, x + w, y + d, h), p4 = iso(state, x, y + d, h), b1 = iso(state, x, y, 0), b3 = iso(state, x + w, y + d, 0), b4 = iso(state, x, y + d, 0); state.ctx.beginPath(); state.ctx.moveTo(p1.x, p1.y); state.ctx.lineTo(p2.x, p2.y); state.ctx.lineTo(p3.x, p3.y); state.ctx.lineTo(p4.x, p4.y); state.ctx.closePath(); state.ctx.fillStyle = top; state.ctx.fill(); state.ctx.strokeStyle = "rgba(11,20,34,.18)"; state.ctx.lineWidth = 1; state.ctx.stroke(); state.ctx.beginPath(); state.ctx.moveTo(p4.x, p4.y); state.ctx.lineTo(p3.x, p3.y); state.ctx.lineTo(b3.x, b3.y); state.ctx.lineTo(b4.x, b4.y); state.ctx.closePath(); state.ctx.fillStyle = right; state.ctx.fill(); state.ctx.beginPath(); state.ctx.moveTo(p1.x, p1.y); state.ctx.lineTo(p4.x, p4.y); state.ctx.lineTo(b4.x, b4.y); state.ctx.lineTo(b1.x, b1.y); state.ctx.closePath(); state.ctx.fillStyle = left; state.ctx.fill(); }
