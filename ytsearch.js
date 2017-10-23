var ytsearch = require('youtube-search');

module.exports = function (term, opts, cb) {
	if(/^new/g.test(term)){
		term = '六點半新聞報道';
		opts.order = 'date';
		opts.channelId = 'UCYtW5p3KSA4vpWC7Q1flPrw';
	}
	else if(/^now/g.test(term)) {
		term = '8點新聞報道';
		opts.order = 'date';
		opts.channelId = 'UCYtW5p3KSA4vpWC7Q1flPrw';
	}
	else if(/^english/g.test(term)) {
		term = 'News At Seven Thirty';
		opts.order = 'date';
		opts.channelId = 'UCYtW5p3KSA4vpWC7Q1flPrw';
	}
	else if(/^babybus/g.test(term)) {
		term = 'songs';
		opts.order = 'date';
		opts.channelId = 'UCpYye8D5fFMUPf9nSfgd4bA';
		opts.videoDuration = 'medium',
		opts.maxResults = 20; 
	}
	else if(/^pin(k|g)/g.test(term)){
		term = '兒歌';
		opts.order = 'date';
		opts.channelId = 'UCrLO-yoAu4ZTzRSdmWqS53A';
		opts.videoDuration = 'medium',
		opts.maxResults = 20;	
	}
	else if('/^daily/g'.test(term)) {
		var now = new Date();
		var start = new Date(now.getFullYear(), 0, 0);
		var diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
		var oneDay = 1000 * 60 * 60 * 24;
		var day = Math.floor(diff / oneDay);
		var playlist = require('./playlist.json'); 
		return cb(null, [playlist[day]]);
	}
	else {
		//set maxResult to 5 to make sure it doesn't have channel in the result
		opts.maxResults = 5;
	}
	console.log('youtube search term', term);
	console.log('youtube search opts', opts);
	ytsearch(term, opts, function(err, results) {
		var tryout = 0; 
		if(!err && results.length > 1){
			var result = [results[Math.floor(Math.random()*results.length)]];
			while(result[0].kind !== 'youtube#video' && tryout++ < 3){
				result = [results[Math.floor(Math.random()*results.length)]];
			}
			results = result; 
		}
		cb(err, results);
	});
}