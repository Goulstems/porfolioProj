import * as THREE from './jsModules/THREE.js';
import { loadFile } from './jsModules/loader.js';

// Snowboarding game
// Snowboarding game with Three.js

// --- Camera Control Settings ---
const cameraSettings = {
  radius: 3.4,  // Start at cinematic distance for mountain overview
  height: 0.7,
  speed: 0.003,  // Smooth rotation speed
  autoRotate: true,  // Start with auto-rotate on
  fov: 30,  // Wider field of view for close-up
  minRadius: 0.05,  // Allow very close zoom to snowboarder
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
  lastInputTime: Date.now() - 6000, // Start 6 seconds ago to immediately trigger cinematic mode
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

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0x87CEEB, 1); // Sky blue background to contrast with white snow
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Snow Particle System ---
const snowSettings = {
  count: 20000,        // Keep your high particle count
  area: 15,            // Back to original concentrated area
  speed: 0.05,         // Fast fall speed
  windStrength: 0.02,  // Strong wind
  size: 0.025,         // Good visible size
  windDirection: 0.6   // Diagonal wind for realism
};

let snowParticles = [];
let snowGroup;

function createSnowSystem() {
  snowGroup = new THREE.Group();
  snowParticles = [];
  
  // Get mountain center for snow positioning
  const centerX = orbitTarget ? orbitTarget.x : 0;
  const centerZ = orbitTarget ? orbitTarget.z : 0;
  
  // Create geometries for different snowflake sizes
  const fullSizeGeometry = new THREE.SphereGeometry(snowSettings.size, 6, 6);
  const halfSizeGeometry = new THREE.SphereGeometry(snowSettings.size * 0.5, 4, 4);
  const quarterSizeGeometry = new THREE.SphereGeometry(snowSettings.size * 0.25, 3, 3);
  
  const snowflakeMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffffff,
    transparent: false
  });
  
  for (let i = 0; i < snowSettings.count; i++) {
    // Randomly choose size (50% full, 30% half, 20% quarter)
    let geometry;
    const sizeRandom = Math.random();
    if (sizeRandom < 0.5) {
      geometry = fullSizeGeometry; // 50% full size
    } else if (sizeRandom < 0.8) {
      geometry = halfSizeGeometry; // 30% half size
    } else {
      geometry = quarterSizeGeometry; // 20% quarter size
    }
    
    const snowflake = new THREE.Mesh(geometry, snowflakeMaterial);
    
    // Random position centered around mountain
    snowflake.position.x = centerX + (Math.random() - 0.5) * snowSettings.area;
    snowflake.position.y = Math.random() * 20 + 10; // Start higher for better coverage
    snowflake.position.z = centerZ + (Math.random() - 0.5) * snowSettings.area;
    
    // Store velocity on the mesh - smaller flakes fall slightly slower
    const sizeMultiplier = geometry === quarterSizeGeometry ? 0.7 : (geometry === halfSizeGeometry ? 0.85 : 1.0);
    snowflake.velocity = new THREE.Vector3(
      snowSettings.windDirection * snowSettings.windStrength * sizeMultiplier,
      -snowSettings.speed * sizeMultiplier,
      snowSettings.windDirection * snowSettings.windStrength * 0.3 * sizeMultiplier
    );
    
    snowParticles.push(snowflake);
    snowGroup.add(snowflake);
  }
  
  scene.add(snowGroup);
  
  // Add one bright test snowflake to ensure visibility
  const testSnowflake = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8), // Larger test snowflake
    new THREE.MeshBasicMaterial({ color: 0xffff00 }) // Bright yellow
  );
  testSnowflake.position.set(centerX, 5, centerZ); // Position over mountain center
  scene.add(testSnowflake);
}

