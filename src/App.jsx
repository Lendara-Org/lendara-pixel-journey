import React, { useEffect, useMemo, useRef, useState } from 'react';
import { buildMap, W, H, PLACES, ROUTES, routeInfo, pointAt, hash } from './map.js';
import {
  Pixels, Character, NameTag, CHARACTERS,
  TREE, TREE_PAL, MOUNT, MOUNT_PAL, HOUSE, HOUSE_PAL, HEART, HEART_PAL, COIN, COIN_PAL,
} from './sprites.jsx';
import { LINKS } from './config.js';

const IDS = ['anouk', 'elisa', 'karen'];
const JOURNEY_MS = 7000;

const SCENES = [
  { title: 'LATAM', text: 'Three builders. Two countries. One mission.' },
  { title: 'THE JOURNEY', text: 'Anouk sets off from Costa Rica. Elisa and Karu from Argentina. Next stop: Lisbon.' },
  { title: 'LISBON', text: 'Different paths. One destination. Meridian.' },
  { title: 'BUILDING LENDARA', text: 'Three laptops, one table, one goal: build Lendara on Stellar.' },
  { title: "WHAT'S NEXT?", text: 'Built in LATAM. Brought together in Lisbon. Building on Stellar.' },
];

// ------------------------------------------------------------------ helpers

function useTypewriter(text, speed = 28) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = setInterval(() => setN((v) => (v >= text.length ? (clearInterval(id), v) : v + 1)), speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return [text.slice(0, n), n >= text.length, () => setN(text.length)];
}

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function useJourney(scene) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (scene === 0) return setT(0);
    if (scene >= 2) return setT(1);
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - start) / JOURNEY_MS);
      setT(k);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scene]);
  return t;
}

// ------------------------------------------------------------------ world map (scenes 1-3)

const MAP = buildMap();
const ROUTE_INFO = Object.fromEntries(IDS.map((id) => [id, routeInfo(ROUTES[id])]));
const TRAIL_DOTS = Object.fromEntries(
  IDS.map((id) => {
    const info = ROUTE_INFO[id];
    const n = Math.floor(info.total / 0.9);
    return [id, Array.from({ length: n + 1 }, (_, i) => ({ f: i / n, p: pointAt(info, i / n) }))];
  }),
);

function Label({ x, y, text, sub }) {
  const fs = 1.15;
  const w = text.length * fs + 1.6;
  return (
    <g transform={`translate(${x - w / 2} ${y})`}>
      <rect x={0.25} y={0.25} width={w} height={2.4} fill="#1d1630" opacity=".35" />
      <rect width={w} height={2.4} fill="#fbf1d3" />
      <rect x={0.2} y={0.2} width={w - 0.4} height={2} fill="none" stroke="#5b3d2b" strokeWidth={0.18} />
      <text x={w / 2} y={1.75} fontSize={fs} textAnchor="middle" fill="#5b3d2b" className="px">{text}</text>
      {sub && (
        <text x={w / 2} y={3.9} fontSize={0.85} textAnchor="middle" fill="#fbf1d3" className="px outline">{sub}</text>
      )}
    </g>
  );
}

function Town({ at, flag }) {
  const [x, y] = at;
  return (
    <g>
      <Pixels grid={HOUSE} pal={HOUSE_PAL} x={x - 1.2} y={y - 1.9} p={0.3} />
      {flag && (
        <g className="flag">
          <rect x={x + 1.1} y={y - 3.4} width={0.16} height={3.2} fill="#3b2a2a" />
          <rect x={x + 1.26} y={y - 3.4} width={1.3} height={0.8} fill={flag} />
        </g>
      )}
    </g>
  );
}

function useIsMobile() {
  const q = '(max-width: 640px)';
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return m;
}

