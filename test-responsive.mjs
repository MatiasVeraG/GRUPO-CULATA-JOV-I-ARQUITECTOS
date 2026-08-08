import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple static server
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
    let reqUrl = decodeURI(req.url.split('?')[0]);
    if (reqUrl === '/') reqUrl = '/index.html';
    const filePath = path.join(__dirname, reqUrl);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not Found');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
});

const PORT = 3891;
const viewports = [
    { name: 'mobile-320x568', width: 320, height: 568 },
    { name: 'mobile-360x800', width: 360, height: 800 },
    { name: 'mobile-390x844', width: 390, height: 844 },
    { name: 'mobile-414x896', width: 414, height: 896 },
    { name: 'tablet-768x1024', width: 768, height: 1024 },
    { name: 'tablet-820x1180', width: 820, height: 1180 },
    { name: 'desktop-1024x768', width: 1024, height: 768 },
    { name: 'desktop-1280x720', width: 1280, height: 720 },
    { name: 'desktop-1440x900', width: 1440, height: 900 },
    { name: 'desktop-1920x1080', width: 1920, height: 1080 }
];

const pages = [
    { name: 'index', url: '/index.html' },
    { name: 'trabajos', url: '/trabajos.html' },
    { name: 'sobre', url: '/sobre.html' },
    { name: 'contacto', url: '/contacto.html' },
    { name: 'proyecto', url: '/proyecto.html?path=1' }
];

async function run() {
    await new Promise(resolve => server.listen(PORT, resolve));
    console.log(`Server listening on http://localhost:${PORT}`);

    const outDir = path.join(__dirname, 'screenshots', 'final');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const browser = await chromium.launch();
    const results = [];

    for (const pageInfo of pages) {
        for (const vp of viewports) {
            const context = await browser.newContext({
                viewport: { width: vp.width, height: vp.height }
            });
            const page = await context.newPage();
            const targetUrl = `http://localhost:${PORT}${pageInfo.url}`;
            
            await page.goto(targetUrl, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            // Check horizontal overflow
            const overflowInfo = await page.evaluate(() => {
                const docEl = document.documentElement;
                const clientWidth = docEl.clientWidth;
                const scrollWidth = docEl.scrollWidth;
                const hasOverflow = scrollWidth > clientWidth;

                let overflowingElements = [];
                if (hasOverflow) {
                    const allEls = document.querySelectorAll('*');
                    allEls.forEach(el => {
                        const rect = el.getBoundingClientRect();
                        if (rect.right > clientWidth + 1 || rect.left < -1) {
                            overflowingElements.push({
                                tag: el.tagName,
                                id: el.id || '',
                                className: el.className || '',
                                right: rect.right,
                                left: rect.left,
                                width: rect.width
                            });
                        }
                    });
                }
                return {
                    clientWidth,
                    scrollWidth,
                    hasOverflow,
                    overflowDiff: scrollWidth - clientWidth,
                    overflowingElements: overflowingElements.slice(0, 10)
                };
            });

            const screenshotPath = path.join(outDir, `${pageInfo.name}_${vp.name}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: false });

            results.push({
                page: pageInfo.name,
                viewport: vp.name,
                width: vp.width,
                height: vp.height,
                ...overflowInfo,
                screenshot: screenshotPath
            });

            await context.close();
        }
    }

    await browser.close();
    server.close();

    const summaryPath = path.join(outDir, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
    console.log(`Testing complete. Summary written to ${summaryPath}`);
    const overflowItems = results.filter(r => r.hasOverflow);
    console.log(`Found ${overflowItems.length} viewports with horizontal overflow:`);
    overflowItems.forEach(item => {
        console.log(`- ${item.page} @ ${item.viewport}: diff=${item.overflowDiff}px, elements:`, item.overflowingElements);
    });
}

run().catch(err => {
    console.error(err);
    server.close();
    process.exit(1);
});
