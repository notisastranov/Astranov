
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GLOBE_ASSETS_DIR = path.join(__dirname, '..', 'public', 'assets', 'globe');

const textures = [
  { name: 'earth-dark.jpg', url: 'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-dark.jpg' },
  { name: 'earth-clouds.png', url: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png' },
  { name: 'earth-water-mask.png', url: 'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-water.png' },
  { name: 'earth-topology.png', url: 'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-topology.png' },
  { name: 'starfield.png', url: 'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/night-sky.png' }
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
  if (!fs.existsSync(GLOBE_ASSETS_DIR)) {
    fs.mkdirSync(GLOBE_ASSETS_DIR, { recursive: true });
  }

  for (const texture of textures) {
    const dest = path.join(GLOBE_ASSETS_DIR, texture.name);
    try {
      await download(texture.url, dest);
    } catch (error) {
      console.error(`Error downloading ${texture.name}:`, error);
    }
  }
}

main();
