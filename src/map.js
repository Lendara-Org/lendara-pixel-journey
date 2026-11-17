// Stylized pixel world map, built from polygons rasterized onto a tile grid.
export const W = 80;
export const H = 45;

const P = {
  northAmerica: [[0, 0], [26, 0], [27, 3], [24, 5], [21, 6], [19, 9], [18, 12], [20, 14], [22, 15], [24, 16], [25, 17.5], [27, 19], [26.5, 20.2], [24, 19.6], [22, 18.4], [19, 16.6], [15, 14.5], [11, 12], [8, 8], [4, 4.5], [0, 3.5]],
  southAmerica: [[26, 20.5], [29, 19.5], [33, 20], [37, 21.5], [40, 23], [44, 25], [45, 27], [43, 30], [40, 32], [37, 34], [35, 35.5], [34, 37], [32, 39], [31, 41], [30, 43], [29.4, 45], [28, 45], [27, 42], [26.5, 38], [26, 34], [25.5, 30], [25, 26], [24, 23], [25, 21]],
  cuba: [[21, 9.2], [26, 9.4], [29, 10.6], [25, 10.8], [21.5, 10.2]],
  hispaniola: [[30, 11], [33.5, 11], [33, 12.2], [30.2, 12.2]],
  uk: [[57, 0], [61, 0], [61.5, 2.6], [59, 3.6], [57.4, 2.6]],
  europe: [[63, 0], [80, 0], [80, 10], [74, 9.5], [70.5, 7.6], [66, 7], [65.5, 5], [63.4, 3]],
  iberia: [[58.6, 8], [60.5, 7], [66, 7], [70.5, 7.6], [71.5, 9.2], [69.5, 12], [65.5, 13.6], [61, 13.8], [59.6, 12.6], [59.2, 10]],
  africa: [[60, 16], [66, 15], [72, 15.6], [80, 15], [80, 45], [75, 45], [72, 40], [70, 34], [69, 30], [66, 28], [61, 27.2], [57, 24.2], [55.8, 21], [57.6, 18]],
  // country highlights
  costaRica: [[22.2, 16.2], [25.6, 17.2], [26.4, 19.8], [22.6, 19.2]],
  argentina: [[27.6, 29], [38.5, 29], [40.4, 32], [37, 34], [35, 35.5], [34, 37], [32, 39], [31, 41], [30, 43], [29.4, 45], [28.4, 45], [28.2, 40], [27.9, 34]],
  portugal: [[58, 7], [62.6, 7], [62.4, 10.5], [62.6, 14], [58, 14]],
};

function inside([px, py], poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

export const hash = (x, y) => {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) % 1000;
};

const LANDS = ['northAmerica', 'southAmerica', 'cuba', 'hispaniola', 'uk', 'europe', 'iberia', 'africa'];

const PAL = {
  deep: '#3f72ad', water: '#4b86c2', shallow: '#6eaed6', foam: '#a9dcea', sand: '#ead59b',
  grass: ['#83c06b', '#78b562'],
  costaRica: ['#4ea85c', '#45994f'],
  argentina: ['#b5c86b', '#a7bb5f'],
  portugal: ['#9bc96d', '#8fbd62'],
  desert: ['#dfc07c', '#d3b36f'],
  andes: ['#a49a73', '#978d68'],
};

