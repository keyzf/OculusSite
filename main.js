const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const robot = require('robotjs');
const zlib = require('zlib');
const { CertPath } = require('./certificates');

const resMul = 1;
const width = 1832 * resMul;
const height = 1920 * resMul;

const options = {
  key: fs.readFileSync(CertPath + 'privkey.pem'),
  cert: fs.readFileSync(CertPath + 'cert.pem')
};

const server = https.createServer(options);
const wss = new WebSocket.Server({ server });

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

      // Compress the bitmap using zlib
      const compressed = await new Promise((resolve, reject) => {
        zlib.deflate(bitmap.image.buffer, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });

      // Send the compressed bitmap to the client
      socket.send(compressed);
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

server.listen(1234, () => {
  console.log('Server started at *:1234');
});