const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const screenshot = require('screenshot-desktop');
const { createCanvas, loadImage, ImageData } = require('canvas');
const { CertPath } = require('./certificates');

const screenCanvas = createCanvas(1832, 1920);
const screenCtx = screenCanvas.getContext('2d');

const resizedCanvas = createCanvas(1832, 1920);
const resizedCtx = resizedCanvas.getContext('2d');

// Create a WebSocket server on port 1234
const options = {
  key: fs.readFileSync(CertPath + 'privkey.pem'),
  cert: fs.readFileSync(CertPath + 'cert.pem'),
  port: 1234
};

const server = https.createServer(options);
const wss = new WebSocket.Server({ server });
console.log('Server started at *:1234');

// Listen for new connections
server.on('connection', socket => {
  console.log('Client connected');

  // Capture the screen and send images to the client at 30fps

  setInterval(async () => {
    try {
      // Capture the screen image and draw it to the screen canvas
      const imageData = await screenshot({format: 'png'});

      // Resize the screen image and draw it to the resized canvas
      resizedCtx.drawImage(await loadImage(imageData), 0, 0, 1832, 1920);

      // Convert the resized canvas to a PNG image and send it to the client
      const resizedImageData = resizedCanvas.toDataURL('image/png');
      socket.send(resizedImageData);
    } catch (error) {
      //console.error('Error capturing screen:', error);
    }
  }, 1000 / 30);

  // Listen for socket close events
  socket.on('close', () => {
    console.log('Client disconnected');
  });
});