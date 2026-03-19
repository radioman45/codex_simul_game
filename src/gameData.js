import { clamp, randInt } from "./gameUtils.js";

export const START = new Date(2026, 2, 28, 6, 0, 0);
export const INITIAL_CASH = 200_000_000;
export const HORIZON = 10;
export const PATTERN = ["day", "day", "off", "off", "night", "night", "off", "off"];
export const OFFSETS = { A: 0, B: 4, C: 2, D: 6 };
export const WEATHER = {
  clear: { label: "Clear", prod: 1, crowd: 1.08, top: "#99d8ff", bot: "#e6edf5" },
  haze: { label: "Haze", prod: 0.98, crowd: 1, top: "#bfd1e2", bot: "#e3e7ec" },
  windy: { label: "Windy", prod: 0.95, crowd: 0.9, top: "#8ec5ff", bot: "#d6dfe8" },
  rain: { label: "Rain", prod: 0.91, crowd: 0.72, top: "#718da8", bot: "#b8c4d0" },
};
export const MEDIA = {
  restrained: { label: "Restrained", crowd: 0.92, rep: 0.04 },
  balanced: { label: "Balanced", crowd: 1, rep: 0.1 },
  amplified: { label: "Amplified", crowd: 1.14, rep: 0.18 },
};
export const TEMPLATES = [
  { id: "control", label: "Control Core", zone: "control", need: 1, shifts: ["day", "night"], types: ["shift"], keys: ["control"], w: 1.35, crit: true },
  { id: "cracker", label: "Naphtha Cracker", zone: "cracker", need: 1, shifts: ["day", "night"], types: ["shift"], keys: ["cracker"], w: 1.28, crit: true },
  { id: "olefins", label: "Ethylene / Propylene", zone: "olefins", need: 1, shifts: ["day", "night"], types: ["shift"], keys: ["olefins"], w: 1.2, crit: true },
  { id: "aromatics", label: "Aromatics", zone: "aromatics", need: 1, shifts: ["day", "night"], types: ["shift"], keys: ["aromatics"], w: 1.08, crit: true },
  { id: "utilities", label: "Utility Zone", zone: "utilities", need: 1, shifts: ["day", "night"], types: ["shift"], keys: ["utilities"], w: 0.98, crit: true },
  { id: "tankFarm", label: "Tank Farm", zone: "tankFarm", need: 1, shifts: ["day", "night"], types: ["shift"], keys: ["tankFarm"], w: 0.94, crit: true },
  { id: "hqDesk", label: "HQ / Labor Desk", zone: "hq", need: 2, shifts: ["day"], types: ["day"], keys: ["hq", "labor"], w: 0.82, crit: false },
  { id: "safetyDesk", label: "Safety / Training", zone: "training", need: 2, shifts: ["day"], types: ["day"], keys: ["safetyDesk", "training"], w: 0.98, crit: true },
  { id: "blossomOps", label: "Blossom Gate Ops", zone: "blossom", need: 2, shifts: ["day"], types: ["day", "shift"], keys: ["blossom", "hq", "safetyDesk"], w: 0.9, crit: false, eventOnly: true },
];
export const ZONES = [
  { id: "union", label: "Union", x: 3, y: 7, w: 2, d: 1.4, h: 30, c: "#d6deeb", t: "office" },
  { id: "hq", label: "HQ", x: 4.5, y: 4, w: 3.2, d: 2.2, h: 46, c: "#eef4fb", t: "office" },
  { id: "training", label: "Training", x: 6, y: 8.7, w: 2.2, d: 1.6, h: 28, c: "#f4eee2", t: "office" },
  { id: "control", label: "Control", x: 8.6, y: 6.1, w: 3.1, d: 2.1, h: 42, c: "#d8ecff", t: "control" },
  { id: "cracker", label: "Cracker", x: 11.8, y: 4.4, w: 3.2, d: 3.2, h: 72, c: "#d8dfeb", t: "stack" },
  { id: "olefins", label: "Olefins", x: 15.2, y: 5.4, w: 2.9, d: 2.2, h: 62, c: "#dae9f9", t: "stack" },
  { id: "aromatics", label: "Aromatics", x: 14.6, y: 9.1, w: 3, d: 2.2, h: 58, c: "#e7e2d8", t: "stack" },
  { id: "utilities", label: "Utility", x: 10.8, y: 10.3, w: 2.2, d: 2.1, h: 36, c: "#e2f0ee", t: "utility" },
  { id: "tankFarm", label: "Tank Farm", x: 17.3, y: 9.6, w: 2.6, d: 2.6, h: 24, c: "#f0eee6", t: "tank" },
  { id: "blossom", label: "Blossom Walk", x: 4.1, y: 12.6, w: 6.4, d: 2.1, h: 8, c: "#efd5e0", t: "blossom" },
];

