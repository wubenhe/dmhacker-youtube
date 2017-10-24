var express = require('express');
var fs = require('fs');
var path = require('path');
var ytdl = require('ytdl-core');
var ytsearch = require('./ytsearch');
var ffmpeg = require('fluent-ffmpeg');

var app = express();

var mkdirs = ['./public/site', './tmp'];
for (var i in mkdirs) {
  var dir = mkdirs[i];
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('index');
});

//////////////////////////// ALEXA ROUTES ////////////////////////////

var cache = {};
var historyId = {}; 

app.get('/alexa-search/:query', function(req, res) {
  var query = new Buffer(req.params.query, 'base64').toString();
  var lang = req.query.language || 'en';
  if (lang !== 'en' || lang !== 'de') {
    lang = 'en';
  }
  console.log('Query from ' + req.connection.remoteAddress + ': '+query);
  ytsearch(query, {
    maxResults: 1,
    type: 'video',
    relevanceLanguage: lang,
    key: process.env.YOUTUBE_API_KEY,
    historyId: historyId
  }, function(err, results) {
    if (err) {
      console.log('An error occurred: '+err.message);
      res.status(500).json({
        state: 'error',
        message: err.message
      });
    } else if (!results || !results.length) {
      console.log('No results found.');
      res.status(200).send({
        state: 'error',
        message: 'No results found'
      });
    } else {
      var metadata = results[0];
      var id = metadata.id;
      var orig_url = 'https://www.youtube.com/watch?v='+id;

      console.log('Query result: '+metadata.title);

      if (!(id in cache)) {
        var tmp_url = path.join(__dirname, 'tmp', id + '.mp4');
        var new_url = path.join(__dirname, 'public', 'site', id + '.mp3');
        var writer = fs.createWriteStream(tmp_url);
        writer.on('finish', function() {
          ffmpeg(tmp_url)
            .format("mp3")
            .audioBitrate(128)
            .on('end', function(){
              cache[id]['downloaded'] = true;
            })
            .save(new_url);
        });
        ytdl(orig_url, {
          filter: 'audioonly'
        }).pipe(writer);

        cache[id] = { downloaded: false };
      }

      res.status(200).json({
        state: 'success',
        message: 'Uploaded successfully.',
        link: '/site/' + id + '.mp3',
        info: {
          id: id,
          title: metadata.title,
          original: orig_url
        }
      });
    }
  });
});

app.get('/alexa-check/:id', function(req, res) {
  var id = req.params.id;
  if (id in cache) {
    if (cache[id]['downloaded']) {
      res.status(200).send({
        state: 'success',
        message: 'Downloaded',
        downloaded: true
      });
    }
    else {
      res.status(200).send({
        state: 'success',
        message: 'Download in progress',
        downloaded: false
      });
    }
  }
  else {
    res.status(200).send({
      state: 'success',
      message: 'Not in cache'
    });
  }
});


//////////////////////////// NON-ALEXA ROUTES ////////////////////////////

function fetch_target_id(req, res) {
  var videoId = req.query.id, old_url;
  if(/^http/i.test(videoId)){
    old_url = videoId; 
  }
  else {
    old_url = 'https://www.youtube.com/watch?v=' + videoId; 
  }
  ytdl.getInfo(old_url, function(err, info) {
    if (err) {
      res.status(500).json({
        state: 'error',
        message: err.message
      });
    } else {
      var id = info.video_id || info.vid;
      historyId = info; 
      var new_url = path.join(__dirname, 'public', 'site', id + '.mp4');
      var writer = fs.createWriteStream(new_url);
      writer.on('finish', function() {
        res.status(200).json({
          state: 'success',
          link: '/site/' + id + '.mp4',
          info: {
            id: id,
            title: info.title
          }
        });
      });
      ytdl(old_url).pipe(writer);
    }
  });
}

app.get('/target', fetch_target_id);

app.get('/search/:query', function(req, res) {
  var query = req.params.query;
  ytsearch(query, {
    maxResults: 1,
    type: 'video',
    key: process.env.YOUTUBE_API_KEY
  }, function(err, results) {
    if (err) {
      res.status(500).json({
        state: 'error',
        message: err.message
      });
    } else {
      if (!results || !results.length) {
        res.status(200).send({
          state: 'error',
          message: 'No results found'
        });
      } else {
        var id = results[0].id;
        req.query.id = id;
        fetch_target_id(req, res);
      }
    }
  });
});

app.get('/listf', function(req, res){
  var pathName = path.join(__dirname, 'public', 'site');
  fs.readdir(pathName, function(err, items) {
      
      res.status(200).send({
        state: 'success',
        items: items
      });
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
