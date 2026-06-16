const http = require('http');

const PAT = 'ghp_fI...SAdL';

function deleteRepo() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/wallyatkins/OpenHouseMap',
      method: 'DELETE',
      headers: {
        'Authorization': `token ${PAT}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Node.js'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Delete status: ${res.statusCode}`);
        resolve(res.statusCode === 204 || res.statusCode === 404);
      });
    });

    req.on('error', (e) => {
      console.error('Delete error:', e.message);
      resolve(false);
    });

    req.end();
  });
}

function createRepo() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      name: 'OpenHouseMap',
      description: 'Private property and home detail mapper. Map your land and house at architectural detail.',
      private: false,
      auto_init: false
    });

    const options = {
      hostname: 'api.github.com',
      path: '/user/repos',
      method: 'POST',
      headers: {
        'Authorization': `token ${PAT}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Node.js',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 201) {
          const repo = JSON.parse(data);
          console.log(`Repo created: ${repo.html_url}`);
          resolve(repo.html_url);
        } else {
          console.log(`Create status: ${res.statusCode}, ${data}`);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.error('Create error:', e.message);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('Step 1: Deleting existing repo...');
  const deleted = await deleteRepo();
  
  if (deleted || deleted === 404) {
    console.log('Step 2: Creating new repo without auto-init...');
    const url = await createRepo();
    if (url) {
      console.log('Success! Set your remote to:', url.replace('https://', 'https://wallyatkins:ghp_fI...SAdL@'));
    }
  } else {
    console.log('Failed to delete repo');
  }
}

main();
