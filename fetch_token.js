const key = "DVbZeuGGcOQKtRL1Kr4WCV6mOAHoEDwrUGzWgIN2myGN5CFI";
const secret = "AlCA04HIrvRhK9VogcJqXITzFmvQ0JUlMYOwGPG814m2bbUXF4EZEJzprW7B1BIf";
const auth = Buffer.from(`${key}:${secret}`).toString('base64');

async function getToken(url, name) {
    console.log(`\n--- Testing ${name} ---`);
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
        });
        
        const status = response.status;
        const text = await response.text();
        
        console.log(`HTTP Status: ${status}`);
        if (status === 200) {
            const data = JSON.parse(text);
            console.log(`✅ Success! Access Token: ${data.access_token}`);
            console.log(`Expires in: ${data.expires_in} seconds`);
        } else {
            console.log(`❌ Failed: ${text}`);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

(async () => {
    // Production test
    await getToken('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', 'Production');
})();
