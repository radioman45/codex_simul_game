# SKIncheonWonchang-Isometric Implementation Plan

## Goal

Rebuild the current browser game into a fully playable isometric workforce planning simulation for SK인천석유화학 원창동 본사/플랜트, centered on 4조2교대 staffing, succession planning, safety, labor harmony, and the seasonal 벚꽃동산 public opening event.

## Product Scope

### 1. Core Presentation

- [x] Replace the current theme park identity with `SKIncheonWonchang-Isometric`.
- [x] Create a new dashboard shell with:
  - [x] Top KPI strip
  - [x] Main isometric plant canvas
  - [x] Minimap with zone staffing heatmap
  - [x] Workforce planning calendar
  - [x] Employee roster and detail panel
  - [x] Event / crisis management panel
  - [x] Succession / training panel
  - [x] Tutorial / alert / log surfaces
- [x] Update typography, color system, and responsive layout to match an industrial cel-shaded SK blue-orange visual direction.

### 2. World and Isometric Rendering

- [ ] Render an isometric complex inspired by SK인천석유화학 원창동 site context.
- [ ] Include major areas:
  - [ ] 본사 / HR headquarters
  - [ ] Union office
  - [ ] Training center
  - [ ] Naphtha cracker
  - [ ] Ethylene / propylene zone
  - [ ] Aromatics facilities
  - [ ] Utility zone
  - [ ] Tank farm
  - [ ] Control / operations core
  - [ ] 벚꽃동산 walkway and gates
- [ ] Add top-left lighting, smoke stacks, pipelines, tanks, and spring cherry visuals.
- [ ] Add day/night lighting and seasonal bloom overlays.

### 3. Workforce Planning Systems

- [ ] Implement 4조2교대 rotation logic for shift workers.
- [ ] Implement fixed 일근 scheduling logic for office / HQ staff.
- [ ] Build a drag-and-drop assignment board for staffing upcoming shifts.
- [ ] Add undo / redo for schedule changes.
- [ ] Add conflict detection for:
  - [ ] Duplicate assignments
  - [ ] Mandatory rest violations
  - [ ] Excess overtime
  - [ ] Shift/day-worker mismatch
  - [ ] Handover coverage risk
- [ ] Reflect staffing quality into uptime, fatigue, morale, and safety outcomes.

### 4. Employee Simulation

- [ ] Model employees with:
  - [ ] Role group
  - [ ] Crew / work type
  - [ ] Skill
  - [ ] Safety competency
  - [ ] Fatigue
  - [ ] Morale
  - [ ] Age
  - [ ] Years of experience
  - [ ] Retirement risk
  - [ ] Succession readiness
  - [ ] Commute / urban pressure factors
- [ ] Update employee state over time based on assignments, overtime, training, and events.
- [ ] Surface employee details and staffing suitability in UI.

### 5. Succession and Talent Pipeline

- [ ] Implement trainee pipeline progression.
- [ ] Implement mentorship pairing logic.
- [ ] Implement knowledge transfer / handover action.
- [ ] Forecast retirement exposure from age demographics.
- [ ] Compute succession coverage % for critical roles.
- [ ] Add talent pool and emergency recruitment actions.

### 6. Cherry Blossom Event

- [ ] Randomize yearly blossom forecast timing in early April.
- [ ] Let the player set opening date and 6-7 day duration.
- [ ] Let the player toggle family perks and media / PR posture.
- [ ] Require safety / HR staffing for crowd control and rule enforcement.
- [ ] Model visitor influx, morale gain, fatigue cost, community reputation, and risk.
- [ ] Trigger positive / negative outcomes based on event execution quality.

### 7. Economy, Safety, and Strategy Layer

- [ ] Start the company economy at `$200,000,000`.
- [ ] Track:
  - [ ] Salary and overtime costs
  - [ ] Training costs
  - [ ] Recruitment costs
  - [ ] Welfare / settlement costs
  - [ ] Event operating costs
- [ ] Compute production revenue from uptime and market conditions.
- [ ] Add warnings for:
  - [ ] Safety incidents / TRIR increase
  - [ ] Regulatory violations / HSE pressure
  - [ ] Labor disputes
  - [ ] Talent shortage
  - [ ] Financial strain
- [ ] Track long-term workforce stability and strategic score pillars.

### 8. Dynamic Events and Audio

- [ ] Add random events:
  - [ ] Oil price swing
  - [ ] HSE regulation tightening
  - [ ] Union demand spike
  - [ ] Retirement wave
  - [ ] Recruitment competition
  - [ ] Blossom weather variability
- [ ] Add Web Audio API ambient bed and SFX:
  - [ ] Plant hum
  - [ ] Shift bell
  - [ ] Alarm / tension tones
  - [ ] Port horn
  - [ ] Cherry blossom wind layer

### 9. Verification

- [ ] Run `npm run check`.
- [ ] Start the local server once for smoke verification.
- [ ] Fix syntax / runtime issues found during verification.
- [ ] Update `progress.md` with final completion notes.

## Implementation Order

1. Build state model, data sets, and schedule logic.
2. Implement drag-and-drop staffing board and KPI calculations.
3. Implement isometric renderer and minimap.
4. Implement event, succession, crisis, and audio systems.
5. Verify, fix, and document final state.

## Risks To Watch

- The feature set is large for a no-framework static JS project, so the implementation should be modular even inside a single file.
- Drag-and-drop schedule interactions can create state bugs if assignment history is not normalized.
- Audio must fail gracefully until the user interacts with the page.
- The game should remain readable on smaller laptop screens despite dashboard density.
