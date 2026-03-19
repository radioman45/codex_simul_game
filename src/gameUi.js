import { MEDIA, START, WEATHER } from "./gameData.js";
import { addDays, avg, clamp, md, money, stamp, ymd } from "./gameUtils.js";

export function renderUi(state, view, conflicts, helpers) {
  const { refs } = state;
  const now = helpers.periodInfo(state.current);
  const weather = WEATHER[helpers.weatherKey(now.dayIndex)];
  setStat(refs.root, "budget", money(state.stats.cash));
  setStat(refs.root, "uptime", `${state.stats.uptime.toFixed(1)}%`);
  setStat(refs.root, "trir", state.stats.trir.toFixed(2));
  setStat(refs.root, "harmony", `${Math.round(state.stats.harmony)}`);
  setStat(refs.root, "succession", `${Math.round(state.stats.succession)}%`);
  setStat(refs.root, "community", `${Math.round(state.stats.community)}`);
  setStat(refs.root, "fatigue", `${Math.round(state.stats.fatigue)}`);
  setStat(refs.root, "clock", stamp(now.date));
  refs.title.textContent = state.focus === "blossom" ? "Blossom Walk & Gates" : "Main Process Core";
  refs.run.textContent = state.running ? "Pause Sim" : "Start Sim";
  refs.audio.textContent = state.audio.on ? "Audio On" : "Audio";

  refs.alert.innerHTML = state.alerts.map((alert) => `<div class="overlay-card ${alert.t === "critical" ? "tone-critical" : "tone-warn"}"><strong>${alert.t === "critical" ? "Alert" : "Watch"}</strong><div class="mini-label">${alert.text}</div></div>`).join("");
  refs.clock.innerHTML = `<div class="overlay-card"><div class="metric-list"><div class="metric-line"><span>Calendar</span><strong>${ymd(now.date)}</strong></div><div class="metric-line"><span>Active Shift</span><strong>${now.shift === "day" ? "Day Shift" : "Night Shift"}</strong></div><div class="metric-line"><span>Weather</span><strong>${weather.label}</strong></div><div class="metric-line"><span>Market Index</span><strong>${state.mods.market.toFixed(2)}x</strong></div><div class="metric-line"><span>Blossom Window</span><strong>D-${Math.max(0, state.blossom.open - helpers.dayNow())}</strong></div></div></div>`;
  refs.legend.innerHTML = `<div class="overlay-card"><strong>Zone Heat Legend</strong><div class="metric-list">${bar("Process coverage", avg(helpers.currentSlots().map((slot) => slot.q)))}${bar("Safety heat", 1 - state.stats.trir / 2.5)}${bar("Labor climate", state.stats.harmony / 100)}${bar("Succession", state.stats.succession / 100)}</div></div>`;
  refs.roster.innerHTML = helpers.filteredEmployees().map((employee) => renderRosterCard(employee, state.selected, nextJobs(view, employee.id, 2))).join("");
  refs.detail.innerHTML = renderDetail(state, nextJobs(view, state.selected, 4), helpers);
  refs.talent.innerHTML = renderTalent(state);
  refs.event.innerHTML = renderEvent(state, helpers, view);
  refs.pattern.innerHTML = renderPattern(state, helpers);
  refs.conflicts.innerHTML = conflicts.length ? conflicts.slice(0, 6).map((conflict) => `<article class="conflict-card"><h3>${conflict.sev === "high" ? "High risk" : "Watch item"}</h3><div class="mini-label">${conflict.text}</div></article>`).join("") : `<article class="conflict-card ok"><h3>Schedule health is stable</h3><div class="mini-label">No duplicate, rest, overtime, mismatch, or handover conflicts in the visible horizon.</div></article>`;
  refs.board.innerHTML = `<div class="board-scroll">${view.map((period) => renderLane(state, period, helpers.weatherKey(period.info.dayIndex))).join("")}</div>`;
  refs.dash.innerHTML = renderDash(state, conflicts, helpers, view);
  refs.tutorial.innerHTML = renderTutorial(state, helpers, view);
  refs.log.innerHTML = state.logs.slice(0, 8).map((entry) => `<article class="feed-item"><div class="feed-meta">${entry.time}</div><h3>${entry.tag}</h3><div class="mini-label">${entry.text}</div></article>`).join("");
}

