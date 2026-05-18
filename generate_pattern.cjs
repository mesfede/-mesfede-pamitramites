const fs = require('fs');

const icons = [
  '<path d="M10 2v6h-6v8h6v6h4v-6h6v-8h-6v-6z"/>',
  '<path d="M2 12h20 M12 2v20" transform="rotate(45 12 12)" />',
  '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M2 12l20-2"/>',
  '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
  '<path d="M10 21c-4.4 0-8-3.6-8-8 0-4.4 3-6.5 4.5-8.5C7.5 3 8.3 2 10 2c1.7 0 2.5 1 3.5 2.5C15 6.5 18 8.6 18 13c0 4.4-3.6 8-8 8Z"/><path d="M10 21v-4"/><path d="M2 13h16"/>',
  '<path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/>',
  '<path d="M8.5 2h7"/><path d="M10 2v10.5l-5 8c-.6.9-.1 2.1 1 2.1h12c1.1 0 1.6-1.2 1-2.1l-5-8V2"/><path d="M6 14h12"/>',
  '<path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1h-2"/>',
  '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/><path d="M12 12v3"/>',
  '<path d="m15.5 15.5 3.8 3.8a4 4 0 0 0 5.6-5.6l-3.8-3.8"/><path d="m4.7 4.7 3.8 3.8"/><path d="M3 13.3c-2.4 2.4-2.4 6.2 0 8.5s6.1 2.4 8.5 0l8.2-8.2c2.4-2.4 2.4-6.2 0-8.5s-6.1-2.4-8.5 0Z"/><path d="m11.2 15.3-2.6-2.6"/><path d="m14.3 12.2-2.6-2.6"/>',
  '<path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="m17 6-2.5-2.5"/><path d="m14 8-1-1"/><path d="m7 18 2.5 2.5"/><path d="m3.5 14.5.5.5"/><path d="m20 9 .5.5"/><path d="m10 16 1 1"/>',
  '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>',
  '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  '<circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>',
  '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'
];

const fillers = [
  '<circle cx="12" cy="12" r="1.5" fill="#0b2344" stroke="none" />',
  '<circle cx="12" cy="12" r="3.5" fill="none" />',
  '<path d="M10 12h4 M12 10v4" />',
  '<path d="M10 10l4 4 M14 10l-4 4" />',
  '<circle cx="12" cy="12" r="1" fill="#0b2344" stroke="none" />'
];

const width = 800;
const height = 800;

let seed = 1234;
function random() {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

let svgElements = [];
const gridSize = 45;
const itemsPerRow = Math.ceil(width / gridSize);
const itemsPerCol = Math.ceil(height / gridSize);

for (let i = -1; i <= itemsPerRow; i++) {
  for (let j = -1; j <= itemsPerCol; j++) {
    const x = i * gridSize + (random() * gridSize * 0.9);
    const y = j * gridSize + (random() * gridSize * 0.9);
    const scale = 0.5 + random() * 0.6;
    const rotate = random() * 360;
    const icon = icons[Math.floor(random() * icons.length)];
    
    svgElements.push(
      '<g transform="translate(' + Math.round(x) + ', ' + Math.round(y) + ') scale(' + scale.toFixed(2) + ') rotate(' + Math.round(rotate) + ')">' +
        '<g transform="translate(-12, -12)">' +
          icon +
        '</g>' +
      '</g>'
    );
    
    for (let k = 0; k < 2; k++) {
      const fx = x + (random() - 0.5) * gridSize * 1.5;
      const fy = y + (random() - 0.5) * gridSize * 1.5;
      if (fx > 0 && fx < width && fy > 0 && fy < height) {
         const fScale = 0.5 + random() * 0.6;
         const fRotate = random() * 360;
         const filler = fillers[Math.floor(random() * fillers.length)];
         svgElements.push(
          '<g transform="translate(' + Math.round(fx) + ', ' + Math.round(fy) + ') scale(' + fScale.toFixed(2) + ') rotate(' + Math.round(fRotate) + ')">' +
            '<g transform="translate(-12, -12)">' +
              filler +
            '</g>' +
          '</g>'
        );
      }
    }
  }
}

const svg = '<svg width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" fill="none" stroke="#0b2344" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">\n  ' + svgElements.join('\n  ') + '\n</svg>';

const encoded = encodeURIComponent(svg).replace(/'/g, "%27");
const cssPattern = "data:image/svg+xml," + encoded;

let css = fs.readFileSync('src/index.css', 'utf-8');
css = css.replace(/background-image: url\("data:image\/svg\+xml,[^"]+"\);/, 'background-image: url("' + cssPattern + '");');
css = css.replace(/opacity: 0\.[0-9]+;/, 'opacity: 0.03;');

fs.writeFileSync('src/index.css', css);
console.log('Done SVG update');
