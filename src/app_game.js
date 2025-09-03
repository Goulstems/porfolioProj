import * as THREE from './jsModules/THREE.js';
import { loadFile } from './jsModules/loader.js';

console.log('🎮 GAME-STYLE CAMERA CONTROLS + SNOWBOARDER!');
console.log('Right-click + drag: Free camera look | Scroll: Zoom | WASD: Control snowboarder | SPACE: Toggle auto-orbit');

// --- Camera Control Settings ---
const cameraSettings = {
  radius: 0.2,  // Very close to the snowboarder
  height: 0.7,
  speed: 0.003,  // Smooth rotation speed
  autoRotate: true,  // Start with auto-rotate on
  fov: 60,  // Wider field of view for close-up
  minRadius: 0.05,  // Allow very close zoom
  maxRadius: 5.0,  // Don't need to go too far
  minFov: 10,
  maxFov: 120
};

// Mouse control state
const mouseState = {
  isRightDown: false,
  lastX: 0,
  lastY: 0,
  phi: 0,      // horizontal rotation
  theta: Math.PI / 4,  // vertical rotation (start at 45 degrees)
  sensitivity: 0.003
};

// Auto-rotate and idle detection
const idleDetection = {
  lastInputTime: Date.now(),
  idleTimeout: 5000, // 5 seconds
  isIdle: false,
  transitionSpeed: 0.02, // How fast to blend between manual and auto
  targetPhi: 0,
  targetTheta: Math.PI / 4
};

// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  cameraSettings.fov,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Cinematic Bars ---
const cinematicBars = {
  topBar: null,
  bottomBar: null,
  targetHeight: 0,
  currentHeight: 0,
  animationSpeed: 0.05,
  maxHeight: 80 // pixels
};

function createCinematicBars() {
  // Top bar
  cinematicBars.topBar = document.createElement('div');
  cinematicBars.topBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 0px;
    background: #000;
    z-index: 1000;
    transition: none;
    pointer-events: none;
  `;
  document.body.appendChild(cinematicBars.topBar);
  
  // Bottom bar
  cinematicBars.bottomBar = document.createElement('div');
  cinematicBars.bottomBar.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 0px;
    background: #000;
    z-index: 1000;
    transition: none;
    pointer-events: none;
  `;
  document.body.appendChild(cinematicBars.bottomBar);
}

function updateCinematicBars() {
  // Show bars when auto-rotating (cinematic mode)
  cinematicBars.targetHeight = cameraSettings.autoRotate ? cinematicBars.maxHeight : 0;
  
  // Smooth animation
  cinematicBars.currentHeight += (cinematicBars.targetHeight - cinematicBars.currentHeight) * cinematicBars.animationSpeed;
  
  // Apply the height
  const height = Math.round(cinematicBars.currentHeight);
  cinematicBars.topBar.style.height = `${height}px`;
  cinematicBars.bottomBar.style.height = `${height}px`;
}

// Create the bars
createCinematicBars();

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);
scene.background = new THREE.Color(0x000000);

// --- Snowboarder Character ---
let snowboarder = null;
let mountainMesh = null;

const snowboarderSettings = {
  position: new THREE.Vector3(0, 0, 0),
  velocity: new THREE.Vector3(0, 0, 0),
  speed: 0.0005,     // Extremely small movement (was 0.003)
  turnSpeed: .05,  // Very slow turning (was 0.008)
  gravity: 0.00005,  // Almost no gravity (was 0.0003)
  friction: 0.999,   // Very high friction (was 0.995)
  rotation: 0
};

