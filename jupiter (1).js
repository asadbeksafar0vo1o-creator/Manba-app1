import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const container = document.getElementById('jupiter3d');

if (container && !container.dataset.jupiterReady) {
  container.dataset.jupiterReady = 'true';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    36,
    Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1),
    0.1,
    100
  );
  camera.position.set(0, 0, 4.15);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(container.clientWidth || 320, container.clientHeight || 250);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // Detailed procedural Jupiter cloud map: broad belts, turbulence and the Great Red Spot.
  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = 2048;
  mapCanvas.height = 1024;
  const ctx = mapCanvas.getContext('2d', { willReadFrequently: true });
  const w = mapCanvas.width;
  const h = mapCanvas.height;

  const palette = [
    [82, 55, 45], [131, 79, 59], [174, 112, 79],
    [205, 157, 117], [229, 194, 158], [244, 220, 186],
    [188, 133, 98], [109, 75, 63], [218, 174, 136]
  ];

  // Base latitude bands with layered sine distortion for an organic cloud look.
  const image = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const lat = y / h;
    const latitude = Math.abs(lat - 0.5) * 2;
    const bandWave =
      Math.sin(y * 0.031 + Math.sin(y * 0.008) * 3.2) * 0.5 +
      Math.sin(y * 0.071 + Math.sin(y * 0.013) * 2.5) * 0.25 +
      Math.sin(y * 0.17) * 0.12;
    const belt = Math.sin(y * 0.044 + Math.sin(y * 0.009) * 2.3);
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const turbulence =
        Math.sin(x * 0.027 + y * 0.041) * 0.18 +
        Math.sin(x * 0.009 - y * 0.023) * 0.16 +
        Math.sin(x * 0.071 + Math.sin(y * 0.02) * 3) * 0.08;
      let tone = 3.5 + bandWave * 1.9 + belt * 0.85 + turbulence;
      tone += Math.sin(x * 0.006 + y * 0.11) * 0.12;
      tone += latitude > 0.82 ? 0.45 : 0;

      const scaled = Math.max(0, Math.min(palette.length - 1, 3.6 + tone));
      const p0 = Math.floor(scaled);
      const p1 = Math.min(palette.length - 1, p0 + 1);
      const mix = scaled - p0;
      // Subtle contrast makes the belt bands visible without looking like hard stripes.
      const contrast = 0.86 + (Math.sin(y * 0.036 + Math.sin(x * 0.012) * 1.4) * 0.14);
      for (let c = 0; c < 3; c++) {
        image.data[idx + c] = Math.max(0, Math.min(255,
          (palette[p0][c] * (1 - mix) + palette[p1][c] * mix) * contrast
        ));
      }
      image.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  // Small turbulent eddies following the horizontal belts.
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * w;
    const y = 80 + Math.random() * (h - 160);
    const rw = 5 + Math.random() * 36;
    const rh = 1 + Math.random() * 5;
    ctx.globalAlpha = 0.025 + Math.random() * 0.07;
    ctx.fillStyle = Math.random() > 0.5 ? '#fff0d8' : '#392a29';
    ctx.beginPath();
    ctx.ellipse(x, y, rw, rh, (Math.random() - 0.5) * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Great Red Spot with concentric storm bands.
  const spotX = w * 0.69;
  const spotY = h * 0.59;
  ctx.save();
  ctx.translate(spotX, spotY);
  ctx.rotate(-0.07);
  const spot = ctx.createRadialGradient(0, 0, 4, 0, 0, 94);
  spot.addColorStop(0, '#8c3c2f');
  spot.addColorStop(0.32, '#b3543c');
  spot.addColorStop(0.67, '#c77a55');
  spot.addColorStop(1, 'rgba(198,122,85,0)');
  ctx.fillStyle = spot;
  ctx.beginPath();
  ctx.ellipse(0, 0, 104, 49, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 12; i++) {
    ctx.strokeStyle = `rgba(${i % 2 ? '104,54,42' : '238,184,142'},${0.13 + Math.random() * 0.1})`;
    ctx.lineWidth = 1.5 + Math.random() * 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18 + i * 6.5, 7 + i * 3.2, 0, 0.15, Math.PI * 1.85);
    ctx.stroke();
  }
  ctx.restore();

  const mapTexture = new THREE.CanvasTexture(mapCanvas);
  mapTexture.colorSpace = THREE.SRGBColorSpace;
  mapTexture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(1.32, 160, 160),
    new THREE.MeshStandardMaterial({
      map: mapTexture,
      roughness: 1,
      metalness: 0
    })
  );
  planet.rotation.z = THREE.MathUtils.degToRad(-7);
  scene.add(planet);

  // Soft atmosphere rim; the shader produces a glow only around the silhouette.
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.365, 96, 96),
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewPosition)), 0.0), 2.4);
          gl_FragColor = vec4(0.16, 0.30, 0.95, rim * 0.42);
        }
      `
    })
  );
  scene.add(atmosphere);

  // Cinematic lighting: warm key light and a cool edge light.
  scene.add(new THREE.AmbientLight(0x7588b5, 0.62));
  const keyLight = new THREE.DirectionalLight(0xffd7ad, 3.4);
  keyLight.position.set(-3.8, 2.3, 4.5);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x5276ff, 1.25);
  rimLight.position.set(3.5, -1.0, -3);
  scene.add(rimLight);

  // Very faint, physically understated ring plane (Jupiter's real rings are faint).
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.52, 1.82, 160),
    new THREE.MeshBasicMaterial({
      color: 0x9d8c82,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  ring.rotation.x = Math.PI * 0.43;
  ring.rotation.y = 0.13;
  ring.position.z = -0.08;
  scene.add(ring);

  // Deep star field.
  const starPositions = [];
  for (let i = 0; i < 520; i++) {
    starPositions.push(
      (Math.random() - 0.5) * 16,
      (Math.random() - 0.5) * 10,
      -2.5 - Math.random() * 7
    );
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      color: 0xcbd8ff,
      size: 0.018,
      transparent: true,
      opacity: 0.72
    })
  );
  scene.add(stars);

  let frameId = 0;
  let oldW = 0;
  let oldH = 0;
  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height || (width === oldW && height === oldH)) return;
    oldW = width;
    oldH = height;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  function animate() {
    frameId = requestAnimationFrame(animate);
    planet.rotation.y += 0.0011;
    atmosphere.rotation.y = planet.rotation.y;
    ring.rotation.z += 0.00005;
    stars.rotation.z += 0.000025;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(frameId);
    observer.disconnect();
    planet.geometry.dispose();
    mapTexture.dispose();
    planet.material.dispose();
    atmosphere.geometry.dispose();
    atmosphere.material.dispose();
    ring.geometry.dispose();
    ring.material.dispose();
    starGeometry.dispose();
    stars.material.dispose();
    renderer.dispose();
  }, { once: true });
}
