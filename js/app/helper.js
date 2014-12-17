var helperModule = angular.module('helperModule', []);

helperModule.service('Helper', ['$q', '$log', function($q, $log) {

	// Parse the response from url after spotify login (which return an hashbang response)
	this.parseHashbangResponse = function(path) {
		var path = path || '';
		if (path.split('/').length !== 2){ return false; }
		if (path.split('/')[1] === '') {return false; }
		var frag = path.split('/')[1].split('&');
		return {
			'accessToken': 	frag[0].split('=')[1],
			'token_type': 	frag[1].split('=')[1],
			'expires_in': 	frag[2].split('=')[1],
		}
	};

	// Generate a url from a baseUrl and some GET parameters
	this.urlWithParams = function(url, params) {
		var i = 0;
		var s = '';
		angular.forEach(params, function(v,k) {
			if (i===0){s+='?';} else if (i>0){s+='&'}
			s += k + '=' + v;
			i += 1;
		});
		return url + s;
	};

	// Get tracks from the Spotify Web API and simplify the result to make it easier in the frontend
	this.getTracksInfo = function(tracks, mode) {
		var temp = [];

		if (mode === 0) {
			console.log(tracks);
			for (var i=0; i<tracks.length; i+=1){
				if (tracks[i]){
					var artists = [];
					for (var j=0; j<tracks[i].artists.length; j+=1){
						artists.push(tracks[i].artists[j].name);
					}
					artists = artists.join(', ');
					temp.push({
						'album': 		tracks[i].album,
						'artists': 		artists,
						'name': 		tracks[i].name,
						'spotifyUrl': 	tracks[i].external_urls.spotify,
					});
				}
			}
		} else if (mode === 1) {
			tracks = tracks.items;
			for (var i=0; i<tracks.length; i+=1){
				if (tracks[i]){
					var track = tracks[i].track;
					var artists = [];
					for (var j=0; j<track.artists.length; j+=1){
						artists.push(track.artists[j].name);
					}
					artists = artists.join(', ');
					temp.push({
						'album': 		track.album,
						'artists': 		artists,
						'name': 		track.name,
						'spotifyUrl': 	track.external_urls.spotify,
					});
				}
			}
		}

		return $q.when(temp);
	};

	// Test youtube result to find the best one based on title and channel name
	this.bestMatch = function(snippet) {
		var title = {};
		var channel = {};
		var result = 0;

		title.name = snippet.title;
		channel.name = snippet.channelTitle;

		// Tests on Title
		title.blacklist = [
			'cover', 'tribute', 'mix'
		];
		title.whitelist = [
			'official'
		];
		title.regexpBlacklist = new RegExp(title.blacklist.join("|"), 'i');
		title.regexpWhitelist = new RegExp(title.whitelist.join("|"), 'i');

		// Tests on channelName
		channel.whitelist = [
			'vevo'
		];
		channel.regexpWhitelist = new RegExp(channel.whitelist.join("|"), 'i');

		/* 
			Excecute tests
			0: not good; 1: might be good; 2: is good;
		*/
		if (title.regexpBlacklist.test(title.name)) {
			$log.debug(title.name, title.regexpBlacklist.test(title.name));
			return 0;
		} else if (channel.regexpWhitelist.test(channel.name)){
			return 2;
		} else {
			return 1;
		}
	};

	// Utility to simulate a delay
	this.sleep = function (milliseconds) {
	  var start = new Date().getTime();
	  for (var i = 0; i < 1e7; i++) {
	    if ((new Date().getTime() - start) > milliseconds){
	      break;
	    }
	  }
	};
}]);