function createSnowboarder() {
  const boarderGroup = new THREE.Group();
  
  // --- Body (torso) ---
  const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.18, 0.5, 8);
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x1565C0 }); // Blue jacket
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.4;
  boarderGroup.add(body);
  
  // --- Head ---
  const headGeometry = new THREE.SphereGeometry(0.12, 12, 8);
  const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC }); // Skin tone
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 0.75;
  boarderGroup.add(head);
  
  // --- Helmet ---
  const helmetGeometry = new THREE.SphereGeometry(0.14, 12, 8);
  const helmetMaterial = new THREE.MeshLambertMaterial({ color: 0xD32F2F }); // Red helmet
  const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
  helmet.position.y = 0.75;
  helmet.scale.set(1, 0.8, 1); // Flatten slightly for realistic helmet shape
  boarderGroup.add(helmet);
  
  // --- Goggles ---
  const gogglesGeometry = new THREE.TorusGeometry(0.08, 0.02, 8, 16);
  const gogglesMaterial = new THREE.MeshLambertMaterial({ color: 0x212121 }); // Black goggles
  const goggles = new THREE.Mesh(gogglesGeometry, gogglesMaterial);
  goggles.position.set(0, 0.75, 0.12);
  goggles.rotation.x = Math.PI / 2;
  boarderGroup.add(goggles);
  
  // --- Arms ---
  const armGeometry = new THREE.CapsuleGeometry(0.06, 0.35, 4, 8);
  const armMaterial = new THREE.MeshLambertMaterial({ color: 0x1565C0 }); // Match jacket
  
  // Left arm
  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-0.2, 0.45, 0);
  leftArm.rotation.z = 0.3;
  leftArm.rotation.x = -0.2;
  boarderGroup.add(leftArm);
  
  // Right arm
  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(0.2, 0.45, 0);
  rightArm.rotation.z = -0.3;
  rightArm.rotation.x = -0.2;
  boarderGroup.add(rightArm);
  
  // --- Legs ---
  const legGeometry = new THREE.CapsuleGeometry(0.08, 0.4, 4, 8);
  const legMaterial = new THREE.MeshLambertMaterial({ color: 0x424242 }); // Dark pants
  
  // Left leg
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.08, 0.05, 0);
  boarderGroup.add(leftLeg);
  
  // Right leg
  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(0.08, 0.05, 0);
  boarderGroup.add(rightLeg);
  
  // --- Snowboard (more realistic) ---
  const boardGeometry = new THREE.BoxGeometry(1.2, 0.08, 0.25);
  const boardMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6F00 }); // Orange board
  const board = new THREE.Mesh(boardGeometry, boardMaterial);
  board.position.y = -0.1;
  // Add some curvature to the board
  board.rotation.x = 0.05;
  boarderGroup.add(board);
  
  // --- Board bindings ---
  const bindingGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.2);
  const bindingMaterial = new THREE.MeshLambertMaterial({ color: 0x212121 }); // Black bindings
  
  // Left binding
  const leftBinding = new THREE.Mesh(bindingGeometry, bindingMaterial);
  leftBinding.position.set(-0.3, -0.05, 0);
  boarderGroup.add(leftBinding);
  
  // Right binding
  const rightBinding = new THREE.Mesh(bindingGeometry, bindingMaterial);
  rightBinding.position.set(0.3, -0.05, 0);
  boarderGroup.add(rightBinding);
  
  // --- Gloves ---
  const gloveGeometry = new THREE.SphereGeometry(0.04, 8, 6);
  const gloveMaterial = new THREE.MeshLambertMaterial({ color: 0x37474F }); // Dark gloves
  
  // Left glove
  const leftGlove = new THREE.Mesh(gloveGeometry, gloveMaterial);
  leftGlove.position.set(-0.3, 0.3, 0);
  boarderGroup.add(leftGlove);
  
  // Right glove
  const rightGlove = new THREE.Mesh(gloveGeometry, gloveMaterial);
  rightGlove.position.set(0.3, 0.3, 0);
  boarderGroup.add(rightGlove);
  
  // --- Boots ---
  const bootGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.25);
  const bootMaterial = new THREE.MeshLambertMaterial({ color: 0x795548 }); // Brown boots
  
  // Left boot
  const leftBoot = new THREE.Mesh(bootGeometry, bootMaterial);
  leftBoot.position.set(-0.08, -0.15, 0.05);
  boarderGroup.add(leftBoot);
  
  // Right boot
  const rightBoot = new THREE.Mesh(bootGeometry, bootMaterial);
  rightBoot.position.set(0.08, -0.15, 0.05);
  boarderGroup.add(rightBoot);
  
  boarderGroup.scale.set(0.05, 0.05, 0.05); // Keep tiny scale for mountain
  return boarderGroup;
}

function getTerrainHeight(x, z) {
  if (!mountainMesh) return 0;
  
  // Simple terrain height sampling - you can make this more sophisticated
  const raycaster = new THREE.Raycaster();
  raycaster.set(new THREE.Vector3(x, 100, z), new THREE.Vector3(0, -1, 0));
  
  const intersects = raycaster.intersectObject(mountainMesh, true);
  if (intersects.length > 0) {
    return intersects[0].point.y;
  }
  return 0;
}

