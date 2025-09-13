// background-art.js
// Injects SVG background graphics into the page
export function injectBackgroundArt() {
  const bgDiv = document.createElement('div');
  bgDiv.style.position = 'fixed';
  bgDiv.style.top = '0';
  bgDiv.style.left = '0';
  bgDiv.style.width = '100vw';
  bgDiv.style.height = '100vh';
  bgDiv.style.zIndex = '-1';
  bgDiv.style.pointerEvents = 'none';
  bgDiv.innerHTML = `
    <!-- Circle -->
    <svg width="60" height="60" style="position:absolute;top:340px;left:10vw;opacity:0.13;" viewBox="0 0 60 60">
      <circle cx="30" cy="30" r="24" stroke="#006ad1" stroke-width="3" fill="none" />
    </svg>
    <svg width="60" height="60" style="position:absolute;top=320px;left:80vw;opacity:0.13;" viewBox="0 0 60 60">
      <polygon points="15,50 45,50 55,20 5,20" stroke="#ff9800" stroke-width="2" fill="none" />
    </svg>
    <!-- Hexagon -->
    <svg width="56" height="56" style="position:absolute;top=330px;left:40vw;opacity:0.13;" viewBox="0 0 56 56">
      <polygon points="28,6 50,18 50,38 28,50 6,38 6,18 28,6" stroke="#347d1b" stroke-width="3" fill="none" />
    </svg>
    <svg width="56" height="56" style="position:absolute;top=500px;right:12vw;opacity:0.13;" viewBox="0 0 56 56">
      <polygon points="28,6 50,18 50,38 28,50 6,38 6,18 28,6" stroke="#222" stroke-width="2" fill="none" />
    </svg>
    <!-- Lines -->
    <svg width="80" height="20" style="position:absolute;top:240px;left:20vw;opacity:0.10;" viewBox="0 0 80 20">
      <line x1="10" y1="10" x2="70" y2="10" stroke="#006ad1" stroke-width="3" />
    </svg>
    <svg width="80" height="20" style="position:absolute;top:400px;right:20vw;opacity:0.10;" viewBox="0 0 80 20">
      <line x1="10" y1="10" x2="70" y2="10" stroke="#ff9800" stroke-width="2" />
    </svg>
    <!-- Arrows -->
    <svg width="60" height="30" style="position:absolute;top:120px;right:10vw;opacity:0.12;" viewBox="0 0 60 30">
      <line x1="10" y1="15" x2="50" y2="15" stroke="#347d1b" stroke-width="3" />
      <polygon points="50,15 44,10 44,20" fill="#347d1b" />
    </svg>
    <svg width="60" height="30" style="position:absolute;top:calc(600px - 4em);right:5vw;opacity:0.12;" viewBox="0 0 60 30">
      <line x1="50" y1="15" x2="10" y2="15" stroke="#222" stroke-width="2" />
      <polygon points="10,15 16,10 16,20" fill="#222" />
    </svg>
    <!-- More shapes for coverage -->
    <svg width="48" height="48" style="position:absolute;top:220px;left:60vw;opacity:0.14;" viewBox="0 0 48 48">
      <rect x="8" y="8" width="32" height="32" stroke="#ff9800" stroke-width="3" fill="none" />
    </svg>
    <svg width="48" height="48" style="position:absolute;top:340px;left:30vw;opacity:0.14;" viewBox="0 0 48 48">
      <polygon points="24,8 8,40 40,40" stroke="#0070ba" stroke-width="3" fill="none" />
    </svg>
    <svg width="56" height="56" style="position:absolute;top:380px;right:30vw;opacity:0.13;" viewBox="0 0 56 56">
      <polygon points="28,8 46,20 40,44 16,44 10,20" stroke="#347d1b" stroke-width="3" fill="none" />
    </svg>
    <!-- Bulleted Quotes, indented 1em left from previous position -->
    <svg width="600" height="260" style="position:absolute;top:calc(50vh - 130px + 5em);left:calc(50vw - 300px + 4em);opacity:0.18;" viewBox="0 0 600 260">
      <g font-family="Arial">
        <text x="30" y="40" fill="#006ad1" font-size="1.125em">•	“Learn, Grow, Achieve.”</text>
        <text x="60" y="80" fill="#ff9800" font-size="1.125em">•	“Every lesson is a step forward.”</text>
        <text x="90" y="120" fill="#347d1b" font-size="1.125em">•	“Building knowledge one session at a time.”</text>
        <text x="120" y="160" fill="#222" font-size="1.125em">•	“Curiosity creates success.”</text>
        <text x="150" y="200" fill="#006ad1" font-size="1.125em">•	“Education opens doors.”</text>
      </g>
    </svg>
    <!-- Line break after quotes -->
    <svg width="400" height="2" style="position:absolute;top:calc(50vh + 140px + 5em);left:calc(50vw - 200px);opacity:0.18;" viewBox="0 0 400 2">
      <line x1="0" y1="1" x2="400" y2="1" stroke="#006ad1" stroke-width="2" />
    </svg>
  `;
  document.body.appendChild(bgDiv);
}

// Auto-inject on module load
injectBackgroundArt();
