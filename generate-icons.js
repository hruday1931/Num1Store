const fs = require('fs');
const path = require('path');

// Create a simple SVG icon with the Num1Store branding
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#ec4899" rx="${size * 0.1}"/>
  <text x="50%" y="45%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.15}" font-weight="bold" fill="white">
    Num1
  </text>
  <text x="50%" y="65%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.12}" font-weight="bold" fill="#fbbf24">
    Store
  </text>
</svg>
`;

// Generate icon files
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create SVG files for each size
sizes.forEach(size => {
  const svg = createIconSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  fs.writeFileSync(filepath, svg);
  console.log(`Created ${filename}`);
});

console.log('Icon SVG files generated successfully!');
console.log('Note: These are SVG placeholders. For production, convert them to PNG files using a tool like ImageMagick or an online converter.');
console.log('Example conversion command: for file in *.svg; do convert "$file" "${file%.svg}.png"; done');