function employee(id, name, role, workType, crew, primary, secondary, age, exp, ready, safety, fatigue, trainee, roleGroup = "Operations") {
  const skills = { control: 24, cracker: 24, olefins: 24, aromatics: 24, utilities: 24, tankFarm: 24, hq: 28, labor: 28, safetyDesk: 28, training: 28, blossom: 28 };
  skills[primary] = clamp(84 - (trainee ? 10 : 0), 64, 92);
  secondary.forEach((key, index) => { skills[key] = clamp(66 + index * 4 - (trainee ? 6 : 0), 46, 84); });
  return { id, name, role, workType, crew, roleGroup, primary, secondary, skills, safety, fatigue, morale: clamp(78 - fatigue * 0.35, 56, 88), age, experienceYears: exp, retirementRisk: clamp((age - 45) / 18 + exp / 120, 0.06, 0.96), successionReadiness: ready, commutePressure: clamp(28 + fatigue * 0.9, 18, 74), trainee, mentorId: null, menteeIds: [], recent: [], active: true, hired: false };
}

export function createEmployees() {
  const crews = { A: ["Hyeon Kim","Min Park","Jae Choi","Yuri Lee","Dae Seo","Jin Hong","Ara Moon"], B: ["Soo Yoon","Taek Kang","Rina Shin","Jun Baek","Mira Jeon","Ian Ko","Nari Lim"], C: ["Eun Ha","Do Han","Seul Oh","Theo Kim","Bora Jang","Noel Yoo","Hari Song"], D: ["Sena Cho","Jisoo Kwon","Rin Ahn","Keon Hwang","Mina Gu","Leon Bae","Gaeul Roh"] };
  const shift = [["Control Operator","control",["cracker"],56,24,74,88],["Cracker Field Lead","cracker",["olefins"],49,18,66,83],["Olefins Operator","olefins",["cracker","aromatics"],43,15,61,79],["Aromatics Operator","aromatics",["olefins"],39,12,58,77],["Utility Technician","utilities",["tankFarm"],45,17,63,82],["Tank Farm Technician","tankFarm",["utilities"],41,14,57,80],["Shift Flex Trainee","control",["utilities","tankFarm"],31,6,42,73]];
  const day = [["day-01","Hana Lee","HR Business Partner","hq",["blossom","labor"],"HR",38,12,59,62],["day-02","Joon Seo","Labor Relations Lead","labor",["hq","blossom"],"Labor",51,23,74,64],["day-03","Yuna Choi","Safety Manager","safetyDesk",["training","blossom"],"Safety",47,19,79,92],["day-04","Daniel Park","Training Coordinator","training",["safetyDesk","hq"],"Training",35,10,54,77],["day-05","Mina Kim","Community Affairs Lead","blossom",["hq","labor"],"Community",34,9,52,68],["day-06","Eric Hong","Welfare Coordinator","blossom",["hq","training"],"Welfare",37,11,55,66],["day-07","Sora Bae","Maintenance Planner","hq",["utilities","cracker"],"Maintenance",44,16,61,74],["day-08","Theo Nam","Production Scheduler","hq",["control","training"],"Planning",32,8,48,69]];
  const out = [];
  ["A","B","C","D"].forEach((crew, crewIndex) => shift.forEach((seed, roleIndex) => out.push(employee(`${crew}-${String(roleIndex + 1).padStart(2, "0")}`, crews[crew][roleIndex], seed[0], "shift", crew, seed[1], seed[2], seed[3] + (crewIndex % 2 ? -1 : 1), seed[4] + crewIndex, seed[5] + crewIndex * 2 - (roleIndex === 6 ? 12 : 0), seed[6] + crewIndex - roleIndex, 20 + roleIndex * 4 + crewIndex * 2, roleIndex === 6))));
  day.forEach((seed, index) => out.push(employee(seed[0], seed[1], seed[2], "day", null, seed[3], seed[4], seed[6], seed[7], seed[8], seed[9], 18 + index * 2, index === 3 || index === 7, seed[5])));
  return out;
}

export function createPool() {
  return [
    employee("pool-01", "Sumin Ryu", "Safety Analyst", "day", null, "safetyDesk", ["training", "blossom"], 31, 7, 42, 66, 18, true, "Support"),
    employee("pool-02", "Jaein Min", "Community Planner", "day", null, "blossom", ["hq", "labor"], 29, 5, 40, 61, 18, true, "Support"),
    employee("pool-03", "Hyuk Jin", "Process Operator", "shift", null, "olefins", ["cracker", "control"], 33, 8, 44, 68, 18, true),
    employee("pool-04", "Darin Oh", "Utility Operator", "shift", null, "utilities", ["tankFarm", "control"], 35, 9, 46, 64, 18, true),
  ];
}

export function createBlossomPlan() {
  const forecast = randInt(6, 10);
  return { forecast, open: forecast, duration: 6, perks: true, media: "balanced", scores: [], done: false };
}