function WorldMap({ scene, t }) {
  const mobile = useIsMobile();
  const zoom = scene === 2;
  const cam = zoom ? 'translate(-80px, 0px) scale(2)' : 'translate(0px, 0px) scale(1)';
  const positions = IDS.map((id, i) => {
    const k = ease(Math.max(0, Math.min(1, (t - i * 0.04) / 0.92)));
    return pointAt(ROUTE_INFO[id], k);
  });
  const walking = scene === 1 && t < 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="world" role="img"
      aria-label="Pixel map with Costa Rica, Argentina, the Atlantic Ocean and Portugal">
      <rect width={W} height={H} fill="#3f72ad" />
      <g className="camera" style={{ transform: cam }}>
        {MAP.runs.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w + 0.03} height={1.03} fill={r.c} />
        ))}
        {MAP.sparkles.map((s, i) => (
          <rect key={i} className="sparkle" style={{ animationDelay: `${s.d}s` }} x={s.x + 0.2} y={s.y + 0.4} width={0.6} height={0.18} fill="#a9dcea" />
        ))}
        {MAP.borders.map((b, i) =>
          (b.x + b.y) % 2 === 0 ? (
            <rect key={i} x={b.v ? b.x - 0.12 : b.x + 0.3} y={b.v ? b.y + 0.3 : b.y - 0.12} width={b.v ? 0.24 : 0.4} height={b.v ? 0.4 : 0.24} fill="#5b3d2b" opacity=".7" />
          ) : null,
        )}
        {MAP.mounts.map((m, i) => (
          <Pixels key={i} grid={MOUNT} pal={MOUNT_PAL} x={m.x - 0.3} y={m.y - 0.2} p={0.2} />
        ))}
        {MAP.trees.map((tr, i) => (
          <Pixels key={i} grid={TREE} pal={TREE_PAL} x={tr.x + 0.1} y={tr.y - 0.1} p={0.17} />
        ))}

        {/* drifting clouds & a little ship */}
        <g className="cloud c1"><Cloud x={8} y={26} /></g>
        <g className="cloud c2"><Cloud x={44} y={4} /></g>
        <g className="ship"><Ship x={50} y={34} /></g>

        <text x={50} y={28} fontSize={1.1} textAnchor="middle" fill="#a9dcea" className="px" opacity=".85">ATLANTIC</text>
        <text x={50} y={29.8} fontSize={1.1} textAnchor="middle" fill="#a9dcea" className="px" opacity=".85">OCEAN</text>

        <Town at={PLACES.sanJose} flag="#d33a3a" />
        <Town at={PLACES.buenosAires} flag="#75b4e8" />
        <Town at={PLACES.lisbon} flag="#2f8a3a" />

        <Label x={17.5} y={20.3} text="COSTA RICA" />
        <Label x={31} y={37.5} text="ARGENTINA" />
        <Label x={56} y={4.4} text="PORTUGAL" sub="LISBOA" />

        {/* travel trails */}
        {scene >= 1 &&
          IDS.map((id) =>
            TRAIL_DOTS[id].map((d, i) => {
              const lit = d.f <= ease(Math.max(0, Math.min(1, t)));
              return (
                <rect key={id + i} x={d.p[0] - 0.18} y={d.p[1] - 0.18} width={0.36} height={0.36}
                  fill={lit ? CHARACTERS[id].trail : '#1d1630'} opacity={lit ? 1 : 0.25} />
              );
            }),
          )}

        {IDS.map((id, i) => (
          <Character key={id} id={id} x={positions[i][0]} y={positions[i][1]} walking={walking}
            p={mobile && scene < 2 ? 0.26 : 0.17} below={id === 'elisa'} labelSize={mobile && scene < 2 ? 1.25 : 0.95}
            label={scene === 0 || (scene === 1 && t > 0.97) || scene === 2} bob={i * 0.13} />
        ))}

        {scene === 2 && (
          <g className="pop">
            <Pixels grid={HEART} pal={HEART_PAL} x={62.8} y={7.0} p={0.22} />
            <Spark x={59.4} y={8.6} /><Spark x={68.4} y={9.2} d={0.4} /><Spark x={66.2} y={6.8} d={0.8} />
          </g>
        )}
      </g>
    </svg>
  );
}

