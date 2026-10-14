/* MANBA V4 — textured 3D Jupiter. Graceful CSS fallback if WebGL/CDN is unavailable. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

const host = document.getElementById('jupiter3d');
if (host) {
  try {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.z = 4.25;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.setAttribute('aria-hidden','true');
    host.replaceChildren(renderer.domElement);
    host.classList.add('webgl-ready');

    const loader = new THREE.TextureLoader();
    loader.load('./jupiter-texture.jpg', texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      const geometry = new THREE.SphereGeometry(1.25, 96, 96);
      const material = new THREE.MeshStandardMaterial({
        map: texture, roughness: 0.96, metalness: 0.0
      });
      const planet = new THREE.Mesh(geometry, material);
      planet.rotation.z = THREE.MathUtils.degToRad(-7);
      scene.add(planet);

      const key = new THREE.DirectionalLight(0xffe5c2, 3.0);
      key.position.set(-3.4, 1.4, 3.2);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0x7f9ec7, 0.42);
      fill.position.set(3, -1.5, 1);
      scene.add(fill);
      scene.add(new THREE.AmbientLight(0x9aaac7, 0.18));

      // Thin atmospheric limb, deliberately restrained rather than neon.
      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.275, 96, 96),
        new THREE.MeshBasicMaterial({ color: 0xb5c9df, transparent: true, opacity: 0.075, side: THREE.BackSide })
      );
      scene.add(atmosphere);

      const resize = () => {
        const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize); ro.observe(host);
      let raf = 0, last = 0;
      const draw = t => {
        raf = 0;
        if (document.hidden) return;
        const dt = Math.min(50, last ? t-last : 16); last=t;
        if (!reduced) planet.rotation.y += dt * 0.000055;
        renderer.render(scene, camera);
        if (!reduced) raf = requestAnimationFrame(draw);
      };
      const start = () => { if (!raf) raf=requestAnimationFrame(draw); };
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && raf) { cancelAnimationFrame(raf); raf=0; }
        else if (!document.hidden) start();
      });
      start();
      if (reduced) renderer.render(scene,camera);
    }, undefined, () => { host.classList.remove('webgl-ready'); });
  } catch (err) {
    console.warn('MANBA 3D Jupiter fallback active:', err);
  }
}
