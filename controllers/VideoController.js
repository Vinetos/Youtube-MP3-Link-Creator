const fs = require('fs');
const url = require('url');
const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const {exec} = require('child_process');


router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());

router.get('/', (request, response) => {
    // Read the database
    const youtubeUrl = request.query.url;
    if (!youtubeUrl)
        return response.status(404).send({error: "no video link found"});

    // Ask youtube-dl to download and convert the video
    console.log(`Asking for ${youtubeUrl}`);
    exec(`youtube-dl ${args.join(" ")} ${youtubeUrl}`, (err, output, stderr) => {
        if (err || stderr)
            return response.sendStatus(500);

        console.log(output.toString()); // Send output to console
        const id = getVideoID(youtubeUrl);
        // Error : incorrect id
        if (!id)
            response.sendStatus(500);

        // Check is the video is still available
        const videoPath = downloadDir + '/' + id;
        if (!fs.existsSync(videoPath))
            return response.status(404).send({error: "no video found"});

        // Find mp3 location and generate a link
        const file = fs.readdirSync(videoPath).find(/./.test, /\.mp3$/i);
        // todo : remove hardcoded url link
        const downloadUrl = `${request.protocol}://${request.get('host')}/${id}`;
        console.log(`Download url : ${downloadUrl} for file "${file}"`);
        return response.json({
            downloadUrl: downloadUrl,
            fileName: file
        })
    });
});

router.get('/:video_id', (request, response) => {
    // Read the database
    const id = request.params.video_id;
    if (!id)
        return response.status(404).send({error: "no id found"});

    console.log(`Asking to download ${id}`);
    const videoPath = downloadDir + '/' + id;
    if (!fs.existsSync(videoPath))
        return response.status(404).send({error: "no video found"});

    const file = fs.readdirSync(videoPath).find(/./.test, /\.mp3$/i);
    response.sendFile(`${videoPath}/${file}`, file);
    console.log(`OK !`);
});

const args = [
    '--geo-bypass',
    '--retries', '3',
    '--fragment-retries', '3',
    '-x', '-i',
    '--audio-format', 'mp3',
    '--embed-thumbnail',
    '--add-metadata',
    '--download-archive', 'downloaded.txt',
    '-o', '"./downloads/%(id)s/%(title)s.%(ext)s"'
];

/**
 * Get video ID.
 *
 * There are a few type of video URL formats.
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://m.youtube.com/watch?v=VIDEO_ID
 *  - https://youtu.be/VIDEO_ID
 *  - https://www.youtube.com/v/VIDEO_ID
 *  - https://www.youtube.com/embed/VIDEO_ID
 *  - https://music.youtube.com/watch?v=VIDEO_ID
 *  - https://gaming.youtube.com/watch?v=VIDEO_ID
 *
 * @param {String} link
 * @return {String|Error}
 */
const validQueryDomains = new Set([
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'music.youtube.com',
    'gaming.youtube.com',
]);
const validPathDomains = new Set([
    'youtu.be',
    'youtube.com',
    'www.youtube.com',
]);

const getURLVideoID = function (link) {
    const parsed = url.parse(link, true);
    let id = parsed.query.v;
    if (validPathDomains.has(parsed.hostname) && !id) {
        const paths = parsed.pathname.split('/');
        id = paths[paths.length - 1];
    } else if (parsed.hostname && !validQueryDomains.has(parsed.hostname))
        return new Error('Not a YouTube domain');

    if (!id)
        return new Error('No video id found: ' + link);

    id = id.substring(0, 11);

    if (!validateID(id))
        return new TypeError(`Video id (${id}) does not match expected format (${idRegex.toString()})`);

    return id;
};


/**
 * Gets video ID either from a url or by checking if the given string
 * matches the video ID format.
 *
 * @param {String} str
 * @return {String|Error}
 */
const getVideoID = (str) => {
    if (validateID(str))
        return str;
    else
        return getURLVideoID(str);
};


/**
 * Returns true if given id satifies YouTube's id format.
 *
 * @param {String} id
 * @return {Boolean}
 */
const idRegex = /^[a-zA-Z0-9-_]{11}$/;
const validateID = (id) => {
    return idRegex.test(id);
};

module.exports = router;
