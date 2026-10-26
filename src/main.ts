import './style.css';
import { bucketSort, insertionSort } from './bucketSort';

const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;

// ---------- navegação dos slides ----------
const slides = Array.from(document.querySelectorAll<HTMLElement>('.slide'));
let cur = 0;

function show(n: number): void {
  cur = Math.max(0, Math.min(slides.length - 1, n));
  slides.forEach((s, i) => s.classList.toggle('on', i === cur));
  $('counter').textContent = `${cur + 1} / ${slides.length}`;
  history.replaceState(null, '', `#${cur + 1}`);
}

$('prev').onclick = () => show(cur - 1);
$('next').onclick = () => show(cur + 1);
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') show(cur + 1);
  if (e.key === 'ArrowLeft') show(cur - 1);
});
show((parseInt((location.hash || '#1').slice(1), 10) || 1) - 1);

// ---------- animação ----------
interface Step {
  msg: string;
  arr: number[];
  b: number[][];
  out: number[];
  used: number; // quantos elementos da entrada já foram consumidos
  cur: number;  // elemento atual
  hot: number;  // balde em destaque
}

const K = 5;
let steps: Step[] = [];
let pos = 0;
let timer: number | null = null;

function build(arr: number[]): Step[] {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = (max - min + 1) / K;
  const b: number[][] = Array.from({ length: K }, () => []);
  const out: number[] = [];
  const s: Step[] = [];

  const snap = (msg: string, o: Partial<Step> = {}) =>
    s.push({
      msg, arr,
      b: b.map((x) => [...x]),
      out: [...out],
      used: -1, cur: -1, hot: -1,
      ...o,
    });

  snap(`Vetor original. Vamos usar ${K} baldes; cada um cobre uma faixa de ${range.toFixed(1)} valores.`);

  arr.forEach((v, i) => {
    const bi = Math.floor((v - min) / range);
    b[bi].push(v);
    snap(`Elemento ${v}: índice do balde = ⌊(${v} − ${min}) / ${range.toFixed(1)}⌋ = ${bi}.`,
      { used: i, cur: i, hot: bi });
  });

  b.forEach((x, i) => {
    if (x.length > 1) {
      b[i] = insertionSort(x);
      snap(`Ordenando o balde ${i} com Insertion Sort.`, { used: arr.length, hot: i });
    }
  });

  b.forEach((x, i) => {
    if (x.length) {
      out.push(...x);
      snap(`Concatenando o balde ${i} no resultado.`, { used: arr.length, hot: i });
    }
  });

  snap('Pronto! Vetor ordenado.', { used: arr.length });
  return s;
}

const box = (v: number, cls: string) =>
  `<div class="cell w-10 h-10 flex items-center justify-center rounded border text-sm font-semibold ${cls}">${v}</div>`;

function render(): void {
  const st = steps[pos];
  $('msg').textContent = st.msg;

  $('input').innerHTML = st.arr
    .map((v, i) =>
      box(v,
        i === st.cur ? 'bg-amber-400 border-amber-500 text-slate-900'
        : i < st.used || st.used === st.arr.length ? 'opacity-30 border-slate-300 dark:border-slate-600'
        : 'border-slate-400 dark:border-slate-500'))
    .join('');

  $('buckets').innerHTML = st.b
    .map((x, i) =>
      `<div class="rounded-lg border p-2 min-h-[7rem] ${
        i === st.hot ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                     : 'border-slate-300 dark:border-slate-600'}">
        <div class="text-xs text-slate-500 mb-1">Balde ${i}</div>
        <div class="flex flex-wrap gap-1">${x.map((v) => box(v, 'bg-emerald-600 border-emerald-700 text-white')).join('')}</div>
      </div>`)
    .join('');

  $('output').innerHTML = st.out.map((v) => box(v, 'bg-sky-600 border-sky-700 text-white')).join('');
}

function stop(): void {
  if (timer !== null) clearInterval(timer);
  timer = null;
  $('bPlay').textContent = 'Auto ▶';
}

function go(n: number): void {
  pos = Math.max(0, Math.min(steps.length - 1, n));
  render();
  if (pos === steps.length - 1) stop();
}

function newArray(): void {
  stop();
  const arr = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100));
  steps = build(arr);
  pos = 0;
  render();
}

$('bNext').onclick = () => { stop(); go(pos + 1); };
$('bPrev').onclick = () => { stop(); go(pos - 1); };
$('bNew').onclick = newArray;
$('bPlay').onclick = () => {
  if (timer !== null) { stop(); return; }
  if (pos === steps.length - 1) pos = 0;
  $('bPlay').textContent = 'Pausar ⏸';
  timer = window.setInterval(() => go(pos + 1), 900);
};

steps = build([29, 25, 3, 49, 9, 37, 21, 43, 15, 7]);
render();

// ---------- benchmark ----------
$('bBench').onclick = () => {
  const n = 20000;
  const data = Array.from({ length: n }, () => Math.floor(Math.random() * 100000));
  const t = (f: () => unknown) => {
    const a = performance.now();
    f();
    return `${(performance.now() - a).toFixed(1)} ms`;
  };
  const bucket = t(() => bucketSort(data, 200));
  const insertion = t(() => insertionSort(data));
  const native = t(() => [...data].sort((a, b) => a - b));
  $('bench').textContent = `Bucket (200 baldes): ${bucket} · Insertion: ${insertion} · Array.sort: ${native}`;
};
