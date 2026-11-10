// 内観シミュレーター（プランNo.5）— 壁紙・床・家具・照明・エアコン・コンセント
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* =========================================================
   部屋データ（平面図より。x：西→東、z：北→南、単位 m）
   ========================================================= */
const CH = 2.4; // 天井高
const ROOMS = [
  { id: 'ldk', name: 'LDK', size: '16.26帖', floor: '2階',
    poly: [[0, 0], [6.39, 0], [6.39, 0.5], [7.28, 0.5], [7.28, 3.49], [3.64, 3.49], [3.64, 4.4], [1.82, 4.4], [1.82, 3.8], [0, 3.8]],
    open: [
      { k: 'win', a: [0, 1.44], b: [0, 3.12], y0: 0.91, y1: 2.05, name: '西の窓（シャッター付）', panes: 2 },
      { k: 'win', a: [0.74, 0], b: [1.4, 0], y0: 1.9, y1: 2.2, name: '北の高窓' },
      { k: 'win', a: [1.78, 0], b: [2.44, 0], y0: 1.9, y1: 2.2, name: '北の高窓' },
      { k: 'win', a: [5.61, 0], b: [6.27, 0], y0: 1.35, y1: 1.65, name: '北の小窓（カップボードの間）' },
      { k: 'win', a: [2.42, 4.4], b: [3.03, 4.4], y0: 1.9, y1: 2.2, name: '南の小窓（FIX）' },
      { k: 'door', a: [7.28, 1.77], b: [7.28, 3.41], name: '洗面所・トイレへ（廊下側に吊り下げの引き戸）', slide: true },
      { k: 'pass', a: [3.64, 3.49], b: [4.5, 3.49], name: '階段（下り）' },
      { k: 'pass', a: [6.41, 3.49], b: [7.28, 3.49], name: '階段（上り）' },
      { k: 'closet', a: [0.08, 3.8], b: [1.74, 3.8], name: '収納' },
      { k: 'shelf', a: [6.44, 0.5], b: [7.23, 0.5], name: '収納（扉なし・可動棚）', depth: 0.45, h: 2.2 },
    ],
    fixed: [
      { type: 'island', x: 5.935, z: 2.04, rot: 0 }, // 東の端（コンロ側）を東の壁に付けた壁付けフラット
      { type: 'backcounter', x: 5.48, z: 0.23, rot: 0 },
      { type: 'fridge', x: 4.2, z: 0.344, rot: 0 }, // 幅60×奥行64.8×高さ185cm、北の壁から2cm
    ] },
  { id: 'r1', name: '洋室', size: '7.25帖', floor: '1階',
    poly: [[7.28, 0], [10.01, 0], [10.01, 4.4], [7.28, 4.4]],
    open: [
      { k: 'win', a: [10.01, 1.84], b: [10.01, 3.42], y0: 0.95, y1: 2.05, name: '東の窓（シャッター付）', panes: 2 },
      { k: 'door', a: [7.28, 1.9], b: [7.28, 2.65], name: '廊下へ' },
    ] },
  { id: 'r3a', name: '洋室A', size: '7.7帖', floor: '3階',
    poly: [[0.91, 0], [3.64, 0], [3.64, 3.64], [1.82, 3.64], [1.82, 4.4], [0, 4.4], [0, 2.075], [0.91, 2.075]],
    open: [
      { k: 'win', a: [0.91, 0.21], b: [0.91, 1.86], y0: 0.36, y1: 2.06, name: 'インナーバルコニーの窓', panes: 2 },
      { k: 'door', a: [3.64, 2.66], b: [3.64, 3.41], name: '廊下へ' },
      { k: 'shelf', a: [1.88, 3.64], b: [3.58, 3.64], name: '収納（扉なし・枕棚＋ハンガーパイプ）', depth: 0.7, rod: true },
    ] },
  { id: 'r3b', name: '洋室B', size: '4.9帖', floor: '3階',
    poly: [[4.4, 0], [7.28, 0], [7.28, 2.58], [3.64, 2.58], [3.64, 1.665], [4.4, 1.665]],
    open: [
      { k: 'win', a: [4.47, 0], b: [5.88, 0], y0: 1.16, y1: 2.06, name: '北の窓（シャッター付）', panes: 2 },
      { k: 'door', a: [3.72, 2.58], b: [4.47, 2.58], name: '廊下へ' },
      { k: 'closet', a: [4.4, 0.08], b: [4.4, 1.59], name: '収納' },
    ],
    skylight: { x0: 4.63, x1: 5.39, z0: 0.29, z1: 1.05 } },
  { id: 'r3c', name: '洋室C', size: '6帖', floor: '3階',
    poly: [[7.28, 0], [10.01, 0], [10.01, 3.64], [7.28, 3.64]],
    open: [
      { k: 'win', a: [10.01, 1.84], b: [10.01, 3.42], y0: 1.16, y1: 2.06, name: '東の窓（シャッター付）', panes: 2 },
      { k: 'door', a: [7.28, 2.66], b: [7.28, 3.41], name: '廊下へ' },
      { k: 'closet', a: [8.27, 3.64], b: [9.93, 3.64], name: '収納' },
      { k: 'shelf', a: [7.34, 3.64], b: [8.13, 3.64], name: '収納（小・扉なし・棚）', depth: 0.7 },
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
].map(([id, name, hex, tex]) => ({ id, name, hex, tex: tex || 'plank', series: 'basic' }));
// 実物の床材（写真から貼る）。pw：1枚の幅、pl：1枚の長さ、sl：写真が写している長さ（m）
// DAIKEN トリニティ YN7701（12mm厚・178×1,818mm）。写真は DAIKEN 公式サイトの柄見本（1090×180px。高さを1枚の幅178mmとして約1.08m分の長さ。足りない分は反転して継ぎ足す）
const TRINITY = [
  ['88', 'アッシュ柄', '#f7f0e6'], ['52', 'シカモア柄', '#f3e1c9'], ['50', 'メープル柄', '#ecc9a9'], ['82', 'オーク柄（グレージュ色）', '#d5c8b7'],
  ['30', 'オーク柄', '#d8b47b'], ['33', 'チェスナット柄', '#cfa97a'], ['13', 'チェリー柄', '#ca9662'], ['14', 'バーチ柄（グレー色）', '#805e4a'],
  ['71', 'ウォールナット柄（グレー色）', '#ab927d'], ['40', 'チーク柄', '#8a581d'], ['62', 'マホガニー柄', '#69321c'], ['70', 'ウォールナット柄', '#604233'],
].map(([c, name, hex]) => ({ id: `yn7701-${c}`, code: `YN7701-${c}`, name: `トリニティ ${name}`, hex, img: `interior/floor/yn7701-${c}.jpg`, pw: 0.178, pl: 1.818, series: 'trinity' }));
// MYフロア（色見本は1枚の一部。303mm幅・1,818mm長さとして並べる）
const MYFLOOR = [
  ['01', 'アッシュ柄（ホワイト）', '#e0dac9'], ['02', 'バーチ柄（ベージュ）', '#c4a671'], ['03', 'ウォールナット柄（アンバー）', '#564832'],
  ['04', 'メープル柄（キャメル）', '#927b59'], ['05', 'オーク柄（ペールグレー）', '#b4ad98'], ['06', 'ペカン柄', '#a7936c'],
  ['09', 'オーク柄（チャコール）', '#8e7f6a'], ['10', 'ラスティックオーク柄', '#907751'], ['11', 'ラスティックペカン柄', '#907148'],
  ['12', 'アッシュ柄（スーパーホワイト）', '#eeefe8'], ['13', 'アッシュ柄（ペール）', '#c4beaa'], ['14', 'アップル柄（レディッシュブラウン）', '#4b2d24'],
  ['15', 'メープル柄（ブラック）', '#3b352f'], ['16', 'エルム柄（ブラウン）', '#aa9073'], ['17', 'オーク柄（エクリュ）', '#c4ae8c'],
  ['18', 'チェスナット柄（グレー）', '#aca18f'], ['19', 'チェスナット柄（ダーク）', '#7f6c59'],
].map(([c, name, hex]) => ({ id: `my-m${c}`, code: `M${c}`, name: `MYフロア ${name}`, hex, img: `interior/floor/my-m${c}.jpg`, pw: 0.303, pl: 1.818, series: 'myfloor' }));
FLOORS.push(...TRINITY, ...MYFLOOR);
const FLOOR_SERIES = [['trinity', 'DAIKEN トリニティ（YN7701）', '¥14,280/㎡・178×1,818mm'], ['myfloor', 'MYフロア', '303mm幅として表示'], ['basic', '色だけ（簡易表示）', '']];
// 室内ドア・収納扉：Panasonic ieria（イエリア）の色柄。img はカタログの色見本（約36cm幅の部分として貼る）
const DOOR_SERIES = [['std', 'ieria スタンダード', '8色'], ['sel', 'ieria セレクト', '11色']];
const DOORCOL = [
  ['JH', 'パウダーホワイト柄', '#fffefc', 'std'], ['WH', 'ネオホワイト柄', '#f7f1ea', 'std'], ['MP', 'ソフトグレージュ柄', '#cec0a9', 'std'], ['ML', 'ミルベージュ柄', '#d8b58f', 'std'],
  ['MA', 'ライトオーカー柄', '#d0b181', 'std'], ['MG', 'トープグレー柄', '#a5866b', 'std'], ['MW', 'ダルブラウン柄', '#503c32', 'std'], ['MU', 'モスブラック柄', '#1e2024', 'std'],
  ['PP', 'コットンベージュ柄', '#ddd1bf', 'sel'], ['PA', 'ミルキーオーカー柄', '#d0af81', 'sel'], ['HG', 'バームブラウン柄', '#a27e66', 'sel'], ['PG', 'スモークグレー柄', '#b8a793', 'sel'],
  ['PB', 'ドライブラック柄', '#453937', 'sel'], ['HP', 'スロウベージュ柄', '#d0c3ae', 'sel'], ['PM', 'シナモンブラウン柄', '#c19b68', 'sel'],
  ['EB', 'アイアンブラック柄', '#474143', 'sel', 1], ['ET', 'テラゾホワイト柄', '#f5f6f2', 'sel', 1], ['EG', 'コンクリートグレー柄', '#bcb2a9', 'sel', 1], ['EC', 'コバルトブルー柄', '#17263c', 'sel', 1],
].map(([code, name, hex, series, stone]) => ({ id: code, code, name, hex, series, img: `interior/door/${code.toLowerCase()}.jpg`, stone: !!stone }));
const DOOR_ALIAS = { white: 'JH', oak: 'MA', walnut: 'MW', gray: 'MG', black: 'MU' }; // 旧来の色指定からの置き換え
const doorOf = id => colorOf(DOORCOL, DOOR_ALIAS[id] || id);
const doorLabel = d => `${d.name}（${d.code}）`;
const DFRAME = [['white', '白', '#f3f2ee'], ['black', '黒', '#232426']].map(([id, name, hex]) => ({ id, name, hex }));
const DKNOB = [['silver', 'シルバー', '#d6d9db', 0.35, 0.3], ['black', '黒', '#1f2022', 0.5, 0.45]].map(([id, name, hex, metal, rough]) => ({ id, name, hex, metal, rough }));
// 布・木部の色。後半は、モルタル調・ダークグレーのキッチンにも、クリームストーンのキッチンにも合わせられるように足した、彩度を抑えた中間色
const FABRIC = [['gray', 'グレー', '#8d8e8c'], ['beige', 'ベージュ', '#c9b9a0'], ['ivory', 'アイボリー', '#e3dccd'], ['navy', 'ネイビー', '#34405a'],
  ['green', 'グリーン', '#5c6b52'], ['brown', 'ブラウン', '#6d4f3c'], ['mustard', 'マスタード', '#b99146'], ['charcoal', 'チャコール', '#3c3d3f'],
  ['lightgray', 'ライトグレー', '#b9b9b5'], ['stone', 'ストーングレー', '#9a958d'], ['greige', 'グレージュ', '#aaa293'], ['oatmeal', 'オートミール', '#d5cbb9'],
  ['sand', 'サンド', '#bcab92'], ['mocha', 'モカ', '#87725f']]
  .map(([id, name, hex]) => ({ id, name, hex }));
const WOODC = [['natural', 'ナチュラル', '#c49a6c'], ['walnut', 'ウォールナット', '#5f4331'], ['white', 'ホワイト', '#efeeea'], ['black', 'ブラック', '#2a2b2d'], ['gray', 'グレー', '#8c8d8c'],
  ['ash', 'ホワイトアッシュ', '#d9c9ae'], ['oak', 'ナチュラルオーク', '#c4aa86'], ['greige', 'グレージュオーク', '#ae9f8a'], ['smoke', 'スモークオーク', '#806c5b'],
  ['charcoal', 'チャコールオーク', '#4a4540'], ['ivory', 'アイボリー', '#e6e0d3']]
  .map(([id, name, hex]) => ({ id, name, hex }));
// キッチン・カップボードの扉の色見本を、TOCLAS カラーシミュレーション（スリムフラット-W）の CG の見え方に寄せる補正（sRGB の倍率 R,G,B）。
// 内観のアイランドを同じ向きから描いた色が CG の扉の平均色に合うように測って決めた
const KDOOR_TINT = {'z-cream': [0.811, 0.834, 0.821], 'z-mortar': [0.91, 0.949, 0.911], 'z-gray': [0.834, 0.861, 0.89], 'z-gold': [0.948, 1.069, 1.223], 'z-leather': [0.977, 1.024, 1.064], 'y-white': [0.861, 0.855, 0.821], 'y-mocha': [0.762, 0.813, 0.857], 'n-oak': [0.963, 1.046, 1.067], 'n-teak': [0.892, 0.982, 1.067], 'n-walnut': [0.988, 1.141, 1.198], 's-basic': [0.863, 0.867, 0.884], 's-silk': [0.909, 0.921, 0.952], 'd-wine': [0.763, 0.941, 0.849], 'd-navy': [0.933, 0.977, 1.054], 'q-white': [0.874, 0.903, 0.932], 'q-medium': [1.004, 1.147, 1.258], 'q-dark': [1.182, 1.232, 1.213], 'j-oak': [0.902, 0.941, 0.955], 'j-elm': [1.002, 1.045, 1.036], 'b-linen': [0.918, 0.928, 0.908], 'b-ice': [1.019, 1.0, 0.97], 'b-mimosa': [0.966, 1.05, 1.157], 'b-slate': [0.991, 1.001, 1.002]};
// キッチン・カップボードの扉（本体も同色）：カタログ「扉シリーズ」のリッチマテリアル以外。img はカタログの色見本
const KDOOR_SERIES = [['Z', 'Zシリーズ', 'Grade 2・石目'], ['Y', 'Yシリーズ', 'Grade 2・木目'], ['N', 'Nシリーズ', 'Grade 2・木目'], ['S', 'Sシリーズ', 'Grade 2・白無地'],
  ['D', 'Dシリーズ', 'Grade 2・鏡面'], ['Q', 'Qシリーズ', 'Grade 2・鏡面木目'], ['J', 'Jシリーズ', 'Grade 1・木目'], ['B', 'Bシリーズ', 'Grade 1・マット']];
const KDOORS = [
  ['z-cream', 'Z', 'クリームストーン', '#f1e5da'], ['z-mortar', 'Z', 'スムースモルタル', '#8f8a8b'], ['z-gray', 'Z', 'グレーストーン', '#676561'], ['z-gold', 'Z', 'エイジングゴールド', '#554434'], ['z-leather', 'Z', 'ダークレザー', '#463c37'],
  ['y-white', 'Y', 'リファインドホワイト', '#e8ddd2'], ['y-mocha', 'Y', 'リファインドモカ', '#8e7d70'],
  ['n-oak', 'N', 'ライトオーク', '#d3ad84'], ['n-teak', 'N', 'ミディアムチーク', '#8e6446'], ['n-walnut', 'N', 'ダークウォルナット', '#4f4340'],
  ['s-basic', 'S', 'ベーシックホワイト［鏡面］', '#f8f7f0', 1], ['s-silk', 'S', 'シルクホワイト［艶消し］', '#f0ece3'],
  ['d-wine', 'D', 'ワインレッド', '#733a44', 1], ['d-navy', 'D', 'ミッドナイトブルー', '#47444b', 1],
  ['q-white', 'Q', 'グロウホワイト', '#f1e3d1', 1], ['q-medium', 'Q', 'グロウミディアム', '#694a35', 1], ['q-dark', 'Q', 'グロウダーク', '#3d3330', 1],
  ['j-oak', 'J', 'チョークドオーク', '#e8ddc7'], ['j-elm', 'J', 'グレイッシュエルム', '#bfb1a6'],
  ['b-linen', 'B', 'リネンベージュ', '#d4cfcc'], ['b-ice', 'B', 'アイスブルー', '#bdccd1'], ['b-mimosa', 'B', 'ミモザイエロー', '#f4c575'], ['b-slate', 'B', 'スレートグレー', '#6d6d6c'],
].map(([id, series, name, hex, gloss]) => ({ id, series, name, hex, gloss: !!gloss, img: `interior/kitchen/${id}.jpg`, mpp: 0.4 / 435, tint: KDOOR_TINT[id] }));
// 天板：人造大理石「テノール」カウンター（Grade 5）
const KTOPS = [['tenor-white', 'ソルティホワイト', '#f1f3ec'], ['tenor-gray', 'メテオダークグレー', '#575550'], ['tenor-brown', 'バーストブラウン', '#665246'], ['tenor-black', 'アイアンブラック', '#313230']]
  .map(([id, name, hex]) => ({ id, name: `テノール ${name}`, hex, img: `interior/kitchen/${id}.jpg`, mpp: 0.2 / 612 }));
// カップボード（ハイカウンター）の天板は、テノールに加えてメラミンポストフォームの2色も選べる。色はカタログの色見本から
const CB_TOPS = [...KTOPS, ...[['mpf-white', 'ホワイト', '#f7f7f5'], ['mpf-gray', 'ダークグレー', '#544e4a']].map(([id, name, hex]) => ({ id, name: `メラミンポストフォーム ${name}`, hex }))];
const topsOf = type => type === 'backcounter' ? CB_TOPS : KTOPS;
// レンジフード：トクラス サイドフード SHVR の3色（トクラス コラージア スリムフラットW のカラーシミュレーションより）
const RHOOD = [['shvr1', 'シルバー', '#c9cccd', 0.35, 0.3], ['shvr2', 'ブラック', '#2b2c2e', 0.3, 0.4], ['shvr3', 'ホワイト', '#f2f2ef', 0, 0.35]]
  .map(([id, name, hex, metal, rough]) => ({ id, name: `サイドフード SHVR ${name}`, short: name, hex, metal, rough }));
// シンク：人造大理石の H2シンク 4色（色は TOCLAS カラーシミュレーションの CG のシンクの色に合わせた）、取っ手：ロングバー取手 2色（同じシミュレーションの色見本から）
const KSINK = [['w', 'ホワイト', '#daddde'], ['cb', 'シックベージュ', '#bebab5'], ['gg', 'グレージュ', '#c0beb0'], ['g', 'グレー', '#bcc0c2']]
  .map(([id, name, hex]) => ({ id, name: `H2シンク ${name}`, short: name, hex, metal: 0, rough: 0.3 }));
const KHANDLE = [['silver', 'シルバー', '#d4d6d8', 0.3, 0.3], ['black', 'ブラック', '#2a2b2d', 0.2, 0.45]]
  .map(([id, name, hex, metal, rough]) => ({ id, name: `ロングバー取手 ${name}`, short: name, hex, metal, rough }));
// キッチンの部品ごとの色（rs.kitchen[key] に保存。キッチン本体と一緒に作り直す）
const KOPTS = [['hood', 'レンジフード', RHOOD], ['sink', 'シンク', KSINK], ['handle', '取っ手', KHANDLE]];
const optMat = o => std({ color: o.hex, roughness: o.rough, metalness: o.metal });
const KDOOR_ALIAS = { white: 's-silk', natural: 'n-oak', walnut: 'n-walnut', black: 'q-dark', gray: 'z-mortar' }; // 旧来の色指定からの置き換え
const kdoorOf = id => colorOf(KDOORS, KDOOR_ALIAS[id] || id);
// 色見本の画像を、面の実寸（w×h m）に合わせて貼る（継ぎ目が目立たないよう反転しながら繰り返す）
const SWATCH_IMG = {};
let onTexLoad = () => {};
function swatchMat(o, w, h, rough) {
  const m = std({ color: o.hex, roughness: rough });
  if (!o.img) return m;
  (SWATCH_IMG[o.img] || (SWATCH_IMG[o.img] = new Promise((ok, ng) => { const im = new Image(); im.onload = () => ok(im); im.onerror = ng; im.src = o.img; }))).then(im => {
    const t = new THREE.Texture(im); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.anisotropy = 8;
    t.repeat.set(w / (im.width * o.mpp), h / (im.height * o.mpp)); t.needsUpdate = true;
    m.map = t; if (o.tint) m.color.setRGB(...o.tint, THREE.SRGBColorSpace); else m.color.set('#ffffff'); m.needsUpdate = true; onTexLoad();
  }).catch(() => {});
  return m;
}
// 箱の UV を m 単位に（テクスチャの repeat を 1/実寸 にできる）
function meterUV(geo, w, h) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h); uv.needsUpdate = true; }
const DOOR_TEX = {};
function doorTex(d) {
  return DOOR_TEX[d.id] || (DOOR_TEX[d.id] = new Promise((ok, ng) => { const im = new Image(); im.onload = () => ok(im); im.onerror = ng; im.src = d.img; }).then(im => {
    const t = new THREE.Texture(im); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.anisotropy = 8;
    const mw = 0.36, mh = d.stone ? mw * im.height / im.width : 1.0; // 木目は縦に伸ばして、反転の繰り返しを目立たなくする
    t.repeat.set(1 / mw, 1 / mh); t.needsUpdate = true; return t;
  }));
}
// 冷蔵庫 Panasonic NR-E45RY3（450L・5ドア）の本体色。色は商品ページの画像から
const FRIDGE = [['S', 'シルバー', '#b4b1ae', 0.3, 0.32], ['C', 'マットライトベージュ', '#d9d4cf', 0, 0.75]]
  .map(([id, name, hex, metal, rough]) => ({ id, name: `${name}（NR-E45RY3-${id}）`, short: name, hex, metal, rough }));
