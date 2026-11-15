import * as THREE from './lib/three.module.min.js';

/* =====================================================================
   מסע אל בית המקדש — משחק תלת־ממד לימודי
   ציר X: מזרח (+) / מערב (−).  ציר Z: דרום (+) / צפון (−)
   ===================================================================== */

// ---------- Renderer / Scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaed6f2);
scene.fog = new THREE.Fog(0xbfdcf0, 130, 450);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 700);
camera.rotation.order = 'YXZ';
scene.add(camera);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  fitMapCamera();
});

// ---------- מסלול סיור הפתיחה (מעוף ציפור סביב המקדש) ----------
const tourCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(150, 48, 70),
  new THREE.Vector3(60, 34, 95),
  new THREE.Vector3(-45, 26, 82),
  new THREE.Vector3(-95, 32, 0),
  new THREE.Vector3(-45, 26, -82),
  new THREE.Vector3(60, 34, -95),
  new THREE.Vector3(150, 48, -70),
  new THREE.Vector3(175, 60, 0),
], true, 'catmullrom', 0.5);
let tourT = 0;

// ---------- מצלמת מפה (מבט־על אורתוגרפי) ----------
const mapCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 400);
mapCam.position.set(7.5, 200, 0);
mapCam.up.set(0, 0, -1);
mapCam.lookAt(7.5, 0, 0);
function fitMapCamera() {
  // מסגרת עולם: x בטווח ‎-85..110, z בטווח ‎-52..52
  const worldW = 195, worldD = 104, cx = 12.5;
  const aspect = innerWidth / innerHeight;
  let halfW = worldW / 2, halfH = worldD / 2;
  if (aspect > worldW / worldD) halfW = halfH * aspect;
  else halfH = halfW / aspect;
  mapCam.left = -halfW; mapCam.right = halfW;
  mapCam.top = halfH; mapCam.bottom = -halfH;
  mapCam.updateProjectionMatrix();
  // המפה ממורכזת על ציר X של המתחם
  mapCam.position.x = cx;
}
fitMapCamera();

// סמן "אתם כאן" למפה
const mapMarker = new THREE.Group();
{
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(2.2, 5.5, 4),
    new THREE.MeshBasicMaterial({ color: 0xff4433 }));
  arrow.rotation.x = -Math.PI / 2;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.5, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0xff4433 }));
  ring.rotation.x = -Math.PI / 2;
  mapMarker.add(arrow, ring);
  mapMarker.visible = false;
  scene.add(mapMarker);
}

// ---------- Lights ----------
scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x9a8a68, 1.0));
const sun = new THREE.DirectionalLight(0xfff2d8, 1.7);
sun.position.set(60, 120, 70);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -130; sun.shadow.camera.right = 140;
sun.shadow.camera.top = 100; sun.shadow.camera.bottom = -100;
sun.shadow.camera.far = 450;
sun.shadow.bias = -0.0006;
scene.add(sun);

// ---------- Materials ----------
const M = {
  ground:  new THREE.MeshStandardMaterial({ color: 0xc9b88e, roughness: 1 }),
  paving:  new THREE.MeshStandardMaterial({ color: 0xd6c7a3, roughness: .95 }),
  paving2: new THREE.MeshStandardMaterial({ color: 0xdccfae, roughness: .95 }),
  stone:   new THREE.MeshStandardMaterial({ color: 0xd8c8a4, roughness: .9 }),
  wall:    new THREE.MeshStandardMaterial({ color: 0xcdbd97, roughness: .9 }),
  wallIn:  new THREE.MeshStandardMaterial({ color: 0xe3d6b4, roughness: .9 }),
  marble:  new THREE.MeshStandardMaterial({ color: 0xf3ecdc, roughness: .55 }),
  gold:    new THREE.MeshStandardMaterial({ color: 0xf5c542, metalness: .55, roughness: .3 }),
  goldDark:new THREE.MeshStandardMaterial({ color: 0xc99a2e, metalness: .6, roughness: .35 }),
  bronze:  new THREE.MeshStandardMaterial({ color: 0xb0722f, metalness: .55, roughness: .4 }),
  wood:    new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: .85 }),
  woodDark:new THREE.MeshStandardMaterial({ color: 0x6b431f, roughness: .85 }),
  red:     new THREE.MeshStandardMaterial({ color: 0xb03030, roughness: .8 }),
  purple:  new THREE.MeshStandardMaterial({ color: 0x5b2a86, roughness: .8 }),
  skin:    new THREE.MeshStandardMaterial({ color: 0xe8b98a, roughness: .8 }),
  white:   new THREE.MeshStandardMaterial({ color: 0xf7f3e8, roughness: .85 }),
  blue:    new THREE.MeshStandardMaterial({ color: 0x2b4bb5, roughness: .8 }),
  green:   new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: .9 }),
  hill:    new THREE.MeshStandardMaterial({ color: 0xb3a578, roughness: 1 }),
  water:   new THREE.MeshStandardMaterial({ color: 0x4aa3d8, roughness: .2, metalness: .1 }),
};

// ---------- Helpers ----------
const colliders = [];
function addCollider(x1, x2, z1, z2) { colliders.push({ x1, x2, z1, z2 }); }

function box(w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// קיר/מבנה מלא עם התנגשות: טווח רצפה x1..x2, z1..z2, מגובה y0 בגובה h
function solid(x1, x2, z1, z2, y0, h, mat, noCollide) {
  const m = box(x2 - x1, h, z2 - z1, mat);
  m.position.set((x1 + x2) / 2, y0 + h / 2, (z1 + z2) / 2);
  scene.add(m);
  if (!noCollide) addCollider(x1, x2, z1, z2);
  return m;
}

function cyl(rTop, rBot, h, mat, seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// שלט עברית מרחף
function makeLabel(text, scale = 1, color = '#ffd76e') {
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = 224;
  const c = cv.getContext('2d');
  c.font = 'bold 110px "SF Hebrew", "Arial Hebrew", Arial';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineWidth = 14; c.strokeStyle = 'rgba(30,20,5,0.9)';
  c.strokeText(text, 512, 118);
  c.fillStyle = color;
  c.fillText(text, 512, 118);
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true }));
  sp.scale.set(11 * scale, 2.4 * scale, 1);
  return sp;
}
const allLabels = [];
function label(text, x, y, z, scale) {
  const s = makeLabel(text, scale);
  s.position.set(x, y, z);
  s.userData.baseScale = s.scale.clone();
  allLabels.push(s);
  scene.add(s);
  return s;
}

// ---------- גובה קרקע ----------
function groundY(x, z) {
  if (x < -24 && x >= -58 && Math.abs(z) <= 9.5) return 4.5;                 // ההיכל
  if (x < -18 && x >= -24 && Math.abs(z) <= 5) return 2.5 + ((-18 - x) / 6) * 2; // מעלות האולם
  // הכבש — רמפה מלאה שעולה אל ראש המזבח
  if (x >= -4.5 && x <= 0.5 && z >= 6.2 && z <= 17.5) {
    return 2.5 + ((17.5 - z) / 11.3) * 4.55;
  }
  if (x < 18 && x >= -66 && Math.abs(z) <= 28) {
    // המזבח: ראש המזבח, הסובב והיסוד — כולם עבירים
    const mx = Math.abs(x + 2), mz = Math.abs(z);
    if (mx <= 6.2 && mz <= 6.2) return 7.05;   // ראש המזבח
    if (mx <= 7.1 && mz <= 7.1) return 5.6;    // הסובב
    if (mx <= 7.6 && mz <= 7.6) return 3.2;    // היסוד
    return 2.5;                                 // העזרה
  }
  // 15 המעלות העגולות (כגורן עגולה)
  if (x >= 18 && x < 28 && Math.abs(z) <= 7.4) {
    const d = Math.hypot(x - 18, z);
    return 2.5 * Math.max(0, Math.min(1, (9.3 - d) / 6.3));
  }
  return 0;                                                                   // הר הבית
}

/* =====================================================================
   בניית העולם
   ===================================================================== */

// קרקע כללית + הרי ירושלים
{
  const terrain = new THREE.Mesh(new THREE.CircleGeometry(450, 40), M.ground);
  terrain.rotation.x = -Math.PI / 2; terrain.position.y = -0.06;
  terrain.receiveShadow = true;
  scene.add(terrain);

  // ריצוף הר הבית
  const har = box(180, 0.5, 95, M.paving);
  har.position.set(10, -0.25, 0);
  scene.add(har);

  // גבעות ברקע
  const hillGeo = new THREE.SphereGeometry(1, 18, 12);
  [[-260, 140, 90], [-180, -200, 70], [220, 190, 80], [260, -150, 95],
   [-300, -60, 110], [180, -260, 85], [60, 280, 100], [-80, 260, 75]].forEach(([hx, hz, r]) => {
    const h = new THREE.Mesh(hillGeo, M.hill);
    h.scale.set(r, r * 0.28, r);
    h.position.set(hx, -4, hz);
    scene.add(h);
  });

  // ברושים סביב
  [[95, 30], [95, -30], [105, 12], [105, -12], [-80, 42], [-80, -42], [60, 48], [60, -48]].forEach(([tx, tz]) => {
    const trunk = cyl(0.18, 0.25, 1.6, M.woodDark, 8); trunk.position.set(tx, 0.8, tz);
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.1, 5, 10), M.green);
    top.position.set(tx, 3.9, tz); top.castShadow = true;
    scene.add(trunk, top);
  });
}

// הסורג — מחיצה נמוכה סביב המקדש
{
  const h = 1.1, t = 0.35, mat = M.stone;
  solid(86 - t, 86, -38, -4, 0, h, mat);   // מזרח (עם פתח)
  solid(86 - t, 86, 4, 38, 0, h, mat);
  solid(-72, -72 + t, -38, 38, 0, h, mat); // מערב
  solid(-72, 86, -38, -38 + t, 0, h, mat); // צפון
  solid(-72, 86, 38 - t, 38, 0, h, mat);   // דרום
}

// ---------- עזרת הנשים ----------
{
  const H = 6, t = 1;
  // רצפה מובחנת
  const fl = box(50, 0.12, 50, M.paving2); fl.position.set(50, 0.06, 0); scene.add(fl);
  // חומות (פתח מזרחי ופתח מערבי אל המעלות)
  solid(75 - t, 75, -25, -4, 0, H, M.wall); solid(75 - t, 75, 4, 25, 0, H, M.wall);   // מזרח
  solid(25, 25 + t, -25, -7.5, 0, H, M.wall); solid(25, 25 + t, 7.5, 25, 0, H, M.wall); // מערב
  solid(25, 75, -25, -25 + t, 0, H, M.wall);  // צפון
  solid(25, 75, 25 - t, 25, 0, H, M.wall);    // דרום
  // שער מזרחי — משקוף
  solid(74, 76, -4.6, -4, 0, 8, M.stone); solid(74, 76, 4, 4.6, 0, 8, M.stone);
  const lin = box(2.4, 1.2, 9.6); lin.material = M.stone; lin.position.set(75, 8.1, 0); scene.add(lin);
  label('עזרת הנשים', 50, 9.5, 0, 1.4);

  // ארבע הלשכות בפינות
  const rooms = [
    { x1: 62, x2: 74, z1: 13, z2: 25, name: 'לשכת הנזירים', door: 'N' },
    { x1: 26, x2: 38, z1: 13, z2: 25, name: 'לשכת השמנים', door: 'N' },
    { x1: 26, x2: 38, z1: -25, z2: -13, name: 'לשכת המצורעים', door: 'S' },
    { x1: 62, x2: 74, z1: -25, z2: -13, name: 'לשכת העצים', door: 'S' },
  ];
  for (const r of rooms) {
    const cx = (r.x1 + r.x2) / 2, rh = 4.6, wt = 0.6;
    // קירות מזרח/מערב
    solid(r.x1, r.x1 + wt, r.z1, r.z2, 0, rh, M.wallIn);
    solid(r.x2 - wt, r.x2, r.z1, r.z2, 0, rh, M.wallIn);
    // קיר עם פתח (לכיוון מרכז העזרה)
    if (r.door === 'N') {
      solid(r.x1, cx - 2, r.z1, r.z1 + wt, 0, rh, M.wallIn);
      solid(cx + 2, r.x2, r.z1, r.z1 + wt, 0, rh, M.wallIn);
      solid(r.x1, r.x2, r.z2 - wt, r.z2, 0, rh, M.wallIn);
    } else {
      solid(r.x1, cx - 2, r.z2 - wt, r.z2, 0, rh, M.wallIn);
      solid(cx + 2, r.x2, r.z2 - wt, r.z2, 0, rh, M.wallIn);
      solid(r.x1, r.x2, r.z1, r.z1 + wt, 0, rh, M.wallIn);
    }
    // גג
    const roof = box(r.x2 - r.x1 + 0.6, 0.4, r.z2 - r.z1 + 0.6, M.stone);
    roof.position.set(cx, rh + 0.2, (r.z1 + r.z2) / 2);
    scene.add(roof);
    label(r.name, cx, rh + 2.2, (r.z1 + r.z2) / 2, 0.95);
  }
}

// ---------- 15 המעלות + הדוכן ----------
{
  // "כחצי גורן עגולה" — מדרגות חצי־עגולות סביב שער ניקנור
  for (let i = 0; i < 15; i++) {
    const r = 3.2 + i * 0.42;
    const h = Math.max(2.5 * (9.3 - r) / 6.3, 0.1);
    const st = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, h, 42, 1, false, 0, Math.PI),
      M.marble);
    st.position.set(18, h / 2, 0);
    st.castShadow = true; st.receiveShadow = true;
    scene.add(st);
  }
  // קירות צד למעלות
  solid(18, 25, 7.5, 8.5, 0, 6, M.wall);
  solid(18, 25, -8.5, -7.5, 0, 6, M.wall);
}

// ---------- חומות העזרה + שער ניקנור ----------
{
  const t = 1.2;
  solid(18 - t, 18, -28, -4, 0, 11, M.wall); solid(18 - t, 18, 4, 28, 0, 11, M.wall); // מזרח
  solid(-66, -66 + t, -28, 28, 0, 11, M.wall);  // מערב
  solid(-66, 18, -28, -28 + t, 0, 11, M.wall);  // צפון
  solid(-66, 18, 28 - t, 28, 0, 11, M.wall);    // דרום
  // מגדל שער ניקנור
  solid(16, 19.5, -6.4, -4, 0, 13, M.stone); solid(16, 19.5, 4, 6.4, 0, 13, M.stone);
  const lin = box(3.5, 2, 12.8, M.stone); lin.position.set(17.75, 12, 0); scene.add(lin);
  // דלתות נחושת פתוחות
  const d1 = box(0.25, 7, 3.6, M.bronze); d1.position.set(16.4, 6, -5.2); d1.rotation.y = 0.9; scene.add(d1);
  const d2 = box(0.25, 7, 3.6, M.bronze); d2.position.set(16.4, 6, 5.2); d2.rotation.y = -0.9; scene.add(d2);
  label('שער ניקנור', 18, 14.8, 0, 1.15);

  // מדרגת רצפת העזרה (סלאב)
  const slab = box(84, 2.5, 56, M.paving);
  slab.position.set(-24, 1.25, 0); scene.add(slab);
}

// ---------- לשכת הגזית ובית המוקד ----------
{
  solid(2, 16, 20, 27, 2.5, 6, M.marble);
  const dz1 = box(2.6, 3.4, 0.15, M.woodDark); dz1.position.set(9, 4.2, 19.95); scene.add(dz1);
  label('לשכת הגזית', 9, 11.2, 23.5, 1.05);

  solid(2, 16, -27, -20, 2.5, 6, M.wall);
  const dz2 = box(2.6, 3.4, 0.15, M.woodDark); dz2.position.set(9, 4.2, -19.95); scene.add(dz2);
  // כיפת אש קטנה על בית המוקד
  const dome = new THREE.Mesh(new THREE.SphereGeometry(3.4, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.stone);
  dome.position.set(9, 8.5, -23.5); dome.castShadow = true; scene.add(dome);
  label('בית המוקד', 9, 11.6, -23.5, 1.05);
}

// ---------- מנורות הזהב של שמחת בית השואבה (סוכה נא) ----------
{
  for (const [mxp, mzp] of [[42, 11], [42, -11], [58, 11], [58, -11]]) {
    const base = cyl(0.55, 0.75, 0.5, M.goldDark, 10); base.position.set(mxp, 0.25, mzp);
    const pole = cyl(0.13, 0.13, 10.5, M.gold, 8); pole.position.set(mxp, 5.5, mzp);
    const bar = box(2.5, 0.15, 0.15, M.gold); bar.position.set(mxp, 10.8, mzp);
    scene.add(base, pole, bar);
    for (const off of [-0.98, -0.35, 0.35, 0.98]) {
      const cup = cyl(0.17, 0.11, 0.24, M.gold, 8);
      cup.position.set(mxp + off, 11.02, mzp);
      scene.add(cup);
    }
    addCollider(mxp - 0.5, mxp + 0.5, mzp - 0.5, mzp + 0.5);
  }
  label('מנורות שמחת בית השואבה', 50, 13.4, 11, 0.8);
}

// ---------- שערי העזרה (מידות ב, ו) — עיטור בחומות ----------
{
  const gateAt = (gx, southSide, name) => {
    const zi = southSide ? 26.6 : -26.6;
    const p1 = box(0.9, 6.2, 0.7, M.stone); p1.position.set(gx - 1.7, 2.5 + 3.1, zi);
    const p2 = p1.clone(); p2.position.x = gx + 1.7;
    const lin2 = box(4.3, 0.9, 0.7, M.stone); lin2.position.set(gx, 2.5 + 6.6, zi);
    const door = box(2.5, 5.2, 0.25, M.goldDark); door.position.set(gx, 2.5 + 2.6, zi);
    scene.add(p1, p2, lin2, door);
    label(name, gx, 2.5 + 8.4, southSide ? zi - 0.6 : zi + 0.6, 0.7);
  };
  gateAt(-45, true, 'שער הדלק');
  gateAt(-25, true, 'שער הבכורות');
  gateAt(-5, true, 'שער המים');
  gateAt(-45, false, 'שער הניצוץ');
  gateAt(-25, false, 'שער הקרבן');
}

// ---------- מזבח הנחושת (מזבח העולה) — ניתן לעלות בכבש! ----------
const fireGroup = new THREE.Group();
{
  const cx = -2, cz = 0;
  // היסוד (עבירים ברגל)
  const yesod = box(15.2, 0.7, 15.2, M.stone); yesod.position.set(cx, 2.85, cz); scene.add(yesod);
  // גוף המזבח עד הסובב
  const body1 = box(14.2, 2.4, 14.2, M.stone); body1.position.set(cx, 4.4, cz); scene.add(body1);
  // חוט הסקרא — הפס האדום המקיף את אמצע המזבח
  const band = box(14.35, 0.18, 14.35, M.red); band.position.set(cx, 4.7, cz); scene.add(band);
  // גוף עליון — הסובב הוא המדרך שסביבו
  const body2 = box(12.4, 1.45, 12.4, M.stone); body2.position.set(cx, 6.325, cz); scene.add(body2);
  // קרנות המזבח
  for (const [kx, kz] of [[-5.55, -5.55], [-5.55, 5.55], [5.55, -5.55], [5.55, 5.55]]) {
    const k = box(1.05, 1.05, 1.05, M.stone); k.position.set(cx + kx, 7.57, cz + kz); scene.add(k);
  }

  // הכבש — רמפה מלאה ומוצקה בדרום, עולים עליה עד ראש המזבח
  {
    const shape = new THREE.Shape();
    shape.moveTo(6.2, 2.5);
    shape.lineTo(17.5, 2.5);
    shape.lineTo(6.2, 7.05);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 5, bevelEnabled: false });
    const kevesh = new THREE.Mesh(geo, M.stone);
    kevesh.rotation.y = -Math.PI / 2;
    kevesh.position.set(0.5, 0, 0);
    kevesh.castShadow = true; kevesh.receiveShadow = true;
    scene.add(kevesh);
  }

  // מערכה — עצים (חסומה כדי שלא ילכו בתוך האש)
  for (let i = 0; i < 3; i++) {
    const log = box(2.6, 0.28, 0.28, M.woodDark);
    log.position.set(cx, 7.2 + i * 0.22, cz);
    log.rotation.y = i * 0.9;
    scene.add(log);
  }
  addCollider(-3.4, -0.6, -1.4, 1.4);
  // אש התמיד
  const f1 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.6, 10),
    new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: .85 }));
  const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.7, 10),
    new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: .9 }));
  f1.position.y = 1.3; f2.position.y = 1.1;
  fireGroup.add(f1, f2);
  fireGroup.position.set(cx, 7.5, cz);
  const fLight = new THREE.PointLight(0xff8830, 2.2, 30);
  fLight.position.y = 2;
  fireGroup.add(fLight);
  scene.add(fireGroup);
  label('מזבח העולה', cx, 12.5, cz, 1.35);
}

