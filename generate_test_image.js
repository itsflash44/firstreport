const fs = require('fs');
// 1x1 black pixel PNG base64
const pixel = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
fs.writeFileSync('tests/e2e/test_image.png', Buffer.from(pixel, 'base64'));
