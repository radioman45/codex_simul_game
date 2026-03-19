import "./style.css";
import { createGame } from "./parkTycoon.js";

const root = document.querySelector("#app");

root.innerHTML = `
  <div class="app-shell">
    <header class="hero panel">
      <div class="hero-copy">
        <span class="eyebrow">SK INCHEON PETROCHEMICAL / WORKFORCE DIGITAL TWIN</span>
        <h1>SKIncheonWonchang-Isometric</h1>
        <p>
          인천 서구 봉수대로 415 원창동 플랜트를 배경으로, 4조2교대 운영과 일근 조직, 승계 파이프라인,
          벚꽃동산 개방 이벤트를 동시에 조율하는 인력계획 시뮬레이션입니다.
        </p>
      </div>
      <div class="hero-actions">
        <button data-action="toggle-run">가동 재개</button>
        <button data-action="advance-12h">12시간 진행</button>
        <button data-action="advance-day">1일 진행</button>
        <button data-action="open-audio">오디오 활성화</button>
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
              <h2 data-scene-title>원창동 메인 콤플렉스</h2>
            </div>
            <div class="panel-actions">
              <button data-action="focus-core">플랜트 중심</button>
              <button data-action="focus-blossom">벚꽃동산</button>
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
                <h2>미니맵</h2>
              </div>
            </div>
            <canvas id="minimap-canvas" width="360" height="240"></canvas>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div>
                <span class="eyebrow">Operations Feed</span>
                <h2>현장 로그</h2>
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
              <h2>현장 인력</h2>
            </div>
            <div class="panel-actions">
              <button data-filter="all" class="is-active">전체</button>
              <button data-filter="shift">교대</button>
              <button data-filter="day">일근</button>
            </div>
          </div>
          <p class="hint-text">직원을 드래그해서 아래 배치 슬롯에 놓으세요. 칩의 X 버튼으로 해제할 수 있습니다.</p>
          <div class="roster-list" data-roster></div>
          <div class="employee-detail" data-employee-detail></div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div>
              <span class="eyebrow">Talent & Transfer</span>
              <h2>승계 / 교육</h2>
            </div>
            <div class="panel-actions">
              <button data-action="auto-mentor">멘토 자동매칭</button>
              <button data-action="run-training">집중훈련</button>
              <button data-action="run-handover">지식이전</button>
              <button data-action="emergency-recruit">긴급채용</button>
            </div>
          </div>
          <div class="talent-board" data-talent></div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div>
              <span class="eyebrow">Cherry Blossom Window</span>
              <h2>벚꽃동산 이벤트</h2>
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
            <h2>교대 배치 캘린더</h2>
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
            <h2>지표와 운영 가이드</h2>
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
