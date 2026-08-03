// ================= Inicio =================
const startScreen = document.getElementById('start-screen');
const audio = document.getElementById('audio');
audio.preload = 'auto';
audio.load();

let experienceStarted = false;
function unlockAudioAndStart() {
  if (experienceStarted) return;
  experienceStarted = true;
  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(err => console.log("Audio no autoplay:", err));
  }
  startScreen.classList.add('hidden');
}
startScreen.addEventListener('touchend', (e) => {
  e.preventDefault();
  unlockAudioAndStart();
}, {passive: false});
startScreen.addEventListener('click', unlockAudioAndStart);

const isMobile = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent) || window.innerWidth <= 820;

// ================= Botón de mensaje =================
const letterBtn = document.getElementById('love-letter-btn');
const letterOverlay = document.getElementById('love-letter-overlay');
const letterClose = document.getElementById('love-letter-close');
function openLetter(){ letterOverlay.classList.add('visible'); }
function closeLetter(){ letterOverlay.classList.remove('visible'); }
letterBtn.addEventListener('click', openLetter);
letterClose.addEventListener('click', closeLetter);
letterOverlay.addEventListener('click', (e) => { if (e.target === letterOverlay) closeLetter(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLetter(); });

// ================= Escena Three.js =================
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({canvas, antialias: !isMobile});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 5000);

let targetDist = 400, currentDist = 400;
let rotX = 0.2;
let rotY = 0;

const loader = new THREE.TextureLoader();
loader.setCrossOrigin('anonymous');
loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/cube/MilkyWay/dark-s_px.jpg',
  (tex) => { scene.background = tex; },
  undefined,
  () => { console.log('Nebulosa de fondo no disponible (sin conexion): se usa el fondo por defecto.'); }
);

function makeDotTexture(){
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  grad.addColorStop(0.0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.55, 'rgba(255,255,255,1)');
  grad.addColorStop(0.85, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
const dotTexture = makeDotTexture();

(function makeStars(count = isMobile ? 1400 : 2200, spread=3000){
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for(let i=0; i<count; i++){
    const r = spread * (0.3 + Math.random() * 0.7);
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i*3+0] = r * Math.sin(ph) * Math.cos(th);
    pos[i*3+1] = r * Math.cos(ph);
    pos[i*3+2] = r * Math.sin(ph) * Math.sin(th);
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({
    size: 2.2,
    sizeAttenuation: false,
    map: dotTexture,
    transparent: true,
    alphaTest: 0.01,
    depthWrite: false,
    opacity: 0.9,
    color: 0xffe6f2
  })));
})();

function heartCurve(t){
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
  return { x, y };
}

const HEART_SCALE = 3.2;
const HEART_THICKNESS = 3.4;
const HEART_DEPTH = 8.5;
const HEART_Y_OFFSET = 6;

const heartPoints = [];
const HEART_COUNT = isMobile ? 4400 : 5800;
for (let i = 0; i < HEART_COUNT; i++) {
  const t = Math.random() * Math.PI * 2;
  const p0 = heartCurve(t);
  const p1 = heartCurve(t + 0.001);
  const tx = p1.x - p0.x, ty = p1.y - p0.y;
  const tLen = Math.hypot(tx, ty) || 1;
  const nx = -ty / tLen, ny = tx / tLen;
  const offset = (Math.random() - 0.5) * HEART_THICKNESS;

  const rawX = p0.x + nx * offset;
  const rawY = p0.y + ny * offset + HEART_Y_OFFSET;

  heartPoints.push(new THREE.Vector3(
    rawX * HEART_SCALE,
    rawY * HEART_SCALE,
    (Math.random() - 0.5) * HEART_DEPTH
  ));
}
const heartGeom = new THREE.BufferGeometry().setFromPoints(heartPoints);
const heartMat = new THREE.PointsMaterial({
  color: 0xff3399,
  size: 1.2,
  map: dotTexture,
  transparent: true,
  alphaTest: 0.01,
  depthWrite: false,
  opacity: 0.95,
  blending: THREE.AdditiveBlending
});
const heart = new THREE.Points(heartGeom, heartMat);
scene.add(heart);