// ---------- הכיור ----------
{
  const kx = -16, kz = 9;
  const base = cyl(0.45, 0.7, 0.9, M.bronze); base.position.set(kx, 2.5 + 0.45, kz);
  const basin = cyl(1.15, 0.85, 1.0, M.bronze); basin.position.set(kx, 2.5 + 1.4, kz);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.09, 10, 24), M.bronze);
  rim.rotation.x = Math.PI / 2; rim.position.set(kx, 2.5 + 1.92, kz); rim.castShadow = true;
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.02, 20), M.water);
  water.rotation.x = -Math.PI / 2; water.position.set(kx, 2.5 + 1.86, kz);
  scene.add(base, basin, rim, water);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const tap = cyl(0.06, 0.06, 0.5, M.goldDark, 8);
    tap.rotation.z = Math.PI / 2; tap.rotation.y = -a;
    tap.position.set(kx + Math.cos(a) * 1.05, 2.5 + 1.05, kz + Math.sin(a) * 1.05);
    scene.add(tap);
  }
  addCollider(kx - 1.3, kx + 1.3, kz - 1.3, kz + 1.3);
  label('הכיור', kx, 6.6, kz, 0.9);
}

// ---------- בית המטבחיים (צפון העזרה) ----------
{
  // ננסין — עמודים נמוכים
  for (let i = 0; i < 8; i++) {
    const px = -4 + (i % 4) * 3.2, pz = -22 + Math.floor(i / 4) * 3.4;
    const p = cyl(0.16, 0.2, 2.6, M.wood, 10); p.position.set(px, 2.5 + 1.3, pz);
    const hook = box(0.7, 0.1, 0.1, M.goldDark); hook.position.set(px, 2.5 + 2.45, pz);
    scene.add(p, hook);
  }
  // טבעות
  for (let i = 0; i < 6; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.07, 8, 18), M.bronze);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(-6 + (i % 3) * 2.6, 2.58, -13.5 - Math.floor(i / 3) * 2.6);
    scene.add(ring);
  }
  // שולחנות שיש
  for (let i = 0; i < 2; i++) {
    const t = box(2.2, 0.18, 1.2, M.marble); t.position.set(8.5, 2.5 + 1.0, -14 - i * 2.6);
    const leg = box(1.8, 1, 0.8, M.stone); leg.position.set(8.5, 2.5 + 0.5, -14 - i * 2.6);
    scene.add(t, leg);
  }
  // גדר דיר הכבשים
  const pen = [[1.2, -16.2, 6.2, 0.15], [1.2, -20.8, 6.2, 0.15], [-1.9, -18.5, 0.15, 4.6], [4.3, -18.5, 0.15, 4.6]];
  for (const [px, pz, w, d] of pen) {
    const f = box(w, 0.9, d, M.wood); f.position.set(px, 2.5 + 0.45, pz); scene.add(f);
  }
  label('בית המטבחיים', 3, 8.6, -18, 1.0);
}

// ---------- ההיכל ----------
const menorahFlames = [];
let loavesGroup, menorahLight;
let parochetGroup, parochetCollider, kodeshLight, shechinaPillar;
{
  const t = 1;
  // רצפה פנימית מוגבהת
  const fl = box(34, 2, 18.4, M.marble); fl.position.set(-41, 3.5, 0); scene.add(fl);
  // קירות צד
  solid(-58, -24, 9, 10, 2.5, 16, M.marble);
  solid(-58, -24, -10, -9, 2.5, 16, M.marble);
  // קיר מערבי
  solid(-59, -58, -10, 10, 2.5, 16, M.marble);
  // חזית האולם — רחבה וגבוהה, עם פתח
  solid(-25, -24, 3, 14, 2.5, 18, M.marble);
  solid(-25, -24, -14, -3, 2.5, 18, M.marble);
  const overDoor = box(1, 8, 6, M.marble); overDoor.position.set(-24.5, 14.5 + 2, 0); scene.add(overDoor);
  // כותרת זהב לחזית
  const trim = box(1.6, 0.8, 28.6, M.gold); trim.position.set(-24.5, 20.9, 0); scene.add(trim);
  // מסגרת זהב לפתח
  const fr1 = box(0.5, 8.5, 0.6, M.gold); fr1.position.set(-24.2, 6.7, 3.2);
  const fr2 = fr1.clone(); fr2.position.z = -3.2;
  const fr3 = box(0.5, 0.6, 7, M.gold); fr3.position.set(-24.2, 11, 0);
  scene.add(fr1, fr2, fr3);
  // גג
  const roof = box(35.5, 0.9, 20.5, M.stone); roof.position.set(-41.5, 18.95, 0); scene.add(roof);
  const roofFront = box(2.2, 0.9, 28.6, M.stone); roofFront.position.set(-24.5, 21.6, 0); scene.add(roofFront);

  // 12 מעלות האולם
  for (let i = 0; i < 12; i++) {
    const x2 = -18 - (i * 6) / 12, x1 = -18 - ((i + 1) * 6) / 12;
    const h = 2 * ((i + 1) / 12);
    const st = box(x2 - x1 + 0.02, h, 10, M.marble);
    st.position.set((x1 + x2) / 2, 2.5 + h / 2, 0);
    scene.add(st);
  }

  // תאורה פנימית
  const inLight = new THREE.PointLight(0xffe0b0, 55, 40, 1.8);
  inLight.position.set(-40, 12, 0); scene.add(inLight);

  // הפרוכת — לפני קודש הקודשים (נפתחת ביום הכיפורים)
  parochetGroup = new THREE.Group();
  const par = box(0.25, 8.5, 18, M.purple); par.position.set(0, 8.75, 0);
  const gs1 = box(0.1, 8.5, 0.7, M.gold); gs1.position.set(0.15, 8.75, 3);
  const gs2 = gs1.clone(); gs2.position.z = -3;
  parochetGroup.add(par, gs1, gs2);
  parochetGroup.position.set(-52, 0, 0);
  scene.add(parochetGroup);
  parochetCollider = { x1: -52.4, x2: -51.6, z1: -9, z2: 9 };
  colliders.push(parochetCollider);
  const khkLabel = makeLabel('קודש הקודשים', 0.95);
  khkLabel.position.set(-51.4, 13.8, 0); scene.add(khkLabel);

  // ----- קודש הקודשים: אבן השתייה, ארון הברית והכרובים -----
  const evenShtiya = box(3.4, 0.5, 3.2, M.stone);
  evenShtiya.position.set(-55.2, 4.75, 0); scene.add(evenShtiya);

  const aron = new THREE.Group();
  const aBody = box(1.3, 0.8, 0.8, M.gold); aBody.position.y = 0.4; aron.add(aBody);
  // זר הזהב המקיף את הארון
  const zer = box(1.42, 0.12, 0.92, M.goldDark); zer.position.y = 0.82; aron.add(zer);
  // הבדים — לעולם אינם סרים מן הארון
  for (const s of [-1, 1]) {
    const bad = cyl(0.05, 0.05, 2.4, M.goldDark, 8);
    bad.rotation.z = Math.PI / 2;
    bad.position.set(0, 0.22, s * 0.52);
    aron.add(bad);
    for (const e of [-1, 1]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.03, 8, 12), M.goldDark);
      ring.rotation.y = Math.PI / 2;
      ring.position.set(e * 0.6, 0.22, s * 0.46);
      aron.add(ring);
    }
  }
  // הכפורת
  const kaporet = box(1.32, 0.09, 0.82, M.gold); kaporet.position.y = 0.92; aron.add(kaporet);
  // שני הכרובים — פניהם איש אל אחיו, כנפיהם סוככות מעל בקשת
  for (const s of [-1, 1]) {
    const keruv = new THREE.Group();
    const kBody = cyl(0.1, 0.17, 0.45, M.gold, 10); kBody.position.y = 0.22; keruv.add(kBody);
    const kHead = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), M.gold);
    kHead.position.y = 0.52; kHead.castShadow = true; keruv.add(kHead);
    // כנפיים בשני חלקים — עולות ונפגשות מעל הכפורת
    for (const w of [-1, 1]) {
      const wingA = box(0.44, 0.055, 0.15, M.gold);
      wingA.position.set(-s * 0.16, 0.55, w * 0.09);
      wingA.rotation.z = s * 1.0;
      keruv.add(wingA);
      const wingB = box(0.42, 0.05, 0.13, M.gold);
      wingB.position.set(-s * 0.4, 0.72, w * 0.09);
      wingB.rotation.z = s * 0.25;
      keruv.add(wingB);
    }
    keruv.position.set(s * 0.44, 0.96, 0);
    aron.add(keruv);
  }
  aron.position.set(-55.2, 5.0, 0);
  scene.add(aron);

  // אור השכינה — נדלק כשהפרוכת נפתחת
  kodeshLight = new THREE.PointLight(0xfff2d0, 0, 14);
  kodeshLight.position.set(-55.2, 8.5, 0); scene.add(kodeshLight);
  shechinaPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 1.0, 9, 14, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff6dd, transparent: true, opacity: 0.28,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
  shechinaPillar.position.set(-55.2, 10.5, 0);
  shechinaPillar.visible = false;
  scene.add(shechinaPillar);

  // ----- המנורה (דרום) — גביעים, כפתורים ופרחים, כמסורת -----
  const men = new THREE.Group();
  // בסיס מדורג רחב ומעוטר
  const b1 = cyl(0.52, 0.62, 0.14, M.goldDark, 8); b1.position.y = 0.07;
  const b2 = cyl(0.38, 0.52, 0.14, M.gold, 8); b2.position.y = 0.21;
  const b3 = cyl(0.2, 0.38, 0.16, M.goldDark, 8); b3.position.y = 0.36;
  men.add(b1, b2, b3);
  // עזרים: גביע (כוס הפוכה), כפתור (תפוח), פרח (מתרחב)
  const gevia = (y, x = 0, s = 1) => { const m2 = cyl(0.115 * s, 0.05 * s, 0.13 * s, M.gold, 10); m2.position.set(x, y, 0); m2.castShadow = true; men.add(m2); };
  const kaftor = (y, x = 0, s = 1) => { const m2 = new THREE.Mesh(new THREE.SphereGeometry(0.09 * s, 10, 8), M.goldDark); m2.position.set(x, y, 0); m2.castShadow = true; men.add(m2); };
  const perach = (y, x = 0, s = 1) => { const m2 = cyl(0.14 * s, 0.055 * s, 0.08 * s, M.gold, 10); m2.position.set(x, y, 0); m2.castShadow = true; men.add(m2); };
  // הקנה האמצעי
  const shaft = cyl(0.06, 0.075, 1.7, M.gold, 12); shaft.position.y = 1.15; men.add(shaft);
  gevia(0.56); kaftor(0.68); perach(0.79);
  // כפתור מתחת לכל זוג קנים היוצאים מן הקנה
  kaftor(0.98); kaftor(1.18); kaftor(1.38);
  const armY = 1.58;
  for (const r of [0.42, 0.8, 1.18]) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(r, 0.055, 10, 30, Math.PI), M.gold);
    arc.rotation.z = Math.PI; arc.position.y = armY;
    arc.castShadow = true;
    men.add(arc);
    for (const s of [-1, 1]) {
      const stem = cyl(0.05, 0.05, 0.3, M.gold, 8);
      stem.position.set(s * r, armY + 0.15, 0);
      men.add(stem);
      // גביע, כפתור ופרח בראש כל קנה
      gevia(armY + 0.12, s * r, 0.8);
      kaftor(armY + 0.24, s * r, 0.8);
      perach(armY + 0.34, s * r, 0.8);
    }
  }
  // ראש הקנה האמצעי
  const cStem = cyl(0.05, 0.05, 0.32, M.gold, 8); cStem.position.y = 1.76; men.add(cStem);
  gevia(1.7); kaftor(1.82); perach(1.92);
  // שבעת הנרות — הפתילות פונות אל הנר המערבי: "אֶל מוּל פְּנֵי הַמְּנוֹרָה יָאִירוּ"
  for (const gx of [-1.18, -0.8, -0.42, 0, 0.42, 0.8, 1.18]) {
    const cup = cyl(0.11, 0.065, 0.13, M.gold, 10); cup.position.set(gx, 2.02, 0); men.add(cup);
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.22, 8),
      new THREE.MeshBasicMaterial({ color: 0xffb733 }));
    fl.position.set(gx, 2.2, 0);
    fl.rotation.z = gx === 0 ? 0 : (gx > 0 ? 0.28 : -0.28);
    fl.visible = false;
    men.add(fl); menorahFlames.push(fl);
  }
  men.rotation.y = Math.PI / 2;
  men.scale.setScalar(1.35);
  men.position.set(-42, 4.5, 5.2);
  scene.add(men);
  addCollider(-43, -41, 4.4, 6);
  menorahLight = new THREE.PointLight(0xffc668, 0, 14);
  menorahLight.position.set(-42, 7.6, 5.2); scene.add(menorahLight);
  label('המנורה', -42, 8.6, 5.2, 0.8);

  // ----- שולחן לחם הפנים (צפון) — עם סניפים וקנים, כמסורת -----
  const tbl = new THREE.Group();
  const top = box(1.7, 0.12, 0.9, M.gold); top.position.y = 1.02;
  // מסגרת (זר) סביב טבלת השולחן
  const rimN = box(1.78, 0.1, 0.06, M.goldDark); rimN.position.set(0, 1.1, 0.45);
  const rimS = rimN.clone(); rimS.position.z = -0.45;
  const rimE = box(0.06, 0.1, 0.96, M.goldDark); rimE.position.set(0.86, 1.1, 0);
  const rimW = rimE.clone(); rimW.position.x = -0.86;
  tbl.add(top, rimN, rimS, rimE, rimW);
  for (const [lx, lz] of [[-0.7, -0.32], [-0.7, 0.32], [0.7, -0.32], [0.7, 0.32]]) {
    const leg = box(0.12, 1.0, 0.12, M.gold); leg.position.set(lx, 0.5, lz); tbl.add(leg);
  }
  // בדי הנשיאה
  for (const s of [-1, 1]) {
    const pole = cyl(0.045, 0.045, 2.4, M.goldDark, 8);
    pole.rotation.z = Math.PI / 2;
    pole.position.set(0, 0.32, s * 0.38);
    tbl.add(pole);
  }
  // סניפים — עמודי הזהב שבשני צידי כל מערכת, והקנים שהלחם שוכב עליהם
  loavesGroup = new THREE.Group();
  const loafMat = new THREE.MeshStandardMaterial({ color: 0xdca659, roughness: .7 });
  for (const sx of [-0.42, 0.42]) {
    for (const [px, pz] of [[-0.3, -0.19], [-0.3, 0.19], [0.3, -0.19], [0.3, 0.19]]) {
      const post = cyl(0.028, 0.028, 1.05, M.gold, 8);
      post.position.set(sx + px, 1.6, pz);
      tbl.add(post);
    }
    for (let i = 0; i < 6; i++) {
      const y = 1.2 + i * 0.15;
      // שני קנים לכל חלה
      for (const rz of [-0.12, 0.12]) {
        const rod = cyl(0.015, 0.015, 0.64, M.gold, 6);
        rod.rotation.z = Math.PI / 2;
        rod.position.set(sx, y - 0.055, rz);
        tbl.add(rod);
      }
      // הלחם — "כמין תיבה פרוצה"
      const loaf = box(0.56, 0.09, 0.34, loafMat);
      loaf.position.set(sx, y, 0);
      const lipA = box(0.06, 0.16, 0.34, loafMat); lipA.position.set(sx - 0.25, y + 0.05, 0);
      const lipB = lipA.clone(); lipB.position.x = sx + 0.25;
      loavesGroup.add(loaf, lipA, lipB);
    }
  }
  loavesGroup.visible = false;
  tbl.add(loavesGroup);
  tbl.rotation.y = Math.PI / 2;
  tbl.position.set(-42, 4.5, -5.2);
  scene.add(tbl);
  addCollider(-43, -41, -6, -4.4);
  label('שולחן לחם הפנים', -42, 8.6, -5.2, 0.8);

  // ----- מזבח הזהב (מזבח הקטורת) — עם זר, קרנות ובדים -----
  const ga = new THREE.Group();
  const gaBody = box(0.95, 1.5, 0.95, M.gold); gaBody.position.y = 0.75;
  const gaZer = box(1.12, 0.16, 1.12, M.goldDark); gaZer.position.y = 1.48;   // זר הזהב
  const gaTop = box(1.02, 0.08, 1.02, M.goldDark); gaTop.position.y = 1.58;
  ga.add(gaBody, gaZer, gaTop);
  // ארבע הקרנות — מחודדות ונוטות חוצה
  for (const [kx, kz] of [[-0.45, -0.45], [-0.45, 0.45], [0.45, -0.45], [0.45, 0.45]]) {
    const k = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 8), M.gold);
    k.position.set(kx, 1.75, kz);
    k.rotation.x = kz * 0.5; k.rotation.z = -kx * 0.5;
    k.castShadow = true;
    ga.add(k);
  }
  // טבעות ובדים
  for (const s of [-1, 1]) {
    const pole = cyl(0.04, 0.04, 2.0, M.goldDark, 8);
    pole.rotation.x = Math.PI / 2;
    pole.position.set(s * 0.52, 1.32, 0);
    ga.add(pole);
    for (const e of [-1, 1]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.025, 8, 12), M.goldDark);
      ring.position.set(s * 0.5, 1.38, e * 0.42);
      ga.add(ring);
    }
  }
  ga.position.set(-46.5, 4.5, 0);
  scene.add(ga);
  addCollider(-47.2, -45.8, -0.7, 0.7);
  label('מזבח הזהב', -46.5, 8.6, 0, 0.8);

  label('ההיכל', -41, 24.2, 0, 1.7);

  // כליא עורב — קוצי הזהב שבראש ההיכל, למנוע מהעורבים לשבת (מידות ד, ו)
  const spikeGeo = new THREE.ConeGeometry(0.13, 0.65, 6);
  const addSpike = (sx, sy, sz) => {
    const s = new THREE.Mesh(spikeGeo, M.gold);
    s.position.set(sx, sy, sz); s.castShadow = true;
    scene.add(s);
  };
  for (let z2 = -13.5; z2 <= 13.5; z2 += 1.5) addSpike(-24.5, 22.35, z2);        // חזית האולם
  for (let x2 = -57.5; x2 <= -26; x2 += 1.8) { addSpike(x2, 19.7, 9.9); addSpike(x2, 19.7, -9.9); }
  for (let z2 = -8; z2 <= 8; z2 += 1.8) addSpike(-58.4, 19.7, z2);               // מערב

  // גפן הזהב שמעל פתח ההיכל
  const vineStem = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.08, 8, 26, Math.PI), M.goldDark);
  vineStem.position.set(-24.0, 11.45, 0);
  vineStem.rotation.y = Math.PI / 2;
  scene.add(vineStem);
  for (const gz of [-1.15, 0, 1.15]) {
    for (let i = 0; i < 6; i++) {
      const grape = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), M.gold);
      grape.position.set(-23.95, 11.7 - Math.floor(i / 2) * 0.18, gz + ((i % 2) - 0.5) * 0.16);
      grape.castShadow = true;
      scene.add(grape);
    }
  }

  // עמודי החזית — כבדגם בית שני
  for (const cz of [-9.2, -5.2, 5.2, 9.2]) {
    const colBase = Math.abs(cz) < 6 ? 4.5 : 2.5;
    const col = cyl(0.55, 0.62, 20.5 - colBase, M.marble, 14);
    col.position.set(-23.4, colBase + (20.5 - colBase) / 2, cz);
    col.castShadow = true;
    const capT = box(1.5, 0.5, 1.5, M.gold); capT.position.set(-23.4, 20.3, cz);
    const capB = box(1.4, 0.4, 1.4, M.goldDark); capB.position.set(-23.4, colBase + 0.2, cz);
    scene.add(col, capT, capB);
  }

  // חלונות צרים בקירות ההיכל
  for (let x2 = -54; x2 <= -29; x2 += 4.2) {
    for (const s of [1, -1]) {
      const w = box(1.1, 2.2, 0.18, M.woodDark);
      w.position.set(x2, 13.5, s * 10.02);
      scene.add(w);
    }
  }
  // פסי זהב לאורך קירות ההיכל
  for (const s of [1, -1]) {
    const trim2 = box(34.5, 0.55, 0.25, M.gold);
    trim2.position.set(-41.2, 18.2, s * 10.05);
    scene.add(trim2);
  }
}