export function buildConflicts(state, view, availableFn) {
  const out = [], seen = new Set(), usage = new Map();
  view.forEach((period) => {
    const local = new Map();
    period.slots.forEach((slot) => {
      if (slot.cov < 1) push(out, seen, { sev: slot.crit ? "high" : "medium", text: `${period.info.label}: ${slot.label} is underfilled (${slot.employeeIds.length}/${slot.need}).` });
      if (slot.crit && !slot.senior) push(out, seen, { sev: "medium", text: `${period.info.label}: ${slot.label} lacks senior handover coverage.` });
      slot.employeeIds.forEach((employeeId) => {
        const employee = state.map.get(employeeId);
        local.set(employeeId, [...(local.get(employeeId) || []), slot.label]);
        usage.set(employeeId, [...(usage.get(employeeId) || []), period.info.index]);
        if (!slot.types.includes(employee.workType) || (employee.workType === "day" && period.info.shift === "night")) push(out, seen, { sev: "high", text: `${period.info.label}: ${employee.name} is mismatched to ${slot.label}.` });
        if (!availableFn(employee, period.info, slot)) push(out, seen, { sev: "medium", text: `${period.info.label}: ${employee.name} is covering off-pattern overtime.` });
      });
      if (slot.off) push(out, seen, { sev: "medium", text: `${period.info.label}: ${slot.label} uses rest-violating or off-pattern coverage.` });
    });
    local.forEach((labels, employeeId) => labels.length > 1 && push(out, seen, { sev: "high", text: `${period.info.label}: ${state.map.get(employeeId)?.name || employeeId} is double-booked (${labels.join(", ")}).` }));
  });
  usage.forEach((periods, employeeId) => {
    const employee = state.map.get(employeeId);
    const hours = periods.length * 12 + (employee?.recent.length || 0) * 12;
    const limit = employee?.workType === "day" ? 60 : 72;
    if (hours > limit) push(out, seen, { sev: "medium", text: `${employee?.name || employeeId} is projected for ${hours}h against a ${limit}h threshold.` });
    const sorted = [...periods].sort((a, b) => a - b);
    for (let index = 1; index < sorted.length; index += 1) if (sorted[index] - sorted[index - 1] === 1) { push(out, seen, { sev: "high", text: `${employee?.name || employeeId} has consecutive half-shift assignments without mandatory rest.` }); break; }
  });
  return out.slice(0, 12);
}

function renderRosterCard(employee, selectedId, nextAssignments) {
  return `<article class="employee-card${employee.id === selectedId ? " is-selected" : ""}" draggable="true" data-employee-id="${employee.id}" data-select-employee="${employee.id}"><div class="employee-top"><div><h3>${employee.name}</h3><div class="employee-meta">${employee.role}</div></div><span class="crew-pill">${employee.workType === "shift" ? `Crew ${employee.crew}` : "Day Staff"}</span></div><div class="badge-row"><span class="badge">${employee.primary}</span><span class="badge ${employee.retirementRisk >= 0.75 ? "is-warm" : ""}">retire ${Math.round(employee.retirementRisk * 100)}%</span><span class="badge ${employee.trainee ? "is-cherry" : ""}">${employee.trainee ? "pipeline" : "core"}</span></div><div class="bar-group">${bar("Skill", Math.max(...Object.values(employee.skills)) / 100, "")}${bar("Safety", employee.safety / 100, "")}${bar("Fatigue", employee.fatigue / 100, employee.fatigue > 65 ? " is-danger" : employee.fatigue > 45 ? " is-warm" : "")}</div><div class="mini-label">${nextAssignments.length ? `Next: ${nextAssignments.join(" | ")}` : "No future slot booked in horizon"}</div></article>`;
}