function updateSnowSystem() {
  if (!snowParticles || snowParticles.length === 0) return;
  
  // Get current mountain center for respawning
  const centerX = orbitTarget ? orbitTarget.x : 0;
  const centerZ = orbitTarget ? orbitTarget.z : 0;
  
  for (let i = 0; i < snowParticles.length; i++) {
    const snowflake = snowParticles[i];
    
    // Update position based on velocity
    snowflake.position.add(snowflake.velocity);
    
    // Add some wind variation
    snowflake.velocity.x += (Math.random() - 0.5) * 0.001;
    
    // Reset snowflake if it falls too low or drifts too far from mountain center
    if (snowflake.position.y < -5 || 
        Math.abs(snowflake.position.x - centerX) > snowSettings.area || 
        Math.abs(snowflake.position.z - centerZ) > snowSettings.area) {
      
      // Reset to top, centered around mountain
      snowflake.position.x = centerX + (Math.random() - 0.5) * snowSettings.area;
      snowflake.position.y = Math.random() * 10 + 20; // Spawn higher
      snowflake.position.z = centerZ + (Math.random() - 0.5) * snowSettings.area;
      
      // Reset velocity
      snowflake.velocity.set(
        snowSettings.windDirection * snowSettings.windStrength,
        -snowSettings.speed,
        snowSettings.windDirection * snowSettings.windStrength * 0.3
      );
    }
  }
}

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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Brighter ambient for snowy day
scene.add(ambientLight);

// Add directional light for realistic snow illumination
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Snowy sky background
scene.background = new THREE.Color(0xf0f8ff); // Alice blue for snowy atmosphere
scene.fog = new THREE.Fog(0xf0f8ff, 20, 100); // Add fog for atmospheric depth

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
    // Clicking does NOT reset cinematic timer
    
    if (e.button === 2) { // Right mouse button
      mouseState.isRightDown = true;
      mouseState.lastX = e.clientX;
      mouseState.lastY = e.clientY;
      canvas.style.cursor = 'grabbing';
    }
  });
  
  // Mouse up
  canvas.addEventListener('mouseup', (e) => {
    // Releasing does NOT reset cinematic timer
    
    if (e.button === 2) {
      mouseState.isRightDown = false;
      canvas.style.cursor = 'default';
    }
  });
  
  // Mouse move
  canvas.addEventListener('mousemove', (e) => {
    // Only register input if right-click dragging (not regular mouse movement)
    if (mouseState.isRightDown) {
      registerInput(); // Right-click dragging resets cinematic timer
      
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
    // registerInput() is now handled globally
    
    const zoomSpeed = 0.1;
    let newRadius;
    
    if (e.deltaY > 0) {
      // Zoom out - always allow
      newRadius = Math.min(cameraSettings.maxRadius, cameraSettings.radius + zoomSpeed);
      cameraSettings.radius = newRadius;
    } else {
      // Zoom in - check for safety
      newRadius = Math.max(cameraSettings.minRadius, cameraSettings.radius - zoomSpeed);
      
      // Test if this zoom level would cause clipping
      const testSafe = isZoomSafe(newRadius);
      if (testSafe) {
        cameraSettings.radius = newRadius;
      }
      // If not safe, don't zoom in further
    }
  });

  // --- Touch Controls for Mobile ---
  let touchState = {
    isTracking: false,
    lastX: 0,
    lastY: 0,
    touchStartTime: 0
  };

  // Touch start
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling
    
    if (e.touches.length === 1) { // Single finger touch
      const touch = e.touches[0];
      touchState.isTracking = true;
      touchState.lastX = touch.clientX;
      touchState.lastY = touch.clientY;
      touchState.touchStartTime = Date.now();
      canvas.style.cursor = 'grabbing';
    }
  });

  // Touch end
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchState.isTracking = false;
    canvas.style.cursor = 'default';
  });

  // Touch move - orbit camera
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Prevent scrolling
    
    if (touchState.isTracking && e.touches.length === 1) {
      const touch = e.touches[0];
      registerInput(); // Touch dragging resets cinematic timer
      
      const deltaX = touch.clientX - touchState.lastX;
      const deltaY = touch.clientY - touchState.lastY;
      
      // Update camera angles (same as mouse)
      mouseState.phi -= deltaX * mouseState.sensitivity;
      mouseState.theta = Math.max(0.1, Math.min(Math.PI - 0.1, mouseState.theta + deltaY * mouseState.sensitivity));
      
      touchState.lastX = touch.clientX;
      touchState.lastY = touch.clientY;
    }
  });

  // Touch pinch for zoom
  let pinchDistance = 0;
  
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      // Two finger pinch start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      pinchDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
    }
  });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (pinchDistance > 0) {
        const deltaDistance = currentDistance - pinchDistance;
        const zoomSpeed = 0.01; // Smaller for touch sensitivity
        let newRadius;
        
        if (deltaDistance < 0) {
          // Pinch in - zoom in
          newRadius = Math.max(cameraSettings.minRadius, cameraSettings.radius + deltaDistance * zoomSpeed);
          const testSafe = isZoomSafe(newRadius);
          if (testSafe) {
            cameraSettings.radius = newRadius;
          }
        } else {
          // Pinch out - zoom out
          newRadius = Math.min(cameraSettings.maxRadius, cameraSettings.radius + deltaDistance * zoomSpeed);
          cameraSettings.radius = newRadius;
        }
      }
      
      pinchDistance = currentDistance;
    }
  });
}

