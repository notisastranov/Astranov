
async function test() {
  const urls = [
    'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-dark.jpg',
    'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-clouds.png',
    'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-water.png',
    'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-topology.png',
    'https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/night-sky.png',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(`${url}: ${res.status} ${res.statusText}`);
    } catch (e) {
      console.log(`${url}: Error ${e.message}`);
    }
  }
}

test();