/* =====================================================================
   דמויות — כהנים, לוויים, כבשים
   ===================================================================== */
const npcs = [];
function makePerson(o = {}) {
  const g = new THREE.Group();
  const robeMat = new THREE.MeshStandardMaterial({ color: o.robe || 0xf7f3e8, roughness: .85 });

  // גוף — גלימה, חזה וכתפיים
  const robe = cyl(0.3, 0.46, 1.2, robeMat, 14); robe.position.y = 0.6;
  const chest = cyl(0.26, 0.31, 0.4, robeMat, 12); chest.position.y = 1.3;
  g.add(robe, chest);

  // ראש ופנים — עיניים, גבות, אף, שפם וזקן מלא
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), M.skin);
  head.position.y = 1.56; head.castShadow = true;
  g.add(head);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: .4 });
  const hairMat = new THREE.MeshStandardMaterial({ color: o.beard || 0x5d4a38, roughness: .95 });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 6), eyeMat);
    eye.position.set(s * 0.075, 1.6, 0.17);
    g.add(eye);
    const brow = box(0.062, 0.016, 0.02, hairMat);
    brow.position.set(s * 0.075, 1.645, 0.175);
    brow.rotation.z = -s * 0.15;
    g.add(brow);
    const mst = box(0.075, 0.026, 0.022, hairMat);
    mst.position.set(s * 0.045, 1.503, 0.178);
    mst.rotation.z = s * 0.3;
    g.add(mst);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 6), M.skin);
  nose.position.set(0, 1.555, 0.195);
  g.add(nose);
  // זקן מלא — סנטר ולחיים
  const beardTop = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), hairMat);
  beardTop.scale.set(1.35, 0.75, 0.55);
  beardTop.position.set(0, 1.46, 0.135);
  g.add(beardTop);
  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.32, 8), hairMat);
  beard.rotation.x = Math.PI;
  beard.position.set(0, 1.35, 0.12);
  g.add(beard);

  // אבנט — אדום כמסורת, עם קצוות תלויים מלפנים
  const beltMat = new THREE.MeshStandardMaterial({ color: o.belt || 0xb5382e, roughness: .8 });
  const belt = cyl(0.33, 0.33, 0.14, beltMat, 14); belt.position.y = 1.02;
  g.add(belt);
  if (o.migbaat !== false) {
    const tail1 = box(0.11, 0.52, 0.035, beltMat);
    tail1.position.set(0.1, 0.72, 0.315); tail1.rotation.x = 0.06;
    const tail2 = box(0.09, 0.4, 0.035, beltMat);
    tail2.position.set(-0.07, 0.78, 0.305); tail2.rotation.x = 0.06;
    g.add(tail1, tail2);
  }

  // מגבעת לכהן / שיער לעולה רגל
  if (o.migbaat !== false) {
    const tur = cyl(0.14, 0.22, 0.26, M.white, 12);
    tur.position.y = 1.8;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.05, 8, 16), M.white);
    rim.rotation.x = Math.PI / 2; rim.position.y = 1.71; rim.castShadow = true;
    g.add(tur, rim);
  } else {
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.215, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: o.hair || 0x4a3520, roughness: .95 }));
    hair.position.y = 1.58;
    g.add(hair);
  }

  // זרועות עם מפרקי כתפיים — לאנימציה
  const arms = {};
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.34, 1.42, 0);
    const arm = cyl(0.06, 0.07, 0.6, robeMat, 8);
    arm.position.y = -0.32;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), M.skin);
    hand.position.y = -0.65; hand.castShadow = true;
    pivot.add(arm, hand);
    pivot.rotation.z = s * 0.15;
    g.add(pivot);
    arms[s === -1 ? 'L' : 'R'] = pivot;
  }

  // בגדי הכהן הגדול — מעיל, אפוד, חושן, ציץ
  if (o.meil) {
    const meil = cyl(0.35, 0.5, 0.8, M.blue, 14); meil.position.y = 0.95; g.add(meil);
    // שולי המעיל — רימוני תכלת וארגמן ופעמוני זהב
    const rimonColors = [0x2b4bb5, 0x7a2a6a, 0xb03030];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      if (i % 2 === 0) {
        const rimon = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 6),
          new THREE.MeshStandardMaterial({ color: rimonColors[(i / 2) % 3], roughness: .7 }));
        rimon.position.set(Math.cos(a) * 0.48, 0.55, Math.sin(a) * 0.48);
        g.add(rimon);
      } else {
        const paamon = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.06, 8), M.gold);
        paamon.rotation.x = Math.PI;
        paamon.position.set(Math.cos(a) * 0.48, 0.55, Math.sin(a) * 0.48);
        g.add(paamon);
      }
    }
    // כתפות האפוד עם אבני השוהם
    for (const s of [-1, 1]) {
      const ktef = box(0.15, 0.1, 0.28, M.gold);
      ktef.position.set(s * 0.22, 1.5, 0.03);
      g.add(ktef);
      const shoham = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x2f4f3a, roughness: .3 }));
      shoham.position.set(s * 0.22, 1.53, 0.15);
      g.add(shoham);
    }
    // החושן — 12 אבנים לשנים־עשר השבטים
    const choshen = box(0.26, 0.32, 0.07, M.gold); choshen.position.set(0, 1.22, 0.29); g.add(choshen);
    const stoneColors = [0xb03030, 0x3aa05a, 0xd8c93a, 0x3a6ad8, 0x8a5a2b, 0xd87a3a,
                         0x9a3ad8, 0x3ad8c9, 0xd83a8a, 0xf5f0e6, 0x22224a, 0xc9c9d8];
    stoneColors.forEach((c, i) => {
      const st = box(0.05, 0.05, 0.02,
        new THREE.MeshStandardMaterial({ color: c, roughness: .25, metalness: .2 }));
      st.position.set(-0.07 + (i % 3) * 0.07, 1.33 - Math.floor(i / 3) * 0.073, 0.335);
      g.add(st);
    });
    // הציץ — "קודש לה'"
    const tzitz = box(0.2, 0.055, 0.03, M.gold); tzitz.position.set(0, 1.655, 0.205); g.add(tzitz);
  }

  // כלי הנגינה של הלוויים
  if (o.instrument === 'kinor') {
    const lyre = new THREE.Group();
    const body = box(0.34, 0.4, 0.08, M.wood);
    const aL = box(0.06, 0.42, 0.06, M.wood); aL.position.set(-0.14, 0.38, 0);
    const aR = aL.clone(); aR.position.x = 0.14;
    const bar = box(0.34, 0.05, 0.05, M.wood); bar.position.y = 0.58;
    lyre.add(body, aL, aR, bar);
    for (let i = 0; i < 4; i++) {
      const str = cyl(0.006, 0.006, 0.38, M.gold, 4);
      str.position.set(-0.1 + i * 0.066, 0.37, 0);
      lyre.add(str);
    }
    lyre.scale.setScalar(0.62);
    lyre.position.set(0.38, 1.05, 0.22); lyre.rotation.z = -0.15;
    g.add(lyre);
  }
  if (o.instrument === 'nevel') {
    const nevel = new THREE.Group();
    const post = box(0.08, 1.05, 0.1, M.wood);
    const top = box(0.72, 0.08, 0.1, M.wood); top.position.set(0.32, 0.5, 0);
    const diag = box(0.85, 0.08, 0.1, M.wood);
    diag.position.set(0.3, -0.08, 0); diag.rotation.z = 0.62;
    nevel.add(post, top, diag);
    for (let i = 0; i < 5; i++) {
      const sx = 0.14 + i * 0.12;
      const len = 0.82 - i * 0.13;
      const str = cyl(0.006, 0.006, len, M.gold, 4);
      str.position.set(sx, 0.46 - len / 2, 0);
      nevel.add(str);
    }
    nevel.position.set(0.42, 1.0, 0.2); nevel.rotation.y = -0.35;
    g.add(nevel);
  }
  if (o.instrument === 'cymbal') {
    for (const s of [-1, 1]) {
      const disc = cyl(0.16, 0.16, 0.03, M.gold, 16);
      disc.rotation.z = Math.PI / 2;
      disc.position.y = -0.68;
      arms[s === -1 ? 'L' : 'R'].add(disc);
    }
  }

  if (o.label) {
    const lb = makeLabel(o.label, 0.5, '#cfe2ff');
    lb.position.y = 2.3; g.add(lb);
  }
  g.position.set(o.x, groundY(o.x, o.z), o.z);
  if (o.face !== undefined) g.rotation.y = o.face;
  g.userData = {
    bobPhase: Math.random() * 6,
    anim: o.anim || 'idle',
    armL: arms.L, armR: arms.R,
  };
  if (o.patrol) {
    g.userData.patrol = o.patrol;
    g.userData.patrolT = Math.random();
    g.userData.patrolLen = Math.hypot(o.patrol[2] - o.patrol[0], o.patrol[3] - o.patrol[1]);
  }
  scene.add(g);
  npcs.push(g);
  return g;
}

// כהנים — כל אחד בעבודתו
const kohenBikkurim = makePerson({ x: 5, z: 10, face: Math.PI / 2, label: 'כהן', anim: 'idle' });
const kohenKorban  = makePerson({ x: 0, z: -12.5, face: Math.PI, label: 'כהן', anim: 'raise' });
makePerson({ x: -14, z: 6.8, face: -2.2, label: 'כהן', anim: 'wash' });                   // מקדש ידיים בכיור
makePerson({ x: -8, z: -8.5, label: 'כהן', anim: 'walk', patrol: [-10, -8.5, 6, -8.5] }); // הולך בעזרה
makePerson({ x: -4.6, z: 2.6, face: 2.35, label: 'כהן', anim: 'tend', beard: 0x777468 }); // מסדר את המערכה על ראש המזבח
// כהנים מברכים ברכת כהנים על מעלות האולם — כבציור המסורתי
makePerson({ x: -19.4, z: -3.2, face: Math.PI / 2, anim: 'raise', beard: 0x3a2c20 });
makePerson({ x: -20.3, z: 0, face: Math.PI / 2, anim: 'raise', label: 'ברכת כהנים', beard: 0x2a2018 });
makePerson({ x: -19.4, z: 3.2, face: Math.PI / 2, anim: 'raise', beard: 0x5d4a38 });
// כהן גדול בהיכל
makePerson({ x: -44, z: 1.8, face: -Math.PI / 2, meil: true, label: 'הכהן הגדול', anim: 'raise', beard: 0x8a877d });
// לוויים על הדוכן — בנבל, בכינור ובמצלתיים
makePerson({ x: 20.8, z: -3.6, face: Math.PI / 2, robe: 0xe9edf6, belt: 0x7a5aa0, instrument: 'nevel', label: 'לוי', anim: 'harp' });
makePerson({ x: 20.2, z: 0, face: Math.PI / 2, robe: 0xe9edf6, belt: 0x7a5aa0, instrument: 'kinor', label: 'לוי', anim: 'harp' });
makePerson({ x: 20.8, z: 3.6, face: Math.PI / 2, robe: 0xe9edf6, belt: 0x7a5aa0, instrument: 'cymbal', label: 'לוי', anim: 'cymbal' });
// עולי רגל משוטטים בעזרת הנשים
makePerson({ x: 46, z: 9, face: -2.2, robe: 0xc9b287, belt: 0x6b431f, migbaat: false, anim: 'idle' });
makePerson({ x: 57, z: 5, face: 2.4, robe: 0xa88d64, belt: 0x4a3520, migbaat: false, hair: 0x2a2018, anim: 'idle' });

// כבשים
const sheepList = [];
function makeSheep(x, z) {
  const g = new THREE.Group();
  const wool = new THREE.MeshStandardMaterial({ color: 0xf2ede2, roughness: 1 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), wool);
  body.scale.set(1.35, 1, 1); body.position.y = 0.55; body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xd8cfc0, roughness: .9 }));
  head.position.set(0.62, 0.72, 0); head.castShadow = true;
  g.add(body, head);
  for (const [lx, lz2] of [[-0.28, -0.18], [-0.28, 0.18], [0.3, -0.18], [0.3, 0.18]]) {
    const leg = cyl(0.05, 0.05, 0.36, M.woodDark, 6);
    leg.position.set(lx, 0.18, lz2);
    g.add(leg);
  }
  g.position.set(x, groundY(x, z), z);
  scene.add(g); sheepList.push(g);
  return g;
}
const korbanSheep = makeSheep(1.2, -18.5);
makeSheep(3, -19.8); makeSheep(2.2, -17);

// עולה רגל שאיבד את דרכו (שלב אהבת חינם)
const pilgrim = makePerson({ x: 95, z: 28, face: -0.8, robe: 0xb8935e, belt: 0x6b431f, migbaat: false, label: 'עולה רגל' });
{
  const stick = cyl(0.04, 0.04, 1.5, M.wood, 6);
  stick.position.set(0.52, 0.75, 0.1); pilgrim.add(stick);
}

// הכהן הזקן שנשבר כדו (שלב אהבת חינם)
const oldKohen = makePerson({ x: 55, z: -10, face: 2.6, label: 'כהן זקן' });
{
  // שברי הכד לרגליו
  for (const [sx, sz, r] of [[0.6, 0.4, 0.35], [1.0, -0.2, 0.28], [0.3, -0.5, 0.2]]) {
    const shard = box(r, 0.08, r * 0.7, new THREE.MeshStandardMaterial({ color: 0xb06a3a, roughness: .9 }));
    shard.position.set(55 + sx, 0.06, -10 + sz);
    shard.rotation.y = sx * 3;
    scene.add(shard);
  }
}

// כד שמן חדש — בלשכת השמנים
const jug = new THREE.Group();
{
  const clay = new THREE.MeshStandardMaterial({ color: 0xb06a3a, roughness: .85 });
  const body = cyl(0.2, 0.3, 0.52, clay, 12); body.position.y = 0.28;
  const neck = cyl(0.11, 0.15, 0.2, clay, 10); neck.position.y = 0.62;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 8, 14), clay);
  lip.rotation.x = Math.PI / 2; lip.position.y = 0.73; lip.castShadow = true;
  jug.add(body, neck, lip);
  jug.position.set(32.8, 0, 20.5);
  scene.add(jug);
}

// אבן היסוד הסמלית (מופיעה בסיום)
const foundationStone = box(1.7, 1.0, 1.3, M.marble);
foundationStone.position.set(23, groundY(23, 5) + 0.5, 5);
foundationStone.visible = false;
scene.add(foundationStone);

// דמות השחקן — כהן צעיר, נראית בזום־אאוט
const avatar = makePerson({ x: 100, z: 0, robe: 0xf7f3e8, belt: 0xb5382e });
avatar.visible = false;

// ---------- סל הביכורים ----------
const basket = new THREE.Group();
{
  const b = cyl(0.42, 0.3, 0.42, new THREE.MeshStandardMaterial({ color: 0xa8773c, roughness: .9 }), 12);
  b.position.y = 0.21; basket.add(b);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 8, 18), M.wood);
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.42; basket.add(rim);
  const fruits = [[0xa03060, 0.1, -0.15, 0], [0xc03030, 0.13, 0.12, 0.1], [0x77aa33, 0.09, 0, -0.16],
                  [0x5b3a86, 0.1, 0.05, 0.18], [0xd8a040, 0.1, -0.12, 0.14], [0x8a5a2b, 0.09, 0.18, -0.08]];
  for (const [c, r, fx, fz] of fruits) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8),
      new THREE.MeshStandardMaterial({ color: c, roughness: .6 }));
    f.position.set(fx, 0.48, fz); f.castShadow = true;
    basket.add(f);
  }
  // שולחן הסל
  const tbl = box(1.5, 0.12, 1.0, M.wood); tbl.position.set(14, 2.5 + 0.85, 8);
  const legs = box(1.2, 0.85, 0.7, M.woodDark); legs.position.set(14, 2.5 + 0.43, 8);
  scene.add(tbl, legs);
  addCollider(13.2, 14.8, 7.4, 8.6);
  basket.position.set(14, 2.5 + 0.91, 8);
  scene.add(basket);
}

/* =====================================================================
   אפקטים — עשן, ניצוצות, עמוד אור
   ===================================================================== */
function smokeTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  const tx = new THREE.CanvasTexture(cv);
  return tx;
}
const smokeTex = smokeTexture();
const smokeEmitters = [];
function makeSmokeEmitter(x, y, z, { count = 12, size = 1.6, height = 10, color = 0x999999, speed = 0.12 } = {}) {
  const em = { sprites: [], active: true, speed };
  for (let i = 0; i < count; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: smokeTex, color, transparent: true, opacity: 0, depthWrite: false }));
    sp.userData = { phase: i / count, jx: (Math.random() - 0.5), jz: (Math.random() - 0.5), base: { x, y, z }, size, height };
    scene.add(sp);
    em.sprites.push(sp);
  }
  smokeEmitters.push(em);
  return em;
}
const mizbeachSmoke = makeSmokeEmitter(-2, 9, 0, { count: 14, size: 2.2, height: 16, color: 0xb9b4ac });
const ketoretSmoke = makeSmokeEmitter(-46.5, 6.3, 0, { count: 10, size: 0.8, height: 6, color: 0xf5f0e6, speed: 0.07 });
ketoretSmoke.active = false;

// ניצוצות
const sparkPool = [];
{
  const geo = new THREE.OctahedronGeometry(0.1);
  for (let i = 0; i < 60; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffd76e, transparent: true }));
    m.visible = false; scene.add(m);
    sparkPool.push({ mesh: m, vel: new THREE.Vector3(), life: 0 });
  }
}
function burst(x, y, z, color = 0xffd76e, n = 26) {
  let used = 0;
  for (const p of sparkPool) {
    if (used >= n) break;
    if (p.life > 0) continue;
    used++;
    p.life = 1.1 + Math.random() * 0.4;
    p.mesh.visible = true;
    p.mesh.material.color.setHex(color);
    p.mesh.material.opacity = 1;
    p.mesh.position.set(x, y, z);
    p.vel.set((Math.random() - 0.5) * 4, 2.5 + Math.random() * 3.5, (Math.random() - 0.5) * 4);
  }
}

