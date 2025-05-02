import * as THREE from './jsModules/THREE.js';
import { loadFile } from './jsModules/loader.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xcccccc, 0.8);
scene.add(ambientLight);

// --- Model Loading ---
let peakRef = null;

loadFile('../prefabs/mountainScene.glb', scene, (model) => {
  scene.add(model);

  model.traverse((child) => {
    if (child.name === 'peakRef') {
      peakRef = child;
      console.log('✅ peakRef assigned:', peakRef);
      console.log('Peak Ref Initial Position:', peakRef.position);
      console.log('Peak Ref Initial Rotation:', peakRef.rotation);
      console.log('Peak Ref Initial Scale:', peakRef.scale);
    }
  });
  

  if (!peakRef) {
    console.warn('⚠️ peakRef not found in loaded model');
  }
});

// --- Animation Loop ---
const radius = 2;
let angle = 0;
const worldPos = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  if (peakRef) {
    peakRef.getWorldPosition(worldPos);
    // console.log(worldPos);

    angle += 0.005;

    camera.position.x = Math.sin(angle) * radius + worldPos.x;
    camera.position.z = Math.cos(angle) * radius + worldPos.z;
    camera.position.y = worldPos.y + 1.5;

    camera.lookAt(worldPos);
  }

  renderer.render(scene, camera);
}

animate();

// --- Responsive Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