function isZoomSafe(testRadius) {
  if (!mountainMesh) return true;
  
  // Get current target
  let currentTarget = orbitTarget;
  let isFollowingSnowboarder = false;
  if (followSnowboarder && snowboarder) {
    currentTarget = snowboarderSettings.position.clone();
    currentTarget.y += 0.04;
    isFollowingSnowboarder = true;
  }
  
  // Calculate where camera would be at this radius
  const testX = currentTarget.x + testRadius * Math.sin(mouseState.theta) * Math.cos(mouseState.phi);
  const testY = currentTarget.y + testRadius * Math.cos(mouseState.theta);
  const testZ = currentTarget.z + testRadius * Math.sin(mouseState.theta) * Math.sin(mouseState.phi);
  
  const testPos = new THREE.Vector3(testX, testY, testZ);
  const direction = new THREE.Vector3().subVectors(testPos, currentTarget).normalize();
  
  // When following snowboarder, be much more permissive with close zoom
  if (isFollowingSnowboarder) {
    // Allow very close zoom to snowboarder - only check for actual mountain collision
    const raycaster = new THREE.Raycaster(currentTarget, direction, 0, testRadius + 0.1);
    const intersects = raycaster.intersectObject(mountainMesh, true);
    
    // Allow minimum distance of 0.02 when following snowboarder (very close!)
    return intersects.length === 0 && testRadius >= 0.02;
  } else {
    // When orbiting mountain peak, allow closer zoom for cinematic shots
    const ZOOM_SAFETY_BUFFER = 0.3; // Reduced buffer for closer zoom
    const raycaster = new THREE.Raycaster(currentTarget, direction, 0, testRadius + ZOOM_SAFETY_BUFFER);
    const intersects = raycaster.intersectObject(mountainMesh, true);
    
    const MIN_SAFE_ZOOM = 0.2; // Much closer minimum zoom for cinematic mode
    return intersects.length === 0 && testRadius >= MIN_SAFE_ZOOM;
  }
}

// --- Comprehensive Input Detection ---
function setupGlobalInputDetection() {
  // NO general keyboard detection - only WASD will be detected in keyboard handlers
  
  // Detect scroll anywhere
  document.addEventListener('wheel', registerInput);
  
  // Detect touch events (for mobile/tablets)
  document.addEventListener('touchstart', registerInput);
  document.addEventListener('touchmove', registerInput);
  document.addEventListener('touchend', registerInput);
}

// --- Input Detection for Idle System ---
function registerInput() {
  idleDetection.lastInputTime = Date.now();
  if (cameraSettings.autoRotate) {
    // Store current auto-rotate position as new manual position for smooth transition
    mouseState.phi = autoRotateAngle;
    mouseState.theta = Math.PI / 3; // Use the current auto-rotate viewing angle
    cameraSettings.autoRotate = false;
  }
}

// --- Keyboard Controls ---
const keys = {};
let followSnowboarder = false; // Keep gameplay cam in background, use cinematic orbit

document.addEventListener('keydown', (e) => { 
  keys[e.code] = true; 
  
  // Only WASD keys reset the cinematic timer
  if (e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD') {
    registerInput();
  }
});
document.addEventListener('keyup', (e) => { 
  keys[e.code] = false; 
  
  // Only WASD keys reset the cinematic timer
  if (e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD') {
    registerInput();
  }
});