const spiralPoints = [];
const arms = 4;
const SPIRAL_COUNT = isMobile ? 3400 : 5200;
for (let i = 0; i < SPIRAL_COUNT; i++) {
  const r = Math.random() * 250; 
  const armIndex = Math.floor(Math.random() * arms);
  const theta = (armIndex * Math.PI * 2 / arms) + (r * 0.02) + (Math.random() * 0.4 - 0.2);
  const sx = Math.cos(theta) * r;
  const sz = Math.sin(theta) * r;
  const sy = -35 - (r * 0.4) + (Math.random() * 8 - 4); 
  spiralPoints.push(new THREE.Vector3(sx, sy, sz));
}
const spiralGeom = new THREE.BufferGeometry().setFromPoints(spiralPoints);
const spiralMat = new THREE.PointsMaterial({
  color: 0xff3399,
  size: 1.2,
  map: dotTexture,
  transparent: true,
  alphaTest: 0.01,
  depthWrite: false,
  opacity: 0.95,
  blending: THREE.AdditiveBlending
});
const spiral = new THREE.Points(spiralGeom, spiralMat);
scene.add(spiral);

const DUST_INNER_R = 150;
const DUST_OUTER_R = 380;
const dustPoints = [];
const DUST_COUNT = isMobile ? 7000 : 14000;
for (let i = 0; i < DUST_COUNT; i++) {
  const r = DUST_INNER_R + Math.random() * (DUST_OUTER_R - DUST_INNER_R);
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  dustPoints.push(new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  ));
}
const dustGeom = new THREE.BufferGeometry().setFromPoints(dustPoints);
const dustMat = new THREE.PointsMaterial({
  color: 0xffc2e6,
  size: 1.0,
  map: dotTexture,
  transparent: true,
  alphaTest: 0.01,
  depthWrite: false,
  opacity: 0.55,
  blending: THREE.AdditiveBlending
});
const dust = new THREE.Points(dustGeom, dustMat);
scene.add(dust);

const hitSphere = new THREE.Mesh(
  new THREE.SphereGeometry(62, 16, 16),
  new THREE.MeshBasicMaterial({visible: false})
);
scene.add(hitSphere);

