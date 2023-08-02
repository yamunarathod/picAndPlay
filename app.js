const express = require('express');
const { Gpio } = require('onoff');
const { exec } = require('child_process');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
app.use(express.static(__dirname));

const server = http.createServer(app);
const io = socketIO(server);

const port = 3000;
const defaultVideoFilePath = '/home/admin/Desktop/picandplay/video-player-project/input.mp4';
const inputVideoFilePath = './input.mp4';
const videoPlayerCmd = 'omxplayer -o local --loop';

const buttonPin = new Gpio(4, 'in', 'both');
let currentVideoProcess = null;


function playDefaultVideo() {
  stopVideo();
  currentVideoProcess = exec(`${videoPlayerCmd} ${defaultVideoFilePath}`);
}

function playInputVideo() {
  stopVideo();
  currentVideoProcess = exec(`${videoPlayerCmd} ${inputVideoFilePath}`);
}

function stopVideo() {
  if (currentVideoProcess) {
    currentVideoProcess.kill();
    currentVideoProcess = null;
  }
}

buttonPin.watch((err, value) => {
  console.log(value,'data');
  if (err) {
    console.error('Error reading button:', err);
    return;
  }
  io.emit('buttonState', value);
  // if (value == 1) {
  //   io.emit('buttonState', value);
  // } 
  // if (value == 0) {
  //   io.emit('buttonState', value);
  // } 
});

// Serve the frontend HTML page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Provide the video source to the frontend as JSON
app.get('/video-source', (req, res) => {
  const videoPath = buttonPin.readSync() === 1 ? inputVideoFilePath : defaultVideoFilePath;
  res.json({ videoPath });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

process.on('SIGINT', () => {
  buttonPin.unexport();
  stopVideo();
  process.exit();
});