function renderDetail(state, nextAssignments, helpers) {
  const employee = state.map.get(state.selected) || helpers.filteredEmployees()[0];
  if (!employee) return "";
  state.selected = employee.id;
  const mentor = employee.mentorId ? state.map.get(employee.mentorId)?.name || "Unassigned" : "Unassigned";
  const mentees = employee.menteeIds.map((menteeId) => state.map.get(menteeId)?.name).filter(Boolean).join(", ") || "None";
  return `<article class="detail-card"><h3>${employee.name}</h3><div class="detail-grid"><div class="detail-row"><span>Role</span><strong>${employee.role}</strong></div><div class="detail-row"><span>Work Type</span><strong>${employee.workType === "shift" ? `Crew ${employee.crew}` : "Day Staff"}</strong></div><div class="detail-row"><span>Experience</span><strong>${employee.experienceYears}y</strong></div><div class="detail-row"><span>Succession Ready</span><strong>${Math.round(employee.successionReadiness)}%</strong></div><div class="detail-row"><span>Commute Pressure</span><strong>${Math.round(employee.commutePressure)}%</strong></div></div><div class="bar-group">${bar("Primary fit", (employee.skills[employee.primary] || 18) / 100, "")}${bar("Morale", employee.morale / 100, "")}${bar("Fatigue", employee.fatigue / 100, employee.fatigue > 65 ? " is-danger" : employee.fatigue > 45 ? " is-warm" : "")}</div><div class="metric-list"><div class="metric-line"><span>Mentor</span><strong>${mentor}</strong></div><div class="metric-line"><span>Mentees</span><strong>${mentees}</strong></div><div class="metric-line"><span>Upcoming</span><strong>${nextAssignments.join(" / ") || "No slot in horizon"}</strong></div></div></article>`;
}

function renderTalent(state) {
  const retiring = state.employees.filter((employee) => employee.active).sort((a, b) => b.retirementRisk - a.retirementRisk).slice(0, 4);
  const trainees = state.employees.filter((employee) => employee.active && employee.trainee).sort((a, b) => a.successionReadiness - b.successionReadiness).slice(0, 4);
  const pairs = state.employees.filter((employee) => employee.active && employee.mentorId).slice(0, 4).map((employee) => `${employee.name} <- ${state.map.get(employee.mentorId)?.name || "?"}`);
  return `<article class="talent-card"><h3>Retirement Exposure</h3><div class="metric-list">${retiring.map((employee) => `<div class="metric-line"><span>${employee.role}</span><strong>${employee.name} ${Math.round(employee.retirementRisk * 100)}%</strong></div>`).join("")}</div></article><article class="talent-card"><h3>Pipeline Readiness</h3><div class="bar-group">${trainees.map((employee) => bar(employee.name, employee.successionReadiness / 100, employee.successionReadiness < 50 ? " is-warm" : "")).join("")}</div></article><article class="talent-card"><h3>Mentor Pairs</h3><div class="metric-list">${pairs.length ? pairs.map((pair) => `<div class="metric-line"><span>Pair</span><strong>${pair}</strong></div>`).join("") : `<div class="metric-line"><span>Status</span><strong>No mentor pairs yet</strong></div>`}</div></article><article class="talent-card"><h3>External Pool</h3><div class="metric-list">${state.pool.length ? state.pool.slice(0, 3).map((candidate) => `<div class="metric-line"><span>${candidate.workType}</span><strong>${candidate.name} / ${candidate.role}</strong></div>`).join("") : `<div class="metric-line"><span>Status</span><strong>Pool exhausted</strong></div>`}</div></article>`;
}

