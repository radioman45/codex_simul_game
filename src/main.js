import { createGame } from "./parkTycoon.js";

const root = document.querySelector("#app");

root.innerHTML = `
  <div class="app-shell">
    <header class="hero panel">
      <div class="hero-copy">
        <span class="eyebrow">SK INCHEON PETROCHEMICAL / WORKFORCE DIGITAL TWIN</span>
        <h1>SKIncheonWonchang-Isometric</h1>
        <p>
          Manage a 4-crew petrochemical workforce across headquarters, the cracker, aromatics, utilities,
          succession planning, labor harmony, and the spring blossom opening window.
        </p>
      </div>
      <div class="hero-actions">
        <button data-action="toggle-run">Start Sim</button>
        <button data-action="advance-12h">Advance 12h</button>
        <button data-action="advance-day">Advance 1 day</button>
        <button data-action="open-audio">Audio</button>
      </div>
    </header>

    <section class="top-grid">
      <article class="stat-card panel">
        <span>Operating Cash</span>
        <strong data-stat="budget"></strong>
      </article>
      <article class="stat-card panel">
        <span>Production Uptime</span>
        <strong data-stat="uptime"></strong>
      </article>
      <article class="stat-card panel">
        <span>TRIR</span>
        <strong data-stat="trir"></strong>
      </article>
      <article class="stat-card panel">
        <span>Union Harmony</span>
        <strong data-stat="harmony"></strong>
      </article>
      <article class="stat-card panel">
        <span>Succession Coverage</span>
        <strong data-stat="succession"></strong>
      </article>
      <article class="stat-card panel">
        <span>Community Reputation</span>
        <strong data-stat="community"></strong>
      </article>
      <article class="stat-card panel">
        <span>Average Fatigue</span>
        <strong data-stat="fatigue"></strong>
      </article>
      <article class="stat-card panel">
        <span>Calendar</span>
        <strong data-stat="clock"></strong>
      </article>
    </section>

    <main class="main-grid">
      <section class="visual-column">
        <section class="panel canvas-shell">
          <div class="canvas-toolbar">
            <div class="canvas-title">
              <span class="eyebrow">Plant Overview</span>
              <h2 data-scene-title>Main Process Core</h2>
            </div>
            <div class="panel-actions">
              <button data-action="focus-core">Focus Core</button>
              <button data-action="focus-blossom">Focus Blossom</button>
            </div>
          </div>
          <canvas id="game-canvas" width="1440" height="840"></canvas>
          <div class="canvas-overlay overlay-top" data-overlay="alerts"></div>
          <div class="canvas-overlay overlay-left" data-overlay="clock"></div>
          <div class="canvas-overlay overlay-right" data-overlay="legend"></div>
        </section>

        <div class="visual-support">
          <section class="panel">
            <div class="panel-head">
              <div>
                <span class="eyebrow">Staffing Heatmap</span>
                <h2>Minimap</h2>
              </div>
            </div>
            <canvas id="minimap-canvas" width="360" height="240"></canvas>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div>
                <span class="eyebrow">Operations Feed</span>
                <h2>Control Log</h2>
              </div>
            </div>
            <div class="log-stack" data-log></div>
          </section>
        </div>
      </section>

      <aside class="sidebar">
        <section class="panel">
          <div class="panel-head">
            <div>
              <span class="eyebrow">Live Roster</span>
              <h2>Employee Network</h2>
            </div>
            <div class="panel-actions">
              <button data-filter="all" class="is-active">All</button>
              <button data-filter="shift">Shift</button>
              <button data-filter="day">Day</button>
            </div>
          </div>
          <p class="hint-text">
            Drag people into future slots to rework staffing. Remove a slot assignment with the small x button.
          </p>
          <div class="roster-list" data-roster></div>
          <div class="employee-detail" data-employee-detail></div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div>
              <span class="eyebrow">Talent & Transfer</span>
              <h2>Succession Desk</h2>
            </div>
            <div class="panel-actions">
              <button data-action="auto-mentor">Auto Mentor</button>
              <button data-action="run-training">Training</button>
              <button data-action="run-handover">Handover</button>
              <button data-action="emergency-recruit">Emergency Hire</button>
            </div>
          </div>
          <div class="talent-board" data-talent></div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div>
              <span class="eyebrow">Cherry Blossom Window</span>
              <h2>Community Event</h2>
            </div>
          </div>
          <div class="event-center" data-event></div>
        </section>
      </aside>
    </main>

    <section class="operations-grid">
      <section class="panel schedule-panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">4 Crew / 2 Shift Workforce Planning</span>
            <h2>Assignment Board</h2>
          </div>
          <div class="panel-actions">
            <button data-action="undo">Undo</button>
            <button data-action="redo">Redo</button>
          </div>
        </div>
        <div class="pattern-wrap" data-pattern></div>
        <div class="conflict-wrap" data-conflicts></div>
        <div class="board-wrap" data-board></div>
      </section>

      <section class="panel analytics-panel">
        <div class="panel-head">
          <div>
            <span class="eyebrow">KPI / Strategy / Onboarding</span>
            <h2>Operations Guide</h2>
          </div>
        </div>
        <div class="dashboard-grid" data-dashboards></div>
        <div class="tutorial-stack" data-tutorial></div>
      </section>
    </section>
  </div>
`;

createGame({
  canvas: document.querySelector("#game-canvas"),
  minimapCanvas: document.querySelector("#minimap-canvas"),
  statsRoot: root,
});
