export const DAY_MS = 24 * 60 * 60 * 1000;
export const PERIOD_MS = 12 * 60 * 60 * 1000;

export function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function avg(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(from, to, amount) {
  return from + (to - from) * clamp(amount, 0, 1);
}

export function uniq(values) {
  return [...new Set(values)];
}

export function choice(values) {
  return values[Math.floor(Math.random() * values.length)];
}

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function money(value) {
  return `$${Math.round(value).toLocaleString()}`;
}

export function ymd(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function md(date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

export function stamp(date) {
  return `${ymd(date)} ${String(date.getHours()).padStart(2, "0")}:00`;
}

export function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const number = Number.parseInt(value, 16);
  return { r: (number >> 16) & 255, g: (number >> 8) & 255, b: number & 255 };
}

export function rgbToHex(rgb) {
  const match = rgb.match(/\d+/g) || [0, 0, 0];
  return `#${match.slice(0, 3).map((part) => Number(part).toString(16).padStart(2, "0")).join("")}`;
}

export function blendColor(from, to, amount) {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const t = clamp(amount, 0, 1);
  return `rgb(${Math.round(start.r + (end.r - start.r) * t)}, ${Math.round(start.g + (end.g - start.g) * t)}, ${Math.round(start.b + (end.b - start.b) * t)})`;
}

export function shadeColor(color, amount) {
  const { r, g, b } = hexToRgb(color.startsWith("#") ? color : rgbToHex(color));
  return `rgb(${clamp(r + amount, 0, 255)}, ${clamp(g + amount, 0, 255)}, ${clamp(b + amount, 0, 255)})`;
}