// עמוד אור — סמן משימה
const beacon = new THREE.Group();
{
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 1.0, 26, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd76e, transparent: true, opacity: 0.33,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
  pillar.position.y = 13;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.12, 10, 28),
    new THREE.MeshBasicMaterial({ color: 0xffd76e, transparent: true, opacity: 0.8, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.15;
  beacon.add(pillar, ring);
  beacon.visible = false;
  scene.add(beacon);
}

/* =====================================================================
   שמע — Web Audio
   ===================================================================== */
let AC = null, masterGain = null, reverbSend = null;

// הד של אולם אבן — כמו החלל האמיתי במקדש
function makeReverbIR(seconds, decay) {
  const sr = AC.sampleRate, len = Math.floor(sr * seconds);
  const ir = AC.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return ir;
}

function audioInit() {
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = AC.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(AC.destination);
    const conv = AC.createConvolver();
    conv.buffer = makeReverbIR(3.2, 2.4);
    reverbSend = AC.createGain();
    reverbSend.gain.value = 0.55;
    reverbSend.connect(conv);
    conv.connect(masterGain);
  } catch (e) { AC = null; }
}

function tone(freq, dur, type = 'sine', vol = 0.18, when = 0) {
  if (!AC) return;
  const t0 = AC.currentTime + when;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(masterGain || AC.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}
function dingSound() { tone(784, 0.5, 'triangle', 0.2); tone(1175, 0.7, 'triangle', 0.16, 0.09); }
function bigDing() { tone(659, 0.5, 'triangle', 0.2); tone(880, 0.6, 'triangle', 0.18, 0.1); tone(1319, 0.9, 'triangle', 0.15, 0.2); }

/* ---------------------------------------------------------------------
   סינתזת מיתר פרוט (Karplus–Strong) — צליל נבל וכינור אמיתי
   --------------------------------------------------------------------- */
const pluckCache = new Map();
function pluckBuffer(freq, dur, decay, damp) {
  const key = Math.round(freq) + '|' + dur + '|' + decay + '|' + damp;
  if (pluckCache.has(key)) return pluckCache.get(key);
  const sr = AC.sampleRate, len = Math.floor(sr * dur);
  const buf = AC.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);
  const N = Math.max(2, Math.round(sr / freq));
  const ring = new Float32Array(N);
  let lp = 0;
  for (let i = 0; i < N; i++) {           // עירור מסונן — צליל חם ולא חד
    lp = lp * (1 - damp) + (Math.random() * 2 - 1) * damp;
    ring[i] = lp;
  }
  let idx = 0, prev = 0;
  for (let i = 0; i < len; i++) {
    const cur = ring[idx];
    out[i] = cur;
    ring[idx] = (cur + prev) * 0.5 * decay;   // סינון־ממוצע = דעיכת מיתר
    prev = cur;
    idx = (idx + 1) % N;
  }
  pluckCache.set(key, buf);
  return buf;
}

function pluck(freq, vol, when, o = {}) {
  if (!AC || !isFinite(freq)) return;
  const dur = o.dur || 2.6;
  const src = AC.createBufferSource();
  src.buffer = pluckBuffer(freq, dur, o.decay || 0.9965, o.damp || 0.42);
  const flt = AC.createBiquadFilter();
  flt.type = 'lowpass';
  flt.frequency.value = o.tone || 2400;
  flt.Q.value = 0.4;
  const g = AC.createGain();
  const t0 = AC.currentTime + when;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
  g.gain.setTargetAtTime(0, t0 + 0.06, dur * 0.3);
  src.connect(flt); flt.connect(g);
  g.connect(masterGain);
  if (reverbSend) g.connect(reverbSend);
  src.start(t0);
  src.stop(t0 + dur + 0.1);
}

// מְצִלְתַּיִם — נקישת נחושת בסוף כל פסוק
function cymbal(vol, when) {
  if (!AC) return;
  const sr = AC.sampleRate, dur = 2.2;
  const buf = AC.createBuffer(1, Math.floor(sr * dur), sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.2);
  }
  const src = AC.createBufferSource(); src.buffer = buf;
  const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
  const bp = AC.createBiquadFilter(); bp.type = 'bandpass';
  bp.frequency.value = 5400; bp.Q.value = 0.6;
  const g = AC.createGain();
  const t0 = AC.currentTime + when;
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(hp); hp.connect(bp); bp.connect(g);
  g.connect(masterGain);
  if (reverbSend) g.connect(reverbSend);
  src.start(t0); src.stop(t0 + dur);
}

/* ---------------------------------------------------------------------
   שִׁירַת הַלְוִיִּם — מזמורי תהילים
   הלחנים נכתבו במיוחד למשחק בסולמות נוסח התפילה המסורתי
   (אַהֲבָה רַבָּה, מָגֵן אָבוֹת, אֲדֹנָי מָלָךְ), בסגנון שירת בית הכנסת העתיקה.
   כל תו: [דרגה בסולם, מספר פעימות]. null = שתיקה. 'C' = מצלתיים.
   --------------------------------------------------------------------- */
const MODES = {
  ahavaRabba:   [0, 1, 4, 5, 7, 8, 10],   // הסולם המזרחי המובהק (עם הסקונדה המוגדלת)
  magenAvot:    [0, 2, 3, 5, 7, 8, 10],   // מינור טבעי
  adonaiMalach: [0, 2, 4, 5, 7, 9, 10],   // מז'ור עם סמך נמוך
};
const R = null, C = 'C';

const PSALMS = [
  {
    name: 'שִׁיר שֶׁל יוֹם · מִזְמוֹר שִׁיר לְיוֹם הַשַּׁבָּת',
    ref: 'תְּהִלִּים צ״ב',
    mode: MODES.adonaiMalach, root: 196, beat: 0.60,
    notes: [
      [0,2],[0,1],[1,1],[2,2],[1,1],[0,2],[R,1],[C,0],
      [2,2],[3,1],[4,2],[4,1],[3,1],[2,2],[R,1],
      [4,1],[5,1],[6,1],[5,1],[4,2],[3,2],[R,1],[C,0],
      [2,1],[3,1],[2,1],[1,1],[0,4],[R,3],
    ],
  },
  {
    name: 'שִׁיר שֶׁל יוֹם · לַה׳ הָאָרֶץ וּמְלוֹאָהּ',
    ref: 'תְּהִלִּים כ״ד',
    mode: MODES.ahavaRabba, root: 174.6, beat: 0.66,
    notes: [
      [0,1],[1,1],[0,2],[-1,1],[0,3],[R,1],[C,0],
      [0,1],[1,1],[2,2],[1,1],[0,2],[R,1],
      [2,1],[3,1],[4,2],[3,1],[2,1],[1,2],[R,1],[C,0],
      [4,1],[4,1],[3,1],[2,1],[1,1],[0,4],[R,3],
    ],
  },
  {
    name: 'שִׁיר הַמַּעֲלוֹת · אֶשָּׂא עֵינַי אֶל הֶהָרִים',
    ref: 'תְּהִלִּים קכ״א',
    mode: MODES.magenAvot, root: 220, beat: 0.62,
    notes: [
      [0,2],[2,1],[3,1],[4,2],[3,1],[2,2],[R,1],[C,0],
      [4,2],[5,1],[4,1],[3,2],[2,2],[R,1],
      [5,1],[6,1],[7,2],[6,1],[5,1],[4,2],[R,1],[C,0],
      [4,1],[3,1],[2,1],[1,1],[0,4],[R,3],
    ],
  },
  {
    name: 'הַלְלוּיָהּ · הַלְלוּהוּ בְּמִנִּים וְעוּגָב',
    ref: 'תְּהִלִּים ק״נ',
    mode: MODES.adonaiMalach, root: 196, beat: 0.52,
    notes: [
      [4,1],[4,1],[5,1],[4,1],[2,2],[R,1],[C,0],
      [3,1],[3,1],[4,1],[3,1],[0,2],[R,1],
      [4,1],[5,1],[6,1],[7,2],[6,1],[5,1],[4,2],[R,1],[C,0],
      [2,1],[3,1],[2,1],[1,1],[0,4],[R,3],
    ],
  },
];

function degToFreq(root, mode, deg) {
  const oct = Math.floor(deg / 7);
  const idx = ((deg % 7) + 7) % 7;
  return root * Math.pow(2, (mode[idx] + oct * 12) / 12);
}

let psalmIdx = 0, noteIdx = 0, nextNoteAt = 0, cymbalFlash = 0, pluckFlash = 0, curPsalmName = '';

// מנגן את התו הבא של המזמור. dist = מרחק השחקן מן הדוכן.
function playLevites(time, dist) {
  if (!AC || time < nextNoteAt) return;
  const P = PSALMS[psalmIdx];
  const vol = 0.16 * Math.max(0, 1 - dist / 26);
  const [deg, beats] = P.notes[noteIdx];

  if (deg === C) {                       // מצלתיים בסוף פסוק
    cymbal(vol * 0.5, 0);
    cymbalFlash = time;
  } else if (deg !== R) {
    pluckFlash = time;
    const f = degToFreq(P.root, P.mode, deg);
    pluck(f * 2, vol, 0, { tone: 2800, dur: 2.4 });          // כִּנּוֹר — המנגינה
    pluck(f, vol * 0.5, 0.012, { tone: 1500, dur: 3.0 });    // נֵבֶל — התמיכה
    if (noteIdx % 4 === 0) {                                  // יסוד הסולם כרקע
      pluck(P.root / 2, vol * 0.34, 0.02, { tone: 800, dur: 4.0, decay: 0.998 });
    }
  }

  nextNoteAt = time + Math.max(beats, 0.35) * P.beat;
  noteIdx++;
  if (noteIdx >= P.notes.length) {       // סוף המזמור — שתיקה ואז המזמור הבא
    noteIdx = 0;
    psalmIdx = (psalmIdx + 1) % PSALMS.length;
    nextNoteAt += 4.5;
  }
  curPsalmName = PSALMS[psalmIdx].name + ' · ' + PSALMS[psalmIdx].ref;
}

// ---------- קריינות בעברית ----------
// שני מנועים: Google Cloud TTS (קול גבר איכותי, דורש מפתח API — מוזן בכפתור 🎙️)
// או קול הדפדפן כברירת מחדל (מועדף קול גבר אם קיים).
let narrOn = true, heVoice = null;
let gTtsKey = localStorage.getItem('mikdash_tts_key') || '';
let gTtsEngine = localStorage.getItem('mikdash_tts_engine') || 'gemini';
let gTtsVoice = localStorage.getItem('mikdash_tts_voice') || 'Charon';
// התאמת קול שמור ישן למנוע הנבחר
if (gTtsEngine === 'gemini' && gTtsVoice.includes('-')) gTtsVoice = 'Charon';
if (gTtsEngine === 'cloud' && !gTtsVoice.includes('-')) gTtsVoice = 'he-IL-Wavenet-B';
const ttsCache = new Map();
let curAudio = null;

function pickHeVoice() {
  try {
    const he = speechSynthesis.getVoices().filter(v => v.lang && v.lang.startsWith('he'));
    heVoice = he.find(v => /male|גבר|asaf|guy|אסף/i.test(v.name))
           || he.find(v => /google/i.test(v.name))
           || he[0] || null;
  } catch (e) { heVoice = null; }
}
if ('speechSynthesis' in window) {
  pickHeVoice();
  speechSynthesis.onvoiceschanged = pickHeVoice;
}

// תור הקראה: כל קטע (מידע, משימה, שלב) מוקרא בנפרד וברצף —
// כך כל קטע נשמר במטמון לעצמו, וכל המשימות זוכות לקריינות.
let speechQueue = [], speechGen = 0;

function stopSpeech() {
  speechGen++;
  speechQueue = [];
  try { speechSynthesis.cancel(); } catch (e) {}
  if (curAudio) { curAudio.onended = null; curAudio.pause(); curAudio = null; }
}

// Gemini מחזיר PCM גולמי — עוטפים בכותרת WAV כדי שהדפדפן ינגן
function pcmToWavUrl(b64, sampleRate) {
  const bin = atob(b64);
  const n = bin.length;
  const buf = new ArrayBuffer(44 + n);
  const dv = new DataView(buf);
  const w = (off, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, sampleRate, true); dv.setUint32(28, sampleRate * 2, true);
  dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  w(36, 'data'); dv.setUint32(40, n, true);
  for (let i = 0; i < n; i++) dv.setUint8(44 + i, bin.charCodeAt(i));
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return 'data:audio/wav;base64,' + btoa(s);
}

// מטמון קבוע ב־IndexedDB: כל משפט מוקלט דרך ה־API פעם אחת בלבד,
// ונשמר בדפדפן לצמיתות — אין צורך בחיבור חוזר.
let ttsDB = null;
try {
  const rq = indexedDB.open('mikdash-tts', 1);
  rq.onupgradeneeded = () => rq.result.createObjectStore('audio');
  rq.onsuccess = () => { ttsDB = rq.result; };
} catch (e) { /* אין IndexedDB */ }

function dbGetAudio(key) {
  return new Promise(res => {
    if (!ttsDB) return res(null);
    try {
      const rq = ttsDB.transaction('audio').objectStore('audio').get(key);
      rq.onsuccess = () => res(rq.result || null);
      rq.onerror = () => res(null);
    } catch (e) { res(null); }
  });
}
function dbPutAudio(key, val) {
  try { ttsDB && ttsDB.transaction('audio', 'readwrite').objectStore('audio').put(val, key); } catch (e) {}
}

// מנוע 1: Gemini TTS — מפתח חינמי מ־Google AI Studio (aistudio.google.com)
async function fetchGeminiTts(text) {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=' + encodeURIComponent(gTtsKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: gTtsVoice } } },
      },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
  const part = parts.find(p => p.inlineData && p.inlineData.data);
  if (!part) return null;
  const rate = parseInt((part.inlineData.mimeType.match(/rate=(\d+)/) || [])[1] || '24000', 10);
  return pcmToWavUrl(part.inlineData.data, rate);
}

// מנוע 2: Google Cloud Text-to-Speech (דורש פרויקט Cloud עם חיוב)
async function fetchCloudTts(text) {
  const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + encodeURIComponent(gTtsKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'he-IL', name: gTtsVoice },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.92 },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.audioContent) return null;
  return 'data:audio/mp3;base64,' + data.audioContent;
}

/* ---------------------------------------------------------------------
   חבילת קול — קריינות שנוסעת עם המשחק
   אם קיים הקובץ voice/voicepack.json, כל מי שפותח את המשחק שומע את
   הקריינות המוקלטת — בלי מפתח API, בלי התקנה, ובכל מכשיר.
   --------------------------------------------------------------------- */
let voicePack = null;
fetch('./voice/voicepack.json')
  .then(r => (r.ok ? r.json() : null))
  .then(p => { if (p && typeof p === 'object') voicePack = p; })
  .catch(() => { /* אין חבילה — נופלים לקול המכשיר */ });

// השגת אודיו לקטע: חבילת קול ← מטמון זיכרון ← מטמון קבוע ← פנייה ל־API
async function getTtsUrl(text) {
  if (voicePack && voicePack[text]) return voicePack[text];
  const key = gTtsEngine + '|' + gTtsVoice + '|' + text;
  if (ttsCache.has(key)) return ttsCache.get(key);
  const saved = await dbGetAudio(key);
  if (saved) { ttsCache.set(key, saved); return saved; }
  if (!gTtsKey) return null;
  const url = gTtsEngine === 'gemini' ? await fetchGeminiTts(text) : await fetchCloudTts(text);
  if (!url) return null;
  ttsCache.set(key, url);
  dbPutAudio(key, url);
  return url;
}

// הקלטה מראש בלבד (בלי נגינה) — עבור כפתור "הקלטת הכול מראש"
async function prefetchTts(text) {
  const key = gTtsEngine + '|' + gTtsVoice + '|' + text;
  if (ttsCache.has(key) || await dbGetAudio(key)) return 'cached';
  const url = gTtsEngine === 'gemini' ? await fetchGeminiTts(text) : await fetchCloudTts(text);
  if (!url) return 'failed';
  ttsCache.set(key, url);
  dbPutAudio(key, url);
  return 'fetched';
}

async function speakCloud(text) {
  try {
    const gen = speechGen;
    const url = await getTtsUrl(text);
    if (!url) return false;
    if (gen !== speechGen) return true; // בוטל בינתיים — אבל נשמר במטמון
    curAudio = new Audio(url);
    curAudio.onended = () => { if (gen === speechGen) advanceSpeech(gen); };
    curAudio.play().catch(() => { if (gen === speechGen) advanceSpeech(gen); });
    return true;
  } catch (e) { return false; }
}

function speakLocal(text, gen) {
  const cont = () => { if (gen !== undefined && gen === speechGen) advanceSpeech(gen); };
  if (!('speechSynthesis' in window)) { cont(); return; }
  try {
    const u = new SpeechSynthesisUtterance(text);
    if (heVoice) u.voice = heVoice;
    u.lang = 'he-IL';
    u.rate = 0.95;
    u.pitch = 0.85; // נמוך יותר — קרוב יותר לקול גברי
    let moved = false;
    const once = () => { if (!moved) { moved = true; cont(); } };
    u.onend = once;
    u.onerror = once;      // קול חסר או הפרעה — ממשיכים הלאה
    speechSynthesis.speak(u);
    // רשת ביטחון: אם onend לא נורה (דפדפנים שונים מתנהגים אחרת),
    // התור לא ייתקע — ממשיכים לפי אומדן זמן הדיבור.
    setTimeout(once, 2000 + text.length * 90);
  } catch (e) { cont(); }
}

async function advanceSpeech(gen) {
  if (gen !== speechGen) return;
  const text = speechQueue.shift();
  if (!text) return;
  // תמיד מנסים קודם אודיו מוקלט (חבילת קול או מטמון) — גם בלי מפתח API,
  // שהרי למי שפותח את הקישור אין מפתח. רק אם אין — נופלים לקול הדפדפן.
  const ok = await speakCloud(text);
  if (gen !== speechGen) return;
  if (!ok) speakLocal(text, gen);
}

// speak מקבל טקסט אחד או מערך קטעים שיושמעו ברצף
function speak(items) {
  if (!narrOn) return;
  stopSpeech();
  speechQueue = (Array.isArray(items) ? items : [items]).filter(Boolean);
  advanceSpeech(speechGen);
}

/* =====================================================================
   נתוני משימות ולמידה
   ===================================================================== */
