function init () {
	window.init();
}

var app = angular.module('app', ['youtubeModule', 'spotifyModule', 'helperModule']);

app.constant('YoutubeEvents', {
    STOP:            0, 
    PLAY:            1,
    PAUSE:           2,
    NEXT:  			 3,
    PREVIOUS: 		 4,
    CHANGE: 		 5,
});

app.config(['$logProvider',function($logProvider) {
	$logProvider.debugEnabled(true);
}])

app.controller('appCtrl', ['$scope', '$rootScope', '$log', '$q', '$window', '$location','Spotify', 'Youtube', 'Helper', 'YoutubeEvents',
	function($scope, $rootScope, $log, $q, $window, $location, Spotify, Youtube, Helper, YoutubeEvents) {
		
		$scope.gapiReady = false;
		$scope.isLoggedIn = false;

		$window.init= function() {
			Youtube.setupApi();
			$scope.gapiReady = true;
			Youtube.checkAuth()
			.then(function(authResult) {
				if (authResult === true){
					$scope.isLoggedIn = true;
				} else {
					$scope.isLoggedIn = false;
				}
			});
		};

		$scope.touch = $window.Modernizr.touch;

		// Dichiaro oggetti da popolare
		$rootScope.spotify = {};
		$rootScope.youtube = {};

		// Imposto i dati iniziali di Youtube...
		$rootScope.youtube.gapiReady = false;
		$rootScope.youtube.user = false;
		$rootScope.youtube.current = 0; 	// Start with first video
		$rootScope.youtube.time = 0;
		$rootScope.youtube.showVideo = false;

		// ... e di Spotify.
		$rootScope.spotify.user = false;
		$rootScope.spotify.noLogin = false;

		($scope.setPlayerSize = function() {
			var top = 56;
			var margin = 10;
			$rootScope.youtube.playerWidth = verge.viewportW() - margin*2;
			// if (Math.round(verge.viewportW()*9/16) > verge.viewportH()) {
				$rootScope.youtube.playerHeight = verge.viewportH() - top - margin;
			// } else {
			// 	$rootScope.youtube.playerHeight = Math.round($rootScope.youtube.playerWidth*9/16);
			// }
		})();

		// Hack to make visible the changes to scope even using javascript's onresize event
		$scope.setPlayerSizeOnResize = function() {
			$scope.$apply(function() {
				$scope.setPlayerSize();
			});
		};

		$window.onresize = $scope.setPlayerSizeOnResize;

		/*
		***	METODI SPOTIFY
		*/

		// Controlla se esiste un utente e che l'accessToken è ancora valida. Se non è impostato un utente restituisce Falso.
		Spotify.getAccessToken();

		// Login
		$scope.spotify.login = function() {
			Spotify.login();
		};

		// Scarica le playlist dell'utente corrente (eseguito sempre)
		($scope.spotify.getPlaylists = function() {
			var userLibrary = {
				href: "https://api.spotify.com/v1/me/tracks",
				name: "My Library",
				images : [],
				tracks: {
					href: "https://api.spotify.com/v1/me/tracks",
				}
			}

			$rootScope.loading = true;

			Spotify.getUser()
			.then(function(me) {
				me = me.data;
				$log.debug('User', me);
				return Spotify.getUserPlaylists(me);
			})
			.then(function(playlists) {
				playlists = playlists.data;
				$scope.playlists = playlists.items;
				$scope.playlists.unshift(userLibrary);
				$log.debug('Playlists Loaded!', $scope.playlists);
				$rootScope.loading = false;
			})
			.catch(function(error) {			
				// if (Spotify.getAccessToken()) { Spotify.login(); }
				if ($rootScope.spotify.user) { Spotify.login(); }
				$rootScope.loading = false;
			});
		})();

		$scope.spotify.selectPlaylist = function() {
			$rootScope.loading = true;

			if(!$scope.spotify.nowPlaying || $scope.spotify.nowPlaying === '') {
				$rootScope.loading = false;
				return
			}

			var playlist = $scope.spotify.nowPlaying;
			var tracksUrl = playlist.tracks.href;
			
			Spotify.getUserPlaylistSongs(tracksUrl)
			.then(function(tracks) {
				tracks = tracks.data;
				return Helper.getTracksInfo(tracks, 1);
			})
			.then(function(tracks) {
				$scope.spotify.tracks = tracks;
				$scope.youtube.searchVideos(tracks);
			})
		};

		/*
		***	METODI YOUTUBE
		*/

		// $scope.youtube.login = function() {
		// 	Youtube.login()
		// 	.then(function(results) {
		// 		$rootScope.youtube.user = true;
		// 	}, function(error) {
		// 		$rootScope.error = error;
		// 	});
		// };

		$scope.youtube.searchVideos = function(tracks, retry) {
			$rootScope.youtube.loaded = 0;
			var youtubeIds = [];
			retry = retry || 0;

			if (retry > 3){
				$log.debug('There is a problem connecting to Youtube...');
				return;
			}

			Youtube.searchVideos(tracks)
			.then(function(response) {
				$log.debug('Youtube Videos Loaded!', response);
				angular.forEach(tracks, function(track, i){
					var bestMatch = []; // to be populated with youtube ID
					var items = response[i].result.items;
					angular.forEach(items, function(item, i) {
						var test = Helper.bestMatch(item.snippet);
						if (test === 2) {
							this.unshift(item.id.videoId);
						} else if (test === 1) {
							this.push(item.id.videoId);
						}
					}, bestMatch);
					if (bestMatch.length === 0) { bestMatch.push(items[0].id.videoId); }
					tracks[i].youtubeId = response[i].result.items[0].id.videoId;
					youtubeIds.push(bestMatch[0]);
				});
				$scope.results = tracks;
				$scope.youtube.videos = youtubeIds;
				$rootScope.loading = false;
			})
			.catch(function(error) {
				// if failed try again
				$scope.youtube.searchVideos(tracks, retry + 1);
			});
		};

		$scope.youtube.sendEvent = function (e, args) {
			args = args || {};
			var k = e.keyCode;

			if (k === 37){
				// arrow left
				e.preventDefault();
				$scope.$broadcast(YoutubeEvents.PREVIOUS, args);	
			} else if (k === 39){
				// arrow right
				e.preventDefault();
				$scope.$broadcast(YoutubeEvents.NEXT, args);
			} else if (k === 32){
				// spacebar
				e.preventDefault();
				$scope.$broadcast(YoutubeEvents.PLAY, args);
			}
		};
	}
]);
