var helperModule = angular.module('helperModule', []);

helperModule.service('Helper', ['$q', function($q) {
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

	this.extractSpotifyId = function (urls){
		var ids = [];
		urls = urls.split(/\n/);

		angular.forEach(urls, function(url){
			var type = 0;							// 0: not set, 1: http, 2: spotify uri
			var a = url.trim().split(':');			// Split lines and remove whitespaces
			// Check if the url is http link or spotify uri
			type = (a[0] === 'http') ? ( 
					1
				) : (
					(a[0] === 'spotify')?2:0
				);
			if (type === 0){
				console.log('Url ' + url.trim() + ' is not valid!');
			} else {
				var id = a[a.length - 1].split('/');
				id = id[id.length - 1];
				ids.push(id);
			}
		});

		return ids;
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

	this.sleep = function (milliseconds) {
	  var start = new Date().getTime();
	  for (var i = 0; i < 1e7; i++) {
	    if ((new Date().getTime() - start) > milliseconds){
	      break;
	    }
	  }
	};
}]);