const LEVELS = {
  1: { name: 'שָׁלָב 1 · כְּלֵי הַמִּקְדָּשׁ', desc: 'עֲלוּ אֶל בֵּית ה׳ וְהַכִּירוּ מִקָּרוֹב אֶת כְּלֵי הַקֹּדֶשׁ — מִזְבַּח הָעוֹלָה, הַכִּיּוֹר, הַמְּנוֹרָה, שֻׁלְחַן לֶחֶם הַפָּנִים וּמִזְבַּח הַזָּהָב.',
    pasuk: 'וְעָשׂוּ לִי מִקְדָּשׁ, וְשָׁכַנְתִּי בְּתוֹכָם.' },
  2: { name: 'שָׁלָב 2 · לִשְׁכוֹת הַמִּקְדָּשׁ', desc: 'סַיְּרוּ בְּלִשְׁכוֹת הַמִּקְדָּשׁ — לִשְׁכַּת הַגָּזִית שֶׁל הַסַּנְהֶדְרִין, בֵּית הַמּוֹקֵד, בֵּית הַמִּטְבָּחַיִם וְאַרְבַּע לִשְׁכוֹת עֶזְרַת הַנָּשִׁים.',
    pasuk: 'אֶחָד שָׁאַלְתִּי מֵאֵת ה׳, אוֹתוֹ אֲבַקֵּשׁ — שִׁבְתִּי בְּבֵית ה׳ כָּל יְמֵי חַיַּי.' },
  3: { name: 'שָׁלָב 3 · עֲבוֹדַת הַמִּקְדָּשׁ', desc: 'עַכְשָׁו אַתֶּם עוֹבְדִים בַּמִּקְדָּשׁ! הָבִיאוּ בִּכּוּרִים, הַקְרִיבוּ קָרְבָּן, קַדְּשׁוּ יָדַיִם וְרַגְלַיִם וְעִבְדוּ אֶת עֲבוֹדוֹת הַהֵיכָל.',
    pasuk: 'עִבְדוּ אֶת ה׳ בְּשִׂמְחָה, בֹּאוּ לְפָנָיו בִּרְנָנָה.' },
  4: { name: 'שָׁלָב 4 · תּוֹלְדוֹת הַר הַמּוֹרִיָּה וְהַמִּקְדָּשׁ', desc: 'מֵעֲקֵדַת יִצְחָק וְעַד חֻרְבַּן הַבַּיִת — עִבְרוּ בֵּין תַּחֲנוֹת הַיֶּדַע וַעֲנוּ עַל שְׁאֵלוֹת בְּתוֹלְדוֹת בֵּית הַמִּקְדָּשׁ הָרִאשׁוֹן וְהַשֵּׁנִי.',
    pasuk: 'זְכֹר יְמוֹת עוֹלָם, בִּינוּ שְׁנוֹת דֹּר וָדֹר.' },
  5: { name: 'שָׁלָב 5 · אַהֲבַת חִנָּם וְהַבַּיִת הַשְּׁלִישִׁי', desc: 'הַבַּיִת חָרַב בְּשִׂנְאַת חִנָּם — וְיִבָּנֶה בְּאַהֲבַת חִנָּם! עֲשׂוּ מַעֲשֵׂי חֶסֶד בַּמִּקְדָּשׁ וְהַנִּיחוּ אֶבֶן יְסוֹד לַבַּיִת הַשְּׁלִישִׁי.',
    pasuk: 'וְאָהַבְתָּ לְרֵעֲךָ כָּמוֹךָ. כִּי בֵיתִי בֵּית תְּפִלָּה יִקָּרֵא לְכָל הָעַמִּים.' },
};

