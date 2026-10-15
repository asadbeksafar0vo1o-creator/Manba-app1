/* MANBA — NASA/JPL tekstura manbalari va yuklash yordamchisi
 * Three.js global (THREE) mavjud bo'lgan sahifada ishlatish uchun.
 * Eslatma: internet/CORS cheklovlari bo'lmasligi uchun xaritalarni yuklab,
 * loyiha papkasiga joylang va URL'larni lokal fayllarga almashtiring.
 */
const MANBA_PLANET_TEXTURE_URLS = {
  earth: 'https://maps.jpl.nasa.gov/tmaps/pix/ear0xuu2.jpg',
  mars: 'https://maps.jpl.nasa.gov/tmaps/pix/mar0kuu2.jpg',
  saturn: 'https://maps.jpl.nasa.gov/tmaps/pix/sat0fds1.jpg'
};

function loadManbaPlanetTexture(kind, localPath = MANBA_PLANET_TEXTURE_URLS[kind]) {
  if (!window.THREE) return Promise.reject(new Error('Three.js yuklanmagan'));
  if (!localPath) return Promise.reject(new Error('Noma’lum tekstura: ' + kind));
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(localPath, texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      resolve(texture);
    }, undefined, reject);
  });
}

// Mavjud Mesh'ga yuklangan xaritani qo'llash:
// loadManbaPlanetTexture('earth', './earth-nasa-texture.jpg').then(tex => {
//   earthMesh.material.map = tex;
//   earthMesh.material.needsUpdate = true;
// });