export function buildMap() {
  const land = [];
  const region = [];
  for (let y = 0; y < H; y++) {
    land.push([]);
    region.push([]);
    for (let x = 0; x < W; x++) {
      const pt = [x + 0.5, y + 0.5];
      const isLand = LANDS.some((k) => inside(pt, P[k]));
      land[y].push(isLand);
      let r = null;
      if (isLand) {
        if (inside(pt, P.costaRica)) r = 'costaRica';
        else if (inside(pt, P.argentina)) r = 'argentina';
        else if (inside(pt, P.iberia) && inside(pt, P.portugal)) r = 'portugal';
        else if (inside(pt, P.iberia)) r = 'spain';
        else if (inside(pt, P.africa) && y < 30) r = 'desert';
        else r = 'land';
      }
      region[y].push(r);
    }
  }
  const L = (x, y) => x >= 0 && y >= 0 && x < W && y < H && land[y][x];
  const R = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? region[y][x] : null);

  const cells = [];
  const trees = [];
  const mounts = [];
  const borders = [];
  const sparkles = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const h = hash(x, y);
      if (!land[y][x]) {
        let near = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (L(x + dx, y + dy)) near++;
        let near2 = false;
        for (let dy = -2; dy <= 2 && !near2; dy++) for (let dx = -2; dx <= 2; dx++) if (L(x + dx, y + dy)) { near2 = true; break; }
        cells.push({ x, y, c: near ? PAL.shallow : near2 ? PAL.water : h % 7 === 0 ? PAL.water : PAL.deep });
        if (!near && h % 23 === 0) sparkles.push({ x, y, d: (h % 40) / 10 });
        continue;
      }
      const coast = !L(x - 1, y) || !L(x + 1, y) || !L(x, y - 1) || !L(x, y + 1);
      const r = region[y][x];
      const v = h % 3 === 0 ? 1 : 0;
      const andes = r !== null && x < 32 && y > 20 && y < 44 && (!L(x - 1, y) || !L(x - 2, y) || !L(x - 3, y));
      let c;
      if (coast && !andes) c = PAL.sand;
      else if (andes) c = PAL.andes[v];
      else if (r === 'costaRica') c = PAL.costaRica[v];
      else if (r === 'argentina') c = PAL.argentina[v];
      else if (r === 'portugal') c = PAL.portugal[v];
      else if (r === 'desert') c = PAL.desert[v];
      else c = PAL.grass[v];
      cells.push({ x, y, c });
      if (andes && !coast && h % 3 !== 2 && y % 2 === 0) mounts.push({ x, y });
      else if (!coast && !andes && r !== 'desert' && h % 9 === 0) trees.push({ x, y });
      // dotted border between highlighted country and neighbours
      const hl = (q) => q === 'costaRica' || q === 'argentina' || q === 'portugal';
      if ((L(x + 1, y) && R(x + 1, y) !== r && (hl(r) || hl(R(x + 1, y))))) borders.push({ x: x + 1, y, v: true });
      if ((L(x, y + 1) && R(x, y + 1) !== r && (hl(r) || hl(R(x, y + 1))))) borders.push({ x, y: y + 1, v: false });
    }
  }

  // merge horizontal runs of the same colour
  const runs = [];
  let cur = null;
  for (const cell of cells) {
    if (cur && cur.y === cell.y && cur.c === cell.c && cur.x + cur.w === cell.x) cur.w++;
    else runs.push((cur = { x: cell.x, y: cell.y, w: 1, c: cell.c }));
  }
  return { runs, trees, mounts, borders, sparkles };
}

// Places on the map (tile coordinates).
export const PLACES = {
  sanJose: [25.9, 18.6],
  buenosAires: [38.1, 31.6],
  lisbon: [60.6, 10.4],
};

// Routes: [start ... end]. End points are where they meet in Lisbon.
export const ROUTES = {
  anouk: [[23.4, 18.6], [28, 15.6], [36, 13.4], [46, 12.6], [54, 12.6], [60.6, 12.9]],
  elisa: [[33.4, 33.2], [41, 29], [48, 22], [54, 16.6], [58, 14.6], [63.6, 13.2]],
  karen: [[36.4, 33.2], [42.6, 29.6], [49.6, 22.6], [55.6, 17.2], [59.8, 15.2], [66.6, 12.9]],
};

export function routeInfo(pts) {
  const segs = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const len = Math.hypot(bx - ax, by - ay);
    segs.push({ ax, ay, bx, by, len, start: total });
    total += len;
  }
  return { segs, total };
}

export function pointAt(info, t) {
  const d = Math.max(0, Math.min(1, t)) * info.total;
  for (const s of info.segs) {
    if (d <= s.start + s.len) {
      const k = (d - s.start) / s.len;
      return [s.ax + (s.bx - s.ax) * k, s.ay + (s.by - s.ay) * k];
    }
  }
  const last = info.segs[info.segs.length - 1];
  return [last.bx, last.by];
}