let SILVER_GRAD = null; // シルバーは上が明るく下が暗いヘアライン風のグラデーション
function silverGrad() {
  if (SILVER_GRAD) return SILVER_GRAD;
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#e2e0dd'); gr.addColorStop(0.5, '#c2bfbc'); gr.addColorStop(1, '#8f8c89'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  SILVER_GRAD = new THREE.CanvasTexture(c); SILVER_GRAD.colorSpace = THREE.SRGBColorSpace; return SILVER_GRAD;
}
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
  counter: { g: 'f', name: 'カウンターテーブル', w: 1.82, d: 0.45, h: 0.7, colors: WOODC, def: 'natural' },
  chair: { g: 'f', name: '椅子', w: 0.42, d: 0.45, h: 0.86, colors: WOODC, def: 'natural' },
  bedS: { g: 'f', name: 'ベッド シングル', w: 0.97, d: 1.95, h: 0.75, colors: FABRIC, def: 'ivory' },
  bedSD: { g: 'f', name: 'ベッド セミダブル', w: 1.2, d: 1.95, h: 0.75, colors: FABRIC, def: 'ivory' },
  bedD: { g: 'f', name: 'ベッド ダブル', w: 1.4, d: 1.95, h: 0.75, colors: FABRIC, def: 'ivory' },
  desk: { g: 'f', name: 'デスク＋チェア', w: 1.2, d: 0.9, h: 0.75, colors: WOODC, def: 'natural' },
  shelf: { g: 'f', name: '本棚', w: 0.8, d: 0.3, h: 1.8, colors: WOODC, def: 'white' },
  wardrobe: { g: 'f', name: 'ワードローブ', w: 0.9, d: 0.6, h: 1.8, colors: WOODC, def: 'white' },
  chest: { g: 'f', name: 'チェスト', w: 0.8, d: 0.45, h: 0.9, colors: WOODC, def: 'natural' },
  rug: { g: 'f', name: 'ラグ', w: 2.0, d: 1.4, h: 0.012, colors: FABRIC, def: 'beige' },
  piano: { g: 'f', name: '電子ピアノ', w: 1.45, d: 0.55, h: 1.0, colors: WOODC, def: 'walnut' },
  plant: { g: 'f', name: '観葉植物', w: 0.45, d: 0.45, h: 1.3 },
  downlight: { g: 'l', name: 'ダウンライト', w: 0.1, lm: 4.5 },
  ceiling: { g: 'l', name: 'シーリングライト', w: 0.55, lm: 16 },
  pendant: { g: 'l', name: 'ペンダントライト', w: 0.3, lm: 7 },
  outlet: { g: 'e', name: 'コンセント（2口）', h0: 0.25 },
  switch: { g: 'e', name: 'スイッチ', h0: 1.2 },
  tv: { g: 'e', name: 'TV端子＋コンセント', h0: 0.25 },
  lan: { g: 'e', name: 'LAN（情報コンセント）', h0: 0.25 },
  aircon: { g: 'e', name: 'エアコン', h0: CH - 0.07 - 0.29, fixedH: true },
  island: { g: 'k', name: 'キッチン（スリムフラット）', w: 2.58, d: 0.9, h: 0.85, kit: true },
  backcounter: { g: 'k', name: 'カップボード', w: 1.8, d: 0.45, h: 2.35, kit: true },
  fridge: { g: 'k', name: '冷蔵庫（Panasonic NR-E45RY3）', w: 0.6, d: 0.648, h: 1.85, colors: FRIDGE, def: 'S' },
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
    items: [F('tvboard', 1.52, 0.23), F('rug', 1.52, 1.5), F('sofa3', 1.51, 2.58, 180), F('dining4', 3.82, 2.16, 0), F('counter', 2.73, 4.175, 180), F('chair', 2.73, 3.78, 180),
      L('ceiling', 1.52, 1.6), L('pendant', 3.82, 2.16), L('downlight', 5.0, 1.2), L('downlight', 6.6, 1.2), L('downlight', 5.0, 2.85), L('downlight', 6.6, 2.85), L('downlight', 2.6, 3.7),
      E('aircon', 9, 3.22, null), E('tv', 0, 1.52, 0.25), E('lan', 0, 3.43, 0.25), E('outlet', 0, 3.27, 0.25), E('outlet', 9, 2.98, 0.25),
      E('outlet', 6, 1.67, 0.25), E('outlet', 5, 0.69, 0.25),
      E('outlet', 0, 4.28, 1.9), E('outlet', 0, 4.79, 1.1), E('outlet', 0, 5.3, 1.1), E('outlet', 0, 5.76, 1.1),
      E('switch', 4, 2.55, 1.2), E('switch', 3, 1.1, 1.2)] },
  r1: { wall: 'white', floor: 'oak', ceiling: 'white', door: 'white', accent: { wall: 0, color: 'bluegray', on: false }, lightCol: 'warm',
    items: [F('bedS', 9.47, 1.08, 0), F('piano', 9.17, 4.08, 180),
      L('ceiling', 8.65, 2.2), E('aircon', 0, 2.2, null), E('outlet', 0, 2.43, 1.9), E('tv', 2, 2.12, 0.25), E('switch', 3, 1.5, 1.2)] },
  r3a: { wall: 'white', floor: 'oak', ceiling: 'white', door: 'white', accent: { wall: 1, color: 'sage', on: false }, lightCol: 'warm',
    items: [F('bedS', 0.53, 3.12, 0), F('desk', 3.15, 1.7, 270),
      L('ceiling', 2.3, 2.0), E('aircon', 0, 2.22, null), E('outlet', 1, 1.43, 0.25), E('tv', 1, 1.91, 0.25), E('lan', 1, 2.05, 0.25), E('outlet', 4, 0.47, 0.25),
      E('switch', 1, 2.55, 1.2)] },
  r3b: { wall: 'white', floor: 'oak', ceiling: 'white', door: 'white', accent: { wall: 0, color: 'beige', on: false }, lightCol: 'warm',
    items: [F('bedS', 6.74, 1.4, 0), F('desk', 5.49, 2.09, 180),
      L('ceiling', 5.7, 1.3), E('aircon', 0, 2.27, null), E('outlet', 1, 0.45, 0.25), E('tv', 2, 0.32, 0.25), E('switch', 2, 2.65, 1.2)] },
  r3c: { wall: 'white', floor: 'oak', ceiling: 'white', door: 'white', accent: { wall: 1, color: 'greige', on: false }, lightCol: 'warm',
    items: [F('bedS', 9.47, 1.1, 0), F('desk', 7.85, 0.5, 0),
      L('ceiling', 8.65, 1.82), E('aircon', 1, 0.5, null), E('tv', 0, 1.41, 0.25), E('outlet', 3, 2.15, 0.25), E('switch', 3, 1.1, 1.2)] },
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

