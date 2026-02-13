const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/uploads/id_card_back-1769867929144-60925409.png',
    method: 'HEAD'
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