function updateSnowboarder() {
  if (!snowboarder) return;
  
  // Handle input
  handleSnowboarderInput();
  
  // Apply gravity and friction
  snowboarderSettings.velocity.y -= snowboarderSettings.gravity;
  snowboarderSettings.velocity.multiplyScalar(snowboarderSettings.friction);
  
  // Update position
  snowboarderSettings.position.add(snowboarderSettings.velocity);
  
  // Get terrain height and adjust Y position
  const terrainHeight = getTerrainHeight(snowboarderSettings.position.x, snowboarderSettings.position.z);
  if (snowboarderSettings.position.y < terrainHeight + 0.005) {  // Very small offset for tiny scale
    snowboarderSettings.position.y = terrainHeight + 0.005;
    snowboarderSettings.velocity.y = 0;
    // Heavy friction when on ground - almost stop movement
    snowboarderSettings.velocity.multiplyScalar(0.98);
  }
  
  // Update snowboarder mesh position and rotation
  snowboarder.position.copy(snowboarderSettings.position);
  snowboarder.rotation.y = snowboarderSettings.rotation;
  
  // Tilt the snowboarder based on velocity for realistic movement
  const speed = snowboarderSettings.velocity.length();
  snowboarder.rotation.z = Math.sin(Date.now() * 0.01) * speed * 0.1; // Slight wobble while moving
}

function handleSnowboarderInput() {
  const moveVector = new THREE.Vector3();
  
  if (keys['KeyW'] || keys['ArrowUp']) {
    // Move forward in the direction the snowboarder is facing
    moveVector.x = Math.sin(snowboarderSettings.rotation) * snowboarderSettings.speed;
    moveVector.z = Math.cos(snowboarderSettings.rotation) * snowboarderSettings.speed;
  }
  if (keys['KeyS'] || keys['ArrowDown']) {
    // Move backward
    moveVector.x = -Math.sin(snowboarderSettings.rotation) * snowboarderSettings.speed * 0.5;
    moveVector.z = -Math.cos(snowboarderSettings.rotation) * snowboarderSettings.speed * 0.5;
  }
  if (keys['KeyA'] || keys['ArrowLeft']) {
    // Turn left
    snowboarderSettings.rotation += snowboarderSettings.turnSpeed;
  }
  if (keys['KeyD'] || keys['ArrowRight']) {
    // Turn right
    snowboarderSettings.rotation -= snowboarderSettings.turnSpeed;
  }
  
  // Add movement to velocity
  snowboarderSettings.velocity.add(moveVector);
  
  // Limit max velocity - tiny for tiny snowboarder on massive mountain
  if (snowboarderSettings.velocity.length() > 0.002) {  // Extremely low limit
    snowboarderSettings.velocity.normalize().multiplyScalar(0.002);
  }
}

// --- Mouse Controls ---
function setupMouseControls() {
  const canvas = renderer.domElement;
  
  // Disable context menu on right click
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  
  // Mouse down
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2) { // Right mouse button
      mouseState.isRightDown = true;
      mouseState.lastX = e.clientX;
      mouseState.lastY = e.clientY;
      canvas.style.cursor = 'grabbing';
      
      // Disable auto-rotate when manually controlling
      registerInput(); // Detect input for idle system
    }
  });
  
  // Mouse up
  canvas.addEventListener('mouseup', (e) => {
    if (e.button === 2) {
      mouseState.isRightDown = false;
      canvas.style.cursor = 'default';
    }
  });
  
  // Mouse move
  canvas.addEventListener('mousemove', (e) => {
    if (mouseState.isRightDown) {
      const deltaX = e.clientX - mouseState.lastX;
      const deltaY = e.clientY - mouseState.lastY;
      
      // Update camera angles
      mouseState.phi -= deltaX * mouseState.sensitivity;
      mouseState.theta = Math.max(0.1, Math.min(Math.PI - 0.1, mouseState.theta + deltaY * mouseState.sensitivity));
      
      mouseState.lastX = e.clientX;
      mouseState.lastY = e.clientY;
    }
  });
  
  // Mouse wheel for zoom
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    registerInput(); // Detect input for idle system
    
    const zoomSpeed = 0.1;
    if (e.deltaY > 0) {
      // Zoom out
      cameraSettings.radius = Math.min(cameraSettings.maxRadius, cameraSettings.radius + zoomSpeed);
    } else {
      // Zoom in
      cameraSettings.radius = Math.max(cameraSettings.minRadius, cameraSettings.radius - zoomSpeed);
    }
  });
}

