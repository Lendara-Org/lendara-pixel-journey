import React, { useMemo } from 'react';

// Renders a pixel grid (array of strings) as SVG rects, merging horizontal runs.
export function Pixels({ grid, pal, x = 0, y = 0, p = 1, className }) {
  const rects = useMemo(() => {
    const out = [];
    grid.forEach((row, ry) => {
      let start = 0;
      for (let rx = 1; rx <= row.length; rx++) {
        if (rx === row.length || row[rx] !== row[start]) {
          const ch = row[start];
          const fill = pal[ch];
          if (ch !== '.' && fill) out.push({ x: start, y: ry, w: rx - start, fill });
          start = rx;
        }
      }
    });
    return out;
  }, [grid, pal]);
  return (
    <g transform={`translate(${x} ${y}) scale(${p})`} className={className}>
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w + 0.02} height={1.02} fill={r.fill} />
      ))}
    </g>
  );
}

// ---------- Characters (12 x 15 px, top-down chibi RPG style) ----------

const HEADS = {
  // Anouk: long straight dark hair, glasses
  anouk: [
    '....OOOO....',
    '..OOHHHHOO..',
    '.OHHHHhHHHO.',
    '.OHHHHHHHHO.',
    '.OHSSSSSSHO.',
    '.OHGEGGEGHO.',
    '.OHSSSSSSHO.',
    '.OHHSMMSHHO.',
    '.OHHOSSOHHO.',
    '.OHTTTTTTHO.',
  ],
  // Elisa: big wavy / curly dark hair
  elisa: [
    '..OO.OO.OO..',
    '.OHHOHHOHHO.',
    'OHHhHHhHHhHO',
    'OHhHSSSShHHO',
    'OHHSSSSSSHHO',
    'OHHSESSESHHO',
    'OhHSSSSSShHO',
    'OHhHSMMShHhO',
    'OHhHOSSOHhHO',
    '.OHhTTTThHO.',
  ],
  // Karen (Karu): red hair, side-swept bangs, glasses
  karen: [
    '...OOOOO....',
    '..OHHHHHOO..',
    '.OHHHhHHHHO.',
    '.OHHHHHSSHO.',
    '.OHSSSSSSHO.',
    '.OHGEGGEGHO.',
    '.OHSSSSSSHO.',
    'OHHHSMMSHHHO',
    'OHhHOSSOHhHO',
    '..OTTTTTTO..',
  ],
};

const BODY = ['.OSTTTTTTSO.', '..OTTTTTTO..', '..OPPPPPPO..'];
const LEGS = {
  idle: ['...OPO.OPO..', '...OBO.OBO..'],
  a: ['...OPO.OO...', '...OBO......'],
  b: ['....OO.OPO..', '.......OBO..'],
};

const BASE = { O: '#2b1d2a', S: '#f6cfae', E: '#2b1d2a', M: '#e2777a', B: '#3b2a2a' };

export const CHARACTERS = {
  anouk: {
    name: 'ANOUK',
    trail: '#fff6e0',
    pal: { ...BASE, H: '#2a1f22', h: '#4b3536', G: '#6b4a3a', T: '#f4efe6', P: '#4a5d93' },
  },
  elisa: {
    name: 'ELISA',
    trail: '#55d6c7',
    pal: { ...BASE, H: '#2e1f1c', h: '#5e3d2c', T: '#2fa69a', P: '#3b3f63' },
  },
  karen: {
    name: 'KARU',
    trail: '#ff8a5c',
    pal: { ...BASE, H: '#b8432c', h: '#e8743f', G: '#d4a94a', T: '#6a3058', P: '#2f2d40' },
  },
};

const gridFor = (id, legs) => [...HEADS[id], ...BODY, ...LEGS[legs]];
const CACHE = {};
const frames = (id) =>
  (CACHE[id] ||= { idle: gridFor(id, 'idle'), a: gridFor(id, 'a'), b: gridFor(id, 'b') });

// Character anchored at its feet (x, y). p = size of one sprite pixel in user units.
export function Character({ id, x, y, p = 0.17, walking = false, label = false, below = false, labelSize, bob = 0 }) {
  const f = frames(id);
  const c = CHARACTERS[id];
  const w = 12 * p;
  const h = 14 * p;
  return (
    <g className="char" transform={`translate(${x - w / 2} ${y - h})`}>
      <rect x={p * 2} y={h - p * 0.6} width={p * 8} height={p * 1.2} fill="rgba(20,10,30,.28)" />
      <g className={walking ? 'walk' : 'idle'} style={{ animationDelay: `${bob}s` }}>
        {walking ? (
          <>
            <Pixels grid={f.a} pal={c.pal} p={p} className="fa" />
            <Pixels grid={f.b} pal={c.pal} p={p} className="fb" />
          </>
        ) : (
          <Pixels grid={f.idle} pal={c.pal} p={p} />
        )}
      </g>
      {label && (() => {
        const ls = labelSize || p * 5.5;
        return <NameTag text={c.name} x={w / 2} y={below ? h + ls * 2.6 : -p * 2} color={c.trail} size={ls} />;
      })()}
    </g>
  );
}

export function NameTag({ text, x, y, color = '#fff', size = 1 }) {
  const w = text.length * size + size * 1.2;
  const h = size * 1.9;
  return (
    <g transform={`translate(${x - w / 2} ${y - h})`}><g className="nametag">
      <rect width={w} height={h} fill="#1d1630" />
      <rect x={size * 0.2} y={size * 0.2} width={w - size * 0.4} height={h - size * 0.4} fill="none" stroke={color} strokeWidth={size * 0.15} />
      <text x={w / 2} y={h / 2 + size * 0.5} fontSize={size} fill={color} textAnchor="middle" className="px">
        {text}
      </text>
    </g></g>
  );
}

// ---------- Small props ----------
export const TREE = ['..OOO..', '.OGGgO.', 'OGGGGgO', 'OGgGGGO', '.OOTOO.', '...T...'];
export const TREE_PAL = { O: '#2f5a33', G: '#4f9a4a', g: '#73b85a', T: '#6b4a2e' };

export const MOUNT = ['...O...', '..OWO..', '.OWMMO.', '.OMMmMO', 'OMMmMMmO'];
export const MOUNT_PAL = { O: '#4a3b35', W: '#f4f1ea', M: '#9b8572', m: '#7d6a5a' };

export const HOUSE = ['..OOOO..', '.ORRRRO.', 'ORRRRRRO', '.OWWWWO.', '.OWDWwO.', '.OWDWWO.'];
export const HOUSE_PAL = { O: '#3b2a2a', R: '#d8643c', W: '#f3e6c8', w: '#7ab6e0', D: '#7a4a2e' };

export const HEART = ['.OO.OO.', 'ORROrRO', 'ORRRRRO', '.ORRRO.', '..ORO..', '...O...'];
export const HEART_PAL = { O: '#3b1a2a', R: '#ff5d73', r: '#ffd1d8' };

export const COIN = ['..OOOO..', '.OYYYYO.', 'OYYwYYYO', 'OYwYYYyO', 'OYYYYYyO', 'OYYYYyyO', '.OYyyyO.', '..OOOO..'];
export const COIN_PAL = { O: '#3a2a1a', Y: '#4aa3ff', y: '#2a74c9', w: '#cfe8ff' };
