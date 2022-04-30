var express = require('express');
const fetch = require('node-fetch');
var router = express.Router();
var ytdl = require('ytdl-core');
const yts = require('yt-search');
var cors = require('cors');

const axios = require('axios');
const httpAdapter = require('axios/lib/adapters/http');

router.use(cors());

router.get('/search', (req, res) => {
  const q = req.query.q;
  console.log(q);
  fetch(`https://itunes.apple.com/search?term=${q}&entity=song`)
    .then((response) => response.json())
    .then((response) => {
      res.json(response);
    })
    .catch((err) => res.status(400).json('an error occured'));
});

router.get('/geturl', (req, res) => {
  const name = req.query.name;
  yts(name, function (err, r) {
    var link = r.videos[0].url;
    link = link.replace('https://youtube.com/watch?v=', '');
    res.json(link);
  });
});

/* GET home page. */
router.get('/stream', async function (req, res, next) {
  var url = req.query.url;
  console.log(url);
  let info = await ytdl.getInfo(url, { filter: (format) => format.container === 'mp3' });
  let audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
  const audioUrl = audioFormats[0].url;

  axios
    .get(audioUrl, {
      responseType: 'stream',
      adapter: httpAdapter,
      'Content-Range': 'bytes 16561-8065611',
    })
    .then((Response) => {
      const stream = Response.data;

      res.set('content-type', 'audio/mp3');
      res.set('accept-ranges', 'bytes');
      res.set('content-length', Response.headers['content-length']);
      console.log(Response);

      stream.on('data', (chunk) => {
        res.write(chunk);
      });

      stream.on('error', (err) => {
        res.sendStatus(404);
      });

      stream.on('end', () => {
        res.end();
      });
    })
    .catch((Err) => {
      console.log(Err.message);
    });
});

module.exports = router;
