const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'upload.wikimedia.org',
  port: 443,
  path: '/wikipedia/fi/thumb/3/30/Oiva-hymy.png/250px-Oiva-hymy.png',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'image/png,image/*;q=0.8'
  }
};

const req = https.request(options, (res) => {
  if (res.statusCode === 200) {
    const file = fs.createWriteStream('images/oiva-logo.png');
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Download completed.');
    });
  } else {
    console.log('Error: ' + res.statusCode);
  }
});

req.on('error', (e) => {
  console.error(`Problem: ${e.message}`);
});

req.end();