// --- Input Detection for Idle System ---
function registerInput() {
  idleDetection.lastInputTime = Date.now();
  if (cameraSettings.autoRotate) {
    // Store current auto-rotate position as new manual position for smooth transition
    mouseState.phi = autoRotateAngle;
    mouseState.theta = Math.PI / 3; // Use the current auto-rotate viewing angle
    cameraSettings.autoRotate = false;
    console.log('🎮 Manual control activated - continuing from auto-rotate position');
  }
}

// --- Keyboard Controls ---
const keys = {};
let followSnowboarder = true; // Start in follow mode to see snowboarder

document.addEventListener('keydown', (e) => { 
  keys[e.code] = true; 
  registerInput(); // Detect input for idle system
});
document.addEventListener('keyup', (e) => { 
  keys[e.code] = false; 
});

function handleKeyboardControls() {
  if (keys['Space']) {
    cameraSettings.autoRotate = !cameraSettings.autoRotate;
    console.log('Auto-rotate:', cameraSettings.autoRotate ? 'ON' : 'OFF');
    keys['Space'] = false;
    registerInput();
  }
  
  if (keys['KeyF']) { // F to follow snowboarder
    followSnowboarder = !followSnowboarder;
    if (followSnowboarder) {
      cameraSettings.autoRotate = false; // Disable auto-rotate when following
    }
    console.log('Follow snowboarder:', followSnowboarder ? 'ON' : 'OFF');
    keys['KeyF'] = false;
  }
  
  if (keys['KeyR']) { // Reset camera
    mouseState.phi = 0;
    mouseState.theta = Math.PI / 4;
    cameraSettings.radius = 3.4;
    cameraSettings.autoRotate = true;
    followSnowboarder = false;
    console.log('Camera reset');
    keys['KeyR'] = false;
  }
}

// --- Model Loading ---
let orbitTarget = new THREE.Vector3(0, 3, 0);