function makeGlow(size=768, c1='255,51,153', c2='255,102,204'){
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size/2, size/2, size*0.05, size/2, size/2, size*0.5);
  grad.addColorStop(0, 'rgba(' + c1 + ',0.7)');
  grad.addColorStop(0.5, 'rgba(' + c2 + ',0.2)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
const glow = new THREE.Sprite(new THREE.SpriteMaterial({map: makeGlow(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
glow.scale.set(450, 450, 1);
scene.add(glow);

function ringTexture(size=768){
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); g.translate(size/2, size/2);
  const r1 = size*0.35, r2 = size*0.48;
  const grd = g.createRadialGradient(0, 0, r1*0.6, 0, 0, r2);
  grd.addColorStop(0.0, 'rgba(255,200,255,1)');
  grd.addColorStop(0.3, 'rgba(255,102,204,1)');
  grd.addColorStop(0.7, 'rgba(204,0,153,0.8)');
  grd.addColorStop(1.0, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.beginPath(); g.arc(0,0,r2,0,Math.PI*2); g.arc(0,0,r1,0,Math.PI*2,true); g.closePath(); g.fill();
  return new THREE.CanvasTexture(c);
}
const ring1 = new THREE.Mesh(new THREE.RingGeometry(80, 115, 128), new THREE.MeshBasicMaterial({map: ringTexture(), transparent: true, side: THREE.DoubleSide, opacity: 0.32, blending: THREE.AdditiveBlending}));
const ring2 = new THREE.Mesh(new THREE.RingGeometry(125, 155, 128), new THREE.MeshBasicMaterial({map: ringTexture(), transparent: true, side: THREE.DoubleSide, opacity: 0.2, blending: THREE.AdditiveBlending}));
ring1.rotation.x = ring2.rotation.x = Math.PI/2;
scene.add(ring1); scene.add(ring2);

const WORDS = [];
const baseWords = [
  'Feliz día de la novia 💗',
  'Eres mi novia perfecta ✨',
  'Mi novia, mi universo 🌌',
  'Gracias por ser mía ❤️',
  'La novia más hermosa 💖',
  'Contigo por siempre 💞',
  'Mi corazón es tuyo 💓',
  'Eres mi lugar favorito 🏠',
   'Gracias por existir  🏠',
    'Soy tuyo mi Nao 💓'
];

const PHRASE_REPEAT = isMobile ? 11 : 16;
for(let i=0; i<PHRASE_REPEAT; i++){ WORDS.push(...baseWords); }

function makeTextTexture(text, color){
  const c = document.createElement('canvas'); c.width = 1024; c.height = 128;
  const ctx = c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let fontSize = 50;
  ctx.font = `700 ${fontSize}px "Playfair Display", serif`;
  while (ctx.measureText(text).width > c.width - 50 && fontSize > 26) {
    fontSize -= 2;
    ctx.font = `700 ${fontSize}px "Playfair Display", serif`;
  }
  ctx.fillStyle = '#ffffff'; ctx.shadowColor = color; ctx.shadowBlur = 25;
  ctx.fillText(text, c.width/2, c.height/2);
  return new THREE.CanvasTexture(c);
}
const COLORS = ['#ff66cc','#cc66ff','#ff99cc','#ff3399','#ff66a3','#ffa0f8','#e0a7ff','#ff4488','#ff99ff'];
const textGroup = new THREE.Group(); scene.add(textGroup);

document.fonts.ready.then(() => {
  for(let i=0; i<WORDS.length; i++){
    const tex = makeTextTexture(WORDS[i], COLORS[i%COLORS.length]);
    const mat = new THREE.SpriteMaterial({map: tex, transparent: true, depthWrite: false, alphaTest: 0.01});
    const sp = new THREE.Sprite(mat);
    sp.scale.set(98, 12.25, 1);
    const phi = Math.acos(2 * Math.random() - 1); const theta = Math.random() * Math.PI * 2;
    const r = DUST_INNER_R + Math.random() * (DUST_OUTER_R - DUST_INNER_R - 30);
    sp.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
    sp.userData = {phi: phi, theta: theta, radius: r, speed: 0.001 + Math.random() * 0.001};
    textGroup.add(sp);
  }
});

const PHOTO_PATHS = [
  'https://cdn.jsdelivr.net/gh/JosephCC123/REPO-FOTOS@main/freegalaxy-dia-novia/img1.webp',
  'https://cdn.jsdelivr.net/gh/JosephCC123/REPO-FOTOS@main/freegalaxy-dia-novia/img2.webp',
  'https://cdn.jsdelivr.net/gh/JosephCC123/REPO-FOTOS@main/freegalaxy-dia-novia/img3.webp'
];

const PHOTO_REPEAT = isMobile ? 7 : 12;
const PHOTO_INSTANCES = [];
for (let rep = 0; rep < PHOTO_REPEAT; rep++) { PHOTO_INSTANCES.push(...PHOTO_PATHS); }

const photoGroup = new THREE.Group(); scene.add(photoGroup);
const photoGlowTex = makeGlow(512, '255,153,204', '255,102,204');

PHOTO_INSTANCES.forEach((path) => {
  const phi = Math.acos(2 * Math.random() - 1);
  const theta = Math.random() * Math.PI * 2;
  const r = DUST_INNER_R + Math.random() * (DUST_OUTER_R - DUST_INNER_R - 30);
  const speed = 0.0007 + Math.random() * 0.0009;
  const baseSize = isMobile ? 20 : 28;

  const glowMat = new THREE.SpriteMaterial({
    map: photoGlowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });
  const glowSprite = new THREE.Sprite(glowMat);
  glowSprite.scale.set(baseSize * 1.6, baseSize * 1.6, 1);
  glowSprite.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
  glowSprite.renderOrder = -1;
  glowSprite.userData = {phi: phi, theta: theta, radius: r, speed: speed};
  photoGroup.add(glowSprite);

  loader.load(
    path,
    (tex) => {
      const iw = (tex.image && tex.image.width) || 1;
      const ih = (tex.image && tex.image.height) || 1;
      const ratio = iw / ih;
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        opacity: 0.96
      });
      const photoSprite = new THREE.Sprite(mat);
      if (ratio >= 1) {
        photoSprite.scale.set(baseSize * ratio, baseSize, 1);
      } else {
        photoSprite.scale.set(baseSize, baseSize / ratio, 1);
      }
      photoSprite.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
      photoSprite.userData = {phi: phi, theta: theta, radius: r, speed: speed, isPhoto: true};
      photoGroup.add(photoSprite);
    },
    undefined,
    () => { console.log('No se pudo cargar ' + path); }
  );
});

let isPointerDown = false;
let isDragging = false;
let startX = 0, startY = 0;
let targetRotX = 0.2, targetRotY = 0;
let velX = 0, velY = 0;

function onDown(e) {
  isPointerDown = true;
  isDragging = false;
  velX = 0; velY = 0;
  const t = e.touches ? e.touches[0] : e;
  startX = t.clientX;
  startY = t.clientY;
}

function onMove(e) {
  if (!isPointerDown) return;
  if (e.touches && e.touches.length > 1) return;
  const t = e.touches ? e.touches[0] : e;
  const dx = t.clientX - startX;
  const dy = t.clientY - startY;

  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
    isDragging = true;
    const sensX = (Math.PI * 1.5) / innerWidth;
    const sensY = (Math.PI * 0.8) / innerHeight;

    velY = -dx * sensX;
    velX = dy * sensY;

    targetRotY += velY;
    targetRotX = Math.max(-1.25, Math.min(1.25, targetRotX + velX));

    startX = t.clientX;
    startY = t.clientY;
  }
}

function onUp() { isPointerDown = false; }

const dom = renderer.domElement;
dom.addEventListener('mousedown', onDown);
dom.addEventListener('mousemove', onMove);
window.addEventListener('mouseup', onUp);

dom.addEventListener('touchstart', onDown, {passive: true});
dom.addEventListener('touchmove', onMove, {passive: true});
window.addEventListener('touchend', (e) => {
  if (!e.touches || e.touches.length === 0) {
    onUp();
  } else {
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    isDragging = false;
  }
}, {passive: true});

addEventListener('wheel', (e) => {
  targetDist += e.deltaY * 0.25;
  targetDist = Math.max(180, Math.min(1100, targetDist));
}, {passive: true});

let pinchDist = null;

function getPinchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    pinchDist = getPinchDist(e.touches);
    isPointerDown = false;
    isDragging = false;
  }
}, {passive: true});

