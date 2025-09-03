# Three.js Mountain Scene Portfolio

A 3D portfolio project featuring an interactive mountain scene built with Three.js.

## Features

- 3D mountain scene with GLTF model loading
- Orbiting camera around a peak reference point
- Interactive Three.js environment
- Responsive design

## Quick Start

### Option 1: Using the Batch File (Windows)
Simply double-click `startApp.bat` to start the development server.

### Option 2: Using npm
```bash
npm install
npm start
```

The app will be available at: `http://127.0.0.1:8081/src/`

## Project Structure

```
portfolioProj/
├── src/
│   ├── app.js              # Main application logic
│   ├── index.html          # HTML entry point
│   └── jsModules/          # Three.js modules and utilities
│       ├── THREE.js
│       ├── GLTFLoader.js
│       ├── loader.js
│       ├── BufferGeometryUtils.js
│       └── RGBELoader.js
├── prefabs/
│   └── mountainScene.glb   # 3D mountain model
├── package.json
├── startApp.bat           # Quick start batch file
└── README.md
```

## Technologies Used

- **Three.js** - 3D graphics library
- **GLTF** - 3D model format
- **ES6 Modules** - Modern JavaScript modules
- **http-server** - Development server

## Development

To stop the server, press `Ctrl+C` in the terminal window.

## License

This project is licensed under the ISC License.
