import * as THREE from './jsModules/THREE.js';
import { loadFile } from './jsModules/loader.js';

console.log('🚀 CAMERA CONTROLS VERSION - Press H for help!');

// --- Camera Control Settings ---
const cameraSettings = {
  radius: 3.4,
  height: 0.7,
  speed: 0.005,
  autoRotate: true,
  fov: 30
};

// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  cameraSettings.fov,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1, 5);

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);
scene.background = new THREE.Color(0x000000);

// --- GUI Controls ---
function createControls() {
  const controlPanel = document.createElement('div');
  controlPanel.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 15px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 12px;
    max-width: 200px;
    z-index: 1000;
  `;

  controlPanel.innerHTML = `
    <h3 style="margin:0 0 10px 0; color: #4CAF50;">🎥 Camera Controls</h3>
    
    <div style="margin-bottom: 10px;">
      <button id="toggleRotation" style="width: 100%; padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
        ${cameraSettings.autoRotate ? 'Stop Auto-Rotate' : 'Start Auto-Rotate'}
      </button>
    </div>
    
    <div style="margin-bottom: 10px;">
      <button id="resetCamera" style="width: 100%; padding: 8px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
        Reset Camera
      </button>
    </div>
    
    <div style="font-size: 11px; color: #ccc; margin-top: 15px; line-height: 1.4; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 4px;">
      <strong style="color: #4CAF50;">⌨️ Keyboard Controls:</strong><br><br>
      <span style="color: #ffeb3b;">W/S:</span> Radius ± <br>
      <span style="color: #ffeb3b;">A/D:</span> Speed ± <br>
      <span style="color: #ffeb3b;">Q/E:</span> Height ± <br>
      <span style="color: #ffeb3b;">SPACE:</span> Toggle rotation <br>
      <span style="color: #ffeb3b;">H:</span> Toggle this panel
    </div>
    
    <div style="font-size: 10px; color: #888; margin-top: 10px; text-align: center;">
      Current: R:${cameraSettings.radius} H:${cameraSettings.height} S:${cameraSettings.speed.toFixed(3)}
    </div>
  `;

  document.body.appendChild(controlPanel);

  // Button event listeners only
  document.getElementById('toggleRotation').addEventListener('click', () => {
    cameraSettings.autoRotate = !cameraSettings.autoRotate;
    document.getElementById('toggleRotation').textContent = 
      cameraSettings.autoRotate ? 'Stop Auto-Rotate' : 'Start Auto-Rotate';
  });

  document.getElementById('resetCamera').addEventListener('click', () => {
    cameraSettings.radius = 1.0;
    cameraSettings.height = 0.7;
    cameraSettings.speed = 0.005;
    cameraSettings.fov = 47;
    camera.fov = cameraSettings.fov;
    camera.updateProjectionMatrix();
  });

  return controlPanel;
}

// --- Keyboard Controls ---
const keys = {};
let keyDebounce = {};

document.addEventListener('keydown', (e) => { 
  keys[e.code] = true;
});

document.addEventListener('keyup', (e) => { 
  keys[e.code] = false;
  keyDebounce[e.code] = false;
});

function handleKeyboardControls() {
  if (keys['KeyW']) cameraSettings.radius = Math.max(0.5, cameraSettings.radius - 0.02);
  if (keys['KeyS']) cameraSettings.radius = Math.min(20, cameraSettings.radius + 0.02);
  if (keys['KeyA']) cameraSettings.speed = Math.max(0, cameraSettings.speed - 0.0002);
  if (keys['KeyD']) cameraSettings.speed = Math.min(0.05, cameraSettings.speed + 0.0002);
  if (keys['KeyQ']) cameraSettings.height = Math.max(-2, cameraSettings.height - 0.02);
  if (keys['KeyE']) cameraSettings.height = Math.min(10, cameraSettings.height + 0.02);
  
  if (keys['Space'] && !keyDebounce['Space']) {
    cameraSettings.autoRotate = !cameraSettings.autoRotate;
    document.getElementById('toggleRotation').textContent = 
      cameraSettings.autoRotate ? 'Stop Auto-Rotate' : 'Start Auto-Rotate';
    keyDebounce['Space'] = true;
  }
  
  if (keys['KeyH'] && !keyDebounce['KeyH']) {
    const panel = document.querySelector('div[style*="position: fixed"]');
    if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    keyDebounce['KeyH'] = true;
  }
}

function updateGUIValues() {
  // Update the current values display
  const statusDiv = document.querySelector('div[style*="text-align: center"]');
  if (statusDiv) {
    statusDiv.textContent = `Current: R:${cameraSettings.radius.toFixed(1)} H:${cameraSettings.height.toFixed(1)} S:${cameraSettings.speed.toFixed(3)}`;
  }
}

// --- Model Loading ---
let orbitTarget = new THREE.Vector3(0, 3, 0); // Default position

loadFile('/prefabs/mountainScene.glb', scene, (model) => {
  scene.add(model);
  console.log('✅ Model loaded! Looking for peak...');
  
  // Find highest point
  let highestPoint = new THREE.Vector3(0, -Infinity, 0);
  
  model.traverse((mesh) => {
    if (mesh.isMesh && mesh.geometry && mesh.geometry.attributes.position) {
      console.log(`Scanning mesh: ${mesh.name || 'unnamed'}`);
      const positions = mesh.geometry.attributes.position;
      
      for (let i = 0; i < positions.count; i++) {
        const vertex = new THREE.Vector3(
          positions.getX(i),
          positions.getY(i),
          positions.getZ(i)
        );
        
        const worldVertex = mesh.localToWorld(vertex.clone());
        
        if (worldVertex.y > highestPoint.y) {
          highestPoint.copy(worldVertex);
        }
      }
    }
  });
  
  if (highestPoint.y > -Infinity) {
    orbitTarget = highestPoint;
    console.log('🎯 Found peak at:', orbitTarget);
  } else {
    // Fallback: use model bounding box
    const box = new THREE.Box3().setFromObject(model);
    orbitTarget.set(0, box.max.y, 0);
    console.log('📦 Using model top:', orbitTarget);
  }
});

// --- Animation Loop ---
let angle = 0;

function animate() {
  requestAnimationFrame(animate);
  
  // Handle keyboard input
  handleKeyboardControls();
  
  // Update camera position if auto-rotating
  if (cameraSettings.autoRotate) {
    angle += cameraSettings.speed;
  }
  
  // Calculate camera position
  camera.position.x = Math.sin(angle) * cameraSettings.radius + orbitTarget.x;
  camera.position.z = Math.cos(angle) * cameraSettings.radius + orbitTarget.z;
  camera.position.y = orbitTarget.y + cameraSettings.height;
  
  camera.lookAt(orbitTarget);
  
  // Update GUI display
  updateGUIValues();
  
  renderer.render(scene, camera);
}

// Initialize controls and start animation
createControls();
animate();

// --- Responsive Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
