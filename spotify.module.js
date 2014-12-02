var services = angular.module('spotifyModule', ['helperModule']);

services.service('Spotify', ['$rootScope', '$q', '$http', 'Helper', '$location', function($rootScope, $q, $http, Helper, $location) {
	this.isValidAccessToken = function() {
		if (!$rootScope.spotify.user) { return false; }

		var now = Math.round(new Date().getTime() / 1000);
		var expires = $rootScope.spotify.user.expires;
		
		if( now < expires ) {
			return true;
		} else {
			return false;
		}
	};

	this.getAccessToken = function() {
		var now = Math.round(new Date().getTime() / 1000);
		
		// Controllo se l'accessToken è ancora valida e se esiste un utente
		if( this.isValidAccessToken() ) {
			return;
		}

		// Estraggo dalla risposta di spotify i dati di accesso. 
		// Se non sono presenti dati, elimino l'utente corrente (è una one-page app...)
		// Se ci sono aggiungo il timestamp assoluto di scadenza dell'access token
		$rootScope.spotify.user = Helper.parseHashbangResponse($location.url());
		if ($rootScope.spotify.user) { $rootScope.spotify.user.expires =  now + $rootScope.spotify.user.expires_in; }

	};

	this.login = function() {
		window.location = 'https://accounts.spotify.com/authorize?client_id=60cd0e4b101b40ab9ef2d407c4962149&response_type=token&redirect_uri=http%3A%2F%2Fmacbook-di-marco.local%3A5757';
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

	this.getUserPlaylistSongs = function(id, userId) {
		return $http.get(
			'https://api.spotify.com/v1/users/' + userId + '/playlists/' + id + '/tracks',
			{
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