const tasks = [
  // ---------- שלב 1 · כלי המקדש ----------
  { id: 'enter', lvl: 1, title: 'עִבְרוּ בְּשַׁעַר הַסּוֹרֵג', hint: 'לְכוּ מַעֲרָבָה, אֶל הַפֶּתַח שֶׁבַּמְּחִצָּה הַנְּמוּכָה הַמַּקִּיפָה אֶת הַמִּקְדָּשׁ.', x: 83, z: 0, r: 4,
    info: { t: 'הַסּוֹרֵג', b: 'מְחִצָּה נְמוּכָה שֶׁהִקִּיפָה אֶת בֵּית הַמִּקְדָּשׁ בְּהַר הַבַּיִת. הַסּוֹרֵג סִמֵּן אֶת הַגְּבוּל שֶׁמִּמֶּנּוּ וָהָלְאָה נִכְנָסִים רַק יִשְׂרָאֵל טְהוֹרִים — תְּחִלַּת הַמַּעֲלָה בַּקְּדֻשָּׁה.' } },
  { id: 'en-cross', lvl: 1, title: 'חֲצוּ אֶת עֶזְרַת הַנָּשִׁים וַעֲלוּ בַּחֲמֵשׁ עֶשְׂרֵה הַמַּעֲלוֹת', hint: 'הִכָּנְסוּ בַּשַּׁעַר הַמִּזְרָחִי, חֲצוּ אֶת הֶחָצֵר הַגְּדוֹלָה וַעֲלוּ בַּמַּדְרֵגוֹת הָעֲגֻלּוֹת שֶׁבַּמַּעֲרָב.', x: 21.5, z: 0, r: 3.5,
    info: { t: 'עֶזְרַת הַנָּשִׁים', b: 'חָצֵר גְּדוֹלָה שֶׁל מֵאָה שְׁלוֹשִׁים וְחָמֵשׁ עַל מֵאָה שְׁלוֹשִׁים וְחָמֵשׁ אַמָּה, בָּהּ הִתְאַסְּפוּ כֻּלָּם — גְּבָרִים וְנָשִׁים. כָּאן נֶעֶרְכָה שִׂמְחַת בֵּית הַשּׁוֹאֵבָה בְּחַג הַסֻּכּוֹת, לְאוֹר מְנוֹרוֹת זָהָב עֲנָקִיּוֹת.' } },
  { id: 'nikanor', lvl: 1, title: 'עִבְרוּ בְּשַׁעַר נִיקָנוֹר אֶל הָעֲזָרָה', hint: 'הַשַּׁעַר הַגָּדוֹל שֶׁבְּרֹאשׁ הַמַּעֲלוֹת, עִם דַּלְתוֹת הַנְּחֹשֶׁת הַמֻּפְלָאוֹת.', x: 14.5, z: 0, r: 3.2,
    info: { t: 'שַׁעַר נִיקָנוֹר', b: 'דַּלְתוֹת הַנְּחֹשֶׁת שֶׁהֵבִיא נִיקָנוֹר מֵאָלֶכְּסַנְדְּרִיָּה שֶׁל מִצְרַיִם — נַעֲשׂוּ בָּהֶן נִסִּים בַּיָּם, וְלָכֵן לֹא הֻחְלְפוּ בְּזָהָב. כָּל שְׁאָר שַׁעֲרֵי הָעֲזָרָה צֻפּוּ זָהָב!' } },
  { id: 'mizbeach-look', lvl: 1, title: 'עֲלוּ בַּכֶּבֶשׁ אֶל רֹאשׁ הַמִּזְבֵּחַ', hint: 'עֲלוּ בָּרַמְפָּה שֶׁבַּדָּרוֹם עַד רֹאשׁ הַמִּזְבֵּחַ! שִׂימוּ לֵב לְחוּט הַסִּקְרָא הָאָדֹם, לַסּוֹבֵב וְלַקְּרָנוֹת.', x: -2, z: 11, r: 4.2, action: '🔍 התבוננו במזבח',
    info: { t: 'מִזְבַּח הָעוֹלָה (מִזְבַּח הַנְּחֹשֶׁת)', b: 'מִזְבַּח אֲבָנִים גָּדוֹל, שְׁלוֹשִׁים וּשְׁתַּיִם עַל שְׁלוֹשִׁים וּשְׁתַּיִם אַמָּה, מֵאֲבָנִים שְׁלֵמוֹת שֶׁלֹּא הוּנַף עֲלֵיהֶן בַּרְזֶל. חוּט הַסִּקְרָא הָאָדֹם הִקִּיף אֶת אֶמְצָעוֹ לְהַבְדִּיל בֵּין דָּמִים עֶלְיוֹנִים לְתַחְתּוֹנִים, וְעָלָיו בָּעֲרָה אֵשׁ הַתָּמִיד שֶׁלֹּא כָּבְתָה לְעוֹלָם. עוֹלִים אֵלָיו בַּכֶּבֶשׁ — שֶׁנֶּאֱמַר: "וְלֹא תַעֲלֶה בְמַעֲלֹת עַל מִזְבְּחִי".' } },
  { id: 'kiyor-look', lvl: 1, title: 'הִתְבּוֹנְנוּ בְּכִיּוֹר הַנְּחֹשֶׁת', hint: 'הַכִּיּוֹר עוֹמֵד בֵּין הָאוּלָם לַמִּזְבֵּחַ, מָשׁוּךְ קִמְעָה לַדָּרוֹם.', x: -16, z: 7, r: 2.8, action: '🔍 התבוננו בכיור',
    info: { t: 'הַכִּיּוֹר', b: 'כִּיּוֹר נְחֹשֶׁת וּבוֹ דַּדִּים — בְּרָזִים — מִמֶּנּוּ קִדְּשׁוּ הַכֹּהֲנִים יָדַיִם וְרַגְלַיִם לִפְנֵי כָּל עֲבוֹדָה. בֶּן קָטִין עָשָׂה לוֹ מוּכְנִי, גַּלְגַּל, כְּדֵי שֶׁמֵּימָיו לֹא יִפָּסְלוּ בְּלִינָה.' } },
  { id: 'menorah-look', lvl: 1, title: 'עֲלוּ אֶל הַהֵיכָל וְהִתְבּוֹנְנוּ בַּמְּנוֹרָה', hint: 'עֲלוּ בִּשְׁתֵּים עֶשְׂרֵה הַמַּעֲלוֹת אֶל הַפֶּתַח הַמֻּזְהָב. הַמְּנוֹרָה בְּצַד שְׂמֹאל, בַּדָּרוֹם.', x: -42, z: 3.4, r: 2.8, action: '🔍 התבוננו במנורה',
    info: { t: 'הַמְּנוֹרָה', b: 'מְנוֹרַת זָהָב טָהוֹר בְּמִשְׁקַל כִּכָּר, מִקְשָׁה אַחַת — גְּבִיעִים, כַּפְתּוֹרִים וּפְרָחִים. שִׁבְעָה קָנִים, וּבְרֹאשָׁם שִׁבְעָה נֵרוֹת שֶׁל שֶׁמֶן זַיִת זָךְ.' } },
  { id: 'shulchan-look', lvl: 1, title: 'הִתְבּוֹנְנוּ בְּשֻׁלְחַן לֶחֶם הַפָּנִים', hint: 'הַשֻּׁלְחָן מְצֻפֶּה הַזָּהָב בְּצַד יָמִין, בַּצָּפוֹן שֶׁל הַהֵיכָל.', x: -42, z: -3.4, r: 2.8, action: '🔍 התבוננו בשולחן',
    info: { t: 'שֻׁלְחַן לֶחֶם הַפָּנִים', b: 'שֻׁלְחָן מְצֻפֶּה זָהָב טָהוֹר וְלוֹ מִסְגֶּרֶת זָהָב. עָלָיו סֻדְּרוּ שְׁתֵּים עֶשְׂרֵה חַלּוֹת לֶחֶם הַפָּנִים בִּשְׁתֵּי מַעֲרָכוֹת שֶׁל שֵׁשׁ, כְּנֶגֶד שְׁנֵים עָשָׂר שִׁבְטֵי יִשְׂרָאֵל.' } },
  { id: 'golden-look', lvl: 1, title: 'הִתְבּוֹנְנוּ בְּמִזְבַּח הַזָּהָב', hint: 'הַמִּזְבֵּחַ הַקָּטָן שֶׁבְּאֶמְצַע הַהֵיכָל, לִפְנֵי הַפָּרֹכֶת.', x: -44.2, z: 0, r: 2.7, action: '🔍 התבוננו במזבח הזהב',
    info: { t: 'מִזְבַּח הַזָּהָב (מִזְבַּח הַקְּטֹרֶת)', b: 'מִזְבֵּחַ קָטָן מְצֻפֶּה זָהָב, אַמָּה עַל אַמָּה, וְלוֹ אַרְבַּע קְרָנוֹת וְזֵר זָהָב סָבִיב. עָלָיו הֻקְטְרָה הַקְּטֹרֶת פַּעֲמַיִם בְּכָל יוֹם.' } },
  { id: 'parochet', lvl: 1, title: 'גְּשׁוּ אֶל הַפָּרֹכֶת', hint: 'הַיְרִיעָה הָאַרְגָּמָנִית שֶׁבְּיַרְכְּתֵי הַהֵיכָל.', x: -49.5, z: 0, r: 3.2,
    info: { t: 'הַפָּרֹכֶת וְקֹדֶשׁ הַקֳּדָשִׁים', b: 'מֵעֵבֶר לַפָּרֹכֶת שׁוֹכֵן קֹדֶשׁ הַקֳּדָשִׁים — הַמָּקוֹם הַמְּקֻדָּשׁ בָּעוֹלָם, מְקוֹם הָאָרוֹן וְהַכְּרוּבִים, וּבַבַּיִת הַשֵּׁנִי אֶבֶן הַשְּׁתִיָּה. רַק הַכֹּהֵן הַגָּדוֹל נִכְנָס אֵלָיו, פַּעַם אַחַת בְּשָׁנָה — בְּיוֹם הַכִּפּוּרִים.' } },

  // ---------- שלב 2 · לשכות המקדש ----------
  { id: 'gazit', lvl: 2, title: 'רְדוּ אֶל לִשְׁכַּת הַגָּזִית שֶׁבִּדְרוֹם הָעֲזָרָה', hint: 'צְאוּ מִן הַהֵיכָל וּלְכוּ אֶל הַמִּבְנֶה הַלָּבָן שֶׁבַּחוֹמָה הַדְּרוֹמִית.', x: 9, z: 17, r: 4.5,
    info: { t: 'לִשְׁכַּת הַגָּזִית', b: 'בַּלִּשְׁכָּה הַבְּנוּיָה אַבְנֵי גָּזִית יָשְׁבָה הַסַּנְהֶדְרִין הַגְּדוֹלָה — שִׁבְעִים וְאֶחָד זִקְנֵי יִשְׂרָאֵל — וְדָנָה בְּדִינֵי הַתּוֹרָה. כָּאן בָּדְקוּ אֶת יִחוּסֵי הַכֹּהֲנִים וְהִפִּילוּ גּוֹרָלוֹת עַל עֲבוֹדוֹת הַיּוֹם.' } },
  { id: 'moked', lvl: 2, title: 'חֲצוּ אֶל בֵּית הַמּוֹקֵד שֶׁבַּצָּפוֹן', hint: 'הַמִּבְנֶה הַגָּדוֹל עִם הַכִּפָּה בַּחוֹמָה הַצְּפוֹנִית.', x: 9, z: -17, r: 4.5,
    info: { t: 'בֵּית הַמּוֹקֵד', b: 'לִשְׁכָּה גְּדוֹלָה וּמְקֹרָה כִּפָּה, שֶׁבָּהּ בָּעֲרָה מְדוּרָה תָּמִיד. בָּהּ הִתְחַמְּמוּ הַכֹּהֲנִים הַהוֹלְכִים יְחֵפִים עַל רִצְפַּת הַשַּׁיִשׁ, וּבָהּ יָשְׁנוּ מִשְׁמְרוֹת הַכְּהֻנָּה בַּלַּיְלָה. מַפְתְּחוֹת הָעֲזָרָה נִשְׁמְרוּ בָּהּ.' } },
  { id: 'mitbach', lvl: 2, title: 'בַּקְּרוּ בְּבֵית הַמִּטְבָּחַיִם', hint: 'אֵזוֹר הַטַּבָּעוֹת וְהָעַמּוּדִים שֶׁבִּצְפוֹן הָעֲזָרָה.', x: 3, z: -17, r: 3.5,
    info: { t: 'בֵּית הַמִּטְבָּחַיִם', b: 'בִּצְפוֹן הָעֲזָרָה נִשְׁחֲטוּ קָדְשֵׁי הַקֳּדָשִׁים. כָּאן הָיוּ עֶשְׂרִים וְאַרְבַּע הַטַּבָּעוֹת שֶׁבָּהֶן קָבְעוּ אֶת רֹאשׁ הַקָּרְבָּן, נַנָּסִין — עַמּוּדִים נְמוּכִים — שֶׁעֲלֵיהֶם הִפְשִׁיטוּ, וְשֻׁלְחֲנוֹת שַׁיִשׁ לַהֲדָחַת הַקְּרָבַיִם.' } },
  { id: 'duchan', lvl: 2, title: 'צְאוּ בְּשַׁעַר נִיקָנוֹר וְעִמְדוּ עַל הַדּוּכָן', hint: 'רְדוּ אֶל חֲמֵשׁ עֶשְׂרֵה הַמַּעֲלוֹת וְהַקְשִׁיבוּ לְשִׁירַת הַלְוִיִּם!', x: 21.5, z: 0, r: 3.5,
    info: { t: 'הַדּוּכָן וְשִׁירַת הַלְוִיִּם', b: 'עַל חֲמֵשׁ עֶשְׂרֵה הַמַּעֲלוֹת — כְּנֶגֶד חֲמִשָּׁה עָשָׂר שִׁירֵי הַמַּעֲלוֹת שֶׁבַּתְּהִלִּים — עָמְדוּ הַלְוִיִּם בְּכִנּוֹרוֹת, בִּנְבָלִים וּבִמְצִלְתַּיִם, וְשָׁרוּ אֶת שִׁיר שֶׁל יוֹם בִּשְׁעַת הַקְרָבַת הַקָּרְבָּנוֹת.' } },
  { id: 'shemanim', lvl: 2, title: 'בַּקְּרוּ בְּלִשְׁכַּת הַשְּׁמָנִים (דָּרוֹם־מַעֲרָב)', hint: 'רְדוּ לְעֶזְרַת הַנָּשִׁים — הַלִּשְׁכָּה בַּפִּנָּה הַדְּרוֹמִית מַעֲרָבִית. הִכָּנְסוּ דֶּרֶךְ הַפֶּתַח.', x: 32, z: 18, r: 3.2,
    info: { t: 'לִשְׁכַּת הַשְּׁמָנִים', b: 'בְּלִשְׁכָּה זוֹ אֻחְסְנוּ שֶׁמֶן הַזַּיִת הַזָּךְ לַמְּנוֹרָה וְלַמְּנָחוֹת, וְהַיַּיִן לַנְּסָכִים שֶׁעַל גַּבֵּי הַמִּזְבֵּחַ.' } },
  { id: 'nezirim', lvl: 2, title: 'בַּקְּרוּ בְּלִשְׁכַּת הַנְּזִירִים (דָּרוֹם־מִזְרָח)', hint: 'חֲצוּ אֶת עֶזְרַת הַנָּשִׁים אֶל הַפִּנָּה הַדְּרוֹמִית מִזְרָחִית.', x: 68, z: 18, r: 3.2,
    info: { t: 'לִשְׁכַּת הַנְּזִירִים', b: 'כָּאן בִּשְּׁלוּ הַנְּזִירִים אֶת קָרְבַּן הַשְּׁלָמִים שֶׁלָּהֶם בְּסִיּוּם יְמֵי נְזִירוּתָם, וְגִלְּחוּ אֶת שְׂעָרָם וְהִשְׁלִיכוּהוּ אֶל הָאֵשׁ שֶׁתַּחַת הַסִּיר.' } },
  { id: 'etzim', lvl: 2, title: 'בַּקְּרוּ בְּלִשְׁכַּת הָעֵצִים (צָפוֹן־מִזְרָח)', hint: 'הַפִּנָּה הַצְּפוֹנִית מִזְרָחִית שֶׁל עֶזְרַת הַנָּשִׁים.', x: 68, z: -18, r: 3.2,
    info: { t: 'לִשְׁכַּת הָעֵצִים', b: 'כָּאן בָּדְקוּ אֶת הָעֵצִים לַמַּעֲרָכָה — עֵץ שֶׁנִּמְצְאָה בּוֹ תּוֹלַעַת נִפְסַל לַמִּזְבֵּחַ. כֹּהֲנִים בַּעֲלֵי מוּם, שֶׁלֹּא עָבְדוּ בָּעֲזָרָה, הָיוּ מַתְלִיעִים כָּאן אֶת הָעֵצִים.' } },
  { id: 'metzora', lvl: 2, title: 'בַּקְּרוּ בְּלִשְׁכַּת הַמְּצֹרָעִים (צָפוֹן־מַעֲרָב)', hint: 'הַלִּשְׁכָּה הָאַחֲרוֹנָה — בַּפִּנָּה הַצְּפוֹנִית מַעֲרָבִית.', x: 32, z: -18, r: 3.2,
    info: { t: 'לִשְׁכַּת הַמְּצֹרָעִים', b: 'מְצֹרָעִים שֶׁנִּרְפְּאוּ טָבְלוּ כָּאן בְּיוֹם טָהֳרָתָם הַשְּׁמִינִי, לִפְנֵי שֶׁהֵבִיאוּ אֶת קָרְבְּנוֹתֵיהֶם וְנִכְנְסוּ לַמִּקְדָּשׁ.' } },

  // ---------- שלב 3 · עבודת המקדש ----------
  { id: 'basket-take', lvl: 3, title: 'שׁוּבוּ לָעֲזָרָה וּקְחוּ אֶת סַל הַבִּכּוּרִים', hint: 'הַסַּל מֻנָּח עַל שֻׁלְחָן בַּדָּרוֹם, סָמוּךְ לְשַׁעַר נִיקָנוֹר.', x: 14, z: 8, r: 2.6, action: '🧺 קח את הסל' },
  { id: 'basket-give', lvl: 3, title: 'הַגִּישׁוּ אֶת הַבִּכּוּרִים לַכֹּהֵן שֶׁלִּפְנֵי הַמִּזְבֵּחַ', hint: 'הַכֹּהֵן הָעוֹמֵד לְיַד הַכֶּבֶשׁ שֶׁל הַמִּזְבֵּחַ.', x: 5, z: 10, r: 3, action: '🧺 הגש לכהן',
    info: { t: 'מִצְוַת בִּכּוּרִים', b: 'אֶת הַפֵּרוֹת הָרִאשׁוֹנִים מִשִּׁבְעַת הַמִּינִים — חִטָּה, שְׂעוֹרָה, גֶּפֶן, תְּאֵנָה, רִמּוֹן, זַיִת וְתָמָר — מְבִיאִים בְּסַל אֶל הַכֹּהֵן, מְנִיפִים יַחַד, וְקוֹרְאִים אֶת פָּרָשַׁת "אֲרַמִּי אֹבֵד אָבִי".' } },
  { id: 'sheep-take', lvl: 3, title: 'קְחוּ כֶּבֶשׂ מִבֵּית הַמִּטְבָּחַיִם', hint: 'דִּיר הַקָּרְבָּנוֹת בִּצְפוֹן הָעֲזָרָה.', x: 2.5, z: -16, r: 3.2, action: '🐑 קח את הכבש' },
  { id: 'sheep-give', lvl: 3, title: 'הָבִיאוּ אֶת הַקָּרְבָּן אֶל הַכֹּהֵן', hint: 'הַכֶּבֶשׂ הוֹלֵךְ אַחֲרֵיכֶם! הוֹבִילוּ אוֹתוֹ אֶל הַכֹּהֵן שֶׁבִּצְפוֹן הַמִּזְבֵּחַ.', x: 0, z: -11.5, r: 3, action: '🐑 מסור לכהן',
    info: { t: 'קָרְבַּן הַתָּמִיד', b: 'בְּכָל יוֹם הֻקְרְבוּ שְׁנֵי כְּבָשִׂים — תָּמִיד שֶׁל שַׁחַר וְתָמִיד שֶׁל בֵּין הָעַרְבַּיִם. שְׁחִיטַת קָדְשֵׁי הַקֳּדָשִׁים בַּצָּפוֹן, וּזְרִיקַת הַדָּם עַל הַמִּזְבֵּחַ. אֵיבְרֵי הַקָּרְבָּן עָלוּ עַל אֵשׁ הַמַּעֲרָכָה.' } },
  { id: 'kiyor-work', lvl: 3, title: 'קַדְּשׁוּ יָדַיִם וְרַגְלַיִם מִן הַכִּיּוֹר', hint: 'לִפְנֵי עֲבוֹדַת הַהֵיכָל — חוֹבָה לְקַדֵּשׁ מִן הַכִּיּוֹר!', x: -16, z: 7, r: 2.8, action: '💧 קדש ידיים ורגליים',
    info: { t: 'קִדּוּשׁ יָדַיִם וְרַגְלַיִם', b: 'כָּל כֹּהֵן קִדֵּשׁ יָדָיו וְרַגְלָיו לִפְנֵי הָעֲבוֹדָה — יַד יָמִין עַל רֶגֶל יָמִין, וְיַד שְׂמֹאל עַל רֶגֶל שְׂמֹאל. כֹּהֵן שֶׁעָבַד בְּלֹא קִדּוּשׁ — עֲבוֹדָתוֹ פְּסוּלָה.' } },
  { id: 'menorah-work', lvl: 3, title: 'הַדְלִיקוּ אֶת שִׁבְעַת נֵרוֹת הַמְּנוֹרָה', hint: 'עֲלוּ אֶל הַהֵיכָל — הַמְּנוֹרָה בְּצַד שְׂמֹאל, בַּדָּרוֹם.', x: -42, z: 3.4, r: 2.8, action: '🕯️ הדלק את המנורה',
    info: { t: 'הֲטָבַת הַנֵּרוֹת וְהַדְלָקָתָן', b: 'הַכֹּהֵן מֵטִיב אֶת הַנֵּרוֹת בַּבֹּקֶר וּמַדְלִיקָן בֵּין הָעַרְבַּיִם, בְּשֶׁמֶן זַיִת זָךְ. הַנֵּר הַמַּעֲרָבִי דָּלַק תָּמִיד — עֵדוּת שֶׁהַשְּׁכִינָה שׁוֹרָה בְּיִשְׂרָאֵל.' } },
  { id: 'ketoret', lvl: 3, title: 'הַקְטִירוּ קְטֹרֶת עַל מִזְבַּח הַזָּהָב', hint: 'הַמִּזְבֵּחַ הַקָּטָן שֶׁבְּאֶמְצַע הַהֵיכָל.', x: -44.2, z: 0, r: 2.7, action: '🔥 הקטר קטורת',
    info: { t: 'הַקְטָרַת הַקְּטֹרֶת', b: 'הַקְּטֹרֶת — אַחַד עָשָׂר סַמְמָנִים — הֻקְטְרָה פַּעֲמַיִם בְּכָל יוֹם. עֲבוֹדַת הַקְּטֹרֶת מַעֲשִׁירָה אֶת עוֹשֶׂיהָ, וְלָכֵן הֻגְרְלָה רַק לְכֹהֵן שֶׁטֶּרֶם זָכָה בָּהּ מִיָּמָיו.' } },
  { id: 'lechem', lvl: 3, title: 'סַדְּרוּ אֶת לֶחֶם הַפָּנִים עַל הַשֻּׁלְחָן', hint: 'הַשֻּׁלְחָן בְּצַד יָמִין, בַּצָּפוֹן. שְׁתֵּים עֶשְׂרֵה חַלּוֹת בִּשְׁתֵּי מַעֲרָכוֹת.', x: -42, z: -3.4, r: 2.8, action: '🍞 סדר את הלחם',
    info: { t: 'סִדּוּר לֶחֶם הַפָּנִים', b: 'הַלֶּחֶם הֻחְלַף מִדֵּי שַׁבָּת בְּשַׁבַּתּוֹ: כֹּהֲנִים נִכְנָסִים וִידֵיהֶם מְלֵאוֹת בַּלֶּחֶם הֶחָדָשׁ, וַאֲחֵרִים מוֹצִיאִים אֶת הַיָּשָׁן — וְנִשְׁאָר חַם וְטָרִי בְּדֶרֶךְ נֵס כָּל הַשָּׁבוּעַ!' } },
  { id: 'parochet-open', lvl: 3, title: 'יוֹם הַכִּפּוּרִים: הַסִּיטוּ אֶת הַפָּרֹכֶת', hint: 'אַתֶּם הַכֹּהֵן הַגָּדוֹל, בַּיּוֹם הַקָּדוֹשׁ בַּשָּׁנָה — הַיּוֹם הַיָּחִיד שֶׁבּוֹ נִכְנָסִים פְּנִימָה. גְּשׁוּ אֶל הַפָּרֹכֶת.', x: -50.4, z: 0, r: 3, action: '✨ הסיטו את הפרוכת',
    info: { t: 'כְּנִיסַת יוֹם הַכִּפּוּרִים', b: 'פַּעַם אַחַת בְּשָׁנָה, בְּיוֹם הַכִּפּוּרִים, נִכְנָס הַכֹּהֵן הַגָּדוֹל לְבַדּוֹ אֶל קֹדֶשׁ הַקֳּדָשִׁים — בְּבִגְדֵי לָבָן, עִם מַחְתַּת גֶּחָלִים וְכַף קְטֹרֶת. וְכָל הָעָם עוֹמְדִים בַּחוּץ וּמְצַפִּים לְצֵאתוֹ בְּשָׁלוֹם.' } },
  { id: 'kodesh', lvl: 3, title: 'הִכָּנְסוּ אֶל קֹדֶשׁ הַקֳּדָשִׁים', hint: 'הִכָּנְסוּ בִּדְחִילוּ וּרְחִימוּ — וּרְאוּ אֶת אֲרוֹן הַבְּרִית, הַכַּפֹּרֶת וְהַכְּרוּבִים.', x: -55, z: 0, r: 2.6,
    info: { t: 'אֲרוֹן הַבְּרִית וְהַכְּרוּבִים', b: 'בַּבַּיִת הָרִאשׁוֹן עָמַד כָּאן הָאָרוֹן וּבוֹ לוּחוֹת הַבְּרִית, וְעָלָיו הַכַּפֹּרֶת וּשְׁנֵי כְּרוּבֵי הַזָּהָב — פְּנֵיהֶם אִישׁ אֶל אָחִיו וְכַנְפֵיהֶם סוֹכְכוֹת. תַּחְתָּיו — אֶבֶן הַשְּׁתִיָּה, שֶׁמִּמֶּנָּה הֻשְׁתַּת הָעוֹלָם. בַּבַּיִת הַשֵּׁנִי נִגְנַז הָאָרוֹן, וְנִשְׁאֲרָה אֶבֶן הַשְּׁתִיָּה לְבַדָּהּ.' } },

  // ---------- שלב 4 · תולדות הר המוריה והמקדש ----------
  { id: 'hist1', lvl: 4, title: 'תַּחֲנַת יֶדַע: הַר הַמּוֹרִיָּה', hint: 'הַתַּחֲנָה בְּמַעֲלוֹת הָאוּלָם, בַּיְּצִיאָה מִן הַהֵיכָל.', x: -27, z: 0, r: 3.5,
    quiz: { q: 'עַל אֵיזֶה הַר עוֹמֵד בֵּית הַמִּקְדָּשׁ, וּמִי נֶעֱקַד עָלָיו עַל גַּבֵּי הַמִּזְבֵּחַ?', a: ['הַר הַמּוֹרִיָּה — יִצְחָק אָבִינוּ', 'הַר סִינַי — יַעֲקֹב אָבִינוּ', 'הַר הַכַּרְמֶל — אֵלִיָּהוּ הַנָּבִיא'], c: 0 },
    info: { t: 'הַר הַמּוֹרִיָּה', b: 'כָּאן עָקַד אַבְרָהָם אֶת יִצְחָק בְּנוֹ — "בְּהַר ה׳ יֵרָאֶה". לְיָמִים קָנָה דָּוִד הַמֶּלֶךְ אֶת גֹּרֶן אֲרַוְנָה הַיְבוּסִי וּבָנָה בּוֹ מִזְבֵּחַ, וְכָאן בָּחַר לְהָקִים אֶת בֵּית ה׳.' } },
  { id: 'hist2', lvl: 4, title: 'תַּחֲנַת יֶדַע: בֵּית הַמִּקְדָּשׁ הָרִאשׁוֹן', hint: 'הַתַּחֲנָה לְיַד הַמִּזְבֵּחַ, מִמִּזְרָח לַכֶּבֶשׁ.', x: 7, z: 8, r: 3.5,
    quiz: { q: 'מִי בָּנָה אֶת בֵּית הַמִּקְדָּשׁ הָרִאשׁוֹן?', a: ['שְׁלֹמֹה הַמֶּלֶךְ', 'דָּוִד הַמֶּלֶךְ', 'הוֹרְדוֹס'], c: 0 },
    info: { t: 'בַּיִת רִאשׁוֹן', b: 'דָּוִד הַמֶּלֶךְ הֵכִין אֶת הַתָּכְנִית וְאֶת הַחֳמָרִים, וּשְׁלֹמֹה בְּנוֹ בָּנָה אֶת הַבַּיִת בְּשֶׁבַע שָׁנִים. בּוֹ שָׁכְנוּ הָאָרוֹן וְהַכְּרוּבִים, וְהוּא עָמַד עַל מְכוֹנוֹ אַרְבַּע מֵאוֹת וְעֶשֶׂר שָׁנִים.' } },
  { id: 'hist3', lvl: 4, title: 'תַּחֲנַת יֶדַע: חֻרְבַּן הַבַּיִת הָרִאשׁוֹן', hint: 'הַתַּחֲנָה בָּעֲזָרָה, לִפְנֵי שַׁעַר נִיקָנוֹר.', x: 14.5, z: -4, r: 3.5,
    quiz: { q: 'מִי הֶחֱרִיב אֶת בֵּית הַמִּקְדָּשׁ הָרִאשׁוֹן?', a: ['נְבוּכַדְנֶאצַּר מֶלֶךְ בָּבֶל', 'טִיטוּס הָרוֹמָאִי', 'אַנְטִיּוֹכוּס הַיְּוָנִי'], c: 0 },
    info: { t: 'חֻרְבַּן בַּיִת רִאשׁוֹן', b: 'בְּתִשְׁעָה בְּאָב שָׂרַף נְבוּזַרְאֲדָן, שַׂר צְבָא נְבוּכַדְנֶאצַּר מֶלֶךְ בָּבֶל, אֶת בֵּית ה׳. יִשְׂרָאֵל גָּלוּ לְבָבֶל שִׁבְעִים שָׁנָה — "עַל נַהֲרוֹת בָּבֶל, שָׁם יָשַׁבְנוּ גַּם בָּכִינוּ".' } },
  { id: 'hist4', lvl: 4, title: 'תַּחֲנַת יֶדַע: בֵּית הַמִּקְדָּשׁ הַשֵּׁנִי', hint: 'הַתַּחֲנָה בְּמֶרְכַּז עֶזְרַת הַנָּשִׁים.', x: 50, z: 0, r: 3.5,
    quiz: { q: 'מִי בָּנָה אֶת בֵּית הַמִּקְדָּשׁ הַשֵּׁנִי?', a: ['שָׁבֵי צִיּוֹן — זְרֻבָּבֶל, וְאַחֲרָיו עֶזְרָא וּנְחֶמְיָה', 'שְׁלֹמֹה הַמֶּלֶךְ', 'רַבִּי יְהוּדָה הַנָּשִׂיא'], c: 0 },
    info: { t: 'בַּיִת שֵׁנִי', b: 'בִּרְשׁוּת כּוֹרֶשׁ מֶלֶךְ פָּרַס עָלוּ שָׁבֵי צִיּוֹן וּבָנוּ אֶת הַבַּיִת הַשֵּׁנִי. לְיָמִים חִדֵּשׁ אוֹתוֹ הוֹרְדוֹס בְּפְאֵר עָצוּם — "מִי שֶׁלֹּא רָאָה בִּנְיַן הוֹרְדוֹס, לֹא רָאָה בִּנְיָן נָאֶה מִיָּמָיו". הַבַּיִת עָמַד אַרְבַּע מֵאוֹת וְעֶשְׂרִים שָׁנָה.' } },
  { id: 'hist5', lvl: 4, title: 'תַּחֲנַת יֶדַע: חֻרְבַּן הַבַּיִת הַשֵּׁנִי', hint: 'הַתַּחֲנָה מִחוּץ לַשַּׁעַר הַמִּזְרָחִי שֶׁל עֶזְרַת הַנָּשִׁים.', x: 79, z: 0, r: 3.5,
    quiz: { q: 'מַדּוּעַ, עַל פִּי חֲכָמֵינוּ, חָרַב בֵּית הַמִּקְדָּשׁ הַשֵּׁנִי?', a: ['בִּגְלַל שִׂנְאַת חִנָּם', 'בִּגְלַל עֲבוֹדָה זָרָה', 'בִּגְלַל בַּצֹּרֶת קָשָׁה'], c: 0 },
    info: { t: 'חֻרְבַּן בַּיִת שֵׁנִי', b: 'בְּתִשְׁעָה בְּאָב הֶחֱרִיב טִיטוּס הָרוֹמָאִי אֶת הַבַּיִת. אָמְרוּ חֲכָמֵינוּ: מִקְדָּשׁ שֵׁנִי, שֶׁהָיוּ עוֹסְקִים בּוֹ בְּתוֹרָה וּבְמִצְווֹת — מִפְּנֵי מָה חָרַב? מִפְּנֵי שִׂנְאַת חִנָּם.' } },

  // ---------- שלב 5 · אהבת חינם והבית השלישי ----------
  { id: 'lost', lvl: 5, title: 'עוֹלֵה רֶגֶל אִבֵּד אֶת דַּרְכּוֹ — גְּשׁוּ אֵלָיו', hint: 'הוּא עוֹמֵד נָבוֹךְ בְּהַר הַבַּיִת, מִצְּפוֹן מִזְרָח לָכֶם.', x: 95, z: 28, r: 3.2, action: '🤝 בוא אחריי!' },
  { id: 'lost2', lvl: 5, title: 'הוֹבִילוּ אוֹתוֹ אֶל שַׁעַר עֶזְרַת הַנָּשִׁים', hint: 'הוּא הוֹלֵךְ אַחֲרֵיכֶם — הַרְאוּ לוֹ אֶת הַדֶּרֶךְ אֶל הַשַּׁעַר!', x: 78, z: 0, r: 3.5, action: '🤗 הגענו!',
    info: { t: 'הַכְנָסַת אוֹרְחִים וְאַהֲבַת יִשְׂרָאֵל', b: '"וְהָלְכוּ עַמִּים רַבִּים וְאָמְרוּ לְכוּ וְנַעֲלֶה אֶל הַר ה׳" — כָּל הַמַּדְרִיךְ אֶת חֲבֵרוֹ בַּדֶּרֶךְ הַיְּשָׁרָה, כְּאִלּוּ בְּנָאוֹ. אַהֲבַת יִשְׂרָאֵל הִיא הַיְּסוֹד שֶׁעָלָיו נִבְנֶה הַבַּיִת.' } },
  { id: 'jug', lvl: 5, title: 'לַכֹּהֵן הַזָּקֵן נִשְׁבַּר כַּד הַשֶּׁמֶן! הָבִיאוּ לוֹ כַּד חָדָשׁ מִלִּשְׁכַּת הַשְּׁמָנִים', hint: 'הַכַּד בְּלִשְׁכַּת הַשְּׁמָנִים — הַפִּנָּה הַדְּרוֹמִית מַעֲרָבִית שֶׁל עֶזְרַת הַנָּשִׁים.', x: 32.5, z: 19.5, r: 2.8, action: '🏺 קחו את הכד' },
  { id: 'jug2', lvl: 5, title: 'מִסְרוּ אֶת הַכַּד לַכֹּהֵן הַזָּקֵן', hint: 'הוּא מַמְתִּין בְּעֶזְרַת הַנָּשִׁים, לְיַד הַשְּׁבָרִים.', x: 55, z: -10, r: 3, action: '🏺 מסרו את הכד',
    info: { t: 'גְּמִילוּת חֲסָדִים', b: '"עַל שְׁלֹשָׁה דְּבָרִים הָעוֹלָם עוֹמֵד: עַל הַתּוֹרָה, וְעַל הָעֲבוֹדָה, וְעַל גְּמִילוּת חֲסָדִים". מַעֲשֵׂה חֶסֶד קָטָן — מְקָרֵב אֶת הַגְּאֻלָּה.' } },
  { id: 'quiz-love', lvl: 5, title: 'תַּחֲנַת יֶדַע: הַבַּיִת הַשְּׁלִישִׁי', hint: 'הַתַּחֲנָה בְּמֶרְכַּז עֶזְרַת הַנָּשִׁים.', x: 50, z: 5, r: 3.5,
    quiz: { q: 'אִם חָרַב הַבַּיִת בְּשִׂנְאַת חִנָּם — בַּמֶּה יִבָּנֶה בֵּית הַמִּקְדָּשׁ הַשְּׁלִישִׁי?', a: ['בְּאַהֲבַת חִנָּם וּבְאַחְדוּת יִשְׂרָאֵל', 'בְּכֶסֶף וְזָהָב בִּלְבַד', 'בְּכֹחַ וּבִגְבוּרָה'], c: 0 },
    info: { t: 'אַהֲבַת חִנָּם', b: 'כָּתַב הָרַב קוּק: "אִם נֶחֱרַבְנוּ, וְנֶחֱרַב הָעוֹלָם עִמָּנוּ, עַל יְדֵי שִׂנְאַת חִנָּם — נָשׁוּב לְהִבָּנוֹת, וְהָעוֹלָם עִמָּנוּ יִבָּנֶה, עַל יְדֵי אַהֲבַת חִנָּם".' } },
  { id: 'stone', lvl: 5, title: 'הַנִּיחוּ אֶבֶן יְסוֹד סִמְלִית לַבַּיִת הַשְּׁלִישִׁי', hint: 'עֲלוּ אֶל רֹאשׁ חֲמֵשׁ עֶשְׂרֵה הַמַּעֲלוֹת, מוּל הָעֲזָרָה, וְהַנִּיחוּ אֶת הָאֶבֶן בְּלֵב מָלֵא אַהֲבָה.', x: 23, z: 5, r: 3, action: '🧱 הניחו את אבן היסוד' },
];

