//todo : Rewrite using node-ytdl-core and fluent-ffmpeg packages
const express = require('express');
const app = express();
const port = process.env.PORT || 4000;

// Video controller on <host>/download
const videoController = require('./controllers/VideoController');
app.use('/download', videoController);

// Start the serveur
const server = app.listen(port, () => console.log('Server started on: ' + port));

// Where are downloaded (and converted) videos
global.downloadDir = `${__dirname}/downloads`;