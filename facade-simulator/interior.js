// 内観シミュレーター（プランNo.5）— 壁紙・床・家具・照明・エアコン・コンセント
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* =========================================================
   部屋データ（平面図より。x：西→東、z：北→南、単位 m）
   ========================================================= */
const CH = 2.4; // 天井高
const ROOMS = [
  { id: 'ldk', name: 'LDK', size: '16.5帖', floor: '2階',
    poly: [[0, 0], [6.37, 0], [6.37, 0.6], [7.28, 0.6], [7.28, 3.45], [3.64, 3.45], [3.64, 4.4], [1.82, 4.4], [1.82, 3.95], [0, 3.95]],
    open: [
      { k: 'win', a: [0, 1.42], b: [0, 3.07], y0: 0.85, y1: 2.05, name: '西の窓（シャッター付）' },
      { k: 'win', a: [2.89, 0], b: [3.1, 0], y0: 0.1, y1: 1.85, name: '北のスリット窓' },
      { k: 'win', a: [2.98, 4.4], b: [3.5, 4.4], y0: 1.25, y1: 1.95, name: '南の窓' },
      { k: 'door', a: [7.28, 2.7], b: [7.28, 3.42], name: '洗面所・トイレへ' },
      { k: 'pass', a: [3.64, 3.45], b: [4.1, 3.45], name: '階段（下り）' },
      { k: 'pass', a: [6.42, 3.45], b: [7.28, 3.45], name: '階段（上り）' },
      { k: 'closet', a: [0.1, 3.95], b: [1.72, 3.95], name: '収納' },
      { k: 'closet', a: [6.42, 0.6], b: [7.22, 0.6], name: '収納' },
    ],
    fixed: [
      { type: 'island', x: 5.91, z: 2.0, rot: 0 },
      { type: 'backcounter', x: 5.34, z: 0.33, rot: 0 },
      { type: 'fridge', x: 3.99, z: 0.36, rot: 0 },
    ] },
  { id: 'r1', name: '洋室', size: '7.2帖', floor: '1階',
    poly: [[7.28, 0], [10.01, 0], [10.01, 4.4], [7.28, 4.4]],
    open: [
      { k: 'win', a: [7.38, 0], b: [7.57, 0], y0: 0.99, y1: 1.91, name: '北の小窓' },
      { k: 'win', a: [10.01, 2.4], b: [10.01, 2.57], y0: 1.04, y1: 1.99, name: '東の小窓' },
      { k: 'door', a: [7.28, 1.9], b: [7.28, 2.68], name: '廊下へ' },
    ] },
  { id: 'r3a', name: '洋室（バルコニー側）', size: '7.5帖', floor: '3階',
    poly: [[0.91, 0], [3.64, 0], [3.64, 3.9], [1.84, 3.9], [1.84, 4.4], [0, 4.4], [0, 2.275], [0.91, 2.275]],
    open: [
      { k: 'win', a: [0.91, 0.7], b: [0.91, 1.9], y0: 0.05, y1: 1.85, name: 'バルコニーの窓' },
      { k: 'door', a: [3.64, 2.7], b: [3.64, 3.45], name: '廊下へ' },
      { k: 'closet', a: [1.9, 3.9], b: [3.58, 3.9], name: '収納' },
    ] },
  { id: 'r3b', name: '洋室（北・中央）', size: '5.6帖', floor: '3階',
    poly: [[3.64, 0], [7.28, 0], [7.28, 2.5], [3.64, 2.5]],
    open: [
      { k: 'win', a: [6.04, 0], b: [6.25, 0], y0: 0.61, y1: 1.53, name: '北の小窓' },
      { k: 'win', a: [6.48, 0], b: [6.69, 0], y0: 0.61, y1: 1.53, name: '北の小窓' },
      { k: 'door', a: [3.72, 2.5], b: [4.47, 2.5], name: '廊下へ' },
    ],
    skylight: { x0: 4.55, x1: 5.45, z0: 0.08, z1: 0.88 } },
  { id: 'r3c', name: '洋室（東）', size: '5.7帖', floor: '3階',
    poly: [[7.28, 0.91], [10.01, 0.91], [10.01, 4.4], [7.28, 4.4]],
    open: [
      { k: 'win', a: [10.01, 1.78], b: [10.01, 2.96], y0: 0.85, y1: 1.6, name: '東の窓' },
      { k: 'door', a: [7.28, 2.95], b: [7.28, 3.7], name: '廊下へ' },
      { k: 'closet', a: [8.25, 0.91], b: [9.95, 0.91], name: '収納' },
    ] },
];

/* =========================================================
   色・素材
   ========================================================= */
const WALLPAPER = [
  ['white', 'ホワイト', '#f3f2ee'], ['offwhite', 'オフホワイト', '#ece8de'], ['ivory', 'アイボリー', '#e9e1cf'],
  ['beige', 'ベージュ', '#dacdb7'], ['greige', 'グレージュ', '#c6beb2'], ['lightgray', 'ライトグレー', '#d2d3d0'],
  ['gray', 'グレー', '#9b9d9d'], ['charcoal', 'チャコール', '#4a4c4f'], ['navy', 'ネイビー', '#2f3a4f'],
  ['bluegray', 'ブルーグレー', '#7f91a1'], ['sage', 'セージグリーン', '#a3ae96'], ['green', 'ダークグリーン', '#4f5e4c'],
  ['terracotta', 'テラコッタ', '#b5785d'], ['pink', 'くすみピンク', '#d6b5ac'], ['mustard', 'マスタード', '#c4a253'],
  ['wood', '木目（板張り調）', '#a77a52', 'wood'], ['concrete', 'コンクリート調', '#8f8d89', 'concrete'], ['brick', '白レンガ調', '#e6e2da', 'brick'],
].map(([id, name, hex, tex]) => ({ id, name, hex, tex }));
const FLOORS = [
  ['oak', 'ナチュラルオーク', '#c49a6c'], ['whiteoak', 'ホワイトオーク', '#d9c2a2'], ['walnut', 'ウォールナット', '#6e4b35'],
  ['cherry', 'チェリー', '#a8644a'], ['greige', 'グレージュ', '#a99c8c'], ['ash', 'ダークグレー', '#5d5a57'],
  ['tile', 'タイル（ライトグレー）', '#c9c8c4', 'tile'], ['tilew', 'タイル（ホワイト）', '#e8e6e1', 'tile'],
].map(([id, name, hex, tex]) => ({ id, name, hex, tex: tex || 'plank' }));
const DOORCOL = [['white', 'ホワイト', '#eeede9'], ['oak', 'オーク', '#b98f63'], ['walnut', 'ウォールナット', '#5f4331'], ['gray', 'グレー', '#8c8d8c'], ['black', 'ブラック', '#2a2b2d']]
  .map(([id, name, hex]) => ({ id, name, hex }));
const FABRIC = [['gray', 'グレー', '#8d8e8c'], ['beige', 'ベージュ', '#c9b9a0'], ['ivory', 'アイボリー', '#e3dccd'], ['navy', 'ネイビー', '#34405a'],
  ['green', 'グリーン', '#5c6b52'], ['brown', 'ブラウン', '#6d4f3c'], ['mustard', 'マスタード', '#b99146'], ['charcoal', 'チャコール', '#3c3d3f']]
  .map(([id, name, hex]) => ({ id, name, hex }));
const WOODC = [['natural', 'ナチュラル', '#c49a6c'], ['walnut', 'ウォールナット', '#5f4331'], ['white', 'ホワイト', '#efeeea'], ['black', 'ブラック', '#2a2b2d'], ['gray', 'グレー', '#8c8d8c']]
  .map(([id, name, hex]) => ({ id, name, hex }));
const LIGHTCOL = [['warm', '電球色', '#ffc98a', 2700], ['mid', '温白色', '#ffe2bd', 3500], ['day', '昼白色', '#f4f6ff', 5000]]
  .map(([id, name, hex, k]) => ({ id, name, hex, k }));

/* =========================================================
   家具・器具カタログ（w：幅 x、d：奥行 z、h：高さ。正面は +z）
   ========================================================= */
