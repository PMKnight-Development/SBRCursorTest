const https = require('https');

const layerUrls = [
  'https://tiles.arcgis.com/tiles/nGt4QxSblgDfuJn0/arcgis/rest/services/OpenStreetMap/VectorTileServer',
  'https://services1.arcgis.com/nGt4QxSblgDfuJn0/arcgis/rest/services/Trail_Labels/FeatureServer/0',
  'https://services1.arcgis.com/nGt4QxSblgDfuJn0/arcgis/rest/services/Trail_Routes/FeatureServer/0',
  'https://services1.arcgis.com/nGt4QxSblgDfuJn0/arcgis/rest/services/Trailheads/FeatureServer/0',
  'https://services1.arcgis.com/nGt4QxSblgDfuJn0/arcgis/rest/services/Parking_Areas/FeatureServer/0'
];

function testUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      console.log(`${url}: ${res.statusCode} ${res.statusMessage}`);
      resolve({ url, status: res.statusCode, message: res.statusMessage });
    });
    
    req.on('error', (error) => {
      console.error(`${url}: Error - ${error.message}`);
      reject({ url, error: error.message });
    });
    
    req.setTimeout(10000, () => {
      console.error(`${url}: Timeout`);
      req.destroy();
      reject({ url, error: 'Timeout' });
    });
  });
}

async function testAllUrls() {
  console.log('Testing ArcGIS layer URLs...\n');
  
  for (const url of layerUrls) {
    try {
      await testUrl(url);
    } catch (error) {
      console.error(`Failed to test ${url}:`, error);
    }
  }
  
  console.log('\nURL testing complete.');
}

testAllUrls(); 