loadFile('/prefabs/mountainScene.glb', scene, (model) => {
  scene.add(model);
  console.log('✅ Model loaded! Finding peak and setting up snowboarder...');
  
  // Find the mountain mesh for terrain collision
  model.traverse((child) => {
    if (child.isMesh && (child.name.toLowerCase().includes('mountain') || child.name.toLowerCase().includes('terrain'))) {
      mountainMesh = child;
      console.log('🏔️ Found mountain mesh:', child.name);
    }
  });
  
  // If no specific mountain mesh found, use the first mesh
  if (!mountainMesh) {
    model.traverse((child) => {
      if (child.isMesh && !mountainMesh) {
        mountainMesh = child;
        console.log('🏔️ Using mesh for terrain:', child.name);
      }
    });
  }
  
  // Find highest point for camera target
  let highestPoint = new THREE.Vector3(0, -Infinity, 0);
  
  model.traverse((mesh) => {
    if (mesh.isMesh && mesh.geometry && mesh.geometry.attributes.position) {
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
    console.log('🎯 Camera orbiting around peak at:', orbitTarget);
  } else {
    const box = new THREE.Box3().setFromObject(model);
    orbitTarget.set(0, box.max.y, 0);
    console.log('📦 Camera orbiting around model top:', orbitTarget);
  }
  
  // Create and position the snowboarder
  snowboarder = createSnowboarder();
  
  // Start the snowboarder near the peak position, but on solid ground
  const startX = orbitTarget.x + 0.1; // Slightly offset from exact peak
  const startZ = orbitTarget.z + 0.1; // to ensure we're on a slope
  const terrainHeight = getTerrainHeight(startX, startZ);
  
  // Place directly on terrain surface (no falling)
  snowboarderSettings.position.set(startX, terrainHeight + 0.005, startZ); // Tiny offset for tiny snowboarder
  snowboarder.position.copy(snowboarderSettings.position);
  
  scene.add(snowboarder);
  console.log('🏂 Snowboarder spawned on ground near peak');
  console.log('🎯 Peak reference point:', orbitTarget);
  console.log('🏂 Snowboarder position:', snowboarderSettings.position);
  console.log('🌍 Terrain height at spawn:', terrainHeight);
  
  // Initialize camera position to match first orbit position - prevents initial tween
  initializeCameraPosition();
});

// --- Camera Initialization ---
function initializeCameraPosition() {
  // Set initial camera position to match where auto-rotate will start
  let initialTarget = orbitTarget;
  
  // If following snowboarder, use snowboarder position as target
  if (followSnowboarder && snowboarder) {
    initialTarget = snowboarderSettings.position.clone();
    initialTarget.y += 0.04; // Look at tiny snowboarder's head level
  }
  
  // Start at a nice viewing angle that matches auto-rotate
  const initialPhi = 0; // Start at front view
  const initialTheta = Math.PI / 3; // Nice viewing angle
  
  // Set mouse state to match this initial position
  mouseState.phi = initialPhi;
  mouseState.theta = initialTheta;
  autoRotateAngle = initialPhi;
  
  // Calculate initial camera position
  const x = initialTarget.x + cameraSettings.radius * Math.sin(initialTheta) * Math.cos(initialPhi);
  const y = initialTarget.y + cameraSettings.radius * Math.cos(initialTheta);
  const z = initialTarget.z + cameraSettings.radius * Math.sin(initialTheta) * Math.sin(initialPhi);
  
  // Set camera position immediately - no tween
  camera.position.set(x, y, z);
  camera.lookAt(initialTarget);
  
  console.log('📹 Camera initialized at seamless starting position');
}

// --- Animation Loop ---
let autoRotateAngle = 0;

function updateCameraPosition() {
  // Check for idle timeout
  const timeSinceInput = Date.now() - idleDetection.lastInputTime;
  const shouldAutoRotate = timeSinceInput > idleDetection.idleTimeout;
  
  // Smoothly transition to auto-rotate when idle
  if (shouldAutoRotate && !cameraSettings.autoRotate) {
    cameraSettings.autoRotate = true;
    // Sync auto-rotate angle to current manual position for seamless continuation
    autoRotateAngle = mouseState.phi;
    console.log('🔄 Auto-rotate activated (idle detected) - continuing from current position');
  }
  
  let currentPhi = mouseState.phi;
  let currentTheta = mouseState.theta;
  let currentTarget = orbitTarget;
  
  // If following snowboarder, use snowboarder position as target
  if (followSnowboarder && snowboarder) {
    currentTarget = snowboarderSettings.position.clone();
    currentTarget.y += 0.04; // Look at tiny snowboarder's head level (scaled down)
  }
  
  // Handle auto-rotation with seamless transitions
  if (cameraSettings.autoRotate) {
    autoRotateAngle += cameraSettings.speed;
    
    // If we just switched to auto-rotate, smoothly blend from current position
    if (timeSinceInput <= idleDetection.idleTimeout + 1000) { // 1 second blend time
      // Smoothly interpolate from manual to auto position
      const blendFactor = Math.min(1, (timeSinceInput - idleDetection.idleTimeout) / 1000); // 1 second blend
      currentPhi = mouseState.phi * (1 - blendFactor) + autoRotateAngle * blendFactor;
      // Keep user's vertical angle but slowly drift to a nice viewing angle
      const targetTheta = Math.PI / 3; // Slightly higher angle for better view
      currentTheta = mouseState.theta * (1 - blendFactor) + targetTheta * blendFactor;
    } else {
      // Full auto-rotate - continue from where user left off
      currentPhi = autoRotateAngle;
      currentTheta = Math.PI / 3; // Nice viewing angle
    }
  }
  
  // Convert spherical coordinates to cartesian
  const x = currentTarget.x + cameraSettings.radius * Math.sin(currentTheta) * Math.cos(currentPhi);
  const y = currentTarget.y + cameraSettings.radius * Math.cos(currentTheta);
  const z = currentTarget.z + cameraSettings.radius * Math.sin(currentTheta) * Math.sin(currentPhi);
  
  camera.position.set(x, y, z);
  camera.lookAt(currentTarget);
}

function animate() {
  requestAnimationFrame(animate);
  
  handleKeyboardControls();
  updateSnowboarder(); // Update snowboarder physics and movement
  updateCameraPosition();
  updateCinematicBars(); // Update cinematic bars animation
  
  renderer.render(scene, camera);
}

// --- Initialize ---
setupMouseControls();
animate();

// --- Responsive Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Show initial instructions
setTimeout(() => {
  console.log('🎮 Controls Ready!');
  console.log('🎥 CAMERA:');
  console.log('• Right-click + drag = Free camera look');
  console.log('• Scroll wheel = Zoom in/out');
  console.log('• SPACE = Toggle auto-orbit');
  console.log('• F = Follow snowboarder');
  console.log('• R = Reset camera');
  console.log('');
  console.log('🏂 SNOWBOARDER:');
  console.log('• W/↑ = Move forward');
  console.log('• S/↓ = Move backward');
  console.log('• A/← = Turn left');
  console.log('• D/→ = Turn right');
}, 1000);