function renderEvent(state, helpers, view) {
  const crowd = Math.round(6300 * WEATHER[helpers.weatherKey(state.blossom.open)].crowd * MEDIA[state.blossom.media].crowd * (state.blossom.perks ? 1.08 : 1));
  const eventView = view.find((period) => period.slots.some((slot) => slot.zone === "blossom"));
  const quality = eventView ? eventView.slots.find((slot) => slot.zone === "blossom")?.q || 0 : 0;
  return `<article class="event-card"><h3>Opening Setup</h3><div class="metric-list"><div class="metric-line"><span>Forecast</span><strong>${md(addDays(START, state.blossom.forecast))}</strong></div><div class="metric-line"><span>Opening</span><strong>${md(addDays(START, state.blossom.open))}</strong></div><div class="metric-line"><span>Duration</span><strong>${state.blossom.duration} days</strong></div><div class="metric-line"><span>Status</span><strong>${helpers.eventDay(helpers.dayNow()) ? "Live" : `D-${Math.max(0, state.blossom.open - helpers.dayNow())}`}</strong></div><div class="metric-line"><span>Expected visitors</span><strong>${crowd.toLocaleString()}</strong></div></div><div class="event-controls"><div class="control-line"><span>Opening date</span><div class="panel-actions"><button data-event-action="date-minus">-1 day</button><button data-event-action="date-plus">+1 day</button></div></div><div class="control-line"><span>Duration</span><button data-event-action="duration-toggle">${state.blossom.duration === 6 ? "Switch to 7 days" : "Switch to 6 days"}</button></div><div class="control-line"><span>Family perks</span><button data-event-action="family-toggle" class="${state.blossom.perks ? "is-active" : ""}">${state.blossom.perks ? "Enabled" : "Disabled"}</button></div><div class="control-line"><span>PR mode</span><div class="panel-actions">${Object.entries(MEDIA).map(([key, value]) => `<button data-event-action="media" data-value="${key}" class="${state.blossom.media === key ? "is-active" : ""}">${value.label}</button>`).join("")}</div></div></div><div class="bar-group">${bar("Projected event staffing", quality, quality < 0.65 ? " is-warm" : "")}</div></article>`;
}

function renderPattern(state, helpers) {
  const days = Array.from({ length: 8 }, (_, index) => helpers.dayNow() + index);
  const row = (crew) => `<div class="pattern-row"><strong>${crew === "day" ? "Day Staff" : `Crew ${crew}`}</strong>${days.map((dayIndex) => crew === "day" ? `<span class="pattern-cell ${helpers.eventDay(dayIndex) ? "is-day" : [0, 6].includes(addDays(START, dayIndex).getDay()) ? "is-off" : "is-day"}">${helpers.eventDay(dayIndex) ? "Event" : [0, 6].includes(addDays(START, dayIndex).getDay()) ? "Off" : "Office"}</span>` : `<span class="pattern-cell is-${helpers.crewShift(crew, dayIndex)}">${helpers.crewShift(crew, dayIndex) === "day" ? "Day" : helpers.crewShift(crew, dayIndex) === "night" ? "Night" : "Off"}</span>`).join("")}</div>`;
  return `<div class="pattern-table"><div class="pattern-row"><strong>Day</strong>${days.map((dayIndex) => `<span class="pattern-cell">${md(addDays(START, dayIndex))}</span>`).join("")}</div>${row("A")}${row("B")}${row("C")}${row("D")}${row("day")}</div>`;
}

function renderLane(state, period, weatherKey) {
  return `<section class="lane-column"><header class="lane-head"><span class="eyebrow">${md(period.info.date)}</span><h3>${period.info.shift === "day" ? "Day Shift" : "Night Shift"}</h3><div class="mini-label">${WEATHER[weatherKey].label}</div></header>${period.slots.map((slot) => `<article class="slot-card${slot.cov < 1 ? " is-underfilled" : slot.q >= 0.72 ? " is-healthy" : ""}" data-slot-id="${slot.id}"><div class="employee-top"><div><h3>${slot.label}</h3><div class="slot-meta">need ${slot.need} / fill ${slot.employeeIds.length}</div></div><span class="badge ${slot.manual ? "is-cherry" : ""}">${slot.manual ? "manual" : "auto"}</span></div><div class="badge-row"><span class="badge">${Math.round(slot.q * 100)} quality</span><span class="badge ${slot.off ? "is-warm" : ""}">${slot.off ? "off-pattern" : "planned"}</span></div><div class="slot-chip-row">${slot.employeeIds.length ? slot.employeeIds.map((employeeId) => `<span class="slot-chip${slot.manual ? " is-manual" : ""}">${state.map.get(employeeId)?.name || employeeId}<button type="button" data-slot-id="${slot.id}" data-remove-assignment="${employeeId}">x</button></span>`).join("") : `<div class="slot-empty">Drop an employee here</div>`}</div></article>`).join("")}</section>`;
}