const Cloud = ({ x, y }) => (
  <Pixels x={x} y={y} p={0.4} pal={{ O: '#ffffff', o: '#dbe8f2' }}
    grid={['...OOO.....', '.OOOOOOO...', 'OOOOOOOOOOO', '.ooooooooo.']} />
);
const Ship = ({ x, y }) => (
  <Pixels x={x} y={y} p={0.22} pal={{ O: '#3b2a2a', S: '#fbf1d3', W: '#8a5a36', R: '#d8643c' }}
    grid={['....R....', '....SS...', '....SSS..', '....SSSS.', 'OOOOOOOOO', '.OWWWWWO.', '..OOOOO..']} />
);
const Spark = ({ x, y, d = 0 }) => (
  <g className="twinkle" style={{ animationDelay: `${d}s` }}>
    <rect x={x - 0.15} y={y - 0.6} width={0.3} height={1.2} fill="#ffe27a" />
    <rect x={x - 0.6} y={y - 0.15} width={1.2} height={0.3} fill="#ffe27a" />
  </g>
);

// ------------------------------------------------------------------ hackathon room (scene 4)

function Hackathon({ step }) {
  const seats = [26, 40, 54];
  const bulbs = ['#ff5d73', '#ffd25e', '#55d6c7', '#9a7bff'];
  return (
    <svg viewBox="0 0 80 45" preserveAspectRatio="xMidYMid slice" className="world" role="img" aria-label="Pixel hackathon room: the three builders coding at a long table">
      {/* wall */}
      <rect width="80" height="17" fill="#3a3466" />
      {Array.from({ length: 20 }, (_, i) => (
        <rect key={i} x={i * 4 + (i % 2) * 2} y={(i * 7) % 13 + 1} width="1" height="0.5" fill="#443d75" />
      ))}
      <rect y="15.6" width="80" height="1.4" fill="#2a2550" />
      {/* window with night sky */}
      <rect x="4.5" y="3" width="13" height="9" fill="#2a2550" />
      <rect x="5.3" y="3.8" width="11.4" height="7.4" fill="#1b2350" />
      <rect x="10.6" y="3.8" width="0.8" height="7.4" fill="#2a2550" />
      <rect x="5.3" y="7.2" width="11.4" height="0.6" fill="#2a2550" />
      <rect x="13.8" y="4.6" width="1.6" height="1.6" fill="#fbf1d3" />
      <rect x="7" y="5" width="0.4" height="0.4" fill="#fff" className="twinkle" />
      <rect x="8.6" y="9.2" width="0.4" height="0.4" fill="#fff" className="twinkle" style={{ animationDelay: '.7s' }} />
      {/* string lights */}
      <rect x="20" y="1.2" width="40" height="0.2" fill="#2a2550" />
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} x={20.8 + i * 2.9} y="1.4" width="0.7" height="0.9" fill={bulbs[i % 4]} className="blink" style={{ animationDelay: `${(i % 3) * 0.4}s` }} />
      ))}
      {/* banner */}
      <rect x="25.6" y="3.1" width="28.8" height="5.4" fill="#2b1d2a" />
      <rect x="26" y="3.5" width="28" height="4.6" fill="#e2445c" />
      <rect x="26.6" y="4.1" width="26.8" height="3.4" fill="none" stroke="#ffd25e" strokeWidth="0.2" />
      <text x="40" y="6.45" fontSize="1.45" textAnchor="middle" fill="#fff6e0" className="px">MERIDIAN</text>
      <rect x="28" y="8.1" width="1" height="1" fill="#e2445c" />
      <rect x="51" y="8.1" width="1" height="1" fill="#e2445c" />
      {/* whiteboard doodle */}
      <rect x="60.5" y="3" width="14" height="9" fill="#2b1d2a" />
      <rect x="61" y="3.5" width="13" height="8" fill="#f4f1ea" />
      <rect x="62.2" y="5" width="2.6" height="2" fill="none" stroke="#4a86c2" strokeWidth="0.3" />
      <rect x="66.2" y="5" width="2.6" height="2" fill="none" stroke="#e2445c" strokeWidth="0.3" />
      <rect x="70.2" y="5" width="2.6" height="2" fill="none" stroke="#2fa69a" strokeWidth="0.3" />
      <rect x="64.9" y="5.9" width="1.2" height="0.25" fill="#3b2a2a" />
      <rect x="68.9" y="5.9" width="1.2" height="0.25" fill="#3b2a2a" />
      <rect x="62.2" y="8.6" width="7" height="0.3" fill="#9a8f80" />
      <rect x="62.2" y="9.6" width="5" height="0.3" fill="#9a8f80" />
      <rect x="70.6" y="8.4" width="1.6" height="1.6" fill="#ffd25e" />

      {/* floor planks */}
      {Array.from({ length: 10 }, (_, r) => (
        <g key={r}>
          <rect y={17 + r * 3} width="80" height="3" fill={r % 2 ? '#8a5a3c' : '#94623f'} />
          {Array.from({ length: 6 }, (_, c) => (
            <rect key={c} x={(c * 15 + (r % 2) * 7) % 80} y={17 + r * 3} width="0.25" height="3" fill="#6e4430" />
          ))}
        </g>
      ))}
      {/* rug */}
      <rect x="12" y="22" width="56" height="18" fill="#4b3f7a" />
      <rect x="13" y="23" width="54" height="16" fill="none" stroke="#ffd25e" strokeWidth="0.3" strokeDasharray="1 1" />

      {/* builders */}
      {IDS.map((id, i) => (
        <g key={id} className="typing" style={{ animationDelay: `${i * 0.18}s` }}>
          <Character id={id} x={seats[i]} y={28.2} p={0.6} />
        </g>
      ))}

      {/* desk */}
      <rect x="15" y="26.6" width="50" height="4.4" fill="#b98250" />
      <rect x="15" y="26.6" width="50" height="0.5" fill="#d29a64" />
      <rect x="15" y="31" width="50" height="1.6" fill="#7e5236" />
      <rect x="16.5" y="32.6" width="1.4" height="4.4" fill="#6a432c" />
      <rect x="62.1" y="32.6" width="1.4" height="4.4" fill="#6a432c" />
      <rect x="15" y="37" width="50" height="0.8" fill="rgba(30,15,30,.25)" />

      {/* laptops (we see the lids) */}
      {IDS.map((id, i) => (
        <g key={id}>
          <rect x={seats[i] - 3.3} y="24.9" width="6.6" height="3.9" fill="#2b2a3a" />
          <rect x={seats[i] - 2.9} y="25.3" width="5.8" height="3.1" fill="#c9ccd6" />
          <rect x={seats[i] - 0.5} y="26.4" width="1" height="1" fill={CHARACTERS[id].trail} className="blink" style={{ animationDelay: `${i * 0.5}s` }} />
          <rect x={seats[i] - 3.6} y="28.8" width="7.2" height="0.7" fill="#2b2a3a" />
          <text x={seats[i]} y="18.6" fontSize="1" textAnchor="middle" fill={CHARACTERS[id].trail} className="px code" style={{ animationDelay: `${i * 0.6}s` }}>
            {['</>', '{ }', '=>'][i]}
          </text>
        </g>
      ))}
      {/* mugs */}
      <rect x="31.2" y="27.4" width="1.4" height="1.6" fill="#fbf1d3" /><rect x="32.6" y="27.8" width="0.4" height="0.8" fill="#fbf1d3" />
      <rect x="45.6" y="27.4" width="1.4" height="1.6" fill="#e2445c" /><rect x="47" y="27.8" width="0.4" height="0.8" fill="#e2445c" />
      {/* plant */}
      <rect x="3.6" y="36" width="3.6" height="3.6" fill="#c25a3c" />
      <Pixels grid={TREE} pal={TREE_PAL} x={2.6} y={30.4} p={0.8} />

      {/* USDC coin rising once the second milestone lands */}
      {step >= 2 && (
        <g className="coin-rise">
          <Pixels grid={COIN} pal={COIN_PAL} x={45.5} y={17.6} p={0.5} />
        </g>
      )}
    </svg>
  );
}

