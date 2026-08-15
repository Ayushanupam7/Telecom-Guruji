const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'apps', 'web', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>
    <linearGradient id="sig" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#a855f7" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)" />
  <g filter="url(#glow)">
    <path d="M 110 256 C 160 140, 200 370, 256 256 C 312 142, 350 370, 402 256" stroke="url(#sig)" stroke-width="36" stroke-linecap="round" fill="none" />
    <circle cx="256" cy="180" r="24" fill="#38bdf8" />
    <circle cx="330" cy="256" r="18" fill="#a855f7" />
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');

// 2. Create manifest.json
const manifestContent = {
  name: "SignalHub",
  short_name: "SignalHub",
  description: "AI-Powered Learning & Verification Platform",
  start_url: "/",
  display: "standalone",
  background_color: "#0f172a",
  theme_color: "#4f46e5",
  icons: [
    {
      src: "/icon.svg",
      sizes: "any",
      type: "image/svg+xml"
    },
    {
      src: "/icon-192.png",
      sizes: "192x192",
      type: "image/png"
    },
    {
      src: "/icon-512.png",
      sizes: "512x512",
      type: "image/png"
    }
  ]
};

fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(manifestContent, null, 2), 'utf8');
console.log('Public static files generated successfully.');