function renderDash(state, conflicts, helpers, view) {
  const eventView = view.find((period) => period.slots.some((slot) => slot.zone === "blossom"));
  const eventQuality = eventView ? eventView.slots.find((slot) => slot.zone === "blossom")?.q || 0 : 0;
  const exposure = Math.round(avg(state.employees.filter((employee) => employee.active).sort((a, b) => b.retirementRisk - a.retirementRisk).slice(0, 6).map((employee) => employee.retirementRisk)) * 100);
  return `<article class="dashboard-card"><h3>Finance Flow</h3><div class="metric-list"><div class="metric-line"><span>Revenue to date</span><strong>${money(state.fin.revenue)}</strong></div><div class="metric-line"><span>Salary cost</span><strong>${money(state.fin.salary)}</strong></div><div class="metric-line"><span>Overtime cost</span><strong>${money(state.fin.overtime)}</strong></div><div class="metric-line"><span>Last net period</span><strong>${money(state.fin.last.net)}</strong></div></div></article><article class="dashboard-card"><h3>Safety & Labor</h3><div class="metric-list"><div class="metric-line"><span>TRIR</span><strong>${state.stats.trir.toFixed(2)}</strong></div><div class="metric-line"><span>Regulation pressure</span><strong>${Math.round(state.mods.reg * 100)}%</strong></div><div class="metric-line"><span>Union pressure</span><strong>${Math.round(state.mods.labor * 100)}%</strong></div><div class="metric-line"><span>Visible conflicts</span><strong>${conflicts.length}</strong></div></div></article><article class="dashboard-card"><h3>Succession & Talent</h3><div class="metric-list"><div class="metric-line"><span>Coverage</span><strong>${Math.round(state.stats.succession)}%</strong></div><div class="metric-line"><span>Retirement exposure</span><strong>${exposure}%</strong></div><div class="metric-line"><span>Mentor pairs</span><strong>${state.employees.filter((employee) => employee.active && employee.mentorId).length}</strong></div><div class="metric-line"><span>Training live</span><strong>${state.progs.training ? "Yes" : "No"}</strong></div></div></article><article class="dashboard-card"><h3>Community & Event</h3><div class="metric-list"><div class="metric-line"><span>Reputation</span><strong>${Math.round(state.stats.community)}</strong></div><div class="metric-line"><span>Event staffing</span><strong>${Math.round(eventQuality * 100)}%</strong></div><div class="metric-line"><span>Family perks</span><strong>${state.blossom.perks ? "On" : "Off"}</strong></div><div class="metric-line"><span>Current staffed zones</span><strong>${helpers.currentSlots().filter((slot) => slot.cov >= 1).length}</strong></div></div></article>`;
}

function renderTutorial(state, helpers, view) {
  const eventView = view.find((period) => period.slots.some((slot) => slot.zone === "blossom"));
  const quality = eventView ? eventView.slots.find((slot) => slot.zone === "blossom")?.cov || 0 : 0;
  const tasks = [["Hold uptime above 90%", state.stats.uptime >= 90],["Keep harmony above 70", state.stats.harmony >= 70],["Cover blossom gate before opening", quality >= 1 || helpers.dayNow() > state.blossom.open],["Raise succession over 72%", state.stats.succession >= 72],["Create at least 3 mentor pairs", state.employees.filter((employee) => employee.active && employee.mentorId).length >= 3]];
  return tasks.map(([text, done]) => `<article class="tutorial-card${done ? " done" : ""}"><h3>${done ? "Closed loop" : "Guide"}</h3><div class="mini-label">${text}</div></article>`).join("");
}

function nextJobs(view, employeeId, limit) {
  const out = [];
  view.forEach((period) => period.slots.forEach((slot) => slot.employeeIds.includes(employeeId) && out.length < limit && out.push(`${md(period.info.date)} ${slot.label}`)));
  return out;
}

function push(out, seen, item) { if (seen.has(item.text)) return; seen.add(item.text); out.push(item); }
function setStat(root, key, value) { const node = root.querySelector(`[data-stat='${key}']`); if (node) node.textContent = value; }
function bar(label, value, extra = "") { return `<div class="bar-row"><div class="bar-head"><span>${label}</span><strong>${Math.round(clamp(value, 0, 1) * 100)}%</strong></div><div class="bar-track"><div class="bar-fill${extra}" style="width:${clamp(value, 0, 1) * 100}%"></div></div></div>`; }