// ------------------------------------------------------------------ finale (scene 5)

const SKY = ['#2b2350', '#3b2b62', '#5a3570', '#86426f', '#c2586b', '#ee8a5e', '#ffc06a'];
const BUILDINGS = Array.from({ length: 16 }, (_, i) => {
  const h = hash(i, 7);
  return {
    x: i * 5.2 - 2 + (h % 10) / 10,
    w: 4.4 + (h % 3) * 0.6,
    h: 5 + (h % 5),
    c: ['#f2c75c', '#e88a8a', '#7aa7d8', '#efe6d2', '#9fd0a8'][h % 5],
  };
});

function Finale() {
  return (
    <svg viewBox="0 0 80 45" preserveAspectRatio="xMidYMid slice" className="world" role="img" aria-label="The three builders together at a Lisbon viewpoint at sunset">
      {SKY.map((c, i) => <rect key={c} y={i * 3.6} width="80" height="3.7" fill={c} />)}
      {Array.from({ length: 18 }, (_, i) => {
        const h = hash(i, 3);
        return <rect key={i} className="twinkle" style={{ animationDelay: `${(h % 30) / 10}s` }} x={(h * 7) % 80} y={(h % 9) + 0.5} width="0.4" height="0.4" fill="#fff6e0" />;
      })}
      {/* sun */}
      <Pixels x={55} y={14} p={0.9} pal={{ Y: '#ffe08a' }} grid={['...YYYY...', '.YYYYYYYY.', 'YYYYYYYYYY', 'YYYYYYYYYY']} />
      {/* river */}
      <rect y="21.6" width="80" height="5" fill="#4b6fa8" />
      {Array.from({ length: 14 }, (_, i) => (
        <rect key={i} className="sparkle" style={{ animationDelay: `${i * 0.3}s` }} x={(i * 13) % 78} y={22.4 + (i % 3) * 1.3} width="1.4" height="0.25" fill="#ffd9a0" />
      ))}
      {/* bridge */}
      <rect y="18.2" width="80" height="0.6" fill="#b5423a" />
      {[18, 48].map((x) => (
        <g key={x}>
          <rect x={x} y="11" width="1" height="11" fill="#b5423a" />
          <rect x={x + 2.2} y="11" width="1" height="11" fill="#b5423a" />
          <rect x={x} y="12.4" width="3.2" height="0.5" fill="#b5423a" />
        </g>
      ))}
      <path d="M0 13 Q 10 18 18.5 11.2 Q 33.5 22 49 11.2 Q 60 18 80 13" fill="none" stroke="#b5423a" strokeWidth="0.3" />
      {/* hill of houses */}
      <rect y="26" width="80" height="12" fill="#6a4a5e" />
      {BUILDINGS.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={34 - b.h} width={b.w} height={b.h + 4} fill={b.c} />
          <rect x={b.x - 0.3} y={33.2 - b.h} width={b.w + 0.6} height="1.2" fill="#d8643c" />
          {Array.from({ length: Math.floor(b.h / 2.2) }, (_, r) => (
            <g key={r}>
              <rect x={b.x + 0.8} y={35.4 - b.h + r * 2.2} width="0.9" height="1.1" fill="#3b2a3a" />
              <rect x={b.x + b.w - 1.7} y={35.4 - b.h + r * 2.2} width="0.9" height="1.1" fill={r % 2 ? '#ffe08a' : '#3b2a3a'} />
            </g>
          ))}
        </g>
      ))}
      {/* tram */}
      <g className="tram">
        <Pixels x={-10} y={32.2} p={0.4} pal={{ O: '#2b1d2a', Y: '#f5c242', W: '#cfe8ff', R: '#e2445c' }}
          grid={['.....O.......', '..OOOOOOOOOO.', '.OYYYYYYYYYYO', '.OWWYWWYWWYYO', '.OWWYWWYWWYYO', '.ORRRRRRRRRRO', '.OYYYYYYYYYYO', '..OO.....OO..']} />
      </g>
      {/* miradouro: calçada floor + railing */}
      <rect y="36" width="80" height="9" fill="#e4dccb" />
      {Array.from({ length: 40 }, (_, i) => (
        <rect key={i} x={(i % 20) * 4 + (Math.floor(i / 20) % 2) * 2} y={37.5 + Math.floor(i / 20) * 3.5} width="2" height="0.6" fill="#2b2a3a" opacity=".55" />
      ))}
      <rect y="35.2" width="80" height="0.8" fill="#2b2a3a" />
      {IDS.map((id, i) => (
        <Character key={id} id={id} x={31 + i * 9} y={42.5} p={0.55} label labelSize={1.3} bob={i * 0.2} />
      ))}
      <g className="pop">
        <Pixels grid={HEART} pal={HEART_PAL} x={34.4} y={31.2} p={0.24} />
      </g>
    </svg>
  );
}

