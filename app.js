function init () {
	window.init();
}

var app = angular.module('app', ['ngSanitize','youtubeModule', 'spotifyModule', 'helperModule', 'ui.select']);

app.filter('propsFilter', function() {
  return function(items, props) {
    var out = [];

    if (angular.isArray(items)) {
      items.forEach(function(item) {
        var itemMatches = false;

        var keys = Object.keys(props);
        for (var i = 0; i < keys.length; i++) {
          var prop = keys[i];
          var text = props[prop].toLowerCase();
          if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
            itemMatches = true;
            break;
          }
        }

        if (itemMatches) {
          out.push(item);
        }
      });
    } else {
      // Let the output be the input untouched
      out = items;
    }

    return out;
  }
});

app.controller('appCtrl', ['$scope', '$rootScope', '$q', '$window', '$location','Spotify', 'Youtube', 'Helper',
	function($scope, $rootScope, $q, $window, $location, Spotify, Youtube, Helper) {
		
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

		// Dichiaro oggetti da popolare
		$rootScope.spotify = {};
		$rootScope.youtube = {};

		// Imposto i dati iniziali di Youtube...
		$rootScope.youtube.gapiReady = false;
		$rootScope.youtube.user = false;

		// ... e di Spotify.
		$rootScope.spotify.user = false;
		$rootScope.spotify.noLogin = false;

		/*
		***	METODI SPOTIFY
		*/

		// Controlla se esiste un utente e che l'accessToken è ancora valida. Se non è impostato un utente restituisce Falso.
		Spotify.getAccessToken();
		console.log(Spotify.isValidAccessToken());

		// Login
		$scope.spotify.login = function() {
			Spotify.login();
		};

		// Scarica le playlist dell'utente corrente (eseguito sempre)
		($scope.spotify.getPlaylists = function() {
			$rootScope.loading = true;
			if (!Spotify.isValidAccessToken()) { 
				$rootScope.loading = false;
				return 
			}
			Spotify.getUser()
			.then(function(me) {
				me = me.data;
				console.log(me);
				return Spotify.getUserPlaylists(me);
			})
			.then(function(playlists) {
				playlists = playlists.data;
				$scope.playlists = playlists.items;
				console.log($scope.playlists);
				$rootScope.loading = false;
			});
		})();

		$scope.spotify.selectPlaylist = function() {
			$rootScope.loading = true;
			// var playlist = $scope.playlists[key];
			// var id = playlist.id;
			// var userId = playlist.owner.id;
			console.log($scope.spotify.nowPlaying);
			if(!$scope.spotify.nowPlaying) {return}

			var playlist = $scope.spotify.nowPlaying;
			var id = playlist.id;
			var userId = playlist.owner.id;			
			
			Spotify.getUserPlaylistSongs(id, userId)
			.then(function(tracks) {
				tracks = tracks.data;
				console.log(tracks);
				return Helper.getTracksInfo(tracks, 1);
			})
			.then(function(tracks) {
				$scope.youtube.searchVideos(tracks);
			})
		};

		/*
		***	METODI YOUTUBE
		*/

		$scope.youtube.login = function() {
			Youtube.login()
			.then(function(results) {
				$rootScope.youtube.user = true;
			}, function(error) {
				$rootScope.error = error;
			});
		};

		$scope.youtube.searchVideos = function(tracks) {
			var promises = [];
			var youtubeIds = [];

			angular.forEach(tracks, function(track, i){
				promises.push(Youtube.searchVideo(track));
			});
			$q.all(promises)
			.then(function(response) {
				angular.forEach(tracks, function(track, i){
					tracks[i].youtubeId = response[i].result.items[0].id.videoId;
					youtubeIds.push(tracks[i].youtubeId);
				});
				$scope.results = tracks;
				$scope.youtubeIds = youtubeIds;
				$rootScope.loading = false;
			});
		};
	}
]);
