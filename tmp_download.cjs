const https = require('https');
const fs = require('fs');
const path = require('path');

const images = {
    "bali-rice.jpg": "https://images.unsplash.com/photo-1672837919448-3f03e0b04992?auto=format&fit=crop&q=80&w=1000",
    "bali-temple.jpg": "https://unsplash.com/photos/KD8jKVdCFoQ/download?force=true&w=800",
    "phiphi-resort.jpg": "https://unsplash.com/photos/izUlxxDtLL8/download?force=true&w=800",
    "phiphi-snorkeling.jpg": "https://images.unsplash.com/photo-1771521364782-b88e79c6a998?auto=format&fit=crop&q=80&w=1000",
    "maldives-villa.jpg": "https://unsplash.com/photos/AjBzl6gdCL0/download?force=true&w=800",
    "maldives-sunset.jpg": "https://unsplash.com/photos/heV-74ZHKJE/download?force=true&w=800",
    "maldives-picnic.jpg": "https://unsplash.com/photos/a5Wuqass63A/download?force=true&w=800",
    "kyoto-hotel.jpg": "https://unsplash.com/photos/DT8P2mZ27cc/download?force=true&w=800",
    "kyoto-bamboo.jpg": "https://unsplash.com/photos/fsJ0basri8U/download?force=true&w=800",
    "kyoto-tea.jpg": "https://plus.unsplash.com/premium_photo-1726804803991-ee6bd503adb2?auto=format&fit=crop&q=80&w=1000",
    "phiphi-zeavola.jpg": "https://images.unsplash.com/photo-1596879857570-7b6b9018bcb6?auto=format&fit=crop&q=80&w=1000",
    "kyoto-riverside.jpg": "https://unsplash.com/photos/gsQ74-Lxs-M/download?force=true&w=800"
};

const dir = 'frontend/img/destinations';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function download() {
    for (const [name, url] of Object.entries(images)) {
        const filePath = path.join(dir, name);
        console.log(`Downloading ${name}...`);
        
        await new Promise((resolve) => {
            const file = fs.createWriteStream(filePath);
            const request = (targetUrl) => {
                https.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }}, res => {
                    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                        request(res.headers.location);
                    } else {
                        res.pipe(file);
                        res.on('end', () => resolve());
                    }
                }).on('error', err => {
                    console.error(`Error: ${err.message}`);
                    resolve();
                });
            };
            request(url);
        });
        const stats = fs.statSync(filePath);
        console.log(`Finished ${name} (${stats.size} bytes)`);
    }
    console.log("All downloads complete.");
}

download();
