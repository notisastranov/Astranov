import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEXTURES_DIR = path.join(__dirname, '..', 'public', 'textures');

const textures = [
  { name: 'earth-blue-marble.jpg', url: 'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-blue-marble.jpg' },
  { name: 'earth-topology.png', url: 'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-topology.png' },
  { name: 'earth-water.png', url: 'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-water.png' },
  { name: 'earth-clouds.png', url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png' },
  { name: 'lensflare0.png', url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/lensflare/lensflare0.png' },
  { name: 'lensflare0_alpha.png', url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/lensflare/lensflare0_alpha.png' },
  { name: 'youtube-icon.png', url: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' }
];

async function download(url: string, dest: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(dest, buffer);
  console.log(`Downloaded ${url} to ${dest}`);
}

async function main() {
  if (!fs.existsSync(TEXTURES_DIR)) {
    fs.mkdirSync(TEXTURES_DIR, { recursive: true });
  }

  for (const texture of textures) {
    const dest = path.join(TEXTURES_DIR, texture.name);
    try {
      await download(texture.url, dest);
    } catch (error) {
      console.error(`Error downloading ${texture.name}:`, error);
    }
  }
}

main();
