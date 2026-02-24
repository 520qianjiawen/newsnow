import https from 'https';

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

(async () => {
    try {
        const html = await fetchHtml('https://www.36kr.com/newsflashes');
        console.log("newsflashes HTML length:", html.length);
        if (html.includes('newsflash-item')) {
            console.log("newsflash-item CLASS FOUND!");
        } else {
            console.log("newsflash-item NOT FOUND");
            const match = html.match(/window\.initialState\s*=\s*(\{.*?\})\s*</);
            if (match) {
                console.log("Found window.initialState");
            } else {
                console.log("Trying to find NEXT_DATA or similar state objects");
            }
        }
        
        // Write the first 2000 chars of HTML to see what's going on
        const fs = await import('fs');
        fs.writeFileSync('36kr_test.html', html);
        console.log("HTML saved to 36kr_test.html");
    } catch (e) {
        console.error(e);
    }
})();