// 実物の床材：写真1枚から、乱尺ではなく 1/2・1/4 ずらしの張り方で4列分のタイルを作る（UVは m 単位）
const FLOOR_TEX = {};
function floorTex(f) {
  return FLOOR_TEX[f.id] || (FLOOR_TEX[f.id] = new Promise((ok, ng) => { const im = new Image(); im.onload = () => ok(im); im.onerror = ng; im.src = f.img; }).then(im => {
    const sl = f.sl || im.width / im.height * f.pw;   // 写真の長さ（m）
    const ppm = Math.min(640, im.height / f.pw);      // 1m あたりの画素数
    const rows = 4, W = Math.round(f.pl * ppm), rh = Math.round(f.pw * ppm), c = mkC(W, rh * rows), g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    const segW = sl * ppm, shift = [0, 0.5, 0.25, 0.75];
    for (let r = 0; r < rows; r++) {
      const x0 = -shift[r] * W;
      for (let p = 0; p < 2; p++) {                    // 1列にタイル幅2枚分（はみ出しはラップ）
        const px = x0 + p * W, flip = (r + p) % 2 === 1;
        g.save(); g.beginPath(); g.rect(px, r * rh, W, rh); g.clip();
        // 写真が1枚より短いときは、反転を交えて継ぎ足す
        for (let s = 0, k = 0; s < W; s += segW, k++) {
          const mirror = flip !== (k % 2 === 1);
          g.save(); g.translate(px + s + (mirror ? segW : 0), r * rh); g.scale(mirror ? -1 : 1, (r % 2) ? -1 : 1);
          g.drawImage(im, 0, (r % 2) ? -rh : 0, segW, rh); g.restore();
        }
        g.restore();
        g.fillStyle = 'rgba(30,20,10,.32)'; g.fillRect(Math.round(px) - 1, r * rh, 2, rh); // 継ぎ目（短辺）
      }
      g.fillStyle = 'rgba(30,20,10,.28)'; g.fillRect(0, r * rh, W, 1.5);                  // 継ぎ目（長辺）
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    t.repeat.set(1 / f.pl, 1 / (f.pw * rows));
    return t;
  }));
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
// キッチン：トクラス コラージア スリムフラットW の形。作業側は -z、+x 端（東）がコンロ側で、そこに床から天井までのキッチンパネルと
// パネルに付くサイドフードを置く。+x 端から コンロ下（グリル＋引き出し2段）75cm／食洗機45cm／シンク下（引き出し3段）90cm／残りは引き出し3段
function kitchenModel(g, c, it) {
  const kd = kdoorOf(it.color), kt = colorOf(KTOPS, it.top), r = kd.gloss ? 0.18 : 0.55, seam = MAT.black;
  const tt = 0.02, bh = c.h - tt, pt = 0.02, x1 = c.w / 2 - pt, fz = -c.d / 2 - 0.003; // 薄い天板（2cm）、パネル厚2cm
  const kick = std({ color: '#3a3a3a', roughness: 0.7 }), panel = std({ color: '#f4f4f1', roughness: 0.25 });
  const hood = optMat(colorOf(RHOOD, it.hood)), handle = optMat(colorOf(KHANDLE, it.handle)), sk = colorOf(KSINK, it.sink);
  const bw = c.w - pt, bx = -pt / 2; // 本体（パネルの分だけ短い）
  box(g, bw - 0.01, 0.08, c.d - 0.07, bx, 0.04, 0.03, kick); // 台輪：作業側だけ下がっている
  box(g, bw, bh - 0.08, c.d, bx, 0.08 + (bh - 0.08) / 2, 0, swatchMat(kd, bw, bh - 0.08, r));
  box(g, bw + 0.005, tt, c.d + 0.01, bx, bh + tt / 2, 0, swatchMat(kt, c.w, c.d, 0.35));
  box(g, pt, CH - 0.002, c.d + 0.01, x1 + pt / 2, CH / 2, 0, panel); // キッチンパネル（床から天井まで）
  // 前板の割り付け（+x 端から）
  const xa = x1 - 0.75, xb = xa - 0.45, xc = xb - 0.9, x0 = -c.w / 2, top = bh - 0.01;
  const vline = x => box(g, 0.004, bh - 0.1, 0.01, x, 0.09 + (bh - 0.1) / 2, fz, seam, false);
  const hline = (l, r2, y) => box(g, r2 - l - 0.006, 0.004, 0.01, (l + r2) / 2, y, fz, seam, false);
  const bar = (l, r2, y) => box(g, r2 - l - 0.08, 0.012, 0.02, (l + r2) / 2, y, fz - 0.01, handle, false); // ロングバー取手
  [xa, xb, xc].forEach(vline);
  // コンロ下：上にグリル・操作部、引き出し2段
  box(g, 0.74, 0.13, 0.012, (xa + x1) / 2, top - 0.075, fz - 0.003, MAT.steel, false);
  box(g, 0.34, 0.07, 0.006, xa + 0.22, top - 0.075, fz - 0.01, MAT.screen, false);
  hline(xa, x1, top - 0.15); hline(xa, x1, 0.39);
  bar(xa, x1, top - 0.18); bar(xa, x1, 0.36);
  // 食洗機：1枚扉＋上部の操作部
  box(g, 0.44, 0.04, 0.012, (xb + xa) / 2, top - 0.02, fz - 0.003, MAT.steel, false);
  // シンク下・残りの列：引き出し3段
  for (const [l, r2] of [[xc, xb], [x0, xc]]) { hline(l, r2, 0.33); hline(l, r2, 0.58); for (const y of [top - 0.03, 0.55, 0.3]) bar(l, r2, y); }
  // コンロ（3口）・シンク・水栓
  const cx = (xa + x1) / 2, sx = (xc + xb) / 2;
  box(g, 0.6, 0.008, 0.5, cx, c.h + 0.004, -0.1, MAT.screen);
  for (const [dx, dz] of [[-0.17, -0.12], [0.17, -0.12], [0, 0.1]]) cyl(g, 0.06, 0.06, 0.01, cx + dx, c.h + 0.01, -0.1 + dz, MAT.black);
  // シンク：縁＋一段暗い内側で深さを出す
  box(g, 0.75, 0.006, 0.45, sx, c.h + 0.001, -0.08, optMat(sk));
  box(g, 0.69, 0.004, 0.39, sx, c.h + 0.005, -0.08, std({ color: new THREE.Color(sk.hex).multiplyScalar(0.9), roughness: 0.35 }), false);
  cyl(g, 0.012, 0.012, 0.3, sx, c.h + 0.15, 0.2, MAT.metal); box(g, 0.02, 0.02, 0.2, sx, c.h + 0.29, 0.11, MAT.metal);
  // オイルガード（コンロのダイニング側の縁に立つガラス）
  box(g, 0.7, 0.26, 0.008, x1 - 0.36, c.h + 0.13, c.d / 2 - 0.03, std({ color: '#dfeeee', roughness: 0.05, transparent: true, opacity: 0.25 }), false);
  // サイドフード SHVR：パネルに付く薄い整流板＋天井までの四角い幕板
  const hy = 1.65, hz = -0.12;
  box(g, 0.9, 0.025, 0.6, x1 - 0.45, hy + 0.0125, hz, hood);
  box(g, 0.36, CH - hy - 0.025, 0.3, x1 - 0.24, (CH + hy + 0.025) / 2, hz - 0.06, hood);
}
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
    case 'tvboard': box(g, c.w, 0.42, c.d, 0, 0.21, 0, main);
      box(g, 1.23, 0.71, 0.04, 0, 0.42 + 0.06 + 0.355, -0.05, MAT.screen);
      box(g, 0.42, 0.012, 0.24, 0, 0.426, -0.03, MAT.black); box(g, 0.1, 0.07, 0.03, 0, 0.465, -0.05, MAT.black); break; // 55型相当の画面＋中央スタンド（台座 幅42×奥行24cm）
    case 'dining4': case 'dining2': {
      const tw = it.type === 'dining4' ? 1.4 : 0.8, td = 0.8;
      box(g, tw, 0.04, td, 0, 0.7, 0, main); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.05, 0.68, 0.05, sx * (tw / 2 - 0.07), 0.34, sz * (td / 2 - 0.07), main);
      const seats = it.type === 'dining4' ? [-0.35, 0.35] : [0];
      for (const sx of seats) for (const sz of [-1, 1]) {
        const ch = new THREE.Group(); ch.position.set(sx, 0, sz * 0.52); ch.rotation.y = sz < 0 ? Math.PI : 0; g.add(ch); // 背もたれ（ローカル +z）がテーブルの外側に来る向き
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
    case 'counter': // 天板＋四隅の脚の普通のテーブル（幕板付き）
      box(g, c.w, 0.03, c.d, 0, c.h - 0.015, 0, main);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.04, c.h - 0.03, 0.04, sx * (c.w / 2 - 0.04), (c.h - 0.03) / 2, sz * (c.d / 2 - 0.04), main);
      for (const sz of [-1, 1]) box(g, c.w - 0.12, 0.06, 0.018, 0, c.h - 0.06, sz * (c.d / 2 - 0.04), main, false);
      for (const sx of [-1, 1]) box(g, 0.018, 0.06, c.d - 0.12, sx * (c.w / 2 - 0.04), c.h - 0.06, 0, main, false);
      break;
    case 'chair': // 前（座る人の向き）が -z、背もたれが +z
      box(g, 0.42, 0.04, 0.42, 0, 0.43, 0, main); box(g, 0.42, 0.4, 0.03, 0, 0.66, 0.2, main);
      for (const a of [-1, 1]) for (const b of [-1, 1]) box(g, 0.03, 0.43, 0.03, a * 0.18, 0.215, b * 0.18, main);
      break;
    case 'piano': {
      box(g, c.w, 0.12, c.d, 0, 0.74, 0, main); // 本体
      for (const sx of [-1, 1]) box(g, 0.04, 0.68, c.d, sx * (c.w / 2 - 0.02), 0.34, 0, main); // 側板
      box(g, c.w - 0.08, 0.5, 0.02, 0, 0.4, -c.d / 2 + 0.02, main); // 背板
      box(g, c.w - 0.14, 0.02, 0.16, 0, 0.81, c.d / 2 - 0.1, std({ color: '#f6f5f0', roughness: 0.4 })); // 鍵盤
      box(g, c.w, 0.2, 0.06, 0, 0.92, -c.d / 2 + 0.03, main); // 譜面台
      break; }
    case 'rug': { const m = box(g, c.w, 0.012, c.d, 0, 0.006, 0, main, false); m.receiveShadow = true; break; }
    case 'plant': cyl(g, 0.17, 0.13, 0.32, 0, 0.16, 0, MAT.pot); { const r = rng(9); for (let k = 0; k < 9; k++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16 + r() * 0.08, 0), MAT.leaf); m.position.set((r() - 0.5) * 0.3, 0.6 + r() * 0.65, (r() - 0.5) * 0.3); m.castShadow = true; g.add(m); } } break;
    case 'island': kitchenModel(g, c, it); break;
    case 'backcounter': {
      // ハイカウンタータイプ用キャビネット（H1025・D450）：西に4段引出し W900、東に家電送風機オープンタイプ W900。
      // 上にウォールキャビネット（W900 の両開き×2、H600・D450、天井から5cm下）。カウンターとの間から北の小窓が見える
      const kd = kdoorOf(it.color), kt = colorOf(CB_TOPS, it.top), r = kd.gloss ? 0.18 : 0.55, seam = MAT.black;
      const handle = optMat(colorOf(KHANDLE, it.cbHandle || it.handle)), gray = std({ color: '#9a9b9b', roughness: 0.6 }), kick = std({ color: '#3a3a3a', roughness: 0.7 });
      const tt = 0.03, bh = 1.025 - tt, kh = 0.07, fz = c.d / 2 + 0.003, bk = -c.d / 2;
      const hline = (l, r2, y, z = fz) => box(g, r2 - l - 0.006, 0.004, 0.01, (l + r2) / 2, y, z, seam, false);
      const vline = (x, y0, y1, z = fz) => box(g, 0.004, y1 - y0, 0.01, x, (y0 + y1) / 2, z, seam, false);
      const hbar = (l, r2, y) => box(g, r2 - l - 0.12, 0.012, 0.02, (l + r2) / 2, y, fz + 0.01, handle, false);
      box(g, c.w - 0.01, kh, c.d - 0.06, 0, kh / 2, -0.03, kick); // 台輪
      // 4段引出し（x -0.9〜0）：下から 大引出し・3段
      box(g, 0.9, bh - kh, c.d, -0.45, kh + (bh - kh) / 2, 0, swatchMat(kd, 0.9, bh - kh, r));
      const ys = [kh, kh + 0.37, kh + 0.56, kh + 0.74, bh];
      for (let k = 1; k < 4; k++) hline(-0.9, 0, ys[k]);
      for (let k = 0; k < 4; k++) hbar(-0.9, 0, ys[k + 1] - 0.04);
      // 家電送風機オープンタイプ（x 0〜0.9）：側板・背板、スライド棚、下にダストボックスワゴン
      vline(0, kh, bh);
      box(g, 0.02, bh - kh, c.d, 0.89, kh + (bh - kh) / 2, 0, swatchMat(kd, c.d, bh - kh, r));
      box(g, 0.87, bh - kh, 0.01, 0.445, kh + (bh - kh) / 2, bk + 0.005, gray, false);
      box(g, 0.87, 0.02, c.d - 0.01, 0.445, bh - 0.01, 0.005, gray, false);
      box(g, 0.86, 0.38, c.d - 0.03, 0.445, kh + 0.19, 0.015, swatchMat(kd, 0.86, 0.38, r)); // ワゴン
      hbar(0, 0.9, kh + 0.34);
      box(g, 0.86, 0.025, c.d - 0.06, 0.445, 0.5, 0, gray); // スライド棚
      // 天板（間口いっぱい）
      box(g, c.w + 0.005, tt, c.d + 0.01, 0, bh + tt / 2, 0.005, swatchMat(kt, c.w, c.d, 0.35));
      // ウォールキャビネット：扉の取っ手は両開きの合わせ目の下の方
      const wh = 0.6, wd = 0.45, wy = CH - 0.05 - wh / 2, wz = bk + wd + 0.003;
      box(g, c.w, wh, wd, 0, wy, bk + wd / 2, swatchMat(kd, c.w, wh, r));
      for (const x of [-0.45, 0, 0.45]) vline(x, wy - wh / 2 + 0.01, wy + wh / 2 - 0.01, wz);
      for (const x of [-0.45, 0.45]) for (const sx of [-1, 1]) box(g, 0.012, 0.2, 0.02, x + sx * 0.04, wy - wh / 2 + 0.16, wz + 0.01, handle, false);
      break; }
    case 'fridge': { // NR-E45RY3：上から 冷蔵室（1枚扉）／小さい引き出し2つ（左右）／引き出し2段
      const f = colorOf(FRIDGE, it.color), silver = f.id === 'S';
      const m = std({ color: silver ? '#ffffff' : f.hex, map: silver ? silverGrad() : null, roughness: f.rough, metalness: f.metal });
      const seam = std({ color: silver ? '#4a4846' : '#9a948d', roughness: 0.8 }), fz = c.d / 2 + 0.002;
      box(g, c.w, c.h - 0.03, c.d, 0, 0.03 + (c.h - 0.03) / 2, 0, m);
      box(g, c.w - 0.04, 0.03, c.d - 0.06, 0, 0.015, -0.02, std({ color: '#2b2b2b', roughness: 0.8 })); // 下部（脚・吹き出し）
      for (const y of [0.96, 0.76, 0.39]) box(g, c.w - 0.002, 0.006, 0.006, 0, y, fz, seam, false);
      box(g, 0.006, 0.2, 0.006, 0, 0.86, fz, seam, false);
      box(g, 0.006, 0.8, 0.008, c.w / 2 - 0.004, 1.38, fz, seam, false); // 冷蔵室扉の取っ手部（側面の手掛け）
      break; }
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
const SIDES = ['A', 'B'];
export function createInterior(root, { onPlan } = {}) {
  let state;
  try { state = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { state = null; }
  if (!state || !state.rooms) state = { room: 'ldk', tab: 'wall', night: false, rooms: {}, migr: 4 }; // 新しい状態は今の初期配置のまま（下の移行は古い保存データだけ）
  for (const r of ROOMS) if (!state.rooms[r.id]) state.rooms[r.id] = structuredClone(DEFAULT_ROOMS[r.id]);
  // 旧配置からの移行（1回だけ）：LDK のソファ・ローテーブルを前に出して後ろに通路を確保し、ラグは外す
  if (!(state.migr >= 1)) {
    const it = state.rooms.ldk.items, at = (o, t, x, z) => o.type === t && Math.abs(o.x - x) < 1e-6 && Math.abs(o.z - z) < 1e-6;
    for (const o of it) { if (at(o, 'sofa3', 1.3, 3.2)) o.z = 2.85; else if (at(o, 'lowtable', 1.3, 2.05)) o.z = 1.85; }
    state.rooms.ldk.items = it.filter(o => !at(o, 'rug', 1.3, 2.05));
    state.migr = 1;
  }
  // 南側の収納の横（奥行45cm・幅1.82mの凹み）にカウンターテーブルと椅子を追加（1回だけ）
  if (!(state.migr >= 2)) {
    const it = state.rooms.ldk.items;
    if (!it.some(o => o.type === 'counter')) it.push({ type: 'counter', x: 2.73, z: 4.175, rot: 180 }, { type: 'chair', x: 2.73, z: 3.78, rot: 180 });
    state.migr = 2;
  }
  // プランA（rooms）とプランB（roomsB）。B がまだなければ今の内容（A）をコピーして始める
  if (!state.roomsB) state.roomsB = structuredClone(state.rooms);
  for (const r of ROOMS) if (!state.roomsB[r.id]) state.roomsB[r.id] = structuredClone(DEFAULT_ROOMS[r.id]);
  // 2026.11.10 の図面に合わせて、家具・照明・コンセント・エアコンを図面の配置に置き換える（1回だけ。色の選択は残す）
  if (!(state.migr >= 3)) {
    for (const rooms of [state.rooms, state.roomsB]) for (const r of ROOMS) rooms[r.id].items = structuredClone(DEFAULT_ROOMS[r.id].items);
    state.migr = 3;
  }
  // 図面の配置に置き換えたときに消えた、南側の収納の横のカウンターテーブルと椅子を戻す（1回だけ）
  if (!(state.migr >= 4)) {
    for (const rooms of [state.rooms, state.roomsB]) { const it = rooms.ldk.items; if (!it.some(o => o.type === 'counter')) it.push({ type: 'counter', x: 2.73, z: 4.175, rot: 180 }, { type: 'chair', x: 2.73, z: 3.78, rot: 180 }); }
    state.migr = 4;
  }
  if (state.mode !== 'compare') state.mode = 'single';
  if (state.edit !== 'B') state.edit = 'A';
  if (typeof state.sync !== 'boolean') state.sync = true;
  const roomsOf = s => s === 'B' ? state.roomsB : state.rooms;
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignore */ } };

  const viewHTML = s => `<div class="in-view" data-side="${s}"><div class="in-legend"></div></div>`;
  root.innerHTML = `
  <section class="in-stage-wrap">
    <div class="toolbar">
      <span class="lbl">部屋</span>
      <select id="inRoom" class="in-select" aria-label="部屋を選ぶ">${ROOMS.map(r => `<option value="${r.id}">${r.floor} ${r.name}（${r.size}）</option>`).join('')}</select>
      <div class="views" id="inViews">
        <button type="button" data-v="persp">俯瞰</button><button type="button" data-v="top">真上（図面）</button><button type="button" data-v="eye">入口から</button><button type="button" data-v="eye2">奥から</button>
      </div>
      <div class="seg" id="inEditSeg" aria-label="家具・器具の配置"><button type="button" data-ed="0" aria-pressed="true">配置を固定</button><button type="button" data-ed="1" aria-pressed="false">編集モード</button></div>
      <div class="seg" id="inTime"><button type="button" data-t="day" aria-pressed="true">昼</button><button type="button" data-t="night" aria-pressed="false">夜</button></div>
      <label class="check" id="inDayLitWrap" title="昼の画面でも照明を点けて、照明の色（電球色・温白色・昼白色）の違いを見る"><input type="checkbox" id="inDayLit"> 昼も照明を点ける</label>
      <label class="in-bright" title="画面の明るさ（標準 90%）">明るさ <input type="range" id="inBright" min="60" max="130" step="5" aria-label="明るさ"><output id="inBrightV"></output></label>
      <label class="check" id="inSyncWrap"><input type="checkbox" id="inSync"> 2画面の視点を連動</label>
    </div>
    <div class="in-stage" id="inStage">${SIDES.map(viewHTML).join('')}<div class="in-hint" id="inHint"></div></div>
  </section>
  <aside class="panel in-panel" aria-label="内装の設定">
    <div class="edit-target show" id="inEdit">
      <span class="lbl">編集中</span>
      <button type="button" class="tab" data-pedit="A" style="--c:var(--plan-a)"><i></i>プランA</button>
      <button type="button" class="tab" data-pedit="B" style="--c:var(--plan-b)"><i></i>プランB</button>
      <button type="button" class="btn small" id="inCopy"></button>
    </div>
    <div class="in-tabs" role="tablist" id="inTabs">
      <button type="button" data-tab="wall">壁紙・床</button><button type="button" data-tab="f">家具</button><button type="button" data-tab="l">照明</button><button type="button" data-tab="e">電気・エアコン</button>
    </div>
    <div class="in-sel" id="inSel" hidden></div>
    <div id="inBody"></div>
  </aside>`;
  const $ = s => root.querySelector(s);
  const stageEl = $('#inStage');

  let room, ed; // 表示中の部屋（A・B共通）
  let editing = false; // 家具・器具の移動・追加・削除は編集モードのときだけ（色はいつでも変えられる）
  let pickingAccent = false, view = 'persp', syncing = false;
  const views = {};
  const V = () => views[state.edit]; // 編集中のプランの画面
  onTexLoad = () => { for (const s of SIDES) if (views[s]) views[s].dirty = true; };

  // ---- three（プランごとに1画面） ----
  function makeView(side) {
    const el = root.querySelector(`.in-view[data-side="${side}"]`), legEl = el.querySelector('.in-legend');
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.prepend(renderer.domElement);
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, 1, 0.05, 200);
    const controls = new OrbitControls(cam, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.1; controls.maxPolarAngle = Math.PI * 0.499;
    const hemi = new THREE.HemisphereLight('#ffffff', '#ece6dd', 0.9), sun = new THREE.DirectionalLight('#fff3e2', 0.5), amb = new THREE.AmbientLight('#ffffff', 2.4);
    sun.position.set(0.6, 10, 1.2); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 30 });
    sun.shadow.bias = -0.0005; scene.add(hemi, sun, sun.target, amb);
    const roomG = new THREE.Group(); scene.add(roomG);
    let rs, wallMeshes = [], floorMesh, itemObjs = [], lightObjs = [], selected = null;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), std({ color: '#d7d5d0', roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.03; ground.receiveShadow = true; scene.add(ground);
    const mats = { wall: std({ roughness: 0.92 }), accent: std({ roughness: 0.92 }), floor: std({ roughness: 0.55 }), ceiling: std({ roughness: 0.95, side: THREE.BackSide }), door: std({ roughness: 0.55 }), dframe: std({ roughness: 0.5 }), knob: std({}),
      glass: std({ color: '#cfe3f2', emissive: '#bcd9f0', emissiveIntensity: 0.7, roughness: 0.1 }), frame: std({ color: '#f4f4f2', roughness: 0.45 }) /* 窓枠（室内側）は白。外観のサッシ色とは連動しない */, base: std({ color: '#ffffff', roughness: 0.6 }) };
    const selBox = new THREE.BoxHelper(new THREE.Object3D(), '#ff7a1a'); selBox.visible = false; scene.add(selBox);
    const v = { side, el, renderer, cam, controls, dirty: true };
    controls.addEventListener('change', () => { v.dirty = true; cull(); if (!syncing) syncFrom(v); });

    function applySurface(mat, list, id, defTex) {
      const c = colorOf(list, id), k = c.tex || defTex;
      mat.map = tex(k === 'plank' && list === WALLPAPER ? 'wood' : k); mat.color.set(c.hex); mat.needsUpdate = true;
    }
    function buildRoom() {
      rs = roomsOf(side)[room.id];
      roomG.clear(); wallMeshes = []; itemObjs = []; lightObjs = []; selected = null; selBox.visible = false;
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
        const holes = ops.filter(o => o.k !== 'closet').map(o => ({ u0: o.u0, u1: o.u1, y0: o.k === 'win' ? o.y0 : 0, y1: o.k === 'win' ? o.y1 : o.k === 'pass' ? CH : o.h || 2.0 }));
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
            if (o.panes === 2) box(g, 0.03, o.y1 - o.y0, 0.05, 0, (o.y0 + o.y1) / 2, -0.06 * sz, mats.frame, false);
            box(g, w + 0.06, 0.02, 0.1, 0, o.y0 - 0.01, 0.02 * sz, mats.base, false); // 窓台
          } else if (o.k === 'door' && o.slide) {
            // 廊下側（壁の外）に吊り下げた引き戸（アウトセット）。室内からは開口の奥に閉じた戸が見える
            const T = 0.12, pz = -(T + 0.02) * sz;
            for (const x of [-w / 2 - 0.01, w / 2 + 0.01]) box(g, 0.02, 2.0, T, x, 1.0, -T / 2 * sz, mats.dframe, false); // 開口の見込み（枠）
            box(g, w + 0.04, 0.02, T, 0, 2.01, -T / 2 * sz, mats.dframe, false);
            for (const x of [-w / 2 - 0.02, w / 2 + 0.02]) box(g, 0.04, 2.04, 0.012, x, 1.02, 0.006 * sz, mats.dframe, false);
            box(g, w + 0.08, 0.04, 0.012, 0, 2.02, 0.006 * sz, mats.dframe, false);
            const p = box(g, w + 0.1, 2.04, 0.035, 0, 1.02, pz, mats.door); meterUV(p.geometry, w + 0.1, 2.04); p.userData.kind = 'door';
            box(g, w * 2 + 0.2, 0.05, 0.05, -w / 2, 2.07, pz - 0.03 * sz, MAT.metal, false); // 上吊りレール（床にレールなし）
            box(g, 0.02, 0.32, 0.02, w / 2 - 0.07, 1.0, pz + 0.027 * sz, mats.knob, false); // 引手
          } else if (o.k === 'shelf') {
            // 扉のない収納：奥の壁・側面・天井と、可動棚（棚柱付き、見た目だけ）。rod は枕棚＋ハンガーパイプ、h は垂れ壁の下端
            const D = o.depth || 0.5, H = o.h || 2.0, zc = -D / 2 * sz, sh = std({ color: '#f1efe9', roughness: 0.6 });
            box(g, w, H, 0.01, 0, H / 2, -(D + 0.005) * sz, mats.wall, false);
            for (const x of [-w / 2 - 0.005, w / 2 + 0.005]) box(g, 0.01, H, D, x, H / 2, zc, mats.wall, false);
            box(g, w, 0.01, D, 0, H + 0.005, zc, mats.wall, false);
            const fl = box(g, w, 0.004, D, 0, 0.002, zc, mats.floor, false); meterUV(fl.geometry, w, D); fl.receiveShadow = true;
            if (o.rod) {
              box(g, w - 0.01, 0.02, 0.4, 0, 1.7, -(D - 0.2) * sz, sh);
              box(g, w - 0.02, 0.025, 0.025, 0, 1.62, -(D / 2) * sz, MAT.metal, false);
            } else {
              for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) box(g, 0.025, H - 0.1, 0.012, x, H / 2, -(D - 0.006) * sz, MAT.metal, false);
              for (const y of [0.45, 0.8, 1.15, 1.5, 1.85].filter(y => y < H - 0.1)) box(g, w - 0.01, 0.02, D - 0.04, 0, y, -(D / 2 + 0.02) * sz, sh);
            }
            for (const x of [-w / 2 - 0.02, w / 2 + 0.02]) box(g, 0.04, H + 0.04, 0.012, x, H / 2 + 0.02, 0.006 * sz, mats.dframe, false);
            box(g, w + 0.08, 0.04, 0.012, 0, H + 0.02, 0.006 * sz, mats.dframe, false);
          } else if (o.k === 'door' || o.k === 'closet') {
            const n = o.k === 'closet' ? Math.max(2, Math.round(w / 0.45)) : 1, pw = w / n;
            const dz = (o.k === 'door' ? -0.03 : 0.02) * sz, front = dz + 0.0175 * sz;
            for (let k = 0; k < n; k++) { const p = box(g, pw - 0.006, 2.0, 0.035, -w / 2 + pw * (k + 0.5), 1.0, dz, mats.door); meterUV(p.geometry, pw - 0.006, 2.0); p.userData.kind = 'door'; }
            // 枠（たて枠2本＋上枠。壁面から少し出す）
            const fz = (sz > 0 ? Math.max(front, 0) : Math.min(front, 0)) + 0.006 * sz;
            for (const x of [-w / 2 - 0.02, w / 2 + 0.02]) box(g, 0.04, 2.04, 0.012, x, 1.02, fz, mats.dframe, false);
            box(g, w + 0.08, 0.04, 0.012, 0, 2.02, fz, mats.dframe, false);
            if (o.k === 'door') { // レバーハンドル（座＋レバー）
              const hx = w / 2 - 0.07, hz = front + 0.006 * sz;
              cyl(g, 0.026, 0.026, 0.012, hx, 0.95, hz, mats.knob).rotation.x = Math.PI / 2;
              box(g, 0.018, 0.018, 0.03, hx, 0.95, hz + 0.015 * sz, mats.knob, false);
              box(g, 0.13, 0.018, 0.018, hx - 0.055, 0.95, hz + 0.03 * sz, mats.knob, false);
            } else for (let k = 0; k < n; k += 2) box(g, 0.012, 0.18, 0.02, -w / 2 + pw * (k + 1) - 0.04, 1.0, front + 0.01 * sz, mats.knob, false);
          } else if (o.k === 'pass') {
            const st = new THREE.Mesh(new THREE.PlaneGeometry(w, CH), std({ color: '#9a978f', roughness: 1 })); st.position.set(0, CH / 2, -0.9 * sz); if (sz < 0) st.rotation.y = Math.PI; g.add(st);
          }
        }
      }
      // 家具・器具
      for (const f of room.fixed || []) addObj({ ...f, fixed: true, color: rs.kitchen && rs.kitchen[f.type], top: rs.kitchenTop && rs.kitchenTop[f.type], ...Object.fromEntries(KOPTS.map(([k]) => [k, rs.kitchen && rs.kitchen[k]])), cbHandle: rs.kitchen && rs.kitchen.cbHandle });
      rs.items.forEach(it => addObj(it));
      applyMats(); applyTime(); renderCount(); cull();
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
    function addObj(it) {
      const c = CAT[it.type]; if (!c) return;
      const g = buildItem(it, rs.lightCol), wrap = new THREE.Group(); wrap.add(g); wrap.userData = { item: it };
      g.traverse(m => { if (m.isMesh) m.userData.pick = wrap; });
      if (c.g === 'e') { const p = wallPose(it); wrap.position.copy(p.pos); wrap.rotation.y = p.rot; }
      else if (c.g === 'l') { wrap.position.set(it.x, CH, it.z); const pl = new THREE.PointLight('#fff', 0, 0, 2); pl.position.set(0, it.type === 'pendant' ? -0.95 : -0.12, 0); pl.userData.lm = c.lm; wrap.add(pl); lightObjs.push(pl); }
      else { wrap.position.set(it.x, 0, it.z); wrap.rotation.y = (it.rot || 0) * Math.PI / 180; }
      roomG.add(wrap); itemObjs.push(wrap); v.dirty = true; return wrap;
    }
    function removeObj(wrap) {
      roomG.remove(wrap); itemObjs.splice(itemObjs.indexOf(wrap), 1);
      const pl = wrap.children.find(o => o.isLight); if (pl) lightObjs.splice(lightObjs.indexOf(pl), 1);
      if (selected === wrap) select(null); v.dirty = true;
    }
    // 色を変えた家具・器具を作り直す（選択中ならそのまま選択を引き継ぐ）
    function replaceObj(old, it) {
      const wasSel = selected === old, w = addObj(it); removeObj(old); applyTime(); if (wasSel) select(w); return w;
    }
    function applyMats() {
      applySurface(mats.wall, WALLPAPER, rs.wall, 'paper'); applySurface(mats.accent, WALLPAPER, rs.accent.color, 'paper'); applySurface(mats.ceiling, WALLPAPER, rs.ceiling, 'paper');
      applyFloor(); applyDoor();
      for (const w of wallMeshes) w.material = rs.accent.on && rs.accent.wall === w.userData.edge ? mats.accent : mats.wall;
      v.dirty = true;
    }
    // 室内ドア：色見本を読み込むまでは単色。枠とハンドルの色も
    function applyDoor() {
      const d = doorOf(rs.door), fr = colorOf(DFRAME, rs.doorFrame), kn = colorOf(DKNOB, rs.doorKnob);
      mats.dframe.color.set(fr.hex); mats.knob.color.set(kn.hex); mats.knob.metalness = kn.metal; mats.knob.roughness = kn.rough;
      mats.door.userData.want = d.id;
      if (mats.door.userData.have !== d.id) { mats.door.map = null; mats.door.color.set(d.hex); }
      mats.door.needsUpdate = true; mats.dframe.needsUpdate = true; mats.knob.needsUpdate = true; v.dirty = true;
      doorTex(d).then(t => { if (mats.door.userData.want !== d.id) return; mats.door.map = t; mats.door.color.set('#ffffff'); mats.door.userData.have = d.id; mats.door.needsUpdate = true; v.dirty = true; }).catch(() => {});
    }
    // 床：写真のある床材は読み込みが終わるまで色＋簡易木目で表示し、終わったら差し替える
    function applyFloor() {
      const f = colorOf(FLOORS, rs.floor); mats.floor.userData.want = f.id;
      if (!f.img) { applySurface(mats.floor, FLOORS, rs.floor, 'plank'); mats.floor.roughness = 0.55; return; }
      if (mats.floor.userData.have !== f.id) { mats.floor.map = tex('plank'); mats.floor.color.set(f.hex); mats.floor.needsUpdate = true; }
      floorTex(f).then(t => {
        if (mats.floor.userData.want !== f.id) return;
        mats.floor.map = t; mats.floor.color.set('#ffffff'); mats.floor.roughness = 0.6; mats.floor.userData.have = f.id; mats.floor.needsUpdate = true; v.dirty = true;
      }).catch(() => {});
    }
    function applyTime() {
      const n = state.night, lit = n || !!state.dayLights, lc = colorOf(LIGHTCOL, rs.lightCol);
      // 昼：three.js の物理ベースの光は強さ1で色の約1/π の明るさになるため、白い壁が白く見えるよう間接光（全方向から均等な光）を強めにし、床が明るく飛ばないよう上からの光は控えめにしている
      // 昼に照明を点けたときは、照明の分だけ全体が明るくなりすぎないよう間接光を少し弱め、照明も夜より控えめにする（色温度の違いは見えるようにする）
      hemi.intensity = n ? 0.04 : 0.9; sun.intensity = n ? 0 : 0.5; amb.intensity = n ? 0.03 : lit ? 1.7 : 2.4;
      scene.background = new THREE.Color(n ? '#1b1f26' : '#e9ecef'); ground.material.color.set(n ? '#2a2c30' : '#d7d5d0');
      mats.glass.emissive.set(n ? '#1d2735' : '#bcd9f0'); mats.glass.emissiveIntensity = n ? 0.6 : 0.7; mats.glass.color.set(n ? '#2c3646' : '#cfe3f2');
      for (const pl of lightObjs) { pl.intensity = n ? pl.userData.lm : lit ? pl.userData.lm * 0.7 : 0; pl.color.set(lc.hex); }
      for (const o of itemObjs) o.traverse(m => { if (m.userData.glow) { m.material.emissive.set(lc.hex); m.material.emissiveIntensity = lit ? 2.2 : 0.15; } });
      renderer.toneMappingExposure = (state.bright ?? 90) / 100; // 明るさ（昼・夜とも全体に効く）
      v.dirty = true;
    }
    function setView(vn) {
      const b = bbox(room.poly), [cx, cz] = centroid(room.poly), span = Math.max(b.x1 - b.x0, b.z1 - b.z0);
      const asp = Math.max(0.5, cam.aspect || 1);
      if (vn === 'top') { cam.fov = 40; cam.position.set((b.x0 + b.x1) / 2, span / asp * 1.6 + 3, (b.z0 + b.z1) / 2 + 0.001); controls.target.set((b.x0 + b.x1) / 2, 0, (b.z0 + b.z1) / 2); }
      else if (vn === 'eye' || vn === 'eye2') {
        const door = room.open.find(o => o.k === 'door'), dx = (door.a[0] + door.b[0]) / 2, dz = (door.a[1] + door.b[1]) / 2;
        const e = ed.find(e => onEdge(e, [dx, dz]) != null) || ed[0];
        if (vn === 'eye') { cam.fov = 65; cam.position.set(dx + e.n[0] * 0.35, 1.5, dz + e.n[1] * 0.35); controls.target.set(cx, 1.1, cz); }
        else { cam.fov = 65; const fx = cx + (cx - dx) * 0.7, fz = cz + (cz - dz) * 0.7; const px = pointInPoly(fx, fz, room.poly) ? fx : cx, pz = pointInPoly(fx, fz, room.poly) ? fz : cz; cam.position.set(px, 1.5, pz); controls.target.set(dx, 1.0, dz); }
      } else { cam.fov = 45; const d = span * 1.05 / Math.min(1, asp) + 1.2; cam.position.set(cx - d * 0.35, d * 0.85, cz + d * 0.75); controls.target.set(cx, 0.6, cz); }
      cam.updateProjectionMatrix(); syncing = true; controls.update(); syncing = false; v.dirty = true; cull();
    }
    function resize() { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); v.dirty = true; }
    new ResizeObserver(resize).observe(el);

    // ---- 選択・ドラッグ ----
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const setRay = e => { const r = renderer.domElement.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, cam); };
    const visibleWalls = () => wallMeshes.filter(w => { const n = new THREE.Vector3(...[w.geometry.attributes.normal.getX(0), 0, w.geometry.attributes.normal.getZ(0)]); const p = new THREE.Vector3().fromBufferAttribute(w.geometry.attributes.position, 0); return n.dot(cam.position.clone().sub(p)) > 0; });
    let drag = null;
    renderer.domElement.addEventListener('pointerdown', e => {
      if (state.edit !== side) setEdit(side); // 2画面では、触った側のプランを編集対象にする
      setRay(e);
      const hits = ray.intersectObjects([...itemObjs, ...visibleWalls(), floorMesh], true).filter(h => h.object.visible);
      const h = hits[0]; if (!h) return;
      const wrap = h.object.userData.pick;
      if (wrap) {
        select(wrap);
        if (editing && !wrap.userData.item.fixed) { drag = { wrap, moved: false, start: [e.clientX, e.clientY] }; controls.enabled = false; renderer.domElement.setPointerCapture(e.pointerId); }
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
      v.dirty = true; showSel();
    });
    const endDrag = () => { if (drag) { if (drag.moved) { save(); renderCount(); } drag = null; controls.enabled = true; } };
    renderer.domElement.addEventListener('pointerup', endDrag); renderer.domElement.addEventListener('pointercancel', endDrag);
    function select(wrap) { selected = wrap; selBox.visible = !!wrap; if (wrap) selBox.setFromObject(wrap); v.dirty = true; if (state.edit === side) showSel(); }
    function renderCount() {
      legEl.innerHTML = `<b><i class="in-pb">${side}</i>${room.floor} ${room.name}</b>（${room.size}）<span>${countText(rs)}</span>`;
    }
    function frame() {
      if (el.hidden) return; const m = controls.update();
      if (selected && drag) selBox.setFromObject(selected);
      if (v.dirty || m) { renderer.render(scene, cam); v.dirty = false; }
    }
    Object.defineProperties(v, { rs: { get: () => rs }, selected: { get: () => selected }, itemObjs: { get: () => itemObjs } }); // Object.assign だと getter が値になってしまう
    return Object.assign(v, {
      buildRoom, cull, addObj, removeObj, replaceObj, applyMats, applyDoor, applyTime, setView, resize, select, visibleWalls, endDrag, renderCount, frame,
      refreshSel() { if (selected) selBox.setFromObject(selected); v.dirty = true; },
      render() { renderer.render(scene, cam); return renderer.domElement; },
    });
  }
  // 2画面で視点を連動
  function syncFrom(v) {
    if (state.mode !== 'compare' || !state.sync) return;
    const o = views[v.side === 'A' ? 'B' : 'A']; if (!o) return;
    copyCam(v, o);
  }
  function copyCam(from, to) {
    syncing = true;
    to.cam.position.copy(from.cam.position); to.controls.target.copy(from.controls.target);
    if (to.cam.fov !== from.cam.fov) { to.cam.fov = from.cam.fov; to.cam.updateProjectionMatrix(); }
    to.controls.update(); to.dirty = true; to.cull(); syncing = false;
  }
  const countText = rs => { const n = t => rs.items.filter(it => it.type === t).length; return `コンセント ${n('outlet')}・TV ${n('tv')}・LAN ${n('lan')}・スイッチ ${n('switch')}・照明 ${n('downlight') + n('ceiling') + n('pendant')}・エアコン ${n('aircon')}`; };
  const renderCount = () => { for (const s of SIDES) views[s].renderCount(); };

  function buildRoom() {
    room = ROOMS.find(r => r.id === state.room) || ROOMS[0]; ed = edges(room);
    for (const s of SIDES) { views[s].buildRoom(); views[s].setView(view); }
    for (const b2 of root.querySelectorAll('#inViews button')) b2.setAttribute('aria-pressed', b2.dataset.v === view);
    showSel(); renderPanel();
  }
  function setView(vn) {
    view = vn; for (const s of SIDES) views[s].setView(vn);
    for (const b2 of root.querySelectorAll('#inViews button')) b2.setAttribute('aria-pressed', b2.dataset.v === vn);
  }
  // 1画面 A／1画面 B／2画面で比較
  function layout() {
    const cmp = state.mode === 'compare';
    for (const s of SIDES) { const el = views[s].el; el.hidden = !cmp && state.edit !== s; el.classList.toggle('cur', state.edit === s); }
    stageEl.classList.toggle('compare', cmp);
    $('#inSyncWrap').hidden = !cmp; $('#inSync').checked = state.sync;
    for (const b of root.querySelectorAll('[data-pedit]')) b.setAttribute('aria-pressed', b.dataset.pedit === state.edit);
    const other = state.edit === 'A' ? 'B' : 'A';
    $('#inCopy').textContent = `${state.edit} の内容を ${other} にコピー`;
    if (onPlan) onPlan(state.mode, state.edit);
    requestAnimationFrame(() => { for (const s of SIDES) views[s].resize(); });
  }
  function setPlan(mode, side) {
    const prev = state.edit;
    state.mode = mode === 'compare' ? 'compare' : 'single'; if (side === 'A' || side === 'B') state.edit = side;
    if (prev !== state.edit) views[prev].endDrag();
    if (state.mode === 'single' && prev !== state.edit) copyCam(views[prev], views[state.edit]); // 1画面で A↔B を切り替えても同じ視点で見比べる
    else if (state.mode === 'compare' && state.sync) copyCam(views[state.edit], views[state.edit === 'A' ? 'B' : 'A']);
    pickingAccent = false; save(); layout(); showSel(); renderPanel();
  }
  const setEdit = side => setPlan(state.mode, side);

  // ---- 選択中の家具・器具（編集中のプラン） ----
  function showSel() {
    const el = $('#inSel'), v = V(); if (!el || !v) return;
    const sel = v.selected;
    if (!sel) { el.hidden = true; return; }
    v.refreshSel();
    const it = sel.userData.item, c = CAT[it.type]; el.hidden = false;
    const colors = c.kit ? kitChips(it.type) : c.colors ? `<div class="colors">${c.colors.map(o => `<button type="button" class="chip" data-icol="${o.id}" aria-pressed="${(it.color || c.def) === o.id}" title="${o.name}" style="background:${o.hex}"></button>`).join('')}</div>` : '';
    let pos = '';
    if (c.g === 'e') pos = c.fixedH ? `壁の上部に設置（天井から7cm下）` : `床からの高さ <b>${Math.round((it.h ?? c.h0) * 100)}cm</b>
      ${editing ? `<span class="in-hset">${[25, 40, 110, 120].map(v => `<button type="button" class="btn small" data-h="${v / 100}">${v}cm</button>`).join('')}</span>` : ''}`;
    else if (c.g === 'f' || c.g === 'k') pos = `幅${Math.round(c.w * 100)}×奥行${Math.round(c.d * 100)}cm`;
    el.innerHTML = `<div class="in-sel-h"><b>${c.name}</b>${state.mode === 'compare' ? `<span class="tag">プラン${state.edit}</span>` : ''}${it.fixed ? '<span class="tag">固定</span>' : ''}<button type="button" class="btn small" data-act="close" aria-label="選択を解除">×</button></div>
      <div class="in-sel-p">${pos}</div>${colors}
      ${editing ? `<div class="in-sel-a">${c.g === 'f' ? '<button type="button" class="btn small" data-act="rot">90°回転</button>' : ''}${!it.fixed ? '<button type="button" class="btn small" data-act="dup">複製</button><button type="button" class="btn small danger" data-act="del">削除</button>' : ''}</div>`
        : !it.fixed ? '<p class="note">移動・回転・削除は「編集モード」で行えます。</p>' : ''}`;
  }
  $('#inSel').addEventListener('click', e => {
    const v = V(), sel = v.selected, rs = v.rs;
    const b = e.target.closest('button'); if (!b || !sel) return; const it = sel.userData.item;
    if (b.dataset.kt) return setKitchen(b.dataset.kt, b.dataset.kp, b.dataset.kc);
    if (b.dataset.act === 'close') return v.select(null);
    if (!editing && (b.dataset.act || b.dataset.h)) return;
    if (b.dataset.act === 'rot') { it.rot = ((it.rot || 0) + 90) % 360; sel.rotation.y = it.rot * Math.PI / 180; }
    if (b.dataset.act === 'del') { rs.items.splice(rs.items.indexOf(it), 1); v.removeObj(sel); }
    if (b.dataset.act === 'dup') { const n = structuredClone(it); if ('x' in n) { n.x += 0.3; n.z += 0.3; } else n.u += 0.2; rs.items.push(n); const w = v.addObj(n); v.applyTime(); v.select(w); }
    if (b.dataset.h) { it.h = +b.dataset.h; const ps = wallPose(it); sel.position.copy(ps.pos); }
    if (b.dataset.icol) {
      if (it.fixed) { rs.kitchen = rs.kitchen || {}; rs.kitchen[it.type] = b.dataset.icol; }
      it.color = b.dataset.icol; v.replaceObj(sel, it);
    }
    save(); renderCount(); v.dirty = true; v.cull(); showSel();
  });
  function wallPose(it) {
    const e = ed[it.wall] || ed[0], u = Math.max(0.05, Math.min(e.len - 0.05, it.u)), h = CAT[it.type].fixedH ? CAT[it.type].h0 : (it.h ?? CAT[it.type].h0);
    return { pos: new THREE.Vector3(e.a[0] + e.d[0] * u, h, e.a[1] + e.d[1] * u), rot: Math.atan2(e.n[0], e.n[1]) };
  }

  // ---- キッチン・カップボードの扉（本体）と天板 ----
  const curRs = () => V().rs;
  const kitCur = (type, part) => { const rs = curRs(); return part === 'top' ? colorOf(topsOf(type), rs.kitchenTop && rs.kitchenTop[type]).id : kdoorOf(rs.kitchen && rs.kitchen[type]).id; };
  const kchip = (type, part, o, cur, title) => `<button type="button" class="chip" data-kt="${type}" data-kp="${part}" data-kc="${o.id}" aria-pressed="${cur === o.id}" title="${title}" aria-label="${title}" style="background:${o.hex}${o.img ? ` url(${o.img}) center/cover` : ''}"></button>`;
  function kitChips(type) {
    const cd = kitCur(type, 'door'), ct = kitCur(type, 'top');
    return `<div class="in-kit"><div class="in-kit-h">扉・本体<span>${kdoorOf(cd).series}シリーズ ${kdoorOf(cd).name}</span></div>
      ${KDOOR_SERIES.map(([k, label, note]) => `<div class="in-kser"><small>${label}（${note}）</small><div class="colors">${KDOORS.filter(o => o.series === k).map(o => kchip(type, 'door', o, cd, `${label} ${o.name}`)).join('')}</div></div>`).join('')}
      <div class="in-kit-h">天板<span>${colorOf(topsOf(type), ct).name}</span></div>
      <div class="colors">${topsOf(type).map(o => kchip(type, 'top', o, ct, o.name)).join('')}</div>
      ${type === 'island' ? KOPTS.map(([k, label, list]) => { const cur = optOf(k); return `<div class="in-kit-h">${label}<span>${cur.name}</span></div>
      ${k === 'sink' ? `<div class="colors">${list.map(o => `<button type="button" class="chip" data-kt="${k}" data-kp="door" data-kc="${o.id}" aria-pressed="${cur.id === o.id}" title="${o.name}" aria-label="${o.name}" style="background:${o.hex}"></button>`).join('')}</div>`
        : `<div class="seg">${list.map(o => `<button type="button" data-kt="${k}" data-kp="door" data-kc="${o.id}" aria-pressed="${cur.id === o.id}">${o.short}</button>`).join('')}</div>`}`; }).join('') : ''}
      ${type === 'backcounter' ? (() => { const cur = cbHandleOf(); return `<div class="in-kit-h">取っ手<span>${cur.name}</span></div>
      <div class="seg">${KHANDLE.map(o => `<button type="button" data-kt="cbHandle" data-kp="door" data-kc="${o.id}" aria-pressed="${cur.id === o.id}">${o.short}</button>`).join('')}</div>`; })() : ''}</div>`;
  }
  // カップボードの取っ手：選ぶまではキッチンの取っ手と同じ色
  const cbHandleOf = (rs = curRs()) => colorOf(KHANDLE, rs.kitchen && (rs.kitchen.cbHandle || rs.kitchen.handle));
  const optOf = (k, rs = curRs()) => colorOf(KOPTS.find(o => o[0] === k)[2], rs.kitchen && rs.kitchen[k]);
  function setKitchen(type, part, id) {
    const v = V(), rs = v.rs, key = part === 'top' ? 'kitchenTop' : 'kitchen'; rs[key] = rs[key] || {}; rs[key][type] = id;
    // フード・シンク・取っ手はキッチンの一部として作り直す。キッチンの取っ手は、取っ手を選んでいないカップボードにも効くので両方作り直す
    const isOpt = KOPTS.some(o => o[0] === type) || type === 'cbHandle';
    const owners = type === 'cbHandle' ? ['backcounter'] : type === 'handle' ? ['island', 'backcounter'] : isOpt ? ['island'] : [type];
    for (const old of v.itemObjs.filter(o => o.userData.item.fixed && owners.includes(o.userData.item.type))) {
      const it = old.userData.item; if (isOpt) it[type] = id; else if (part === 'top') it.top = id; else it.color = id; v.replaceObj(old, it);
    }
    save(); v.dirty = true; showSel(); renderPanel();
  }
  const kitOpen = new Set();
  $('#inBody').addEventListener('toggle', e => { const k = e.target.dataset && e.target.dataset.ksec; if (k) { if (e.target.open) kitOpen.add(k); else kitOpen.delete(k); } }, true);
  const kitDesc = (type, rs = curRs()) => `扉 ${kdoorOf(rs.kitchen && rs.kitchen[type]).name}・天板 ${colorOf(topsOf(type), rs.kitchenTop && rs.kitchenTop[type]).name}${type === 'island' ? KOPTS.map(([k, label]) => `・${label} ${optOf(k, rs).short}`).join('') : ''}${type === 'backcounter' ? `・取っ手 ${cbHandleOf(rs).short}` : ''}`;

  // ---- パネル ----
  const sw = (list, cur, attr) => `<div class="colors">${list.map(o => `<button type="button" class="chip${o.tex ? ' tx' : ''}" ${attr}="${o.id}" aria-pressed="${cur === o.id}" title="${o.name}" aria-label="${o.name}" style="background:${o.hex}"></button>`).join('')}</div>`;
  function renderPanel() {
    const rs = curRs();
    for (const b of root.querySelectorAll('#inTabs button')) b.setAttribute('aria-pressed', b.dataset.tab === state.tab);
    $('#inRoom').value = room.id;
    for (const b of root.querySelectorAll('#inTime button')) b.setAttribute('aria-pressed', (b.dataset.t === 'night') === !!state.night);
    $('#inDayLit').checked = !!state.dayLights; $('#inDayLit').disabled = !!state.night; // 夜は常に点灯
    for (const b of root.querySelectorAll('#inEditSeg button')) b.setAttribute('aria-pressed', (b.dataset.ed === '1') === editing);
    stageEl.classList.toggle('editing', editing);
    $('#inHint').textContent = editing ? '編集モード：家具や器具をドラッグで移動。何もない所のドラッグで回転' : 'ドラッグで回転・ホイール／2本指で拡大。クリックで選択して色を変更';
    const body = $('#inBody'); let h = '';
    if (state.tab === 'wall') {
      const ac = rs.accent;
      h = `<section class="sec"><div class="sec-h"><h2>壁紙</h2><span class="cur">${colorOf(WALLPAPER, rs.wall).name}</span></div>${sw(WALLPAPER, rs.wall, 'data-wall')}</section>
      <section class="sec"><div class="sec-h"><h2>アクセントクロス</h2><span class="cur">${ac.on ? colorOf(WALLPAPER, ac.color).name : 'なし'}</span></div>
        <label class="check"><input type="checkbox" id="acOn" ${ac.on ? 'checked' : ''}> 1面だけ色を変える</label>
        ${ac.on ? `${sw(WALLPAPER, ac.color, 'data-accent')}<button type="button" class="btn small" id="acPick" aria-pressed="${pickingAccent}">${pickingAccent ? '3Dで壁をクリックしてください' : 'アクセントにする壁を選ぶ'}</button>
        <p class="note">今は「${wallName(ac.wall)}」です。</p>` : ''}</section>
      <section class="sec"><div class="sec-h"><h2>天井</h2><span class="cur">${colorOf(WALLPAPER, rs.ceiling).name}</span></div>${sw(WALLPAPER.filter(w => !w.tex || w.tex === 'wood'), rs.ceiling, 'data-ceil')}</section>
      <section class="sec"><div class="sec-h"><h2>床</h2><span class="cur">${floorLabel(colorOf(FLOORS, rs.floor))}</span></div>
        ${FLOOR_SERIES.map(([k, label, note]) => { const list = FLOORS.filter(f => f.series === k), open = list.some(f => f.id === rs.floor) || (k === 'trinity' && !FLOORS.some(f => f.id === rs.floor && f.series === 'myfloor'));
          return `<details class="in-fl"${open ? ' open' : ''}><summary><b>${label}</b><span>${list.length}色${note ? `・${note}` : ''}</span></summary>
          <div class="colors">${list.map(o => `<button type="button" class="chip${o.tex && !o.img ? ' tx' : ''}" data-floor="${o.id}" aria-pressed="${rs.floor === o.id}" title="${floorLabel(o)}" aria-label="${floorLabel(o)}" style="background:${o.hex}${o.img ? ` url(${o.img}) center/cover` : ''}"></button>`).join('')}</div></details>`; }).join('')}</section>
      <section class="sec"><div class="sec-h"><h2>室内ドア・収納扉</h2><span class="cur">${doorLabel(doorOf(rs.door))}</span></div>
        ${DOOR_SERIES.map(([k, label, note]) => { const cur = doorOf(rs.door).id, list = DOORCOL.filter(o => o.series === k);
          return `<details class="in-fl"${list.some(o => o.id === cur) ? ' open' : ''}><summary><b>${label}</b><span>${note}</span></summary>
          <div class="colors">${list.map(o => `<button type="button" class="chip" data-door="${o.id}" aria-pressed="${cur === o.id}" title="${doorLabel(o)}" aria-label="${doorLabel(o)}" style="background:${o.hex} url(${o.img}) center/cover"></button>`).join('')}</div></details>`; }).join('')}
        <div class="in-dopt"><span>枠</span><div class="seg">${DFRAME.map(o => `<button type="button" data-dframe="${o.id}" aria-pressed="${colorOf(DFRAME, rs.doorFrame).id === o.id}">${o.name}</button>`).join('')}</div>
        <span>ハンドル</span><div class="seg">${DKNOB.map(o => `<button type="button" data-dknob="${o.id}" aria-pressed="${colorOf(DKNOB, rs.doorKnob).id === o.id}">${o.name}</button>`).join('')}</div></div></section>
      ${(room.fixed || []).filter(f => CAT[f.type].kit).map(f => `<details class="in-fl in-kitsec" data-ksec="${f.type}"${kitOpen.has(f.type) ? ' open' : ''}><summary><b>${CAT[f.type].name.replace(/（.*）/, '')}</b><span>${kitDesc(f.type)}</span></summary>${kitChips(f.type)}</details>`).join('')}
      ${(room.fixed || []).some(f => f.type === 'fridge') ? `<div class="in-dopt"><span>冷蔵庫</span><small class="note">Panasonic NR-E45RY3</small><div class="seg">${FRIDGE.map(o => `<button type="button" data-kt="fridge" data-kp="door" data-kc="${o.id}" aria-pressed="${colorOf(FRIDGE, rs.kitchen && rs.kitchen.fridge).id === o.id}">${o.short}</button>`).join('')}</div></div>` : ''}
      <button type="button" class="btn small" id="copyAll">この部屋の壁紙・床・天井・ドアを全部屋に反映（プラン${state.edit}）</button>`;
    } else {
      const g = state.tab, list = Object.entries(CAT).filter(([, c]) => c.g === g && (g !== 'k'));
      h = !editing ? `<section class="sec"><div class="sec-h"><h2>${GROUP_LABEL[g]}</h2></div>
        <p class="note">配置は固定中です。追加・移動・削除するには <button type="button" class="btn small" data-ed="1">編集モード</button> にしてください。色は3Dでクリックして選べばいつでも変えられます。</p></section>`
        : `<section class="sec"><div class="sec-h"><h2>${GROUP_LABEL[g]}を追加</h2></div>
        <div class="in-cat">${list.map(([k, c]) => `<button type="button" class="in-add" data-add="${k}"><span>${c.name}</span><small>${c.g === 'e' ? (c.fixedH ? '壁上部' : `標準 ${Math.round(c.h0 * 100)}cm`) : c.g === 'l' ? '天井' : `${Math.round(c.w * 100)}×${Math.round(c.d * 100)}`}</small></button>`).join('')}</div>
        <p class="note">${g === 'e' ? '追加すると見えている壁に付きます。ドラッグで壁から壁へ移動でき、高さも変わります。高さはボタンで25・40・110・120cmにそろえられます。' : g === 'l' ? '天井に付きます。ドラッグで位置を移動。「夜」にすると明かりの広がりを確認できます。' : '部屋の中央に置かれます。ドラッグで移動、選択して「90°回転」で向きを変えます。'}</p></section>`;
      if (g === 'l') h += `<section class="sec"><div class="sec-h"><h2>照明の色</h2><span class="cur">${colorOf(LIGHTCOL, rs.lightCol).name}</span></div>
        <div class="seg">${LIGHTCOL.map(o => `<button type="button" data-lc="${o.id}" aria-pressed="${rs.lightCol === o.id}">${o.name}</button>`).join('')}</div></section>`;
      const placed = rs.items.filter(it => CAT[it.type] && CAT[it.type].g === g);
      h += `<section class="sec"><div class="sec-h"><h2>この部屋に設置中</h2><span class="cur">${placed.length}点</span></div>
        <ul class="in-list">${placed.map(it => `<li><button type="button" data-pick="${rs.items.indexOf(it)}">${CAT[it.type].name}${CAT[it.type].g === 'e' ? `<small>${wallName(it.wall)}・${CAT[it.type].fixedH ? '上部' : Math.round((it.h ?? CAT[it.type].h0) * 100) + 'cm'}</small>` : ''}</button></li>`).join('') || '<li class="note">まだありません</li>'}</ul></section>`;
      if (g === 'f' && room.fixed) h += `<p class="note">キッチン・カップボード・冷蔵庫は固定です。キッチン・カップボードはクリックすると扉・天板の色を、冷蔵庫は本体の色を変えられます（「壁紙・床」タブでも選べます）。</p>`;
    }
    body.innerHTML = h;
  }
  function floorLabel(f) { return f.code ? `${f.name}（${f.code}）` : f.name; }
  function wallName(i) {
    const e = ed[i]; if (!e) return ''; const dir = Math.abs(e.n[0]) > Math.abs(e.n[1]) ? (e.n[0] > 0 ? '西' : '東') : (e.n[1] > 0 ? '北' : '南');
    return `${dir}の壁（${Math.round(e.len * 100) / 100}m）`;
  }
  $('#inBody').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const d = b.dataset, v = V(), rs = v.rs;
    if (d.wall) { rs.wall = d.wall; v.applyMats(); }
    else if (d.accent) { rs.accent.color = d.accent; v.applyMats(); }
    else if (d.ceil) { rs.ceiling = d.ceil; v.applyMats(); }
    else if (d.floor) { rs.floor = d.floor; v.applyMats(); }
    else if (d.door) { rs.door = d.door; v.applyMats(); }
    else if (d.dframe) { rs.doorFrame = d.dframe; v.applyDoor(); }
    else if (d.dknob) { rs.doorKnob = d.dknob; v.applyDoor(); }
    else if (d.ed) { setEditing(d.ed === '1'); return; }
    else if (d.kt) { setKitchen(d.kt, d.kp, d.kc); return; }
    else if (b.id === 'acPick') { pickingAccent = !pickingAccent; }
    else if (b.id === 'copyAll') { for (const r of ROOMS) Object.assign(roomsOf(state.edit)[r.id], { wall: rs.wall, floor: rs.floor, ceiling: rs.ceiling, door: rs.door, doorFrame: rs.doorFrame, doorKnob: rs.doorKnob }); b.textContent = '全部屋に反映しました'; save(); return; }
    else if (d.lc) { rs.lightCol = d.lc; v.applyTime(); }
    else if (d.pick) { const it = rs.items[+d.pick]; const w = v.itemObjs.find(o => o.userData.item === it); if (w) v.select(w); return; }
    else if (d.add) {
      const c = CAT[d.add], [cx, cz] = centroid(room.poly); let it;
      if (c.g === 'e') { const vw = v.visibleWalls(); const wi = vw.length ? vw[Math.floor(vw.length / 2)].userData.edge : 0; it = { type: d.add, wall: wi, u: +(ed[wi].len / 2).toFixed(2), h: c.h0 }; }
      else if (c.g === 'l') it = { type: d.add, x: +cx.toFixed(2), z: +cz.toFixed(2) };
      else it = { type: d.add, x: +(pointInPoly(cx, cz, room.poly) ? cx : room.poly[0][0] + 1).toFixed(2), z: +(pointInPoly(cx, cz, room.poly) ? cz : room.poly[0][1] + 1).toFixed(2), rot: 0, color: c.def };
      rs.items.push(it); const w = v.addObj(it); v.applyTime(); v.cull(); v.select(w); renderCount();
    }
    save(); renderPanel();
  });
  $('#inBody').addEventListener('change', e => { if (e.target.id === 'acOn') { const v = V(); v.rs.accent.on = e.target.checked; pickingAccent = v.rs.accent.on; v.applyMats(); save(); renderPanel(); } });
  $('#inTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { state.tab = b.dataset.tab; pickingAccent = false; save(); renderPanel(); } });
  $('#inRoom').addEventListener('change', e => { state.room = e.target.value; save(); buildRoom(); });
  $('#inViews').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) setView(b.dataset.v); });
  function setEditing(on) { editing = on; for (const s of SIDES) views[s].endDrag(); renderPanel(); showSel(); }
  $('#inEditSeg').addEventListener('click', e => { const b = e.target.closest('[data-ed]'); if (b) setEditing(b.dataset.ed === '1'); });
  const applyTimeAll = () => { for (const s of SIDES) views[s].applyTime(); };
  { const r = $('#inBright'), out = $('#inBrightV'), show = () => { out.textContent = `${r.value}%`; };
    r.value = state.bright ?? 90; show();
    r.addEventListener('input', () => { state.bright = +r.value; show(); applyTimeAll(); });
    r.addEventListener('change', save);
    r.addEventListener('dblclick', () => { state.bright = 90; r.value = 90; show(); applyTimeAll(); save(); }); }
  $('#inDayLit').addEventListener('change', e => { state.dayLights = e.target.checked; save(); applyTimeAll(); });
  $('#inTime').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (b) { state.night = b.dataset.t === 'night'; save(); applyTimeAll(); renderPanel(); } });
  $('#inEdit').addEventListener('click', e => { const t = e.target.closest('[data-pedit]'); if (t) setEdit(t.dataset.pedit); });
  $('#inCopy').addEventListener('click', () => {
    const from = state.edit, to = from === 'A' ? 'B' : 'A';
    if (!confirm(`プラン${from} の内装・家具・照明・電気の配置（全部屋）をプラン${to} にコピーします。プラン${to} の今の内容は置き換わります。よろしいですか？`)) return;
    const copy = structuredClone(roomsOf(from)); if (to === 'B') state.roomsB = copy; else state.rooms = copy;
    views[to].buildRoom(); save();
  });
  $('#inSync').addEventListener('change', e => { state.sync = e.target.checked; save(); if (state.sync) syncFrom(V()); });

  for (const s of SIDES) views[s] = makeView(s);
  let active = true;
  (function loop() { requestAnimationFrame(loop); if (!active) return; for (const s of SIDES) views[s].frame(); })();
  layout(); for (const s of SIDES) views[s].resize(); buildRoom();

  return {
    show(on) { active = on; if (on) { layout(); for (const s of SIDES) { views[s].resize(); views[s].dirty = true; } } },
    plan() { return { mode: state.mode, edit: state.edit }; },
    setPlan,
    save,
    snapshot() {
      const sides = state.mode === 'compare' ? SIDES : [state.edit];
      const sc = Math.min(window.devicePixelRatio || 1, 2), pad = Math.round(14 * sc), head = Math.round(50 * sc), lh = Math.round(21 * sc);
      const cols = sides.map(s => {
        const v = views[s], rs = v.rs, src = v.render(), cp = mkC(src.width, src.height); cp.getContext('2d').drawImage(src, 0, 0);
        const lines = [`壁紙：${colorOf(WALLPAPER, rs.wall).name}${rs.accent.on ? `／アクセント：${colorOf(WALLPAPER, rs.accent.color).name}（${wallName(rs.accent.wall)}）` : ''}`,
          `天井：${colorOf(WALLPAPER, rs.ceiling).name}／床：${floorLabel(colorOf(FLOORS, rs.floor))}`,
          `室内ドア：${doorLabel(doorOf(rs.door))}・枠${colorOf(DFRAME, rs.doorFrame).name}・ハンドル${colorOf(DKNOB, rs.doorKnob).name}／照明色：${colorOf(LIGHTCOL, rs.lightCol).name}`,
          ...(room.fixed || []).filter(f => CAT[f.type].kit).map(f => `${CAT[f.type].name.replace(/（.*）/, '')}：${kitDesc(f.type, rs)}`),
          ...((room.fixed || []).some(f => f.type === 'fridge') ? [`冷蔵庫：${colorOf(FRIDGE, rs.kitchen && rs.kitchen.fridge).name}`] : []),
          countText(rs)];
        return { s, img: cp, lines };
      });
      const iw = cols[0].img.width, ih = cols[0].img.height, nl = Math.max(...cols.map(c => c.lines.length));
      const c = mkC(iw * cols.length + pad * (cols.length + 1), head + ih + nl * lh + pad * 2), g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#1b2023'; g.font = `700 ${Math.round(17 * sc)}px "Zen Kaku Gothic New", sans-serif`; g.textBaseline = 'middle';
      g.fillText(`内観シミュレーション（プランNo.5）${room.floor} ${room.name}（${room.size}）${cols.length > 1 ? '' : `　プラン${cols[0].s}`}`, pad, head / 2);
      cols.forEach((col, i) => {
        const x = pad + i * (iw + pad);
        g.drawImage(col.img, x, head);
        if (cols.length > 1) {
          g.fillStyle = col.s === 'A' ? '#275c7c' : '#9a4f24'; g.beginPath(); g.arc(x + 22 * sc, head + 22 * sc, 13 * sc, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#fff'; g.font = `700 ${Math.round(14 * sc)}px sans-serif`; g.textAlign = 'center'; g.fillText(col.s, x + 22 * sc, head + 22 * sc); g.textAlign = 'left';
        }
        g.fillStyle = '#1b2023'; g.font = `500 ${Math.round(12.5 * sc)}px "Zen Kaku Gothic New", sans-serif`;
        col.lines.forEach((t0, j) => { let t = t0; while (g.measureText(t).width > iw && t.length > 2) t = t.slice(0, -2) + '…'; g.fillText(t, x, head + ih + pad + lh * (j + 0.5)); });
      });
      return c.toDataURL('image/png');
    },
  };
}