const hotspots = [];
const maxScore = tasks.length * 10;

// ---------- קטעי הקריינות (יחידות קבועות — לשימוש חוזר במטמון) ----------
const taskIntroText = t => 'הַמְּשִׂימָה הַבָּאָה: ' + t.title + '. ' + t.hint;
const infoSpeechText = i => i.t + '. ' + i.b;
const levelIntroText = L => L.name + '. ' + L.desc + ' ' + (L.pasuk || '');
const WIN_SPEECH = 'כָּל הַכָּבוֹד! הִשְׁלַמְתֶּם אֶת הַמַּסָּע אֶל בֵּית הַמִּקְדָּשׁ. יְהִי רָצוֹן שֶׁנִּזְכֶּה בִּמְהֵרָה לְבִנְיַן בֵּית הַמִּקְדָּשׁ הַשְּׁלִישִׁי, בְּאַהֲבַת חִנָּם וּבְאַחְדוּת. לַשָּׁנָה הַבָּאָה בִּירוּשָׁלַיִם הַבְּנוּיָה!';

// כל קטעי הקריינות במשחק — לצורך הקלטה מראש
function allNarrationTexts() {
  const arr = [];
  for (const k of Object.keys(LEVELS)) arr.push(levelIntroText(LEVELS[k]));
  for (const t of tasks) {
    arr.push(taskIntroText(t));
    if (t.info) arr.push(infoSpeechText(t.info));
    if (t.quiz) arr.push(t.quiz.q);
  }
  arr.push(WIN_SPEECH);
  return arr;
}

// עמדות תחנות הידע — עמוד שיש ומגילה
for (const t of tasks) {
  if (!t.quiz) continue;
  const gy = groundY(t.x, t.z);
  const col = cyl(0.38, 0.5, 1.25, M.marble, 10);
  col.position.set(t.x, gy + 0.625, t.z);
  const scroll = cyl(0.13, 0.13, 0.75, M.white, 10);
  scroll.rotation.z = Math.PI / 2;
  scroll.position.set(t.x, gy + 1.4, t.z);
  const band = cyl(0.15, 0.15, 0.12, M.gold, 10);
  band.rotation.z = Math.PI / 2;
  band.position.set(t.x, gy + 1.4, t.z);
  scene.add(col, scroll, band);
}

/* =====================================================================
   מצב משחק, קלט, HUD
   ===================================================================== */
const $ = id => document.getElementById(id);

// ---------- מונה צפיות (counterapi.dev — נספר לכל טעינת דף) ----------
(async () => {
  try {
    const res = await fetch('https://api.counterapi.dev/v1/mikdash-yehonatan-haze/views/up');
    const data = await res.json();
    if (data && typeof data.count === 'number') {
      $('viewsBadge').textContent = '👁️ ' + data.count.toLocaleString('he-IL') + ' צפיות';
      $('viewsBadge').style.display = 'block';
    }
  } catch (e) { /* אין אינטרנט — המונה מוסתר */ }
})();
const state = {
  running: false, done: false, tour: true, mapOpen: false,
  ti: -1, score: 0, lvl: 0,
  px: 100, pz: 0, yaw: Math.PI / 2, pitch: 0, zoom: 0,
  carryBasket: false, sheepFollow: false, pilgrimFollow: false, fireFlare: 0,
  actionReady: false,
};

const keys = {};
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyE') tryAction();
  if (e.code === 'KeyM' && state.running) toggleMap();
  if (e.code === 'Escape' && state.mapOpen) toggleMap();
});
addEventListener('keyup', e => { keys[e.code] = false; });

// ---------- זום (גלגלת + כפתורים) ----------
function setZoom(v) { state.zoom = Math.max(0, Math.min(70, v)); }
addEventListener('wheel', e => { if (state.running) setZoom(state.zoom + e.deltaY * 0.04); }, { passive: true });
$('zoomOut').onclick = () => setZoom(state.zoom + 10);
$('zoomIn').onclick = () => setZoom(state.zoom - 10);

// ---------- מפה ----------
function toggleMap() {
  state.mapOpen = !state.mapOpen;
  $('mapHeader').style.display = state.mapOpen ? 'flex' : 'none';
  mapMarker.visible = state.mapOpen;
  // במפה — תוויות גדולות וקריאות יותר
  const f = state.mapOpen ? 1.9 : 1;
  for (const s of allLabels) s.scale.copy(s.userData.baseScale).multiplyScalar(f);
}
$('mapBtn').onclick = toggleMap;
$('mapClose').onclick = toggleMap;

// ---------- כפתורי קריינות והגדרות קול ----------
$('voiceBtn').onclick = () => {
  narrOn = !narrOn;
  if (!narrOn) stopSpeech();
  else speak('הַקְּרָיְנוּת הֻפְעֲלָה');
  $('voiceBtn').textContent = narrOn ? '🔊 קריינות' : '🔇 קריינות';
};

const TTS_VOICES = {
  gemini: [
    ['Charon', 'קול גבר — Charon (מומלץ)'],
    ['Puck', 'קול גבר — Puck'],
    ['Fenrir', 'קול גבר — Fenrir (נמרץ)'],
    ['Enceladus', 'קול גבר — Enceladus (רגוע)'],
  ],
  cloud: [
    ['he-IL-Wavenet-B', 'קול גבר — Wavenet B (מומלץ)'],
    ['he-IL-Wavenet-D', 'קול גבר — Wavenet D'],
    ['he-IL-Standard-B', 'קול גבר — Standard B'],
    ['he-IL-Standard-D', 'קול גבר — Standard D'],
  ],
};
const TTS_HINTS = {
  gemini: 'מפתח חינמי בקליק, בלי כרטיס אשראי: היכנסו ל־aistudio.google.com/apikey ← לחצו Create API key ← העתיקו והדביקו כאן.',
  cloud: 'דורש פרויקט Google Cloud עם Text-to-Speech API מופעל וחיוב פעיל.',
};
function fillTtsVoices() {
  const list = TTS_VOICES[gTtsEngine] || TTS_VOICES.gemini;
  $('ttsVoice').innerHTML = list.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
  $('ttsVoice').value = list.some(([v]) => v === gTtsVoice) ? gTtsVoice : list[0][0];
  $('ttsHint').textContent = TTS_HINTS[gTtsEngine];
}
$('ttsEngine').onchange = () => {
  gTtsEngine = $('ttsEngine').value;
  fillTtsVoices();
};
$('ttsBtn').onclick = () => {
  $('ttsKey').value = gTtsKey;
  $('ttsEngine').value = gTtsEngine;
  fillTtsVoices();
  $('ttsStatus').textContent = gTtsKey ? '✓ מפתח שמור — קול איכותי פעיל' : 'ללא מפתח — קול הדפדפן הבסיסי';
  $('ttsPanel').style.display = 'block';
};
$('ttsClose').onclick = () => { $('ttsPanel').style.display = 'none'; };
function saveTts() {
  gTtsKey = $('ttsKey').value.trim();
  gTtsEngine = $('ttsEngine').value;
  gTtsVoice = $('ttsVoice').value;
  localStorage.setItem('mikdash_tts_key', gTtsKey);
  localStorage.setItem('mikdash_tts_engine', gTtsEngine);
  localStorage.setItem('mikdash_tts_voice', gTtsVoice);
  ttsCache.clear();
}
$('ttsSave').onclick = () => {
  saveTts();
  $('ttsStatus').textContent = gTtsKey ? '✓ נשמר! הקריינות תשתמש בקול Google Cloud' : 'נשמר ללא מפתח — קול הדפדפן';
};
$('ttsTest').onclick = async () => {
  saveTts();
  $('ttsStatus').textContent = '⏳ בודק את הקול...';
  const sample = 'שָׁלוֹם! כָּךְ אֶשָּׁמַע בַּמִּשְׂחָק. בְּרוּכִים הַבָּאִים אֶל בֵּית הַמִּקְדָּשׁ.';
  stopSpeech();
  if (gTtsKey) {
    const ok = await speakCloud(sample);
    $('ttsStatus').textContent = ok ? '✓ מצוין! הקול פועל'
      : (gTtsEngine === 'gemini'
        ? '✗ שגיאה — בדקו שהמפתח הועתק במלואו מ־aistudio.google.com/apikey'
        : '✗ שגיאה — בדקו שהמפתח תקין ושה־Text-to-Speech API מופעל בפרויקט');
  } else {
    speakLocal(sample);
    $('ttsStatus').textContent = 'הושמע קול הדפדפן (אין מפתח API)';
  }
};

// ---------- הקלטת כל הקריינות מראש ----------
// עובר על כל קטעי הקריינות במשחק ומקליט אותם למטמון הקבוע, בקצב איטי
// שמכבד את מגבלות המפתח החינמי. ניתן לעצור ולהמשיך — ההתקדמות נשמרת.
let pregenActive = false;
const sleep = ms => new Promise(r => setTimeout(r, ms));
$('ttsPregen').onclick = async () => {
  if (pregenActive) {
    pregenActive = false;
    $('ttsPregen').textContent = '🎧 הקלטת כל הקריינות מראש';
    return;
  }
  saveTts();
  if (!gTtsKey) { $('ttsStatus').textContent = 'נדרש מפתח API כדי להקליט מראש'; return; }
  pregenActive = true;
  $('ttsPregen').textContent = '⏸ עצירה (ההתקדמות נשמרת)';
  const texts = allNarrationTexts();
  let done = 0, fetched = 0, consecFails = 0;
  for (const text of texts) {
    if (!pregenActive) break;
    let r = await prefetchTts(text);
    if (r === 'failed') {
      // אולי מגבלת קצב — ממתינים ומנסים שוב
      $('ttsStatus').textContent = `⏳ ממתין בגלל מגבלת קצב... (${done}/${texts.length})`;
      await sleep(25000);
      if (!pregenActive) break;
      r = await prefetchTts(text);
    }
    done++;
    if (r === 'fetched') { fetched++; consecFails = 0; await sleep(7000); }
    else if (r === 'failed') {
      consecFails++;
      if (consecFails >= 3) {
        $('ttsStatus').textContent = `⚠️ כנראה הגעתם למגבלה היומית של המפתח (הוקלטו ${done - consecFails}/${texts.length}). ההתקדמות נשמרה — חזרו מחר ולחצו שוב להמשך.`;
        pregenActive = false;
        $('ttsPregen').textContent = '🎧 המשך הקלטה מראש';
        return;
      }
    } else { consecFails = 0; }
    $('ttsStatus').textContent = `🎧 הוקלטו ${done}/${texts.length} קטעים...`;
  }
  $('ttsPregen').textContent = '🎧 הקלטת כל הקריינות מראש';
  if (pregenActive) $('ttsStatus').textContent = `✓ הושלם! כל ${texts.length} קטעי הקריינות שמורים בדפדפן — המשחק ידבר בלי שום פנייה ל־API.`;
  else $('ttsStatus').textContent = `הופסק. הוקלטו ${done}/${texts.length} — ההתקדמות נשמרה.`;
  pregenActive = false;
};

// ---------- ייצוא חבילת קול לשיתוף ----------
// אורז את כל הקריינות המוקלטת לקובץ אחד, כדי שתיסע יחד עם המשחק
// לכל מי שיפתח את הקישור. הדחיסה נעשית אחר כך בכלי חיצוני.
$('ttsExport').onclick = async () => {
  const texts = allNarrationTexts();
  const pack = {};
  let packed = 0, missing = 0;
  $('ttsExport').disabled = true;
  $('ttsStatus').textContent = '📦 אורז...';
  for (const text of texts) {
    const key = gTtsEngine + '|' + gTtsVoice + '|' + text;
    const url = ttsCache.get(key) || await dbGetAudio(key);
    if (url) { pack[text] = url; packed++; } else { missing++; }
  }
  $('ttsExport').disabled = false;
  if (!packed) {
    $('ttsStatus').textContent = '✗ אין קריינות מוקלטת לייצוא — לחצו קודם על "הקלטת כל הקריינות מראש".';
    return;
  }
  const json = JSON.stringify(pack);
  const a2 = document.createElement('a');
  a2.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a2.download = 'voicepack.json';
  a2.click();
  setTimeout(() => URL.revokeObjectURL(a2.href), 4000);
  $('ttsStatus').textContent = `✓ נארזו ${packed} מתוך ${texts.length} קטעים (${(json.length / 1048576).toFixed(1)}MB). הקובץ voicepack.json ירד לתיקיית ההורדות.`
    + (missing ? ` — ${missing} קטעים עדיין חסרים, הקליטו אותם קודם.` : '');
};

// ---------- חידון ----------
let quizTask = null;
function openQuiz(t) {
  quizTask = t;
  speak(t.quiz.q);
  $('quizQ').textContent = t.quiz.q;
  const wrap = $('quizAnswers');
  wrap.innerHTML = '';
  const shuffled = t.quiz.a.map((ans, i) => ({ ans, correct: i === t.quiz.c }))
    .sort(() => Math.random() - 0.5);
  shuffled.forEach(({ ans, correct }) => {
    const b = document.createElement('button');
    b.className = 'ansBtn';
    b.textContent = ans;
    b.onclick = () => {
      if (correct) {
        $('quizPanel').style.display = 'none';
        quizTask = null;
        tone(880, 0.4, 'triangle', 0.18);
        completeTask();
      } else {
        b.classList.add('wrongAns');
        tone(196, 0.35, 'sawtooth', 0.1);
        setTimeout(() => b.classList.remove('wrongAns'), 600);
      }
    };
    wrap.appendChild(b);
  });
  $('quizPanel').style.display = 'block';
}

// ---------- הסתכלות בגרירה (עם מעקב אצבע, לתמיכה בריבוי־מגע) ----------
let lookId = null, lastX = 0, lastY = 0;
renderer.domElement.addEventListener('pointerdown', e => {
  if (lookId !== null) return;              // אצבע אחת כבר מסתכלת
  lookId = e.pointerId; lastX = e.clientX; lastY = e.clientY;
});
addEventListener('pointermove', e => {
  if (e.pointerId !== lookId) return;
  state.yaw -= (e.clientX - lastX) * 0.0038;
  state.pitch -= (e.clientY - lastY) * 0.0032;
  state.pitch = Math.max(-1.15, Math.min(1.15, state.pitch));
  lastX = e.clientX; lastY = e.clientY;
});
for (const ev of ['pointerup', 'pointercancel']) {
  addEventListener(ev, e => { if (e.pointerId === lookId) lookId = null; });
}

// ---------- ג'ויסטיק מגע: ציר Y = הליכה, ציר X = פנייה ----------
const joy = { id: null, fwd: 0, turn: 0 };
{
  const base = $('joyBase'), knob = $('joyKnob');
  const RAD = 46;
  const setKnob = (dx, dy) => { knob.style.transform = `translate(${dx}px, ${dy}px)`; };
  const update = e => {
    const r = base.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy);
    if (d > RAD) { dx = dx / d * RAD; dy = dy / d * RAD; }
    setKnob(dx, dy);
    joy.fwd = -dy / RAD;                    // למעלה = קדימה
    joy.turn = -dx / RAD;                   // ימינה = פנייה ימינה
  };
  base.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    joy.id = e.pointerId;
    base.setPointerCapture(e.pointerId);
    update(e);
  });
  base.addEventListener('pointermove', e => {
    if (e.pointerId !== joy.id) return;
    e.preventDefault(); e.stopPropagation();
    update(e);
  });
  const release = e => {
    if (e.pointerId !== joy.id) return;
    joy.id = null; joy.fwd = 0; joy.turn = 0;
    setKnob(0, 0);
  };
  base.addEventListener('pointerup', release);
  base.addEventListener('pointercancel', release);
}

// הפעלת ממשק המגע — אוטומטית במכשירי מגע, או ידנית עם ‎?touch=1 לבדיקה
const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0
  || new URLSearchParams(location.search).has('touch');
if (isTouchDevice) document.body.classList.add('touch');

const PR = 0.5; // רדיוס שחקן
function blocked(x, z) {
  for (const c of colliders) {
    if (x > c.x1 - PR && x < c.x2 + PR && z > c.z1 - PR && z < c.z2 + PR) return true;
  }
  return false;
}

// ---------- HUD ----------
let infoTimer = null;
function showInfo(t, b, noSpeak) {
  $('infoTitle').textContent = t;
  $('infoBody').textContent = b;
  $('infoPanel').style.display = 'block';
  if (!noSpeak) speak(t + '. ' + b);
  clearTimeout(infoTimer);
  infoTimer = setTimeout(() => { $('infoPanel').style.display = 'none'; }, 11000);
}
$('infoClose').onclick = () => { $('infoPanel').style.display = 'none'; };

let toastTimer = null;
function showToast(text) {
  const el = $('toast');
  el.textContent = text;
  el.style.opacity = '1';
  el.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(-30px)';
  }, 1800);
}

function addScore(n) {
  state.score += n;
  $('kedushaNum').textContent = state.score;
  $('kedushaFill').style.width = (state.score / maxScore * 100) + '%';
}

function showLevel(lvl) {
  const L = LEVELS[lvl];
  $('levelName').textContent = L.name;
  $('levelDesc').textContent = L.desc + (L.pasuk ? ' — "' + L.pasuk + '"' : '');
  $('levelOverlay').style.display = 'flex';
  setTimeout(() => { $('levelOverlay').style.display = 'none'; }, 4200);
}

function updateMissionHUD() {
  const t = tasks[state.ti];
  if (!t) return;
  $('missionLevel').textContent = LEVELS[t.lvl].name;
  $('missionTitle').textContent = '🎯 ' + t.title;
  $('missionHint').textContent = t.hint;
}