const CAT = {
  sofa3: { g: 'f', name: 'ソファ 3人掛け', w: 2.0, d: 0.9, h: 0.8, colors: FABRIC, def: 'gray' },
  sofa2: { g: 'f', name: 'ソファ 2人掛け', w: 1.5, d: 0.85, h: 0.8, colors: FABRIC, def: 'beige' },
  lowtable: { g: 'f', name: 'ローテーブル', w: 1.0, d: 0.5, h: 0.38, colors: WOODC, def: 'natural' },
  tvboard: { g: 'f', name: 'テレビボード＋TV', w: 1.8, d: 0.42, h: 1.15, colors: WOODC, def: 'walnut' },
  dining4: { g: 'f', name: 'ダイニングセット 4人', w: 1.4, d: 1.35, h: 0.75, colors: WOODC, def: 'natural' },
  dining2: { g: 'f', name: 'ダイニングセット 2人', w: 0.8, d: 1.3, h: 0.75, colors: WOODC, def: 'natural' },
  bedS: { g: 'f', name: 'ベッド シングル', w: 0.97, d: 1.95, h: 0.75, colors: FABRIC, def: 'ivory' },
  bedSD: { g: 'f', name: 'ベッド セミダブル', w: 1.2, d: 1.95, h: 0.75, colors: FABRIC, def: 'ivory' },
  bedD: { g: 'f', name: 'ベッド ダブル', w: 1.4, d: 1.95, h: 0.75, colors: FABRIC, def: 'ivory' },
  desk: { g: 'f', name: 'デスク＋チェア', w: 1.2, d: 0.9, h: 0.75, colors: WOODC, def: 'natural' },
  shelf: { g: 'f', name: '本棚', w: 0.8, d: 0.3, h: 1.8, colors: WOODC, def: 'white' },
  wardrobe: { g: 'f', name: 'ワードローブ', w: 0.9, d: 0.6, h: 1.8, colors: WOODC, def: 'white' },
  chest: { g: 'f', name: 'チェスト', w: 0.8, d: 0.45, h: 0.9, colors: WOODC, def: 'natural' },
  rug: { g: 'f', name: 'ラグ', w: 2.0, d: 1.4, h: 0.012, colors: FABRIC, def: 'beige' },
  plant: { g: 'f', name: '観葉植物', w: 0.45, d: 0.45, h: 1.3 },
  downlight: { g: 'l', name: 'ダウンライト', w: 0.1, lm: 4.5 },
  ceiling: { g: 'l', name: 'シーリングライト', w: 0.55, lm: 16 },
  pendant: { g: 'l', name: 'ペンダントライト', w: 0.3, lm: 7 },
  outlet: { g: 'e', name: 'コンセント（2口）', h0: 0.25 },
  switch: { g: 'e', name: 'スイッチ', h0: 1.2 },
  tv: { g: 'e', name: 'TV端子＋コンセント', h0: 0.25 },
  lan: { g: 'e', name: 'LAN（情報コンセント）', h0: 0.25 },
  aircon: { g: 'e', name: 'エアコン', h0: CH - 0.07 - 0.29, fixedH: true },
  island: { g: 'k', name: 'キッチン（アイランド）', w: 2.58, d: 0.9, h: 0.85, colors: WOODC, def: 'white' },
  backcounter: { g: 'k', name: 'カップボード', w: 2.0, d: 0.65, h: 2.1, colors: WOODC, def: 'white' },
  fridge: { g: 'k', name: '冷蔵庫', w: 0.68, d: 0.7, h: 1.8 },
};
const GROUP_LABEL = { f: '家具', l: '照明', e: '電気・エアコン', k: 'キッチン' };

/* =========================================================
   初期レイアウト（平面図の家具配置を参考に補完）
   ========================================================= */
const F = (type, x, z, rot = 0, color) => ({ type, x, z, rot, color });
const L = (type, x, z) => ({ type, x, z });
const E = (type, wall, u, h) => ({ type, wall, u, h }); // wall：辺番号、u：辺の始点からの距離
const DEFAULT_ROOMS = {
  ldk: { wall: 'white', floor: 'oak', ceiling: 'white', door: 'white', accent: { wall: 0, color: 'greige', on: false }, lightCol: 'warm',
    items: [F('rug', 1.3, 2.05), F('tvboard', 1.3, 0.24), F('sofa3', 1.3, 3.2, 180), F('lowtable', 1.3, 2.05), F('dining4', 3.75, 1.98, 0),
      L('ceiling', 1.3, 1.95), L('pendant', 3.75, 1.98), L('downlight', 5.0, 1.2), L('downlight', 6.6, 1.2), L('downlight', 5.0, 2.85), L('downlight', 6.6, 2.85), L('downlight', 2.6, 3.7),
      E('aircon', 9, 3.25, null), E('tv', 0, 1.3, 0.25), E('lan', 0, 1.7, 0.25), E('outlet', 0, 0.55, 0.25), E('outlet', 9, 0.6, 0.25), E('outlet', 6, 1.4, 0.25),
      E('switch', 4, 2.55, 1.2), E('switch', 3, 1.95, 1.2), E('outlet', 1, 0.3, 1.1)] },
  r1: { wall: 'white', floor: 'oak', ceiling: 'white', door: 'white', accent: { wall: 0, color: 'bluegray', on: false }, lightCol: 'warm',
    items: [F('bedSD', 9.4, 1.05, 0), F('desk', 7.95, 0.45, 0), F('chest', 9.55, 4.15, 180),
      L('ceiling', 8.65, 2.2), E('aircon', 2, 1.4, null), E('outlet', 0, 1.9, 0.25), E('outlet', 0, 0.55, 0.25), E('outlet', 2, 0.9, 0.25), E('tv', 2, 1.8, 0.25), E('switch', 3, 1.5, 1.2)] },
  r3a: { wall: 'white', floor: 'oak', ceiling: 'white', door: 'white', accent: { wall: 1, color: 'sage', on: false }, lightCol: 'warm',
    items: [F('bedS', 3.12, 1.05, 0), F('desk', 1.55, 0.45, 0),
      L('ceiling', 2.3, 2.0), E('aircon', 0, 0.9, null), E('outlet', 0, 1.6, 0.25), E('outlet', 1, 2.4, 0.25), E('switch', 1, 2.55, 1.2), E('lan', 0, 0.95, 0.25)] },
  r3b: { wall: 'white', floor: 'oak', ceiling: 'white', door: 'white', accent: { wall: 0, color: 'beige', on: false }, lightCol: 'warm',
    items: [F('bedSD', 6.2, 1.25, 270), F('shelf', 4.2, 0.17, 0),
      L('ceiling', 5.2, 1.3), E('aircon', 3, 1.2, null), E('outlet', 1, 0.5, 0.25), E('outlet', 0, 1.0, 0.25), E('switch', 2, 2.75, 1.2)] },
  r3c: { wall: 'white', floor: 'oak', ceiling: 'white', door: 'white', accent: { wall: 1, color: 'greige', on: false }, lightCol: 'warm',
    items: [F('bedSD', 9.03, 3.45, 270), F('desk', 7.9, 1.37, 0),
      L('ceiling', 8.65, 2.65), E('aircon', 2, 1.4, null), E('outlet', 1, 1.6, 0.25), E('outlet', 1, 3.25, 0.25), E('outlet', 0, 0.62, 0.25), E('switch', 3, 0.5, 1.2)] },
};

/* =========================================================
   テクスチャ
   ========================================================= */
