const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const zlib = require('zlib');
const robot = require('robotjs');
const { CertPath } = require('./certificates');

const resMul = 0.7;
const width = 1920 * resMul;
const height = 1080 * resMul;

const options = {
  key: fs.readFileSync(CertPath + 'privkey.pem'),
  cert: fs.readFileSync(CertPath + 'cert.pem')
};

const server = https.createServer(options);
const wss = new WebSocket.Server({ noServer: true });

const sendScreenData = (ws) => {
  const screenshot = captureScreenshot();
  const compressedData = zlib.deflateSync(screenshot);
  const buffer = Buffer.from(compressedData.buffer);

  ws.send(buffer);

  setTimeout(() => {
    sendScreenData(ws);
  }, 1000 / 75);
};

wss.on('connection', (ws) => {
  console.log('Client connected');
  sendScreenData(ws);
});

const captureScreenshot = () => {
  const imageData = robot.screen.capture(0, 0, width, height).image;
  //console.log('imageData:', imageData);
  const buffer = Buffer.from(imageData.buffer);
  //console.log('buffer:', buffer);
  return buffer;
};

// Handle WebSocket upgrade requests
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, socket => {
    wss.emit('connection', socket, request);
  });
});

server.listen(1234, () => {
  console.log('Server started at *:1234');
});