addEventListener('touchmove', (e) => {
  if (e.touches.length === 2) {
    const newDist = getPinchDist(e.touches);
    if (pinchDist !== null) {
      const delta = pinchDist - newDist;
      targetDist += delta * 0.85;
      targetDist = Math.max(180, Math.min(1100, targetDist));
    }
    pinchDist = newDist;
  } else {
    if (pinchDist !== null) {
      pinchDist = null;
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isPointerDown = true;
        isDragging = false;
      }
    }
  }
}, {passive: true});

addEventListener('touchend', (e) => {
  if (e.touches.length < 2) {
    pinchDist = null;
  }
}, {passive: true});

let t = 0;
const INERTIA_DECAY = 0.88;

function tick(){
  requestAnimationFrame(tick);
  t += 0.01;

  if (!isPointerDown) {
    velX *= INERTIA_DECAY;
    velY *= INERTIA_DECAY;
    targetRotX = Math.max(-1.25, Math.min(1.25, targetRotX + velX));
    targetRotY += velY;
  }

  rotX += (targetRotX - rotX) * 0.12;
  rotY += (targetRotY - rotY) * 0.12;

  ring1.rotation.z += 0.002;
  ring2.rotation.z -= 0.0015;
  spiral.rotation.y -= 0.0045;
  dust.rotation.y += 0.0006;

  glow.scale.set(450 * (1 + Math.sin(t*0.4)*0.03), 450 * (1 + Math.sin(t*0.4)*0.03), 1);

  const s = 1.0 + 0.05 * Math.sin(t * 4);
  heart.scale.set(s, s, s);
  hitSphere.scale.set(s, s, s);

  textGroup.children.forEach(sp => {
    sp.material.opacity = 0.8 + 0.2 * Math.sin(t * 2);
    sp.userData.theta += sp.userData.speed;
    sp.position.x = sp.userData.radius * Math.sin(sp.userData.phi) * Math.cos(sp.userData.theta);
    sp.position.z = sp.userData.radius * Math.sin(sp.userData.phi) * Math.sin(sp.userData.theta);
  });

  photoGroup.children.forEach(sp => {
    sp.userData.theta += sp.userData.speed;
    sp.position.x = sp.userData.radius * Math.sin(sp.userData.phi) * Math.cos(sp.userData.theta);
    sp.position.z = sp.userData.radius * Math.sin(sp.userData.phi) * Math.sin(sp.userData.theta);
    if (sp.userData.isPhoto) {
      sp.material.opacity = 0.82 + 0.14 * Math.sin(t * 1.6 + sp.userData.radius);
    }
  });

  currentDist += (targetDist - currentDist) * 0.06;

  const camX = currentDist * Math.cos(rotX) * Math.sin(rotY);
  const camY = currentDist * Math.sin(rotX);
  const camZ = currentDist * Math.cos(rotX) * Math.cos(rotY);
  camera.position.set(camX, camY, camZ);
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}
tick();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ================= Bloqueos Anti-DevTools =================
(function () {
  "use strict";

  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  document.addEventListener("selectstart", function (e) {
    var tag = e.target.tagName;
    if (tag !== "INPUT" && tag !== "TEXTAREA") e.preventDefault();
  });
  document.addEventListener("dragstart", function (e) { e.preventDefault(); });

  document.addEventListener("keydown", function (e) {
    var key = e.key ? e.key.toUpperCase() : "";
    var ctrlOrCmd = e.ctrlKey || e.metaKey;

    if (e.keyCode === 123 || key === "F12") { e.preventDefault(); return false; }
    if (ctrlOrCmd && e.shiftKey && ["I", "J", "C", "K"].indexOf(key) !== -1) { e.preventDefault(); return false; }
    if (ctrlOrCmd && key === "U" || key === "S" || key === "P") { e.preventDefault(); return false; }
  });

  var overlay = document.createElement("div");
  overlay.id = "__protection_overlay";
  overlay.style.cssText = [
    "position:fixed", "inset:0", "z-index:2147483647",
    "background:#0b0b0f", "color:#fff",
    "display:none", "align-items:center", "justify-content:center",
    "text-align:center", "font-family:system-ui,sans-serif",
    "padding:2rem"
  ].join(";");
  overlay.innerHTML = "<div><p style='font-size:1.1rem;margin-bottom:.5rem;'>Cierra las herramientas de desarrollador para seguir viendo esta página 💌</p></div>";
  document.addEventListener("DOMContentLoaded", function () { document.body.appendChild(overlay); });

  function showOverlay(show) {
    if (!overlay.parentNode) return;
    overlay.style.display = show ? "flex" : "none";
  }

  var ENABLE_DEVTOOLS_DETECTION = true;

  if (ENABLE_DEVTOOLS_DETECTION) {
    var baselineWidthDiff = 0;
    var baselineHeightDiff = 0;
    var DELTA = 200;
    var consecutiveHits = 0;
    var HITS_NEEDED = 4;

    window.addEventListener("load", function () {
      setTimeout(function () {
        baselineWidthDiff = window.outerWidth - window.innerWidth;
        baselineHeightDiff = window.outerHeight - window.innerHeight;
      }, 1000);
    });

    setInterval(function () {
      var widthDiff = window.outerWidth - window.innerWidth;
      var heightDiff = window.outerHeight - window.innerHeight;

      var widthGrew = widthDiff - baselineWidthDiff > DELTA;
      var heightGrew = heightDiff - baselineHeightDiff > DELTA;

      if (widthGrew || heightGrew) consecutiveHits++;
      else { consecutiveHits = 0; showOverlay(false); }

      if (consecutiveHits >= HITS_NEEDED) showOverlay(true);
    }, 500);
  }
})();