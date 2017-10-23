var playlist = require('./playlist'); 

playlist('PLu_yoBy_pbO3Yi-GS1Jk6exWwXxbhvyrn', {key:'AIzaSyCkwj6yaBhVGqEAivaRjEWsWpcfDT7g9xM'}, function(err, result){
	if(!err){
		console.log(result.length);
		require('fs').writeFile(

		    './playlist.json',

		    JSON.stringify(result),

		    function (err) {
		        if (err) {
		            console.error('Crap happens');
		        }
		    }
		);
	}
}, []);