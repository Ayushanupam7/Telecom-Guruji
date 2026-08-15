const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, r, g, b, a = 255) {
  // Simple uncompressed IDAT PNG generator
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA (6)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data: height rows, each starting with filter byte 0 (None)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter 0
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Draw a subtle border / circle highlight
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const radius = width * 0.4;
      
      if (dist < radius) {
        // Gradient color inside circle
        const ratio = dist / radius;
        rawData[pxOffset] = Math.round(56 * (1 - ratio) + 15 * ratio);   // R
        rawData[pxOffset + 1] = Math.round(189 * (1 - ratio) + 23 * ratio); // G
        rawData[pxOffset + 2] = Math.round(248 * (1 - ratio) + 75 * ratio); // B
        rawData[pxOffset + 3] = 255;
      } else {
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
        rawData[pxOffset + 3] = a;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.slice(4, 8 + len));
  buf.writeInt32BE(crc, 8 + len);
  return buf;
}

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ -1;
}

const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

const publicDir = path.join(__dirname, '..', 'apps', 'web', 'public');

// Background color #0f172a (15, 23, 42)
const png192 = createPng(192, 192, 15, 23, 42);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);

const png512 = createPng(512, 512, 15, 23, 42);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);

const favicon = createPng(32, 32, 15, 23, 42);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon);

console.log('PNG icons (icon-192.png, icon-512.png, favicon.ico) created successfully.');