const mkC = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const TEX = {};
function tex(kind, sizeM) {
  if (TEX[kind]) return TEX[kind];
  const r = rng(kind.length * 97 + 7), c = mkC(512, 512), g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 512, 512);
  if (kind === 'paper') { // 壁紙：細かな織物調
    for (let i = 0; i < 9000; i++) { const v = 235 + r() * 20; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2); }
  } else if (kind === 'plank' || kind === 'wood') { // フローリング・板張り（幅15cm）
    const rows = 8;
    for (let y = 0; y < rows; y++) {
      let x = -r() * 300;
      while (x < 512) {
        const len = 160 + r() * 260, v = 200 + r() * 55;
        g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y * 64, len, 64);
        for (let k = 0; k < 14; k++) { const yy = y * 64 + r() * 64, a = 0.05 + r() * 0.08; g.strokeStyle = `rgba(60,40,20,${a})`; g.lineWidth = 0.6 + r() * 1.4; g.beginPath(); g.moveTo(x, yy); g.bezierCurveTo(x + len * 0.3, yy + (r() - 0.5) * 6, x + len * 0.6, yy + (r() - 0.5) * 6, x + len, yy + (r() - 0.5) * 4); g.stroke(); }
        g.fillStyle = 'rgba(40,25,10,.35)'; g.fillRect(x, y * 64, 1.5, 64);
        x += len;
      }
      g.fillStyle = 'rgba(40,25,10,.35)'; g.fillRect(0, y * 64, 512, 1.5);
    }
  } else if (kind === 'tile') { // 60cm角タイル
    for (let i = 0; i < 4000; i++) { const v = 228 + r() * 27; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(r() * 512, r() * 512, 2, 2); }
    g.fillStyle = 'rgba(0,0,0,.18)'; for (let k = 0; k <= 2; k++) { g.fillRect(k * 256 - 1, 0, 2, 512); g.fillRect(0, k * 256 - 1, 512, 2); }
  } else if (kind === 'concrete') {
    for (let i = 0; i < 14000; i++) { const v = 205 + r() * 50; g.fillStyle = `rgba(${v},${v},${v},.6)`; g.fillRect(r() * 512, r() * 512, 1 + r() * 4, 1 + r() * 4); }
    g.fillStyle = 'rgba(0,0,0,.12)'; for (const [x, y] of [[64, 64], [448, 64], [64, 448], [448, 448], [256, 64], [256, 448]]) { g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); }
  } else if (kind === 'brick') {
    for (let y = 0; y < 8; y++) for (let x = -1; x < 3; x++) { const v = 222 + r() * 33; g.fillStyle = `rgb(${v},${v},${v - 4})`; g.fillRect(x * 216 + (y % 2) * 108 + 4, y * 64 + 4, 208, 56); }
    g.globalCompositeOperation = 'destination-over'; g.fillStyle = '#c9c6c0'; g.fillRect(0, 0, 512, 512);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = { paper: 0.8, plank: 1.2, wood: 1.2, tile: 1.2, concrete: 1.8, brick: 1.3 }[kind] || 1;
  t.repeat.set(1 / m, 1 / m);
  return TEX[kind] = t;
}

/* =========================================================
   幾何ユーティリティ
   ========================================================= */
function signedArea(p) { let a = 0; for (let i = 0; i < p.length; i++) { const [x1, z1] = p[i], [x2, z2] = p[(i + 1) % p.length]; a += x1 * z2 - x2 * z1; } return a / 2; }
function edges(room) {
  const p = room.poly, s = signedArea(p) > 0 ? 1 : -1;
  return p.map((a, i) => {
    const b = p[(i + 1) % p.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), d = [dx / len, dz / len];
    const n = s > 0 ? [-d[1], d[0]] : [d[1], -d[0]]; // 室内向き
    // 平面図上の z は南向き、three の z と同じ。signedArea の向きで室内側を決める
    return { i, a, b, d, n, len };
  });
}
function onEdge(e, p) { // 点 p が辺 e 上ならその距離 u
  const vx = p[0] - e.a[0], vz = p[1] - e.a[1], u = vx * e.d[0] + vz * e.d[1], off = Math.abs(vx * e.d[1] - vz * e.d[0]);
  return off < 0.02 && u > -0.02 && u < e.len + 0.02 ? u : null;
}
function pointInPoly(x, z, p) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, zi] = p[i], [xj, zj] = p[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; }
function centroid(p) { let x = 0, z = 0; for (const q of p) { x += q[0]; z += q[1]; } return [x / p.length, z / p.length]; }
function bbox(p) { const xs = p.map(q => q[0]), zs = p.map(q => q[1]); return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }; }

const std = o => new THREE.MeshStandardMaterial(o);
function box(parent, w, h, d, x, y, z, mat, cast = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
}
function cyl(parent, r1, r2, h, x, y, z, mat, seg = 24) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; }
const colorOf = (list, id) => (list.find(c => c.id === id) || list[0]);

/* =========================================================
   家具・器具のモデル（正面 +z、原点は床中央／壁面中央／天井面中央）
   ========================================================= */
