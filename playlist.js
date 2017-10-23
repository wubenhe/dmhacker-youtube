var querystring = require('querystring')
var xhr = require('xhr')

if (!xhr.open) xhr = require('request')

var allowedProperties = [
  'part',
  'id',
  'maxResults',
  'onBehalfOfContentOwner',
  'pageToken',
  'playlistId',
  'videoId',
  'fields',
  'key'
]

module.exports = function getPlaylist (term, opts, cb, prevData) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }

  var params = {
    playlistId: term,
    part: opts.part || 'snippet',
    maxResults: opts.maxResults || 50
  }

  Object.keys(opts).map(function (k) {
    if (allowedProperties.indexOf(k) > -1) params[k] = opts[k]
  })

  console.log('https://www.googleapis.com/youtube/v3/playlistItems?' + querystring.stringify(params));

  xhr({
    url: 'https://www.googleapis.com/youtube/v3/playlistItems?' + querystring.stringify(params),
    method: 'GET'
  }, function (err, res, body) {
    if (err) return cb(err)

    try {
      var result = JSON.parse(body)

      if (result.error) {
        var error = new Error(result.error.errors.shift().message)
        return cb(error)
      }

      var pageInfo = {
        totalResults: result.pageInfo.totalResults,
        resultsPerPage: result.pageInfo.resultsPerPage,
        nextPageToken: result.nextPageToken,
        prevPageToken: result.prevPageToken
      }

      var findings = result.items.map(function (item) {
        var link = ''
        var id = ''

        item.id = item.snippet.resourceId;
        switch (item.id.kind) {
          case 'youtube#channel':
            link = 'https://www.youtube.com/channel/' + item.id.channelId
            id = item.id.channelId
            break
          case 'youtube#playlist':
            link = 'https://www.youtube.com/playlist?list=' + item.id.playlistId
            id = item.id.playlistId
            break
          default:
            link = 'https://www.youtube.com/watch?v=' + item.id.videoId
            id = item.id.videoId
            break
        }

        return {
          id: id,
          link: link,
          kind: item.id.kind,
          publishedAt: item.snippet.publishedAt,
          channelId: item.snippet.channelId,
          channelTitle: item.snippet.channelTitle,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnails: item.snippet.thumbnails
        }
      }); 
      
      findings = findings.concat(prevData);

      if(result.nextPageToken){
        opts.pageToken = result.nextPageToken; 
        return getPlaylist(term, opts, cb, findings); 
      }
      else {
        return cb(null, findings, pageInfo)  
      }
      
    } catch(e) {
      return cb(e)
    }
  })
}