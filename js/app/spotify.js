var spotifyModule = angular.module('spotifyModule', ['helperModule']);

spotifyModule.service('Spotify', ['$rootScope', '$q', '$http', 'Helper', '$location', function($rootScope, $q, $http, Helper, $location) {
	this.accessToken = function() {

	};

	this.getAccessToken = function() {
		var hashbangResponseParsed = Helper.parseHashbangResponse($location.url());
		if (hashbangResponseParsed === false) { return false; } // nessuna accessToken

		$rootScope.spotify.user = hashbangResponseParsed;	// Estraggo dalla risposta di spotify i dati di accesso. 
		return true;	// restituisco true per dire che nella barra degli indirizzi c'è un'accessToken
	};

	this.login = function() {
		var url = 'https://accounts.spotify.com/authorize';
		var scopes = 'playlist-read-private user-library-read';

		if ($location.absUrl().split(':')[1] === '//macbook-di-marco.local') {
			var redirect_uri = 'http://macbook-di-marco.local:5757';
		} else if ($location.absUrl().split(':')[1] === '//192.168.2.66') {
			var redirect_uri = 'http://192.168.2.66:5757';
		} else {
			var redirect_uri = 'http://fuma900.github.io/spotify-youtube'
		}

		var params = {
			'client_id': '60cd0e4b101b40ab9ef2d407c4962149',
			'response_type': 'token',
			'scope': encodeURIComponent(scopes),
			'redirect_uri': encodeURIComponent(redirect_uri),
		}

		window.location = Helper.urlWithParams(url, params);
	};

	this.getUser = function() {
		return $http.get(	
				'https://api.spotify.com/v1/me', 
				{ headers: { 'Authorization': 'Bearer ' + $rootScope.spotify.user.accessToken } }
			);
	};

	this.getUserPlaylists = function(me) {
		return $http.get(
			'https://api.spotify.com/v1/users/' + me.id + '/playlists',
			{ headers: { 'Authorization': 'Bearer ' + $rootScope.spotify.user.accessToken } }
		);
	};

	this.getUserSongs = function(url) {
		return $http.get(url, {
				headers: { 'Authorization': 'Bearer ' + $rootScope.spotify.user.accessToken },
				params: {
					'limit': 50,
				}
			}
		);	
	};

	this.getUserPlaylistSongs = function(url) {
		if (url.split('/')[4] === 'me') {
			console.log(url.split('/')[4]);
			return this.getUserSongs(url);
		}
		return $http.get(url, {
				headers: { 'Authorization': 'Bearer ' + $rootScope.spotify.user.accessToken },
				params: {
					'fields': 'items.track'
				}
			}
		);
	};

	this.getTracks = function (ids){
		var chunks = [];
		var promises = [];
		var tracks = [];

		if (ids.length > 1000){
			return;
		}

		// Workaround to avoid limit of 50 tracks
		if (ids.length > 50){
			for (var i=0,j=ids.length; i<j; i+=50){
				chunks.push(ids.slice(i,i+50));
			}
		} else {
			chunks = [ids];
		}
		
		for (var k=0; k<chunks.length; k+=1) {
			promises.push(
				$http.get('https://api.spotify.com/v1/tracks', {
					params: {ids: chunks[k].join()},
				})
			);
		}
		return promises;
	};
}]);