const MAT = {
  black: std({ color: '#26272a', roughness: 0.5, metalness: 0.2 }),
  metal: std({ color: '#b9bcbe', roughness: 0.3, metalness: 0.8 }),
  white: std({ color: '#f1f0ec', roughness: 0.6 }),
  plate: std({ color: '#f4f3ef', roughness: 0.45 }),
  screen: std({ color: '#141518', roughness: 0.2, metalness: 0.3 }),
  leaf: std({ color: '#4c7a3e', roughness: 0.8, flatShading: true }),
  pot: std({ color: '#d9d4c9', roughness: 0.7 }),
  sheet: std({ color: '#f2f0ea', roughness: 0.9 }),
  steel: std({ color: '#c9ccce', roughness: 0.35, metalness: 0.6 }),
};
function buildItem(it, lightCol) {
  const c = CAT[it.type], g = new THREE.Group(), main = c.colors ? std({ color: colorOf(c.colors, it.color || c.def).hex, roughness: c.colors === FABRIC ? 0.95 : 0.6 }) : null;
  const legW = std({ color: '#5f4331', roughness: 0.6 });
  switch (it.type) {
    case 'sofa3': case 'sofa2': {
      const { w, d } = c; box(g, w, 0.22, d, 0, 0.27, 0, main); box(g, w, 0.45, 0.2, 0, 0.6, -d / 2 + 0.1, main);
      box(g, 0.16, 0.25, d, -w / 2 + 0.08, 0.5, 0, main); box(g, 0.16, 0.25, d, w / 2 - 0.08, 0.5, 0, main);
      const n = it.type === 'sofa3' ? 3 : 2, cw = (w - 0.32) / n;
      for (let k = 0; k < n; k++) box(g, cw - 0.02, 0.12, d - 0.24, -w / 2 + 0.16 + cw * (k + 0.5), 0.44, 0.09, main);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.05, 0.16, 0.05, sx * (w / 2 - 0.08), 0.08, sz * (d / 2 - 0.08), MAT.black);
      break; }
    case 'lowtable': box(g, c.w, 0.04, c.d, 0, c.h - 0.02, 0, main); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.04, c.h - 0.04, 0.04, sx * (c.w / 2 - 0.06), (c.h - 0.04) / 2, sz * (c.d / 2 - 0.06), main); break;
    case 'tvboard': box(g, c.w, 0.42, c.d, 0, 0.21, 0, main); box(g, c.w - 0.02, 0.012, c.d * 0.6, 0, 0.42, 0.05, MAT.black);
      box(g, 1.23, 0.71, 0.04, 0, 0.42 + 0.06 + 0.355, -0.05, MAT.screen); box(g, 0.3, 0.06, 0.2, 0, 0.45, -0.05, MAT.black); break;
    case 'dining4': case 'dining2': {
      const tw = it.type === 'dining4' ? 1.4 : 0.8, td = 0.8;
      box(g, tw, 0.04, td, 0, 0.7, 0, main); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.05, 0.68, 0.05, sx * (tw / 2 - 0.07), 0.34, sz * (td / 2 - 0.07), main);
      const seats = it.type === 'dining4' ? [-0.35, 0.35] : [0];
      for (const sx of seats) for (const sz of [-1, 1]) {
        const ch = new THREE.Group(); ch.position.set(sx, 0, sz * 0.52); ch.rotation.y = sz > 0 ? Math.PI : 0; g.add(ch);
        box(ch, 0.42, 0.04, 0.42, 0, 0.43, 0, main); box(ch, 0.42, 0.4, 0.03, 0, 0.66, 0.2, main);
        for (const a of [-1, 1]) for (const b of [-1, 1]) box(ch, 0.03, 0.43, 0.03, a * 0.18, 0.215, b * 0.18, main);
      }
      break; }
    case 'bedS': case 'bedSD': case 'bedD': {
      const { w, d } = c; box(g, w, 0.3, d, 0, 0.2, 0, std({ color: '#7a5a43', roughness: 0.6 }));
      box(g, w - 0.04, 0.2, d - 0.06, 0, 0.45, 0.02, MAT.sheet); box(g, w, 0.55, 0.06, 0, 0.5, -d / 2 + 0.03, std({ color: '#7a5a43', roughness: 0.6 }));
      box(g, w - 0.03, 0.06, d * 0.62, 0, 0.58, d * 0.17, main);
      const pw = w > 1.1 ? (w - 0.16) / 2 : w - 0.2; for (let k = 0; k < (w > 1.1 ? 2 : 1); k++) box(g, pw, 0.1, 0.36, w > 1.1 ? (k ? 1 : -1) * (pw / 2 + 0.03) : 0, 0.6, -d / 2 + 0.3, MAT.white);
      break; }
    case 'desk': box(g, c.w, 0.03, 0.6, 0, 0.72, -0.15, main); for (const sx of [-1, 1]) box(g, 0.04, 0.71, 0.55, sx * (c.w / 2 - 0.03), 0.355, -0.15, MAT.black);
      { const ch = new THREE.Group(); ch.position.set(0, 0, 0.3); g.add(ch); box(ch, 0.48, 0.07, 0.46, 0, 0.47, 0, MAT.black); box(ch, 0.46, 0.5, 0.05, 0, 0.78, 0.22, MAT.black); cyl(ch, 0.03, 0.03, 0.42, 0, 0.22, 0, MAT.steel); cyl(ch, 0.28, 0.28, 0.03, 0, 0.03, 0, MAT.black, 5); }
      break;
    case 'shelf': box(g, c.w, c.h, 0.02, 0, c.h / 2, -c.d / 2 + 0.01, main); for (const sx of [-1, 1]) box(g, 0.02, c.h, c.d, sx * (c.w / 2 - 0.01), c.h / 2, 0, main);
      for (let k = 0; k <= 5; k++) box(g, c.w, 0.02, c.d, 0, 0.01 + k * (c.h - 0.02) / 5, 0, main);
      { const r = rng(5); for (let k = 0; k < 5; k++) for (let b = 0; b < 6; b++) if (r() > 0.35) box(g, 0.04 + r() * 0.03, 0.2 + r() * 0.1, 0.2, -c.w / 2 + 0.08 + b * 0.11, 0.13 + k * 0.356, 0, std({ color: ['#7a3b2e', '#2f4a63', '#d9c9a8', '#3d5c46', '#8d8e8c'][Math.floor(r() * 5)], roughness: 0.8 }), false); }
      break;
    case 'wardrobe': box(g, c.w, c.h, c.d, 0, c.h / 2, 0, main); box(g, 0.004, c.h - 0.1, 0.01, 0, c.h / 2, c.d / 2 + 0.003, MAT.black);
      for (const sx of [-1, 1]) box(g, 0.02, 0.25, 0.02, sx * 0.06, 1.0, c.d / 2 + 0.015, MAT.metal); break;
    case 'chest': box(g, c.w, c.h, c.d, 0, c.h / 2, 0, main); for (let k = 0; k < 4; k++) { box(g, c.w - 0.04, 0.004, 0.01, 0, 0.22 * (k + 1) - 0.01, c.d / 2 + 0.003, MAT.black); box(g, 0.14, 0.02, 0.02, 0, 0.22 * k + 0.12, c.d / 2 + 0.012, MAT.metal); } break;
    case 'rug': { const m = box(g, c.w, 0.012, c.d, 0, 0.006, 0, main, false); m.receiveShadow = true; break; }
    case 'plant': cyl(g, 0.17, 0.13, 0.32, 0, 0.16, 0, MAT.pot); { const r = rng(9); for (let k = 0; k < 9; k++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16 + r() * 0.08, 0), MAT.leaf); m.position.set((r() - 0.5) * 0.3, 0.6 + r() * 0.65, (r() - 0.5) * 0.3); m.castShadow = true; g.add(m); } } break;
    case 'island': box(g, c.w, c.h, c.d, 0, c.h / 2, 0, main); box(g, c.w + 0.02, 0.03, c.d + 0.02, 0, c.h + 0.015, 0, MAT.steel);
      box(g, 0.75, 0.01, 0.45, -0.55, c.h + 0.031, -0.1, MAT.black); cyl(g, 0.012, 0.012, 0.3, -0.55, c.h + 0.18, -0.38, MAT.metal);
      box(g, 0.6, 0.008, 0.5, 0.8, c.h + 0.034, -0.05, MAT.screen); break;
    case 'backcounter': box(g, c.w, 0.85, c.d, 0, 0.425, 0, main); box(g, c.w, 0.03, c.d, 0, 0.865, 0, MAT.steel);
      box(g, c.w, 0.7, 0.38, 0, 1.75, -c.d / 2 + 0.19, main); for (let k = 1; k < 4; k++) box(g, 0.004, 0.68, 0.01, -c.w / 2 + k * c.w / 4, 1.75, -c.d / 2 + 0.385, MAT.black); break;
    case 'fridge': box(g, c.w, c.h, c.d, 0, c.h / 2, 0, std({ color: '#e3e2de', roughness: 0.3, metalness: 0.2 })); box(g, c.w - 0.02, 0.004, 0.01, 0, 1.15, c.d / 2 + 0.003, MAT.black); box(g, 0.02, 0.3, 0.03, c.w / 2 - 0.06, 1.35, c.d / 2 + 0.02, MAT.metal); break;
    // 照明（天井面が原点、下向き）
    case 'downlight': { const m = cyl(g, 0.05, 0.05, 0.012, 0, -0.006, 0, std({ color: '#fff', emissive: colorOf(LIGHTCOL, lightCol).hex, emissiveIntensity: 0 })); m.userData.glow = true; cyl(g, 0.062, 0.062, 0.004, 0, -0.002, 0, MAT.white); break; }
    case 'ceiling': { const m = cyl(g, 0.27, 0.25, 0.09, 0, -0.045, 0, std({ color: '#fbfbf8', emissive: colorOf(LIGHTCOL, lightCol).hex, emissiveIntensity: 0, roughness: 0.4 }), 40); m.userData.glow = true; break; }
    case 'pendant': cyl(g, 0.004, 0.004, 0.75, 0, -0.375, 0, MAT.black, 6);
      { const sh = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.2, 32, 1, true), std({ color: '#2a2b2d', roughness: 0.4, side: THREE.DoubleSide })); sh.position.y = -0.83; sh.castShadow = true; g.add(sh);
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), std({ color: '#fff', emissive: colorOf(LIGHTCOL, lightCol).hex, emissiveIntensity: 0 })); b.position.y = -0.9; b.userData.glow = true; g.add(b); }
      cyl(g, 0.05, 0.05, 0.02, 0, -0.01, 0, MAT.black); break;
    // 壁付け（壁面が原点、+z が室内側、y は取付高さ中心）
    case 'outlet': box(g, 0.07, 0.12, 0.012, 0, 0, 0.006, MAT.plate, false); for (const y of [-0.025, 0.025]) for (const x of [-0.008, 0.008]) box(g, 0.003, 0.012, 0.004, x, y, 0.013, MAT.black, false); break;
    case 'switch': box(g, 0.07, 0.12, 0.012, 0, 0, 0.006, MAT.plate, false); box(g, 0.05, 0.08, 0.006, 0, 0, 0.014, MAT.white, false); break;
    case 'tv': box(g, 0.07, 0.12, 0.012, 0, 0, 0.006, MAT.plate, false); cyl(g, 0.011, 0.011, 0.01, 0, 0.025, 0.015, MAT.metal, 12).rotation.x = Math.PI / 2; for (const x of [-0.008, 0.008]) box(g, 0.003, 0.012, 0.004, x, -0.025, 0.013, MAT.black, false); break;
    case 'lan': box(g, 0.07, 0.12, 0.012, 0, 0, 0.006, MAT.plate, false); box(g, 0.016, 0.014, 0.006, 0, 0, 0.014, MAT.black, false); break;
    case 'aircon': box(g, 0.8, 0.29, 0.24, 0, 0.145, 0.12, std({ color: '#f5f5f2', roughness: 0.35 })); box(g, 0.72, 0.02, 0.01, 0, 0.03, 0.245, std({ color: '#cfd1d2', roughness: 0.4 })); box(g, 0.08, 0.01, 0.005, 0.28, 0.24, 0.243, MAT.black, false); break;
  }
  return g;
}

/* =========================================================
   本体
   ========================================================= */
