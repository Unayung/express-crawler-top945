const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs-extra");
const puppeteer = require("puppeteer");
const app = express();
const port = 3456;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

async function scrape(baseUrl) {
  const browser = await puppeteer.launch({ 
    headless: true,
    executablePath: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.goto(baseUrl);
  await page.waitForSelector(".jp-playlist-current", { visible: true });
  const audioSrc = await page.$$eval("#jp_audio_0", (els) =>
    els.map((el) => el.getAttribute("src"))
  );
  let re = /https:\/\/www.top945.com.tw\/(.*)01/i;
  let mp3Src = audioSrc.toString().match(re)[1];
  await page.waitForSelector(
    "#jp_container_1 > div.jp-type-playlist > div.jp-playlist > ul > li > div > a.jp-playlist-item"
  );
  const result = await page.$$eval(
    "#jp_container_1 > div.jp-type-playlist > div.jp-playlist > ul > li > div > a.jp-playlist-item",
    (rows, mp3Src) => {
      return Array.from(rows, (row) => {
        let fileUrl =
          `https://www.top945.com.tw/${mp3Src}` +
          encodeURIComponent(row.text) +
          ".mp3";
        let fileName = row.text + ".mp3";

        return { fileUrl: fileUrl, fileName: fileName };
      });
    },
    mp3Src
  );
  browser.close();
  return result;
}

app.get("/", function (req, res) {
  if (req.query.u) {
    let baseUrl = req.query.u;
    let dir = `./downloads/${Date.now()}`;
    scrape(baseUrl).then((result) => {
      result.map((item) => {
        fetch(item.fileUrl).then((response) => {
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          response.body.pipe(fs.createWriteStream(`${dir}/` + item.fileName));
          console.log(item.fileName + " is downloaded");
        });
      });
    });
    res.send("baseUrl is set to " + req.query.u);
  } else {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>TOP 945 Audio Crawler</title>
        <script src="https://unpkg.com/html5-qrcode" type="text/javascript"></script>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            h1 { color: #333; }
            .input-group { margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background: #f9f9f9; }
            .input-row { display: flex; gap: 10px; margin-bottom: 10px; align-items: center; }
            input[type="text"] { flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 3px; }
            input[type="text"]:first-child { flex: 0 0 200px; }
            button { background: #007bff; color: white; padding: 8px 16px; border: none; cursor: pointer; border-radius: 3px; }
            button:hover { background: #0056b3; }
            button.remove { background: #dc3545; padding: 6px 12px; font-size: 14px; }
            button.remove:hover { background: #c82333; }
            button.add { background: #28a745; margin: 10px 0; }
            button.add:hover { background: #218838; }
            button.qr-scan { background: #17a2b8; color: white; padding: 8px 12px; border: none; cursor: pointer; border-radius: 3px; font-size: 14px; }
            button.qr-scan:hover { background: #138496; }
            button.submit { background: #007bff; padding: 12px 24px; font-size: 16px; margin-top: 20px; }
            .info { background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
            #status { margin-top: 20px; padding: 10px; background: #f8f9fa; border-radius: 4px; }
            label { font-weight: bold; margin-bottom: 5px; display: block; }
            .qr-modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.8); }
            .qr-modal-content { background-color: #fefefe; margin: 5% auto; padding: 20px; border-radius: 8px; width: 90%; max-width: 500px; position: relative; }
            .qr-close { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
            .qr-close:hover { color: black; }
            #qr-reader { width: 100%; margin: 10px 0; }
        </style>
    </head>
    <body>
        <h1>TOP 945 Audio Crawler</h1>
        <div class="info">
            <strong>Instructions:</strong> Enter folder names and corresponding TOP 945 URLs. Each URL should contain the GUID parameter. Downloads will be organized by folder name.
        </div>

        <div class="info" style="border-left-color: #28a745; background-color: #f8fff8;">
            <strong>📱 QR Code Scanner:</strong> Click the "Scan QR" button next to any URL field to open the camera and scan QR codes directly from magazines!
        </div>
        
        <form id="crawlForm">
            <div id="inputGroups">
                <div class="input-group">
                    <div class="input-row">
                        <input type="text" placeholder="Folder name" class="folder-name" required>
                        <input type="text" placeholder="https://www.top945.com.tw/...TheGUID" class="url" required>
                        <button type="button" class="qr-scan" onclick="startQrScan(this)">📱 Scan QR</button>
                        <button type="button" class="remove" onclick="removeInputGroup(this)">Remove</button>
                    </div>
                </div>
            </div>
            
            <button type="button" class="add" onclick="addInputGroup()">+ Add Another URL</button>
            <br>
            <button type="submit" class="submit">Start Crawling</button>
        </form>

        <div id="status"></div>

        <!-- QR Scanner Modal -->
        <div id="qrModal" class="qr-modal">
            <div class="qr-modal-content">
                <span class="qr-close" onclick="closeQrScanner()">&times;</span>
                <h3>Scan QR Code</h3>
                <div id="qr-reader"></div>
                <div id="qr-result"></div>
            </div>
        </div>

        <script>
            function addInputGroup() {
                const container = document.getElementById('inputGroups');
                const newGroup = document.createElement('div');
                newGroup.className = 'input-group';
                newGroup.innerHTML = \`
                    <div class="input-row">
                        <input type="text" placeholder="Folder name" class="folder-name" required>
                        <input type="text" placeholder="https://www.top945.com.tw/...TheGUID" class="url" required>
                        <button type="button" class="qr-scan" onclick="startQrScan(this)">📱 Scan QR</button>
                        <button type="button" class="remove" onclick="removeInputGroup(this)">Remove</button>
                    </div>
                \`;
                container.appendChild(newGroup);
            }

            function removeInputGroup(button) {
                const groups = document.querySelectorAll('.input-group');
                if (groups.length > 1) {
                    button.closest('.input-group').remove();
                } else {
                    alert('You must have at least one input group.');
                }
            }

            let html5QrcodeScanner = null;
            let currentTargetInput = null;
            let isProcessing = false;

            function playBeep() {
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.value = 800; // 800Hz beep
                    oscillator.type = 'sine';

                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.3);
                } catch (error) {
                    console.log('Could not play beep sound:', error);
                }
            }

            function startQrScan(button) {
                const urlInput = button.parentElement.querySelector('.url');
                currentTargetInput = urlInput;

                document.getElementById('qrModal').style.display = 'block';

                if (html5QrcodeScanner) {
                    html5QrcodeScanner.clear();
                }

                html5QrcodeScanner = new Html5QrcodeScanner(
                    "qr-reader",
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    false
                );

                html5QrcodeScanner.render(onScanSuccess, onScanError);
            }

            async function onScanSuccess(decodedText, decodedResult) {
                console.log(\`QR Code scanned: \${decodedText}\`);

                if (!currentTargetInput || isProcessing) return;

                // Set processing lock to prevent multiple simultaneous scans
                isProcessing = true;

                // Show loading message
                document.getElementById('qr-result').innerHTML = \`
                    <div style="color: blue; font-weight: bold; margin-top: 10px;">
                        🔄 Checking URL... (following redirects)
                    </div>
                \`;

                try {
                    // Check if it's already a TOP 945 URL
                    if (decodedText.includes('top945.com.tw')) {
                        currentTargetInput.value = decodedText;
                        showSuccessAndClose();
                        return;
                    }

                    // If not, try to expand the URL via backend
                    const response = await fetch('/expand-url', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: decodedText })
                    });

                    const data = await response.json();

                    if (data.isTop945) {
                        currentTargetInput.value = data.finalUrl;
                        showSuccessAndClose();
                    } else {
                        document.getElementById('qr-result').innerHTML = \`
                            <div style="color: red; font-weight: bold; margin-top: 10px;">
                                ❌ URL doesn't redirect to TOP 945.
                                <br><small>Final URL: \${data.finalUrl}</small>
                            </div>
                        \`;
                        // Reset processing flag after failed validation
                        setTimeout(() => {
                            isProcessing = false;
                        }, 2000);
                    }
                } catch (error) {
                    console.error('Error checking URL:', error);
                    document.getElementById('qr-result').innerHTML = \`
                        <div style="color: red; font-weight: bold; margin-top: 10px;">
                            ❌ Error checking URL. Please try again.
                        </div>
                    \`;
                    // Reset processing flag after error
                    setTimeout(() => {
                        isProcessing = false;
                    }, 2000);
                }
            }

            function showSuccessAndClose() {
                playBeep(); // Play success beep sound

                currentTargetInput.style.backgroundColor = '#e8f5e8';
                setTimeout(() => {
                    currentTargetInput.style.backgroundColor = '';
                }, 1000);

                document.getElementById('qr-result').innerHTML = \`
                    <div style="color: green; font-weight: bold; margin-top: 10px;">
                        ✅ TOP 945 URL scanned successfully!
                    </div>
                \`;

                setTimeout(() => {
                    closeQrScanner();
                }, 1500);
            }

            function onScanError(error) {
                // Ignore scan errors (camera still scanning)
            }

            function closeQrScanner() {
                document.getElementById('qrModal').style.display = 'none';
                document.getElementById('qr-result').innerHTML = '';

                if (html5QrcodeScanner) {
                    html5QrcodeScanner.clear().catch(error => {
                        console.error("Failed to clear QR scanner.", error);
                    });
                    html5QrcodeScanner = null;
                }

                currentTargetInput = null;
                isProcessing = false; // Reset processing flag when closing
            }

            // Close modal when clicking outside of it
            window.onclick = function(event) {
                const modal = document.getElementById('qrModal');
                if (event.target === modal) {
                    closeQrScanner();
                }
            }
            
            document.getElementById('crawlForm').addEventListener('submit', function(e) {
                e.preventDefault();
                const folderNames = Array.from(document.querySelectorAll('.folder-name')).map(input => input.value.trim());
                const urls = Array.from(document.querySelectorAll('.url')).map(input => input.value.trim());
                const status = document.getElementById('status');
                
                const inputs = folderNames.map((folder, index) => ({
                    folderName: folder,
                    url: urls[index]
                })).filter(item => item.folderName && item.url);
                
                if (inputs.length === 0) {
                    status.innerHTML = '<strong style="color: red;">Please enter at least one folder name and URL pair.</strong>';
                    return;
                }
                
                status.innerHTML = '<strong style="color: blue;">Starting crawl for ' + inputs.length + ' URL(s)...</strong>';
                
                fetch('/crawl', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ inputs: inputs })
                })
                .then(response => response.json())
                .then(data => {
                    status.innerHTML = '<strong style="color: green;">Crawling started for ' + data.count + ' URLs. Check console for download progress.</strong>';
                })
                .catch(error => {
                    status.innerHTML = '<strong style="color: red;">Error: ' + error.message + '</strong>';
                });
            });
        </script>
    </body>
    </html>
    `);
  }
});

app.post("/expand-url", async function (req, res) {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // First try HTTP redirects
    let finalUrl = url;
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow'
      });
      finalUrl = response.url;

      // If HTTP redirect didn't change the URL, check for JavaScript redirects
      if (finalUrl === url || finalUrl.replace('https://', 'http://') === url || finalUrl.replace('http://', 'https://') === url) {
        const html = await response.text();

        // Look for JavaScript location.href redirects
        const jsRedirectMatch = html.match(/location\.href\s*=\s*["']([^"']+)["']/i);
        if (jsRedirectMatch) {
          finalUrl = jsRedirectMatch[1];
        }

        // Look for meta refresh redirects
        const metaRefreshMatch = html.match(/<meta[^>]*http-equiv\s*=\s*["']refresh["'][^>]*content\s*=\s*["'][^;]*;\s*url\s*=\s*([^"']+)["']/i);
        if (metaRefreshMatch) {
          finalUrl = metaRefreshMatch[1];
        }
      }
    } catch (fetchError) {
      console.error('Error fetching URL:', fetchError);
    }

    res.json({
      originalUrl: url,
      finalUrl: finalUrl,
      isTop945: finalUrl.includes('top945.com.tw')
    });
  } catch (error) {
    console.error('Error expanding URL:', error);
    res.status(500).json({ error: "Failed to expand URL" });
  }
});

app.post("/crawl", function (req, res) {
  const inputs = req.body.inputs;
  if (!inputs || !Array.isArray(inputs)) {
    return res.status(400).json({ error: "Inputs array is required" });
  }

  const timestamp = Date.now();

  inputs.forEach((input) => {
    if (!input.folderName || !input.url) return;

    const dir = `./downloads/${input.folderName}`;

    scrape(input.url.trim()).then((result) => {
      result.map((item) => {
        fetch(item.fileUrl).then((response) => {
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          response.body.pipe(fs.createWriteStream(`${dir}/` + item.fileName));
          console.log(`[${input.folderName}] ${item.fileName} is downloaded`);
        });
      });
    }).catch(error => {
      console.error(`Error scraping URL for folder "${input.folderName}": ${input.url}`, error);
    });
  });

  res.json({ message: "Crawling started", count: inputs.length });
});
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
