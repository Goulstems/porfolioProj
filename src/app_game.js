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
  minRadius: 0.1,  // Minimum zoom distance
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
renderer.setClearColor(0x1E90FF, 1); // Bright vivid dodger blue sky
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Floating Text Overlay ---
function createFloatingText() {
  // Create main text container
  const textContainer = document.createElement('div');
  textContainer.id = 'floating-text-container';
  textContainer.baseTopPosition = 30; // Store base position for movement - moved higher
  textContainer.style.cssText = `
    position: fixed;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 900;
    font-family: 'Arial', sans-serif;
    text-align: center;
    color: #ffffff;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    pointer-events: none;
    user-select: none;
    animation: fadeInDown 2s ease-out;
  `;
  
  // Main name
  const nameElement = document.createElement('h1');
  nameElement.id = 'floating-name';
  nameElement.textContent = 'Joshua Morvant';
  nameElement.style.cssText = `
    margin: 0;
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 300;
    letter-spacing: 3px;
    margin-bottom: 10px;
  `;
  
  // Subtitle
  const subtitleElement = document.createElement('p');
  subtitleElement.id = 'floating-subtitle';
  subtitleElement.textContent = '- Snowboarding / Software';
  subtitleElement.style.cssText = `
    margin: 0;
    font-size: clamp(1rem, 2.5vw, 1.4rem);
    font-weight: 400;
    letter-spacing: 2px;
    opacity: 0.9;
    white-space: nowrap;
  `;
  
  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInDown {
      0% {
        opacity: 0;
        transform: translateX(-50%) translateY(-30px);
      }
      100% {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
    
    #floating-text-container:hover {
      transform: translateX(-50%) scale(1.05);
      transition: transform 0.3s ease;
    }
    
    @media (max-width: 768px) {
      #floating-text-container {
        top: 20px;
      }
      #floating-name {
        letter-spacing: 1px;
      }
      #floating-subtitle {
        letter-spacing: 1px;
      }
    }
  `;
  
  document.head.appendChild(style);
  
  // Add elements to container
  textContainer.appendChild(nameElement);
  textContainer.appendChild(subtitleElement);
  
  // Store reference for dynamic positioning
  textContainer.baseTopPosition = 60; // Moved higher to match initial position
  
  // Add container to page
  document.body.appendChild(textContainer);
  
  return textContainer;
}

// Create the floating text
const floatingText = createFloatingText();

// --- Snow Particle System ---
const snowSettings = {
  count: 20000,        // Keep your high particle count
  area: 15,            // Back to original concentrated area
  speed: 0.05,         // Fast fall speed
  windStrength: 0.02,  // Strong wind
  size: 0.015,         // Good visible size
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

function updateFloatingTextPosition() {
  // Move text down by the current height of the top cinematic bar
  const textContainer = document.getElementById('floating-text-container');
  if (textContainer && textContainer.baseTopPosition !== undefined) {
    const newTopPosition = textContainer.baseTopPosition + cinematicBars.currentHeight;
    textContainer.style.top = `${newTopPosition}px`;
  }
}

// Create the bars
createCinematicBars();

// --- Lighting ---
// Create a bright sunny day atmosphere
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Reduced ambient
scene.add(ambientLight);

// Sun directional light - bright and warm but toned down
const sunLight = new THREE.DirectionalLight(0xfff8dc, 0.8); // Reduced from 1.2 to 0.8
sunLight.position.set(50, 80, 30); // High in the sky, angled
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

// Create visible sun sphere
const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ 
  color: 0xffff99,
  emissive: 0xffff99,
  emissiveIntensity: 0.2 // Reduced emissive intensity
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.copy(sunLight.position).multiplyScalar(0.8); // Position near the light
scene.add(sun);

// Add secondary fill light for softer shadows
const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.2); // Reduced from 0.3 to 0.2
fillLight.position.set(-30, 40, -20);
scene.add(fillLight);

// Clear atmospheric background - remove fog for crisp bluebird day
scene.background = null; // Use renderer clear color instead

let mountainMesh = null;

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
  
  // Calculate where camera would be at this radius
  const testX = currentTarget.x + testRadius * Math.sin(mouseState.theta) * Math.cos(mouseState.phi);
  const testY = currentTarget.y + testRadius * Math.cos(mouseState.theta);
  const testZ = currentTarget.z + testRadius * Math.sin(mouseState.theta) * Math.sin(mouseState.phi);
  
  const testPos = new THREE.Vector3(testX, testY, testZ);
  const direction = new THREE.Vector3().subVectors(testPos, currentTarget).normalize();
  
  
  // When orbiting mountain peak, allow closer zoom for cinematic shots
  const ZOOM_SAFETY_BUFFER = 0.3; // Reduced buffer for closer zoom
  const raycaster = new THREE.Raycaster(currentTarget, direction, 0, testRadius + ZOOM_SAFETY_BUFFER);
  const intersects = raycaster.intersectObject(mountainMesh, true);
  
  const MIN_SAFE_ZOOM = 0.2; // Much closer minimum zoom for cinematic mode
  return intersects.length === 0 && testRadius >= MIN_SAFE_ZOOM;
}

// --- Comprehensive Input Detection ---
function setupGlobalInputDetection() {
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

document.addEventListener('keydown', (e) => { 
  keys[e.code] = true; 
});
document.addEventListener('keyup', (e) => { 
  keys[e.code] = false; 
});

function handleKeyboardControls() {
  if (keys['KeyR']) { // Reset camera
    mouseState.phi = 0;
    mouseState.theta = Math.PI / 4;
    cameraSettings.radius = 3.4;
    cameraSettings.autoRotate = true;
    keys['KeyR'] = false;
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
  
  // Set orbit target to the known peak coordinates
  orbitTarget.set(MOUNTAIN_PEAK.x, MOUNTAIN_PEAK.y, MOUNTAIN_PEAK.z);
  
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
  
  // Use safety margins for mountain orbiting
  const SAFETY_BUFFER = 1.0;
  
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
      const safeDistance = Math.max(SAFETY_BUFFER, hitDistance * 0.7);
      
      return new THREE.Vector3()
        .copy(direction)
        .multiplyScalar(safeDistance)
        .add(target);
    }
  }
  
  // Maintain minimum distance for mountain orbiting
  const minDistance = 0.8;
  if (distance < minDistance) {
    return new THREE.Vector3()
      .copy(direction)
      .multiplyScalar(minDistance)
      .add(target);
  }
  
  return desiredPos;
}

function animate() {
  requestAnimationFrame(animate);
  
  handleKeyboardControls();
  updateCameraPosition();
  updateSnowSystem(); // Update falling snow particles
  updateCinematicBars(); // Update cinematic bars animation
  updateFloatingTextPosition(); // Move text with cinematic bars
  
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
