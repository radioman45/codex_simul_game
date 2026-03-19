export function createAudioState() {
  return { on: false, ctx: null, loops: [] };
}

export function toggleAudio(state, note) {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    note("Audio", "Web Audio is not available in this browser.");
    return;
  }
  if (!state.audio.ctx) {
    state.audio.ctx = new AudioContextCtor();
  }
  if (state.audio.ctx.state === "suspended") {
    state.audio.ctx.resume();
  }
  state.audio.on = !state.audio.on;
  if (state.audio.on) {
    const master = state.audio.ctx.createGain();
    master.gain.value = 0.03;
    master.connect(state.audio.ctx.destination);
    [["sawtooth", 55, 0.018], ["triangle", 110, 0.012], ["sine", 246, 0.006]].forEach(([type, frequency, gainValue]) => {
      const osc = state.audio.ctx.createOscillator();
      const gain = state.audio.ctx.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.value = gainValue;
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      state.audio.loops.push(osc);
    });
    note("Audio", "Ambient audio enabled.");
    return;
  }
  state.audio.loops.forEach((osc) => {
    try { osc.stop(); } catch {}
  });
  state.audio.loops = [];
  note("Audio", "Ambient audio muted.");
}

export function playSfx(state, kind) {
  if (!state.audio.on || !state.audio.ctx || state.audio.ctx.state !== "running") {
    return;
  }
  const notes = {
    bell: [440, 660, 0.12],
    alarm: [180, 120, 0.18],
    assign: [510, 720, 0.1],
    mentor: [392, 587, 0.14],
    soft: [420, 480, 0.07],
  };
  const [start, end, duration] = notes[kind] || notes.soft;
  const osc = state.audio.ctx.createOscillator();
  const gain = state.audio.ctx.createGain();
  const now = state.audio.ctx.currentTime;
  osc.type = kind === "alarm" ? "sawtooth" : "triangle";
  osc.frequency.setValueAtTime(start, now);
  osc.frequency.exponentialRampToValueAtTime(end, now + duration);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain);
  gain.connect(state.audio.ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}