function nextTask() {
  state.ti++;
  if (state.ti >= tasks.length) { winGame(); return; }
  const t = tasks[state.ti];
  if (t.lvl !== state.lvl) { state.lvl = t.lvl; showLevel(t.lvl); }
  updateMissionHUD();
  beacon.visible = true;
  beacon.position.set(t.x, groundY(t.x, t.z) + 0.05, t.z);
}

// ---------- אפקטים של משימות ----------
function taskFx(t) {
  switch (t.id) {
    case 'basket-take':
      basket.parent.remove(basket);
      camera.add(basket);
      basket.position.set(0.55, -0.55, -1.15);
      basket.scale.setScalar(0.8);
      state.carryBasket = true;
      break;
    case 'basket-give':
      camera.remove(basket);
      scene.add(basket);
      basket.scale.setScalar(1);
      basket.position.set(4.2, 2.5, 9.4);
      state.carryBasket = false;
      break;
    case 'sheep-take':
      state.sheepFollow = true;
      break;
    case 'sheep-give':
      state.sheepFollow = false;
      burst(korbanSheep.position.x, korbanSheep.position.y + 1, korbanSheep.position.z, 0xffffff, 20);
      korbanSheep.visible = false;
      state.fireFlare = 4;
      break;
    case 'kiyor-work':
      burst(-16, 4.6, 9, 0x6fd0ff, 30);
      break;
    case 'menorah-work':
      menorahFlames.forEach((f, fi) => setTimeout(() => { f.visible = true; }, fi * 220));
      menorahLight.intensity = 30;
      break;
    case 'ketoret':
      ketoretSmoke.active = true;
      break;
    case 'lechem':
      loavesGroup.visible = true;
      break;
    case 'parochet-open': {
      state.parochetOpen = true;
      const pi = colliders.indexOf(parochetCollider);
      if (pi >= 0) colliders.splice(pi, 1);
      kodeshLight.intensity = 40;
      shechinaPillar.visible = true;
      burst(-52, 9, 0, 0xfff2c8, 24);
      break;
    }
    case 'kodesh':
      burst(-55.2, 6.5, 0, 0xfff2c8, 32);
      bigDing();
      break;
    case 'lost':
      state.pilgrimFollow = true;
      break;
    case 'lost2':
      state.pilgrimFollow = false;
      pilgrim.rotation.y = Math.PI / 2; // פונה אל השער
      burst(pilgrim.position.x, pilgrim.position.y + 1.6, pilgrim.position.z, 0xffd76e, 16);
      break;
    case 'jug':
      jug.parent.remove(jug);
      camera.add(jug);
      jug.position.set(0.5, -0.5, -1.05);
      jug.scale.setScalar(0.9);
      break;
    case 'jug2':
      camera.remove(jug);
      scene.add(jug);
      jug.scale.setScalar(1);
      jug.position.set(55.9, 0, -9.2);
      burst(55, 1.6, -10, 0xffd76e, 20);
      break;
    case 'stone': { // הסיום הגדול
      foundationStone.visible = true;
      menorahFlames.forEach(f => { f.visible = true; });
      menorahLight.intensity = 30;
      ketoretSmoke.active = true;
      loavesGroup.visible = true;
      state.fireFlare = 7;
      const spots = [[23, 2, 5], [-2, 9.5, 0], [-24, 8, 0], [50, 2, 0], [70, 2, 0], [-16, 5, 9]];
      spots.forEach(([bx, by, bz], i) => {
        setTimeout(() => burst(bx, by, bz, i % 2 ? 0xffd76e : 0xfff2c8, 24), i * 350);
      });
      bigDing();
      break;
    }
  }
}

function completeTask() {
  const t = tasks[state.ti];
  taskFx(t);
  addScore(10);
  showToast('+10 קדושה ✨');
  dingSound();
  burst(t.x, groundY(t.x, t.z) + 1.2, t.z);
  if (t.info) showInfo(t.info.t, t.info.b, true);
  // קריינות אוטומטית לכל משימה: המידע שהושלם ← פתיחת שלב (אם יש) ← המשימה הבאה
  const next = tasks[state.ti + 1];
  const parts = [];
  if (t.info) parts.push(infoSpeechText(t.info));
  if (next && next.lvl !== t.lvl) parts.push(levelIntroText(LEVELS[next.lvl]));
  if (next) parts.push(taskIntroText(next));
  if (parts.length) speak(parts);
  $('actionBtn').style.display = 'none';
  state.actionReady = false;
  nextTask();
}

function tryAction() {
  if (state.actionReady && state.running && !state.done) completeTask();
}
$('actionBtn').onclick = tryAction;

function winGame() {
  state.done = true;
  beacon.visible = false;
  $('missionTitle').textContent = '🎉 כל המשימות הושלמו!';
  $('missionHint').textContent = 'סיירו חופשי במקדש — או התחילו מסע חדש.';
  $('missionDist').textContent = '';
  bigDing();
  speak(WIN_SPEECH);
  $('endList').innerHTML =
    '<b>במסע שלך הכרת:</b><br>' +
    '🕎 <b>כלי המקדש</b> — מזבח העולה וחוט הסקרא, הכבש, הכיור, המנורה, שולחן לחם הפנים, מזבח הזהב והפרוכת<br>' +
    '🏛️ <b>לשכות המקדש</b> — לשכת הגזית של הסנהדרין, בית המוקד, בית המטבחיים, הדוכן וארבע לשכות עזרת הנשים<br>' +
    '🐑 <b>עבודת המקדש</b> — ביכורים, קרבן התמיד, קידוש ידיים ורגליים, הדלקת הנרות, הקטרת הקטורת וסידור לחם הפנים<br>' +
    '📜 <b>תולדות הר המוריה</b> — מעקידת יצחק, דרך בית ראשון ובית שני, ועד החורבן בשנאת חינם<br>' +
    '❤️ <b>אהבת חינם</b> — במעשי חסד ובאחדות ישראל נזכה לבניין בית המקדש השלישי — "לשנה הבאה בירושלים הבנויה!"';
  setTimeout(() => {
    $('endScore').textContent = `אספת ${state.score} מתוך ${maxScore} נקודות קדושה ✨`;
    $('endOverlay').style.display = 'flex';
  }, 2600);
}

$('restartBtn').onclick = () => location.reload();
$('startBtn').onclick = () => {
  $('startOverlay').style.display = 'none';
  $('hud').style.opacity = '1';
  $('mapBtn').style.display = 'block';
  $('voiceBtn').style.display = 'block';
  $('ttsBtn').style.display = 'block';
  $('zoomBtns').style.display = 'flex';
  $('zoomHint').style.display = 'block';
  audioInit();
  state.tour = false;
  state.running = true;
  nextTask();
  // קריינות פתיחה: השלב הראשון + המשימה הראשונה
  speak([levelIntroText(LEVELS[1]), taskIntroText(tasks[0])]);
};

/* =====================================================================
   לולאת המשחק
   ===================================================================== */
const clock = new THREE.Clock();
let camY = groundY(state.px, state.pz) + 1.7;

// ממשק בדיקה (דיבאג)
window.__game = {
  state, keys, tryAction, blocked, frames: 0,
  audio: () => ({ AC, masterGain, pluck, cymbal, pluckBuffer, PSALMS, degToFreq }),
  ttsProbe: text => getTtsUrl(text),
  narrationTexts: () => allNarrationTexts(),
  teleport(x, z, yaw) { state.px = x; state.pz = z; if (yaw !== undefined) state.yaw = yaw; },
};

let dtOverride = null;
function animate() {
  window.__game.frames++;
  const dt = dtOverride !== null ? dtOverride : Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;

  // --- סיור פתיחה: מעוף ציפור סביב המקדש ---
  if (state.tour) {
    tourT += dt * 0.016;
    const p = tourCurve.getPointAt(tourT % 1);
    camera.position.copy(p);
    camera.lookAt(-12, 9, 0);
  }

  // --- תנועה ---
  if (state.running && !state.mapOpen && !quizTask) {
    const rot = (keys['ArrowLeft'] ? 1 : 0) - (keys['ArrowRight'] ? 1 : 0) + joy.turn;
    state.yaw += rot * 2.1 * dt;
    const keyFwd = (keys['ArrowUp'] || keys['KeyW'] ? 1 : 0) - (keys['ArrowDown'] || keys['KeyS'] ? 1 : 0);
    const fwd = Math.max(-1, Math.min(1, keyFwd + joy.fwd));
    const strafe = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
    const speed = 8.5;
    if (fwd || strafe) {
      const sy = Math.sin(state.yaw), cy = Math.cos(state.yaw);
      const dx = (-sy * fwd + cy * strafe) * speed * dt;
      const dz = (-cy * fwd - sy * strafe) * speed * dt;
      const nx = state.px + dx;
      if (!blocked(nx, state.pz)) state.px = nx;
      const nz = state.pz + dz;
      if (!blocked(state.px, nz)) state.pz = nz;
      state.px = Math.max(-105, Math.min(115, state.px));
      state.pz = Math.max(-95, Math.min(95, state.pz));
      camY += Math.sin(time * 9) * 0.012; // ניענוע הליכה עדין
    }
  }
  if (!state.tour) {
    const targetY = groundY(state.px, state.pz) + 1.7;
    camY += (targetY - camY) * Math.min(1, dt * 10);
    if (state.zoom < 0.5) {
      // גוף ראשון
      camera.position.set(state.px, camY, state.pz);
      camera.rotation.set(state.pitch, state.yaw, 0);
      avatar.visible = false;
    } else {
      // מבט מרחוק / מלמעלה — רואים את הדמות
      const tilt = Math.max(0.15, Math.min(1.35, 0.5 - state.pitch));
      const sy = Math.sin(state.yaw), cy = Math.cos(state.yaw);
      const hd = state.zoom * Math.cos(tilt), vd = state.zoom * Math.sin(tilt);
      camera.position.set(state.px + sy * hd, camY + vd, state.pz + cy * hd);
      camera.lookAt(state.px - sy * 5, camY, state.pz - cy * 5);
      avatar.visible = true;
      avatar.position.x = state.px;
      avatar.position.z = state.pz;
      avatar.rotation.y = state.yaw + Math.PI; // גב אל המצלמה, פנים לכיוון ההליכה
    }
  }

  // --- משימה נוכחית ---
  if (state.running && !state.done && state.ti >= 0) {
    const t = tasks[state.ti];
    const d = Math.hypot(state.px - t.x, state.pz - t.z);
    $('missionDist').textContent = '📍 מרחק: ' + Math.round(d) + ' מ׳';
    if (d < t.r) {
      if (t.quiz) {
        if (!quizTask) openQuiz(t);
      } else if (t.action) {
        if (!state.actionReady) {
          state.actionReady = true;
          $('actionBtn').textContent = t.action;
          $('actionBtn').style.display = 'block';
        }
      } else completeTask();
    } else if (state.actionReady) {
      state.actionReady = false;
      $('actionBtn').style.display = 'none';
    }
  }

  // --- נקודות מידע ---
  if (state.running) {
    for (const h of hotspots) {
      if (h.done) continue;
      if (Math.hypot(state.px - h.x, state.pz - h.z) < h.r) {
        h.done = true;
        addScore(5);
        showToast('+5 קדושה · ' + h.t);
        showInfo(h.t, h.b);
        tone(880, 0.4, 'sine', 0.14);
      }
    }
  }

  // --- הפרוכת נפתחת (מחליקה הצידה) ---
  if (state.parochetOpen && parochetGroup.position.z > -7.8) {
    parochetGroup.position.z -= dt * 3.5;
  }

  // --- עמוד האור ---
  if (beacon.visible) {
    beacon.rotation.y += dt * 0.8;
    const p = 0.28 + Math.sin(time * 3) * 0.1;
    beacon.children[0].material.opacity = p;
  }

  // --- אש המזבח ---
  if (state.fireFlare > 0) state.fireFlare -= dt;
  const flare = 1 + Math.max(0, state.fireFlare) * 0.35;
  fireGroup.children[0].scale.set(flare * (1 + Math.sin(time * 11) * 0.12), flare * (1 + Math.sin(time * 13.7) * 0.18), flare * (1 + Math.cos(time * 12) * 0.12));
  fireGroup.children[1].scale.copy(fireGroup.children[0].scale);
  fireGroup.children[2].intensity = 2 + Math.sin(time * 15) * 0.5 + Math.max(0, state.fireFlare);

  // --- נרות המנורה ---
  for (const f of menorahFlames) {
    if (f.visible) f.scale.y = 1 + Math.sin(time * 12 + f.position.x * 5) * 0.25;
  }

  // --- עשן ---
  for (const em of smokeEmitters) {
    for (const sp of em.sprites) {
      const u = sp.userData;
      if (!em.active) { sp.material.opacity = 0; continue; }
      const t2 = (time * em.speed + u.phase) % 1;
      sp.position.set(
        u.base.x + u.jx * t2 * 3,
        u.base.y + t2 * u.height,
        u.base.z + u.jz * t2 * 3);
      const s = u.size * (0.5 + t2 * 2.2);
      sp.scale.set(s, s, 1);
      sp.material.opacity = Math.min(t2 * 6, 1 - t2) * 0.42;
    }
  }

  // --- ניצוצות ---
  for (const p of sparkPool) {
    if (p.life <= 0) continue;
    p.life -= dt;
    if (p.life <= 0) { p.mesh.visible = false; continue; }
    p.vel.y -= 5.5 * dt;
    p.mesh.position.addScaledVector(p.vel, dt);
    p.mesh.material.opacity = Math.min(1, p.life);
    p.mesh.rotation.x += dt * 6; p.mesh.rotation.z += dt * 5;
  }

  // --- דמויות: אנימציות עבודה ונגינה ---
  for (const n of npcs) {
    const u = n.userData;
    const t2 = time + u.bobPhase;
    if (u.anim === 'walk' && u.patrol) {
      u.patrolT = (u.patrolT + dt * 1.1 / u.patrolLen) % 2;
      const k = u.patrolT < 1 ? u.patrolT : 2 - u.patrolT;
      n.position.x = u.patrol[0] + (u.patrol[2] - u.patrol[0]) * k;
      n.position.z = u.patrol[1] + (u.patrol[3] - u.patrol[1]) * k;
      const dir = u.patrolT < 1 ? 1 : -1;
      n.rotation.y = Math.atan2((u.patrol[2] - u.patrol[0]) * dir, (u.patrol[3] - u.patrol[1]) * dir);
    }
    n.position.y = groundY(n.position.x, n.position.z) + Math.sin(t2 * 2) * 0.025;
    const L = u.armL, R = u.armR;
    if (!L) continue;
    switch (u.anim) {
      case 'harp': { // פורט על הנבל / הכינור — היד נעה עם כל תו שנשמע
        const sp = time - pluckFlash;
        const hit = pluckFlash > 0 && sp < 0.9 ? Math.exp(-sp * 3.2) : 0;
        L.rotation.x = -0.85; L.rotation.z = -0.25;
        R.rotation.x = -0.62 - hit * 0.42 + Math.sin(t2 * 1.5) * 0.05;
        R.rotation.z = 0.2;
        break;
      }
      case 'cymbal': { // מקיש במצלתיים — בדיוק ברגע שהמצלתיים נשמעות
        const since = time - cymbalFlash;
        const c = cymbalFlash > 0 && since < 0.7 ? Math.exp(-since * 4.5) : 0;
        L.rotation.x = -1.2; R.rotation.x = -1.2;
        L.rotation.z = -(0.52 - c * 0.44);
        R.rotation.z = 0.52 - c * 0.44;
        break;
      }
      case 'wash': // מקדש ידיים ורגליים
        L.rotation.x = -0.5 + Math.sin(t2 * 3.2) * 0.25;
        R.rotation.x = -0.5 + Math.sin(t2 * 3.2 + Math.PI) * 0.25;
        break;
      case 'raise': // נושא כפיו בעבודה
        L.rotation.x = -2.25 + Math.sin(t2 * 1.6) * 0.15; L.rotation.z = -0.3;
        R.rotation.x = -2.25 + Math.sin(t2 * 1.6 + 0.5) * 0.15; R.rotation.z = 0.3;
        break;
      case 'tend': // מסדר את המערכה על המזבח
        L.rotation.x = -1.05 + Math.sin(t2 * 2.4) * 0.45;
        R.rotation.x = -1.05 + Math.sin(t2 * 2.4 + Math.PI / 2) * 0.45;
        break;
      case 'walk': // תנופת ידיים בהליכה
        L.rotation.x = Math.sin(t2 * 5) * 0.5;
        R.rotation.x = -Math.sin(t2 * 5) * 0.5;
        break;
      default: // עמידה רגועה
        L.rotation.x = Math.sin(t2 * 1.6) * 0.07 - 0.05;
        R.rotation.x = Math.sin(t2 * 1.6 + 1) * 0.07 - 0.05;
    }
  }

  // --- כבש עוקב ---
  if (state.sheepFollow) {
    const dx = state.px - korbanSheep.position.x, dz = state.pz - korbanSheep.position.z;
    const d = Math.hypot(dx, dz);
    if (d > 2.3) {
      const sp2 = Math.min(5, d) * dt;
      korbanSheep.position.x += (dx / d) * sp2 * 1.6;
      korbanSheep.position.z += (dz / d) * sp2 * 1.6;
      korbanSheep.rotation.y = Math.atan2(dx, dz) - Math.PI / 2;
      korbanSheep.position.y = groundY(korbanSheep.position.x, korbanSheep.position.z) + Math.abs(Math.sin(time * 8)) * 0.06;
    }
  }
  // כבשים בדיר מנענעים ראש
  for (const s of sheepList) {
    if (s === korbanSheep && state.sheepFollow) continue;
    s.rotation.y += Math.sin(time * 0.7 + s.position.x) * 0.002;
  }

  // --- עולה הרגל עוקב ---
  if (state.pilgrimFollow) {
    const dx = state.px - pilgrim.position.x, dz = state.pz - pilgrim.position.z;
    const d = Math.hypot(dx, dz);
    if (d > 2.6) {
      const sp2 = Math.min(6, d) * dt * 1.5;
      pilgrim.position.x += (dx / d) * sp2;
      pilgrim.position.z += (dz / d) * sp2;
      pilgrim.rotation.y = Math.atan2(dx, dz);
    }
  }

  // --- שירת הלוויים בקרבת הדוכן ---
  if (AC && state.running) {
    const d = Math.hypot(state.px - 21, state.pz);
    if (d < 26) {
      playLevites(time, d);
      if ($('psalmNow').style.display !== 'block') $('psalmNow').style.display = 'block';
      $('psalmNow').textContent = '🎵 ' + (curPsalmName || PSALMS[psalmIdx].name + ' · ' + PSALMS[psalmIdx].ref);
      $('psalmNow').style.opacity = String(Math.min(1, (26 - d) / 8));
    } else if ($('psalmNow').style.display === 'block') {
      $('psalmNow').style.display = 'none';
    }
  }

  // --- רינדור: מבט רגיל או מפת־על ---
  if (state.mapOpen) {
    mapMarker.position.set(state.px, 40, state.pz);
    mapMarker.rotation.y = state.yaw;
    const fog = scene.fog;
    scene.fog = null;
    renderer.render(scene, mapCam);
    scene.fog = fog;
  } else {
    renderer.render(scene, camera);
  }
}
renderer.setAnimationLoop(animate);
// גיבוי: המשך ריצה גם כשהלשונית מוסתרת (rAF מושהה)
setInterval(() => { if (document.hidden) animate(); }, 33);
window.__game.tick = animate;
window.__game.step = (dt) => { dtOverride = dt; animate(); dtOverride = null; };
