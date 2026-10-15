/* MANBA V5 — mobile-aware 3D Jupiter. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

const host = document.getElementById('jupiter3d');
if (host) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const smallScreen = window.matchMedia('(max-width: 720px)').matches;
  const mobile = coarsePointer || smallScreen;
  let renderer, ro, io, raf = 0, visible = true, disposed = false;
  try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.z = 4.25;

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !mobile,
      powerPreference: 'low-power',
      failIfMajorPerformanceCaveat: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.0 : 1.45));
    renderer.setSize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight), false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    host.replaceChildren(renderer.domElement);
    host.classList.add('webgl-ready');

    const geometrySegments = mobile ? 48 : 72;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load('./jupiter-texture.jpg', texture => {
      if (disposed) { texture.dispose(); return; }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), mobile ? 2 : 4);

      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(1.25, geometrySegments, geometrySegments),
        new THREE.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0 })
      );
      planet.rotation.z = THREE.MathUtils.degToRad(-7);
      scene.add(planet);

      const key = new THREE.DirectionalLight(0xffe5c9, 2.45);
      key.position.set(-3.4, 1.4, 3.2);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0x7f9ec7, 0.28);
      fill.position.set(3, -1.5, 1);
      scene.add(fill);
      scene.add(new THREE.AmbientLight(0x9aaac7, 0.14));

      // A restrained atmosphere shell; no extra glow layers or post-processing.
      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.267, geometrySegments, geometrySegments),
        new THREE.MeshBasicMaterial({
          color: 0xaec5dc, transparent: true, opacity: 0.055,
          side: THREE.BackSide, depthWrite: false
        })
      );
      scene.add(atmosphere);

      const resize = () => {
        if (disposed) return;
        const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderOnce();
      };
      ro = new ResizeObserver(resize);
      ro.observe(host);

      let lastFrame = 0, lastRender = 0;
      const frameInterval = mobile ? 1000 / 30 : 1000 / 45;
      function renderOnce() {
        if (!disposed && renderer && !renderer.getContext().isContextLost()) renderer.render(scene, camera);
      }
      function loop(now) {
        raf = 0;
        if (disposed || document.hidden || !visible) return;
        if (!lastFrame || now - lastFrame >= frameInterval) {
          const dt = Math.min(50, lastFrame ? now - lastFrame : 16.7);
          lastFrame = now;
          if (!reducedMotion) planet.rotation.y += dt * 0.000045;
          if (now - lastRender >= frameInterval) { renderOnce(); lastRender = now; }
        }
        if (!reducedMotion) raf = requestAnimationFrame(loop);
      }
      function start() {
        if (disposed || document.hidden || !visible || raf || reducedMotion) return;
        raf = requestAnimationFrame(loop);
      }
      io = new IntersectionObserver(entries => {
        visible = !!entries[0]?.isIntersecting;
        if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
        else if (visible) { renderOnce(); start(); }
      }, { threshold: 0.02 });
      io.observe(host);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
        else if (!document.hidden) { renderOnce(); start(); }
      }, { passive: true });

      renderOnce();
      start();
    }, undefined, err => {
      console.warn('MANBA: 3D texture failed; CSS fallback remains active.', err);
      host.classList.remove('webgl-ready');
    });
  } catch (err) {
    console.warn('MANBA: WebGL unavailable; CSS fallback remains active.', err);
    host.classList.remove('webgl-ready');
  }
}
