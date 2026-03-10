import http from 'http';

function getProjectId() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'metadata.google.internal',
      path: '/computeMetadata/v1/project/project-id',
      headers: {
        'Metadata-Flavor': 'Google'
      }
    };

    const req = http.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Status code: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });
  });
}

getProjectId()
  .then(id => console.log('Project ID from metadata:', id))
  .catch(err => console.error('Error getting project ID:', err.message));
