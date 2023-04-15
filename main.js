const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const robot = require('robotjs');
const { createCanvas, loadImage } = require('canvas');
const { CertPath } = require('./certificates');
const zlib = require('zlib');

const resMul = 1;
const width = 1832 * resMul;
const height = 1920 * resMul;

const options = {
  key: fs.readFileSync(CertPath + 'privkey.pem'),
  cert: fs.readFileSync(CertPath + 'cert.pem')
};

const server = https.createServer(options);
const wss = new WebSocket.Server({ noServer: true });

// Listen for WebSocket connections
wss.on('connection', async (socket) => {
  console.log('Client connected');

  // Capture the screen and send images to the client at 75fps
  const captureInterval = 1000 / 75;

  while (socket.readyState === WebSocket.OPEN) {
    const captureStart = Date.now();

    try {
      // Capture the screen image
      const bitmap = await robot.screen.capture(0, 0, robot.screen.width, robot.screen.height);

      // Create a compressed buffer of the bitmap data using zlib
      const compressedBitmap = zlib.deflateSync(bitmap.image.buffer);

      // Send the compressed bitmap data to the client
      socket.send(compressedBitmap);
    } catch (error) {
      console.error('Error capturing screen:', error);
    }

    // Calculate the time it took to capture the screen
    const captureDuration = Date.now() - captureStart;

    // Wait the remaining time in the capture interval
    await new Promise(resolve => setTimeout(resolve, captureInterval - captureDuration));
  }

  console.log('Client disconnected');
});

// Handle WebSocket upgrade requests
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, socket => {
    wss.emit('connection', socket, request);
  });
});

server.listen(1234, () => {
  console.log('Server started at *:1234');
});