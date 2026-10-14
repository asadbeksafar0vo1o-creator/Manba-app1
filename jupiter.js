import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const container = document.getElementById('jupiter3d');

if (container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    38,
    Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1),
    0.1,
    100
  );
  camera.position.z = 4.25;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'low-power'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(container.clientWidth || 300, container.clientHeight || 250);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // Programmatically generated banded atmosphere texture.
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 1024;
  textureCanvas.height = 512;
  const ctx = textureCanvas.getContext('2d');

  const bands = [
    '#c18b68', '#e5c4a0', '#a76f56', '#f0d7b2',
    '#8e5b48', '#d8a47d', '#eed0a8', '#9a654f',
    '#d9b18a', '#765044', '#e6c49c', '#b77c5d'
  ];

  ctx.fillStyle = '#cda17d';
  ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

  let y = 0;
  while (y < textureCanvas.height) {
    const h = 10 + Math.random() * 28;
    ctx.fillStyle = bands[Math.floor(Math.random() * bands.length)];
    ctx.fillRect(0, y, textureCanvas.width, h);

    // Fine, irregular cloud streaks.
    for (let x = 0; x < textureCanvas.width; x += 6) {
      ctx.globalAlpha = 0.07 + Math.random() * 0.12;
      ctx.fillStyle = Math.random() > 0.5 ? '#fff0d5' : '#53392f';
      ctx.fillRect(x, y + Math.random() * h, 6, 1 + Math.random() * 4);
    }
    ctx.globalAlpha = 1;
    y += h;
  }

  // The Great Red Spot.
  ctx.save();
  ctx.translate(690, 302);
  ctx.rotate(-0.08);
  const spot = ctx.createRadialGradient(0, 0, 3, 0, 0, 53);
  spot.addColorStop(0, '#b84f34');
  spot.addColorStop(0.55, '#c66d4d');
  spot.addColorStop(1, '#b77b59');
  ctx.fillStyle = spot;
  ctx.beginPath();
  ctx.ellipse(0, 0, 55, 29, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(116, 57, 43, .45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 38, 16, 0, 0.2, Math.PI * 1.75);
  ctx.stroke();
  ctx.restore();

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(1.28, 96, 96),
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 1,
      metalness: 0
    })
  );
  scene.add(planet);

  // Soft ambient light plus warm directional sunlight.
  scene.add(new THREE.AmbientLight(0x8b9cff, 1.15));
  const sun = new THREE.DirectionalLight(0xffd8b0, 3.0);
  sun.position.set(-3.5, 2.2, 4);
  scene.add(sun);

  // Subtle blue rim light.
  const rim = new THREE.PointLight(0x597aff, 1.2, 10);
  rim.position.set(2.8, -0.8, -1.8);
  scene.add(rim);

  // Star field behind the planet.
  const starPositions = [];
  for (let i = 0; i < 360; i++) {
    starPositions.push(
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 9,
      -2.5 - Math.random() * 6
    );
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(starPositions, 3)
  );
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: 0xdce5ff,
      size: 0.022,
      transparent: true,
      opacity: 0.78,
      sizeAttenuation: true
    })
  );
  scene.add(stars);

  let animationId = 0;
  let lastWidth = 0;
  let lastHeight = 0;

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height || (width === lastWidth && height === lastHeight)) return;
    lastWidth = width;
    lastHeight = height;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  function animate() {
    animationId = requestAnimationFrame(animate);
    planet.rotation.y += 0.0018;
    stars.rotation.z += 0.00004;
    renderer.render(scene, camera);
  }
  animate();

  // Release GPU resources if the page is being unloaded.
  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(animationId);
    resizeObserver.disconnect();
    planet.geometry.dispose();
    planet.material.map?.dispose();
    planet.material.dispose();
    starGeometry.dispose();
    stars.material.dispose();
    renderer.dispose();
  }, { once: true });
}
