const https = require('https');
https.get('https://drive.google.com/uc?export=download&id=1jMgV72hC29P1sKIt_kQ1JdEvxks4jC9P', {
    headers: { 'Origin': 'https://example.com' }
}, (res) => {
    console.log(res.statusCode, res.headers);
});
