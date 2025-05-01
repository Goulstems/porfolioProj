import { GLTFLoader } from './GLTFLoader.js';

export function loadFile(objPath, scene, callback) {
  // Log to console the name of the file being loaded.
  console.log("\t[LOADING " + objPath + "...]");

  const loader = new GLTFLoader();

  // Load the GLTF file
  loader.load(
    objPath,
    (gltf) => {
      const sceneRoot = gltf.scene;
      scene.add(sceneRoot);

      // Search for the object named "peakRef" inside the loaded model
      const peak = sceneRoot.getObjectByName("peakRef");
      if (peak) {
        window.peakRef = peak;
        console.log("✅ peakRef loaded!");
      } else {
        console.error("⚠️ peakRef not found!");
      }

      // Execute the callback with the loaded sceneRoot, if provided
      if (callback) callback(sceneRoot);
    },
    undefined, // Optional: progress handler can be defined here if needed
    (error) => {
      console.error("Error loading file:", error);
    }
  );
}