// ------------------------------------------------------------------ app

export default function App() {
  const [scene, setScene] = useState(0);
  const [step, setStep] = useState(0); // milestones in scene 4
  const t = useJourney(scene);
  const s = SCENES[scene];
  const [typed, done, skip] = useTypewriter(s.text);
  const last = SCENES.length - 1;

  const go = (d) => setScene((v) => Math.max(0, Math.min(last, v + d)));

  useEffect(() => {
    setStep(0);
    if (scene !== 3) return;
    const a = setTimeout(() => setStep(1), 1300);
    const b = setTimeout(() => setStep(2), 3000);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [scene]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <main className="app">
      <header className="hud">
        <span className="logo">LENDARA<em>· a pixel journey</em></span>
        <span className="scene-tag">{scene + 1}/5 · {s.title}</span>
      </header>

      <div className="stage">
      <section className="screen">
        {scene <= 2 && <WorldMap scene={scene} t={t} />}
        {scene === 3 && <div className="fade"><Hackathon step={step} /></div>}
        {scene === 4 && <div className="fade"><Finale /></div>}
      </section>

        {scene === 3 && (
          <div className="quest">
            <div className="quest-title">QUEST LOG</div>
            <div className={`quest-item ${step >= 1 ? 'on' : ''}`}><i>{step >= 1 ? '✔' : ''}</i>Simulated payment flow</div>
            <div className={`quest-item ${step >= 2 ? 'on' : ''}`}><i>{step >= 2 ? '✔' : ''}</i>USDC received on Stellar Testnet</div>
          </div>
        )}
      </div>

      <section className="dialog" onClick={skip}>
        <p className="dialog-text">
          {typed}
          {done && <span className="caret">▼</span>}
        </p>
        {scene === 0 && (
          <button className="btn primary" onClick={() => go(1)}>▶ Start our journey</button>
        )}
        {scene === last && (
          <div className="links">
            <a className="btn primary" href={LINKS.lendara} target="_blank" rel="noreferrer">Visit Lendara ↗</a>
            <a className="btn" href={LINKS.repo} target="_blank" rel="noreferrer">GitHub repo ↗</a>
            <button className="btn ghost" onClick={() => setScene(0)}>↺ Play again</button>
          </div>
        )}
      </section>

      <nav className="nav">
        <button className="btn" onClick={() => go(-1)} disabled={scene === 0}>◀ Back</button>
        <div className="dots">
          {SCENES.map((_, i) => (
            <button key={i} className={`dot ${i === scene ? 'on' : ''} ${i < scene ? 'past' : ''}`} aria-label={`Go to scene ${i + 1}`} onClick={() => setScene(i)} />
          ))}
        </div>
        <button className="btn" onClick={() => go(1)} disabled={scene === last}>Next ▶</button>
      </nav>
    </main>
  );
}
