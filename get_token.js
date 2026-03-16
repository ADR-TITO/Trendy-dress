const https = require('https');

const key = "DVbZeuGGcOQKtRL1Kr4WCV6mOAHoEDwrUGzWgIN2myGN5CFI";
const secret = "AlCA04HIrvRhK9VogcJqXITzFmvQ0JUlMYOwGPG814m2bbUXF4EZEJzprW7B1BIf";
const auth = Buffer.from(`${key}:${secret}`).toString('base64');

async function check(url, name) {
    console.log(`Checking ${name}...`);
    return new Promise((resolve) => {
        const req = https.get(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Body: ${data}`);
                resolve();
            });
        });
        req.on('error', (e) => {
            console.error(`Error: ${e.message}`);
            resolve();
        });
    });
}

(async () => {
    await check('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', 'Sandbox');
    await check('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', 'Production');
})();
