// src/views/AITrain.ts
// UI to run GA locally and save best weights to localStorage. No libs.

import { initRouter, navigate } from '../router.js';
import { initPopulation, evolve, Individual } from '../ai/algorithm.ts';
import { serialize } from '../ai/nn.js';

const KEY = 'ft_ai_weights_v1';

export const AITrainView = () => {
  const wrap = document.createElement('div');

  let gen = 0;
  let popSize = 60;
  let frames = 2800;
  let survivors = 10;
  let running = false;
  let pop = initPopulation(popSize, 2025);
  let latestBest: Individual | null = null;

  wrap.innerHTML = `
    <div class="card">
      <h2>AI Trainer (Genetic)</h2>
      <p class="muted">Runs a tiny GA in-browser. Saves best weights to your device only.</p>

      <div class="row">
        <label style="flex:1">
          Population
          <input class="input-field" id="pop" type="number" value="${popSize}" min="10" max="200"/>
        </label>
        <label style="flex:1">
          Frames/gen
          <input class="input-field" id="frames" type="number" value="${frames}" min="600" max="8000"/>
        </label>
        <label style="flex:1">
          Survivors
          <input class="input-field" id="surv" type="number" value="${survivors}" min="2" max="40"/>
        </label>
      </div>

      <div class="row">
        <button class="btn primary" id="run1">Run 1 Generation</button>
        <button class="btn" id="run5">Run 5 Generations</button>
        <button class="btn" id="stop">Stop</button>
      </div>

      <div class="row">
        <button class="btn" id="save" disabled>Save Best → Inference</button>
        <a class="btn" data-link href="/ai" id="play">Play vs Saved AI</a>
        <a class="btn" data-link href="/">Back</a>
      </div>

      <div class="card" style="margin-top:16px">
        <h3>Status</h3>
        <p id="status" class="muted">Idle.</p>
        <p id="best">Best: n/a</p>
        <p>Generation: <span id="gen">0</span></p>
      </div>
    </div>
  `;

  const $ = (sel: string) => wrap.querySelector(sel) as HTMLElement;
  const $num = (sel: string) => wrap.querySelector(sel) as HTMLInputElement;

  function syncParams() {
    popSize = clampInt(parseInt($num('#pop').value || '60'), 10, 200);
    frames = clampInt(parseInt($num('#frames').value || '2800'), 600, 8000);
    survivors = clampInt(parseInt($num('#surv').value || '10'), 2, Math.min(40, popSize - 1));
  }

  function setStatus(s: string) { $('#status').textContent = s; }
  function setGen() { $('#gen').textContent = String(gen); }
  function setBest(b: Individual | null) {
    $('#best').textContent = b ? `Best fitness: ${b.fit.toFixed(2)}` : 'Best: n/a';
    (wrap.querySelector('#save') as HTMLButtonElement).disabled = !b;
  }

  async function runGenerations(n: number) {
    if (running) return;
    running = true;
    setStatus(`Running ${n} generation(s)…`);
    try {
      syncParams();
      if (pop.length !== popSize) pop = initPopulation(popSize, 2025 + gen);
      for (let i = 0; i < n && running; i++) {
        const { next, best } = evolve(pop, { seed: 9000 + gen, survivors, frames });
        pop = next;
        latestBest = best;
        gen += 1;
        setGen();
        setBest(best);
      }
      if (!running) setStatus('Stopped.');
      else setStatus('Done.');
    } finally {
      running = false;
    }
  }

  (wrap.querySelector('#run1') as HTMLButtonElement).onclick = () => runGenerations(1);
  (wrap.querySelector('#run5') as HTMLButtonElement).onclick = () => runGenerations(5);
  (wrap.querySelector('#stop') as HTMLButtonElement).onclick = () => { running = false; };

  (wrap.querySelector('#save') as HTMLButtonElement).onclick = () => {
    if (!latestBest) return;
    localStorage.setItem(KEY, serialize(latestBest.w));
    alert('Saved best weights to device. Now “Play vs AI” will use them.');
  };

  return wrap;
};

function clampInt(v: number, a: number, b: number) {
  if (Number.isNaN(v)) return a;
  return Math.min(b, Math.max(a, v | 0));
}