const STORE = 'kmew-interior-v1';
export function createInterior(root, { onBack } = {}) {
  let state;
  try { state = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { state = null; }
  if (!state || !state.rooms) state = { room: 'ldk', tab: 'wall', night: false, rooms: {} };
  for (const r of ROOMS) if (!state.rooms[r.id]) state.rooms[r.id] = structuredClone(DEFAULT_ROOMS[r.id]);
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignore */ } };

  root.innerHTML = `
  <section class="in-stage-wrap">
    <div class="toolbar">
      <span class="lbl">部屋</span>
      <select id="inRoom" class="in-select" aria-label="部屋を選ぶ">${ROOMS.map(r => `<option value="${r.id}">${r.floor} ${r.name}（${r.size}）</option>`).join('')}</select>
      <div class="views" id="inViews">
        <button type="button" data-v="persp">俯瞰</button><button type="button" data-v="top">真上（図面）</button><button type="button" data-v="eye">入口から</button><button type="button" data-v="eye2">奥から</button>
      </div>
      <div class="seg" id="inTime"><button type="button" data-t="day" aria-pressed="true">昼</button><button type="button" data-t="night" aria-pressed="false">夜</button></div>
    </div>
    <div class="in-stage" id="inStage">
      <div class="in-hint">ドラッグで回転・ホイール／2本指で拡大。家具や器具はクリックで選択→ドラッグで移動</div>
      <div class="in-legend" id="inCount"></div>
    </div>
  </section>
  <aside class="panel in-panel" aria-label="内装の設定">
    <div class="in-tabs" role="tablist" id="inTabs">
      <button type="button" data-tab="wall">壁紙・床</button><button type="button" data-tab="f">家具</button><button type="button" data-tab="l">照明</button><button type="button" data-tab="e">電気・エアコン</button>
    </div>
    <div class="in-sel" id="inSel" hidden></div>
    <div id="inBody"></div>
  </aside>`;
  const $ = s => root.querySelector(s);
  const stageEl = $('#inStage');

  // ---- three ----
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stageEl.prepend(renderer.domElement);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, 1, 0.05, 200);
  const controls = new OrbitControls(cam, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.1; controls.maxPolarAngle = Math.PI * 0.499;
  let dirty = true; controls.addEventListener('change', () => { dirty = true; cull(); });
  const hemi = new THREE.HemisphereLight('#ffffff', '#e2d9cc', 1.6), sun = new THREE.DirectionalLight('#fff3e2', 0.9), amb = new THREE.AmbientLight('#ffffff', 0.55);
  sun.position.set(0.6, 10, 1.2); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 30 });
  sun.shadow.bias = -0.0005; scene.add(hemi, sun, sun.target, amb);
  const roomG = new THREE.Group(); scene.add(roomG);
  let room, ed, rs, wallMeshes = [], floorMesh, itemObjs = [], lightObjs = [], selected = null, view = 'persp';
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), std({ color: '#d7d5d0', roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.03; ground.receiveShadow = true; scene.add(ground);

  const mats = { wall: std({ roughness: 0.92 }), accent: std({ roughness: 0.92 }), floor: std({ roughness: 0.55 }), ceiling: std({ roughness: 0.95, side: THREE.BackSide }), door: std({ roughness: 0.55 }),
    glass: std({ color: '#cfe3f2', emissive: '#bcd9f0', emissiveIntensity: 0.7, roughness: 0.1 }), frame: std({ color: '#2b2c2e', roughness: 0.4, metalness: 0.3 }), base: std({ color: '#ffffff', roughness: 0.6 }) };

  function applySurface(mat, list, id, defTex) {
    const c = colorOf(list, id), k = c.tex || defTex;
    mat.map = tex(k === 'plank' && list === WALLPAPER ? 'wood' : k); mat.color.set(c.hex); mat.needsUpdate = true;
  }
  function buildRoom() {
    room = ROOMS.find(r => r.id === state.room) || ROOMS[0]; rs = state.rooms[room.id]; ed = edges(room);
    roomG.clear(); wallMeshes = []; itemObjs = []; lightObjs = []; selected = null; showSel();
    // 床・天井
    const shape = new THREE.Shape(room.poly.map(([x, z]) => new THREE.Vector2(x, -z)));
    const fg = new THREE.ShapeGeometry(shape); fg.rotateX(-Math.PI / 2);
    { const uv = fg.attributes.uv, pos = fg.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i)); }
    floorMesh = new THREE.Mesh(fg, mats.floor); floorMesh.receiveShadow = true; floorMesh.userData.kind = 'floor'; roomG.add(floorMesh);
    const cg = fg.clone(); cg.translate(0, CH, 0); // 天井は裏面を描く（室内からだけ見える）
    const ceil = new THREE.Mesh(cg, mats.ceiling); ceil.userData.kind = 'ceiling'; roomG.add(ceil); ceil.receiveShadow = true;
    // 天窓
    if (room.skylight) { const s = room.skylight; const m = new THREE.Mesh(new THREE.PlaneGeometry(s.x1 - s.x0, s.z1 - s.z0), mats.glass); m.rotation.x = Math.PI / 2; m.position.set((s.x0 + s.x1) / 2, CH - 0.002, (s.z0 + s.z1) / 2); roomG.add(m); }
    // 壁
    for (const e of ed) {
      const ops = room.open.map(o => { const u0 = onEdge(e, o.a), u1 = onEdge(e, o.b); return u0 != null && u1 != null ? { ...o, u0: Math.min(u0, u1), u1: Math.max(u0, u1) } : null; }).filter(Boolean);
      const holes = ops.filter(o => o.k !== 'closet').map(o => ({ u0: o.u0, u1: o.u1, y0: o.k === 'win' ? o.y0 : 0, y1: o.k === 'win' ? o.y1 : o.k === 'pass' ? CH : 2.0 }));
      const us = new Set([0, e.len]), ys = new Set([0, CH]);
      for (const h of holes) { us.add(h.u0); us.add(h.u1); ys.add(h.y0); ys.add(h.y1); }
      const U = [...us].sort((a, b) => a - b), Y = [...ys].sort((a, b) => a - b), P = [], N = [], T = [];
      const pt = (u, y) => [e.a[0] + e.d[0] * u, y, e.a[1] + e.d[1] * u];
      for (let i = 0; i < U.length - 1; i++) for (let j = 0; j < Y.length - 1; j++) {
        const u0 = U[i], u1 = U[i + 1], y0 = Y[j], y1 = Y[j + 1], uc = (u0 + u1) / 2, yc = (y0 + y1) / 2;
        if (holes.some(h => uc > h.u0 && uc < h.u1 && yc > h.y0 && yc < h.y1)) continue;
        const q = [pt(u0, y0), pt(u1, y0), pt(u1, y1), pt(u0, y1)], tq = [[u0, y0], [u1, y0], [u1, y1], [u0, y1]];
        // 室内側を表にする
        const order = (e.n[0] * -e.d[1] + e.n[1] * e.d[0]) > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
        for (const k of order) { P.push(...q[k]); N.push(e.n[0], 0, e.n[1]); T.push(...tq[k]); }
      }
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); gg.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); gg.setAttribute('uv', new THREE.Float32BufferAttribute(T, 2));
      const wm = new THREE.Mesh(gg, rs.accent.on && rs.accent.wall === e.i ? mats.accent : mats.wall); wm.receiveShadow = true; wm.userData = { kind: 'wall', edge: e.i, attach: [] }; roomG.add(wm); wallMeshes.push(wm);
      // 巾木
      const segs = []; let s0 = 0; for (const h of holes.filter(h => h.y0 < 0.06).sort((a, b) => a.u0 - b.u0)) { if (h.u0 > s0) segs.push([s0, h.u0]); s0 = h.u1; } if (s0 < e.len) segs.push([s0, e.len]);
      for (const [a, b] of segs) { const m = box(roomG, b - a, 0.06, 0.012, 0, 0.03, 0, mats.base, false); wm.userData.attach.push(m); const c = pt((a + b) / 2, 0.03); m.position.set(c[0] + e.n[0] * 0.006, 0.03, c[2] + e.n[1] * 0.006); m.rotation.y = -Math.atan2(e.d[1], e.d[0]); }
      // 窓・ドア・収納
      for (const o of ops) {
        const c = pt((o.u0 + o.u1) / 2, 0), rot = -Math.atan2(e.d[1], e.d[0]), w = o.u1 - o.u0;
        const g = new THREE.Group(); g.position.set(c[0], 0, c[2]); g.rotation.y = rot; roomG.add(g); wm.userData.attach.push(g); // ローカル x：壁に沿う、z：室内側と逆向きに注意
        const sz = (e.n[0] * Math.sin(rot) + e.n[1] * Math.cos(rot)) > 0 ? 1 : -1; // ローカル +z が室内側なら 1
        if (o.k === 'win') {
          const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, o.y1 - o.y0), mats.glass); gl.position.set(0, (o.y0 + o.y1) / 2, -0.08 * sz); if (sz < 0) gl.rotation.y = Math.PI; g.add(gl);
          const fw = 0.04; for (const [x, y, ww, hh] of [[-w / 2 + fw / 2, (o.y0 + o.y1) / 2, fw, o.y1 - o.y0], [w / 2 - fw / 2, (o.y0 + o.y1) / 2, fw, o.y1 - o.y0], [0, o.y1 - fw / 2, w, fw], [0, o.y0 + fw / 2, w, fw]]) box(g, ww, hh, 0.06, x, y, -0.05 * sz, mats.frame, false);
          if (w > 0.6) box(g, 0.03, o.y1 - o.y0, 0.05, 0, (o.y0 + o.y1) / 2, -0.06 * sz, mats.frame, false);
          box(g, w + 0.06, 0.02, 0.1, 0, o.y0 - 0.01, 0.02 * sz, mats.base, false); // 窓台
        } else if (o.k === 'door' || o.k === 'closet') {
          const n = o.k === 'closet' ? Math.max(2, Math.round(w / 0.45)) : 1, pw = w / n;
          for (let k = 0; k < n; k++) { const p = box(g, pw - 0.006, 2.0, 0.035, -w / 2 + pw * (k + 0.5), 1.0, (o.k === 'door' ? -0.03 : 0.02) * sz, mats.door); p.userData.kind = 'door'; }
          if (o.k === 'door') box(g, 0.12, 0.02, 0.04, w / 2 - 0.1, 1.0, 0.0, MAT.metal, false);
          else for (let k = 0; k < n; k += 2) box(g, 0.012, 0.18, 0.02, -w / 2 + pw * (k + 1) - 0.04, 1.0, 0.05 * sz, MAT.metal, false);
          box(g, w + 0.06, 0.05, 0.03, 0, 2.025, 0.0, mats.base, false);
        } else if (o.k === 'pass') {
          const st = new THREE.Mesh(new THREE.PlaneGeometry(w, CH), std({ color: '#9a978f', roughness: 1 })); st.position.set(0, CH / 2, -0.9 * sz); if (sz < 0) st.rotation.y = Math.PI; g.add(st);
        }
      }
    }
    // 家具・器具
    for (const f of room.fixed || []) addObj({ ...f, fixed: true, color: rs.kitchen && rs.kitchen[f.type] });
    rs.items.forEach(it => addObj(it));
    applyMats(); applyTime(); setView(view, true); renderPanel(); renderCount(); cull();
  }
  // 背を向けた壁（カメラ側の壁）は、窓枠・巾木・壁付け器具もまとめて隠す
  function cull() {
    if (!wallMeshes.length) return;
    const vis = {};
    for (const w of wallMeshes) {
      const e = ed[w.userData.edge], mx = e.a[0] + e.d[0] * e.len / 2, mz = e.a[1] + e.d[1] * e.len / 2;
      const on = e.n[0] * (cam.position.x - mx) + e.n[1] * (cam.position.z - mz) > -0.01; vis[e.i] = on;
      for (const o of w.userData.attach) o.visible = on;
    }
    for (const o of itemObjs) { const it = o.userData.item; if (CAT[it.type].g === 'e') o.visible = vis[it.wall] !== false; }
  }
  function wallPose(it) {
    const e = ed[it.wall] || ed[0], u = Math.max(0.05, Math.min(e.len - 0.05, it.u)), h = CAT[it.type].fixedH ? CAT[it.type].h0 : (it.h ?? CAT[it.type].h0);
    return { pos: new THREE.Vector3(e.a[0] + e.d[0] * u, h, e.a[1] + e.d[1] * u), rot: Math.atan2(e.n[0], e.n[1]) };
  }
  function addObj(it) {
    const c = CAT[it.type]; if (!c) return;
    const g = buildItem(it, rs.lightCol), wrap = new THREE.Group(); wrap.add(g); wrap.userData = { item: it };
    g.traverse(m => { if (m.isMesh) m.userData.pick = wrap; });
    if (c.g === 'e') { const p = wallPose(it); wrap.position.copy(p.pos); wrap.rotation.y = p.rot; }
    else if (c.g === 'l') { wrap.position.set(it.x, CH, it.z); const pl = new THREE.PointLight('#fff', 0, 0, 2); pl.position.set(0, it.type === 'pendant' ? -0.95 : -0.12, 0); pl.userData.lm = c.lm; wrap.add(pl); lightObjs.push(pl); }
    else { wrap.position.set(it.x, 0, it.z); wrap.rotation.y = (it.rot || 0) * Math.PI / 180; }
    roomG.add(wrap); itemObjs.push(wrap); return wrap;
  }
  function applyMats() {
    applySurface(mats.wall, WALLPAPER, rs.wall, 'paper'); applySurface(mats.accent, WALLPAPER, rs.accent.color, 'paper'); applySurface(mats.ceiling, WALLPAPER, rs.ceiling, 'paper');
    applySurface(mats.floor, FLOORS, rs.floor, 'plank'); mats.door.color.set(colorOf(DOORCOL, rs.door).hex); mats.door.map = rs.door === 'oak' || rs.door === 'walnut' ? tex('wood') : null; mats.door.needsUpdate = true;
    for (const w of wallMeshes) w.material = rs.accent.on && rs.accent.wall === w.userData.edge ? mats.accent : mats.wall;
    dirty = true;
  }
  function applyTime() {
    const n = state.night, lc = colorOf(LIGHTCOL, rs.lightCol);
    hemi.intensity = n ? 0.04 : 1.6; sun.intensity = n ? 0 : 0.9; amb.intensity = n ? 0.03 : 0.55;
    scene.background = new THREE.Color(n ? '#1b1f26' : '#e9ecef'); ground.material.color.set(n ? '#2a2c30' : '#d7d5d0');
    mats.glass.emissive.set(n ? '#1d2735' : '#bcd9f0'); mats.glass.emissiveIntensity = n ? 0.6 : 0.7; mats.glass.color.set(n ? '#2c3646' : '#cfe3f2');
    for (const pl of lightObjs) { pl.intensity = n ? pl.userData.lm : 0; pl.color.set(lc.hex); }
    for (const o of itemObjs) o.traverse(m => { if (m.userData.glow) { m.material.emissive.set(lc.hex); m.material.emissiveIntensity = n ? 2.2 : 0.15; } });
    dirty = true;
  }
  function setView(v, keep) {
    view = v; const b = bbox(room.poly), [cx, cz] = centroid(room.poly), span = Math.max(b.x1 - b.x0, b.z1 - b.z0);
    const asp = Math.max(0.5, cam.aspect || 1);
    if (v === 'top') { cam.fov = 40; cam.position.set((b.x0 + b.x1) / 2, span / asp * 1.6 + 3, (b.z0 + b.z1) / 2 + 0.001); controls.target.set((b.x0 + b.x1) / 2, 0, (b.z0 + b.z1) / 2); }
    else if (v === 'eye' || v === 'eye2') {
      const door = room.open.find(o => o.k === 'door'), dx = (door.a[0] + door.b[0]) / 2, dz = (door.a[1] + door.b[1]) / 2;
      const e = ed.find(e => onEdge(e, [dx, dz]) != null) || ed[0];
      if (v === 'eye') { cam.fov = 65; cam.position.set(dx + e.n[0] * 0.35, 1.5, dz + e.n[1] * 0.35); controls.target.set(cx, 1.1, cz); }
      else { cam.fov = 65; const fx = cx + (cx - dx) * 0.7, fz = cz + (cz - dz) * 0.7; const px = pointInPoly(fx, fz, room.poly) ? fx : cx, pz = pointInPoly(fx, fz, room.poly) ? fz : cz; cam.position.set(px, 1.5, pz); controls.target.set(dx, 1.0, dz); }
    } else { cam.fov = 45; const d = span * 1.05 / Math.min(1, asp) + 1.2; cam.position.set(cx - d * 0.35, d * 0.85, cz + d * 0.75); controls.target.set(cx, 0.6, cz); }
    cam.updateProjectionMatrix(); controls.update(); dirty = true; cull();
    for (const b2 of root.querySelectorAll('#inViews button')) b2.setAttribute('aria-pressed', b2.dataset.v === v);
    void keep;
  }
  function resize() { const w = stageEl.clientWidth, h = stageEl.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); dirty = true; }
  new ResizeObserver(resize).observe(stageEl);

  // ---- 選択・ドラッグ ----
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const setRay = e => { const r = renderer.domElement.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, cam); };
  const visibleWalls = () => wallMeshes.filter(w => { const n = new THREE.Vector3(...[w.geometry.attributes.normal.getX(0), 0, w.geometry.attributes.normal.getZ(0)]); const p = new THREE.Vector3().fromBufferAttribute(w.geometry.attributes.position, 0); return n.dot(cam.position.clone().sub(p)) > 0; });
  let drag = null;
  renderer.domElement.addEventListener('pointerdown', e => {
    setRay(e);
    const hits = ray.intersectObjects([...itemObjs, ...visibleWalls(), floorMesh], true).filter(h => h.object.visible);
    const h = hits[0]; if (!h) return;
    const wrap = h.object.userData.pick;
    if (wrap) {
      select(wrap);
      if (!wrap.userData.item.fixed) { drag = { wrap, moved: false, start: [e.clientX, e.clientY] }; controls.enabled = false; renderer.domElement.setPointerCapture(e.pointerId); }
      return;
    }
    if (h.object.userData.kind === 'wall' && state.tab === 'wall' && pickingAccent) { rs.accent.wall = h.object.userData.edge; rs.accent.on = true; pickingAccent = false; applyMats(); renderPanel(); save(); return; }
    select(null);
  });
  renderer.domElement.addEventListener('pointermove', e => {
    if (!drag) return; if (Math.hypot(e.clientX - drag.start[0], e.clientY - drag.start[1]) < 3 && !drag.moved) return;
    drag.moved = true; setRay(e); const it = drag.wrap.userData.item, c = CAT[it.type];
    if (c.g === 'e') {
      const h = ray.intersectObjects(wallMeshes, false)[0]; if (!h) return; const e2 = ed[h.object.userData.edge];
      it.wall = e2.i; it.u = +((h.point.x - e2.a[0]) * e2.d[0] + (h.point.z - e2.a[1]) * e2.d[1]).toFixed(2);
      if (!c.fixedH) it.h = +Math.max(0.1, Math.min(CH - 0.15, h.point.y)).toFixed(2);
      const ps = wallPose(it); drag.wrap.position.copy(ps.pos); drag.wrap.rotation.y = ps.rot; drag.wrap.visible = true;
    } else {
      const y = c.g === 'l' ? CH : 0, pl = new THREE.Plane(new THREE.Vector3(0, 1, 0), -y), p = new THREE.Vector3();
      if (!ray.ray.intersectPlane(pl, p)) return;
      const b = bbox(room.poly); it.x = +Math.max(b.x0, Math.min(b.x1, p.x)).toFixed(2); it.z = +Math.max(b.z0, Math.min(b.z1, p.z)).toFixed(2);
      drag.wrap.position.x = it.x; drag.wrap.position.z = it.z;
    }
    dirty = true; showSel();
  });
  const endDrag = () => { if (drag) { if (drag.moved) { save(); renderCount(); } drag = null; controls.enabled = true; } };
  renderer.domElement.addEventListener('pointerup', endDrag); renderer.domElement.addEventListener('pointercancel', endDrag);
  let pickingAccent = false;
  const selBox = new THREE.BoxHelper(new THREE.Object3D(), '#ff7a1a'); selBox.visible = false; scene.add(selBox);
  function select(wrap) { selected = wrap; selBox.visible = !!wrap; if (wrap) selBox.setFromObject(wrap); showSel(); dirty = true; }
  function showSel() {
    const el = $('#inSel'); if (!el) return;
    if (!selected) { el.hidden = true; return; }
    selBox.setFromObject(selected);
    const it = selected.userData.item, c = CAT[it.type]; el.hidden = false;
    const colors = c.colors ? `<div class="colors">${c.colors.map(o => `<button type="button" class="chip" data-icol="${o.id}" aria-pressed="${(it.color || c.def) === o.id}" title="${o.name}" style="background:${o.hex}"></button>`).join('')}</div>` : '';
    let pos = '';
    if (c.g === 'e') pos = c.fixedH ? `壁の上部に設置（天井から7cm下）` : `床からの高さ <b>${Math.round((it.h ?? c.h0) * 100)}cm</b>
      <span class="in-hset">${[25, 40, 110, 120].map(v => `<button type="button" class="btn small" data-h="${v / 100}">${v}cm</button>`).join('')}</span>`;
    else if (c.g === 'f' || c.g === 'k') pos = `幅${Math.round(c.w * 100)}×奥行${Math.round(c.d * 100)}cm`;
    el.innerHTML = `<div class="in-sel-h"><b>${c.name}</b>${it.fixed ? '<span class="tag">固定</span>' : ''}<button type="button" class="btn small" data-act="close" aria-label="選択を解除">×</button></div>
      <div class="in-sel-p">${pos}</div>${colors}
      <div class="in-sel-a">${c.g === 'f' ? '<button type="button" class="btn small" data-act="rot">90°回転</button>' : ''}${!it.fixed ? '<button type="button" class="btn small" data-act="dup">複製</button><button type="button" class="btn small danger" data-act="del">削除</button>' : ''}</div>`;
  }
  $('#inSel').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !selected) return; const it = selected.userData.item;
    if (b.dataset.act === 'close') return select(null);
    if (b.dataset.act === 'rot') { it.rot = ((it.rot || 0) + 90) % 360; selected.rotation.y = it.rot * Math.PI / 180; }
    if (b.dataset.act === 'del') { rs.items.splice(rs.items.indexOf(it), 1); roomG.remove(selected); itemObjs.splice(itemObjs.indexOf(selected), 1); const pl = selected.children.find(o => o.isLight); if (pl) lightObjs.splice(lightObjs.indexOf(pl), 1); select(null); }
    if (b.dataset.act === 'dup') { const n = structuredClone(it); if ('x' in n) { n.x += 0.3; n.z += 0.3; } else n.u += 0.2; rs.items.push(n); const w = addObj(n); applyTime(); select(w); }
    if (b.dataset.h) { it.h = +b.dataset.h; const ps = wallPose(it); selected.position.copy(ps.pos); }
    if (b.dataset.icol) {
      if (it.fixed) { rs.kitchen = rs.kitchen || {}; rs.kitchen[it.type] = b.dataset.icol; }
      it.color = b.dataset.icol; const old = selected; const w = addObj(it); roomG.remove(old); itemObjs.splice(itemObjs.indexOf(old), 1); applyTime(); select(w);
    }
    save(); renderCount(); dirty = true; if (selected) showSel();
  });

  // ---- パネル ----
  const sw = (list, cur, attr) => `<div class="colors">${list.map(o => `<button type="button" class="chip${o.tex ? ' tx' : ''}" ${attr}="${o.id}" aria-pressed="${cur === o.id}" title="${o.name}" aria-label="${o.name}" style="background:${o.hex}"></button>`).join('')}</div>`;
  function renderPanel() {
    for (const b of root.querySelectorAll('#inTabs button')) b.setAttribute('aria-pressed', b.dataset.tab === state.tab);
    $('#inRoom').value = room.id;
    for (const b of root.querySelectorAll('#inTime button')) b.setAttribute('aria-pressed', (b.dataset.t === 'night') === !!state.night);
    const body = $('#inBody'); let h = '';
    if (state.tab === 'wall') {
      const ac = rs.accent;
      h = `<section class="sec"><div class="sec-h"><h2>壁紙</h2><span class="cur">${colorOf(WALLPAPER, rs.wall).name}</span></div>${sw(WALLPAPER, rs.wall, 'data-wall')}</section>
      <section class="sec"><div class="sec-h"><h2>アクセントクロス</h2><span class="cur">${ac.on ? colorOf(WALLPAPER, ac.color).name : 'なし'}</span></div>
        <label class="check"><input type="checkbox" id="acOn" ${ac.on ? 'checked' : ''}> 1面だけ色を変える</label>
        ${ac.on ? `${sw(WALLPAPER, ac.color, 'data-accent')}<button type="button" class="btn small" id="acPick" aria-pressed="${pickingAccent}">${pickingAccent ? '3Dで壁をクリックしてください' : 'アクセントにする壁を選ぶ'}</button>
        <p class="note">今は「${wallName(ac.wall)}」です。</p>` : ''}</section>
      <section class="sec"><div class="sec-h"><h2>天井</h2><span class="cur">${colorOf(WALLPAPER, rs.ceiling).name}</span></div>${sw(WALLPAPER.filter(w => !w.tex || w.tex === 'wood'), rs.ceiling, 'data-ceil')}</section>
      <section class="sec"><div class="sec-h"><h2>床</h2><span class="cur">${colorOf(FLOORS, rs.floor).name}</span></div>${sw(FLOORS, rs.floor, 'data-floor')}</section>
      <section class="sec"><div class="sec-h"><h2>室内ドア・収納扉</h2><span class="cur">${colorOf(DOORCOL, rs.door).name}</span></div>${sw(DOORCOL, rs.door, 'data-door')}</section>
      <button type="button" class="btn small" id="copyAll">この部屋の壁紙・床・天井・ドアを全部屋に反映</button>`;
    } else {
      const g = state.tab, list = Object.entries(CAT).filter(([, c]) => c.g === g && (g !== 'k'));
      h = `<section class="sec"><div class="sec-h"><h2>${GROUP_LABEL[g]}を追加</h2></div>
        <div class="in-cat">${list.map(([k, c]) => `<button type="button" class="in-add" data-add="${k}"><span>${c.name}</span><small>${c.g === 'e' ? (c.fixedH ? '壁上部' : `標準 ${Math.round(c.h0 * 100)}cm`) : c.g === 'l' ? '天井' : `${Math.round(c.w * 100)}×${Math.round(c.d * 100)}`}</small></button>`).join('')}</div>
        <p class="note">${g === 'e' ? '追加すると見えている壁に付きます。ドラッグで壁から壁へ移動でき、高さも変わります。高さはボタンで25・40・110・120cmにそろえられます。' : g === 'l' ? '天井に付きます。ドラッグで位置を移動。「夜」にすると明かりの広がりを確認できます。' : '部屋の中央に置かれます。ドラッグで移動、選択して「90°回転」で向きを変えます。'}</p></section>`;
      if (g === 'l') h += `<section class="sec"><div class="sec-h"><h2>照明の色</h2><span class="cur">${colorOf(LIGHTCOL, rs.lightCol).name}</span></div>
        <div class="seg">${LIGHTCOL.map(o => `<button type="button" data-lc="${o.id}" aria-pressed="${rs.lightCol === o.id}">${o.name}</button>`).join('')}</div></section>`;
      const placed = rs.items.filter(it => CAT[it.type] && CAT[it.type].g === g);
      h += `<section class="sec"><div class="sec-h"><h2>この部屋に設置中</h2><span class="cur">${placed.length}点</span></div>
        <ul class="in-list">${placed.map((it, i) => `<li><button type="button" data-pick="${rs.items.indexOf(it)}">${CAT[it.type].name}${CAT[it.type].g === 'e' ? `<small>${wallName(it.wall)}・${CAT[it.type].fixedH ? '上部' : Math.round((it.h ?? CAT[it.type].h0) * 100) + 'cm'}</small>` : ''}</button></li>`).join('') || '<li class="note">まだありません</li>'}</ul></section>`;
      if (g === 'f' && room.fixed) h += `<p class="note">キッチン・カップボード・冷蔵庫は固定です。クリックすると扉の色を変えられます。</p>`;
    }
    body.innerHTML = h;
  }
  function wallName(i) {
    const e = ed[i]; if (!e) return ''; const dir = Math.abs(e.n[0]) > Math.abs(e.n[1]) ? (e.n[0] > 0 ? '西' : '東') : (e.n[1] > 0 ? '北' : '南');
    return `${dir}の壁（${Math.round(e.len * 100) / 100}m）`;
  }
  function renderCount() {
    const n = t => rs.items.filter(it => it.type === t).length;
    $('#inCount').innerHTML = `<b>${room.floor} ${room.name}</b>（${room.size}）<span>コンセント ${n('outlet')}・TV ${n('tv')}・LAN ${n('lan')}・スイッチ ${n('switch')}・照明 ${n('downlight') + n('ceiling') + n('pendant')}・エアコン ${n('aircon')}</span>`;
  }
  $('#inBody').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.wall) { rs.wall = d.wall; applyMats(); }
    else if (d.accent) { rs.accent.color = d.accent; applyMats(); }
    else if (d.ceil) { rs.ceiling = d.ceil; applyMats(); }
    else if (d.floor) { rs.floor = d.floor; applyMats(); }
    else if (d.door) { rs.door = d.door; applyMats(); }
    else if (b.id === 'acPick') { pickingAccent = !pickingAccent; }
    else if (b.id === 'copyAll') { for (const r of ROOMS) Object.assign(state.rooms[r.id], { wall: rs.wall, floor: rs.floor, ceiling: rs.ceiling, door: rs.door }); b.textContent = '全部屋に反映しました'; save(); return; }
    else if (d.lc) { rs.lightCol = d.lc; applyTime(); }
    else if (d.pick) { const it = rs.items[+d.pick]; const w = itemObjs.find(o => o.userData.item === it); if (w) select(w); return; }
    else if (d.add) {
      const c = CAT[d.add], [cx, cz] = centroid(room.poly); let it;
      if (c.g === 'e') { const vw = visibleWalls(); const wi = vw.length ? vw[Math.floor(vw.length / 2)].userData.edge : 0; it = { type: d.add, wall: wi, u: +(ed[wi].len / 2).toFixed(2), h: c.h0 }; }
      else if (c.g === 'l') it = { type: d.add, x: +cx.toFixed(2), z: +cz.toFixed(2) };
      else it = { type: d.add, x: +(pointInPoly(cx, cz, room.poly) ? cx : room.poly[0][0] + 1).toFixed(2), z: +(pointInPoly(cx, cz, room.poly) ? cz : room.poly[0][1] + 1).toFixed(2), rot: 0, color: c.def };
      rs.items.push(it); const w = addObj(it); applyTime(); select(w); renderCount();
    }
    save(); renderPanel();
  });
  $('#inBody').addEventListener('change', e => { if (e.target.id === 'acOn') { rs.accent.on = e.target.checked; pickingAccent = rs.accent.on; applyMats(); save(); renderPanel(); } });
  $('#inTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { state.tab = b.dataset.tab; pickingAccent = false; save(); renderPanel(); } });
  $('#inRoom').addEventListener('change', e => { state.room = e.target.value; save(); buildRoom(); });
  $('#inViews').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) setView(b.dataset.v); });
  $('#inTime').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (b) { state.night = b.dataset.t === 'night'; save(); applyTime(); renderPanel(); } });

  let active = true;
  (function loop() { requestAnimationFrame(loop); if (!active) return; const m = controls.update(); if (selected && drag) selBox.setFromObject(selected); if (dirty || m) { renderer.render(scene, cam); dirty = false; } })();
  resize(); buildRoom();

  return {
    show(on) { active = on; if (on) { resize(); dirty = true; } },
    snapshot() {
      renderer.render(scene, cam); const src = renderer.domElement, sc = Math.min(window.devicePixelRatio || 1, 2), pad = Math.round(14 * sc), head = Math.round(50 * sc), lh = Math.round(21 * sc);
      const lines = [`壁紙：${colorOf(WALLPAPER, rs.wall).name}${rs.accent.on ? `／アクセント：${colorOf(WALLPAPER, rs.accent.color).name}（${wallName(rs.accent.wall)}）` : ''}`,
        `天井：${colorOf(WALLPAPER, rs.ceiling).name}／床：${colorOf(FLOORS, rs.floor).name}／室内ドア：${colorOf(DOORCOL, rs.door).name}／照明色：${colorOf(LIGHTCOL, rs.lightCol).name}`,
        $('#inCount').textContent.replace(/^.*?）/, '')];
      const c = mkC(src.width + pad * 2, head + src.height + lines.length * lh + pad * 2), g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#1b2023'; g.font = `700 ${Math.round(17 * sc)}px "Zen Kaku Gothic New", sans-serif`; g.textBaseline = 'middle';
      g.fillText(`高藤邸 内観シミュレーション（プランNo.5）${room.floor} ${room.name}（${room.size}）`, pad, head / 2);
      g.drawImage(src, pad, head); g.font = `500 ${Math.round(12.5 * sc)}px "Zen Kaku Gothic New", sans-serif`;
      lines.forEach((t, i) => g.fillText(t, pad, head + src.height + pad + lh * (i + 0.5)));
      return c.toDataURL('image/png');
    },
  };
}