function handleKeyboardControls() {
  if (keys['KeyR']) { // Reset camera
    mouseState.phi = 0;
    mouseState.theta = Math.PI / 4;
    cameraSettings.radius = 3.4;
    cameraSettings.autoRotate = true;
    followSnowboarder = false;
    keys['KeyR'] = false;
    // R does NOT reset cinematic timer - only WASD does
  }
}

// --- Model Loading ---
let orbitTarget = new THREE.Vector3(0, 3, 0);

loadFile('/prefabs/mountainScene.glb', scene, (model) => {
  scene.add(model);
  
  // Find the mountain mesh for terrain collision
  model.traverse((child) => {
    if (child.isMesh && (child.name.toLowerCase().includes('mountain') || child.name.toLowerCase().includes('terrain'))) {
      mountainMesh = child;
    }
  });
  
  // If no specific mountain mesh found, use the first mesh
  if (!mountainMesh) {
    model.traverse((child) => {
      if (child.isMesh && !mountainMesh) {
        mountainMesh = child;
      }
    });
  }
  
  // Use static coordinates instead of dynamic peak finding for better performance
  const MOUNTAIN_PEAK = { x: -0.06617075204849243, y: 0.6651918888092041, z: -0.1258300095796585 };
  const SNOWBOARDER_SPAWN = { x: -0.06617075204849243, y: 0.6701918888092183, z: -0.1258300095796585 };
  
  // Set orbit target to the known peak coordinates
  orbitTarget.set(MOUNTAIN_PEAK.x, MOUNTAIN_PEAK.y, MOUNTAIN_PEAK.z);
  
  // Create and position the snowboarder
  snowboarder = createSnowboarder();
  
  // Spawn snowboarder directly at the mountain peak using static coordinates
  const peakX = SNOWBOARDER_SPAWN.x;
  const peakZ = SNOWBOARDER_SPAWN.z;
  
  // Use static coordinates instead of terrain height calculation
  snowboarderSettings.position.set(SNOWBOARDER_SPAWN.x, SNOWBOARDER_SPAWN.y, SNOWBOARDER_SPAWN.z);
  snowboarder.position.copy(snowboarderSettings.position);
  
  scene.add(snowboarder);
  
  // DETAILED LOGGING FOR STATIC COORDINATES
  
  // Now create snow system centered on the mountain
  createSnowSystem();
  
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
  let x = currentTarget.x + cameraSettings.radius * Math.sin(currentTheta) * Math.cos(currentPhi);
  let y = currentTarget.y + cameraSettings.radius * Math.cos(currentTheta);
  let z = currentTarget.z + cameraSettings.radius * Math.sin(currentTheta) * Math.sin(currentPhi);
  
  // Robust collision detection to prevent ANY clipping
  const safePosition = preventMountainClipping(currentTarget, new THREE.Vector3(x, y, z));
  
  camera.position.set(safePosition.x, safePosition.y, safePosition.z);
  camera.lookAt(currentTarget);
}

// --- Ultra-Robust Anti-Clipping System ---
function preventMountainClipping(target, desiredPos) {
  if (!mountainMesh) {
    return desiredPos;
  }
  
  const direction = new THREE.Vector3().subVectors(desiredPos, target).normalize();
  const distance = target.distanceTo(desiredPos);
  
  // Check if we're following the snowboarder
  const isFollowingSnowboarder = followSnowboarder && snowboarder;
  
  // Use different safety margins depending on what we're orbiting
  const SAFETY_BUFFER = isFollowingSnowboarder ? 0.1 : 1.0; // Much smaller buffer when following snowboarder
  
  // Multi-point collision detection for thorough coverage
  const checkPoints = [
    desiredPos.clone(),                                           // Camera position
    desiredPos.clone().add(direction.clone().multiplyScalar(0.1)), // Slightly forward
    desiredPos.clone().add(direction.clone().multiplyScalar(-0.1)), // Slightly back
  ];
  
  // Check each point for intersection
  for (const point of checkPoints) {
    const pointRay = new THREE.Raycaster(target, 
      new THREE.Vector3().subVectors(point, target).normalize(), 
      0, target.distanceTo(point) + 0.2);
    const hits = pointRay.intersectObject(mountainMesh, true);
    
    if (hits.length > 0) {
      // Found intersection - compute safe position
      const hitDistance = target.distanceTo(hits[0].point);
      const safeDistance = Math.max(SAFETY_BUFFER, hitDistance * (isFollowingSnowboarder ? 0.9 : 0.7));
      
      return new THREE.Vector3()
        .copy(direction)
        .multiplyScalar(safeDistance)
        .add(target);
    }
  }
  
  // When following snowboarder, be much more permissive about minimum distance
  const minDistance = isFollowingSnowboarder ? 0.02 : 0.8;
  if (distance < minDistance) {
    return new THREE.Vector3()
      .copy(direction)
      .multiplyScalar(minDistance)
      .add(target);
  }
  
  return desiredPos;
}

// --- Camera Collision Detection ---
function checkCameraCollision(target, desiredCameraPos) {
  if (!mountainMesh) return desiredCameraPos;
  
  // Create a ray from target to desired camera position
  const direction = new THREE.Vector3().subVectors(desiredCameraPos, target).normalize();
  const distance = target.distanceTo(desiredCameraPos);
  
  // Cast ray to check for mountain intersection
  const raycaster = new THREE.Raycaster(target, direction, 0, distance);
  const intersects = raycaster.intersectObject(mountainMesh, true);
  
  if (intersects.length > 0) {
    // Found collision - place camera before the intersection point
    const intersectionPoint = intersects[0].point;
    const safeDistance = 0.3; // Reasonable minimum distance from mountain surface
    const distanceToIntersection = target.distanceTo(intersectionPoint);
    
    // Only adjust if we're actually too close
    if (distanceToIntersection < safeDistance) {
      // Move camera back to safe distance
      const safePosition = new THREE.Vector3()
        .subVectors(intersectionPoint, target)
        .normalize()
        .multiplyScalar(Math.max(cameraSettings.minRadius, distanceToIntersection - safeDistance))
        .add(target);
      
      return safePosition;
    }
  }
  
  // No collision or collision is far enough, use desired position
  return desiredCameraPos;
}

function getMaxSafeRadius(requestedRadius) {
  if (!mountainMesh) return requestedRadius;
  
  // Get current target and camera angles
  let currentTarget = orbitTarget;
  if (followSnowboarder && snowboarder) {
    currentTarget = snowboarderSettings.position.clone();
    currentTarget.y += 0.04;
  }
  
  // Calculate camera position with requested radius
  const testX = currentTarget.x + requestedRadius * Math.sin(mouseState.theta) * Math.cos(mouseState.phi);
  const testY = currentTarget.y + requestedRadius * Math.cos(mouseState.theta);
  const testZ = currentTarget.z + requestedRadius * Math.sin(mouseState.theta) * Math.sin(mouseState.phi);
  
  const testPosition = new THREE.Vector3(testX, testY, testZ);
  const direction = new THREE.Vector3().subVectors(testPosition, currentTarget).normalize();
  
  // Cast ray to find maximum safe distance
  const raycaster = new THREE.Raycaster(currentTarget, direction, 0, requestedRadius);
  const intersects = raycaster.intersectObject(mountainMesh, true);
  
  if (intersects.length > 0) {
    // Return safe distance with reasonable buffer
    const maxSafeDistance = currentTarget.distanceTo(intersects[0].point) - 0.2;
    return Math.max(cameraSettings.minRadius, maxSafeDistance);
  }
  
  // No collision, use requested radius
  return requestedRadius;
}

function animate() {
  requestAnimationFrame(animate);
  
  handleKeyboardControls();
  updateSnowboarder(); // Update snowboarder physics and movement
  updateCameraPosition();
  updateSnowSystem(); // Update falling snow particles
  updateCinematicBars(); // Update cinematic bars animation
  
  renderer.render(scene, camera);
}

// --- Initialize ---
setupMouseControls();
setupGlobalInputDetection(); // Enable comprehensive input detection
animate();

// --- Responsive Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Show initial instructions
setTimeout(() => {
}, 1000);
