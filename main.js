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

const options = {
  key: fs.readFileSync(CertPath + 'privkey.pem'),
  cert: fs.readFileSync(CertPath + 'cert.pem')
};

const server = https.createServer(options);
const wss = new WebSocket.Server({ noServer: true });

// Listen for WebSocket connections
wss.on('connection', socket => {
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
      console.error('Error capturing screen:', error);
    }
  }, 1000 / 90);

  // Listen for socket close events
  socket.on('close', () => {
    console.log('Client disconnected');
  });
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