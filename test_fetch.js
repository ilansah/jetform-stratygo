const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/uploads/missing_file.pdf',
    method: 'HEAD'
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    // If we get 200, it's BAD (because it's serving index.html)
    // If we get 404, it's GOOD (but only if we fixed it, currently expecting 200)

    if (res.statusCode === 200 && res.headers['content-type'] && res.headers['content-type'].includes('text/html')) {
        console.log("FAIL: Server returned HTML for missing PDF. This causes the PDF viewer error.");
    } else if (res.statusCode === 404) {
        console.log("SUCCESS: Server returned 404 for missing PDF.");
    } else {
        console.log("UNKNOWN: Check headers manually.");
    }
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
