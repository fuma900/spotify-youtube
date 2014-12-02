var services = angular.module('youtubeModule', ['helperModule']);

services.service('Youtube', ['$q', '$window', 'Helper', function($q, $window, Helper) {

	this.clientId = '743605158714-vfjtaobdqlgshs7157r43e1ohntdkbe6.apps.googleusercontent.com';
	this.scopes = 'https://www.googleapis.com/auth/youtube';

	this.setupApi = function() {
		gapi.client.setApiKey('AIzaSyBKB-CGWlr3id6q4SObfRPrYrAIHcACPuk');
		$window.setTimeout(this.checkAuth,1);
	};

	this.checkAuth = function() {
		var deferred = $q.defer();
		gapi.auth.authorize({client_id: this.clientId, scope: this.scopes, immediate: true}, function(authResult) {
			if (authResult && !authResult.error) {
				deferred.resolve(true);
			} else if (!authResult) {
				deferred.resolve(false);
			} else {
				deferred.resolve(authResult.error);
			}
		});
		return deferred.promise;
	}

	this.login = function(event) {
		var deferred = $q.defer();
        // Step 3: get authorization to use private data
        gapi.auth.authorize({client_id: this.clientId, scope: this.scopes, immediate: false}, function(authResult) {
        	if (authResult && !authResult.error) {
				deferred.resolve(authResult);
			} else if (!authResult) {
				deferred.resolve(false);
			} else {
				deferred.reject(authResult.error);
			}
        });
        return deferred.promise;
    }

    this.createPlaylist = function(playlistName) {
    	var deferred = $q.defer();
    	var request = gapi.client.youtube.playlists.insert({
    		part: 'snippet,status',
    		resource: {
    			snippet: {
    				title: playlistName,
    				description: 'A private playlist created with the YouTube API'
    			},
    			status: {
    				privacyStatus: 'private'
    			}
    		}
    	});
    	request.execute(function(response) {
    		var result = response.result;
    		if (result) {
    			deferred.resolve(result);
    		} else {
				deferred.resolve(false);
    		}
    	});
    	return deferred.promise;
    };

    this.addVideoToPlaylist = function(videoId, playlistId) {
    	var deferred = $q.defer();
    	var details = {
    		videoId: id,
    		kind: 'youtube#video'
    	}
    	var request = gapi.client.youtube.playlistItems.insert({
    		part: 'snippet',
    		resource: {
    			snippet: {
    				playlistId: playlistId,
    				resourceId: details
    			}
    		}
    	});
    	request.execute(function(response) {
    		deferred.resolve(result);
    	});
    	return deferred.promise;
    };

	this.loadApi = function(callback) {
		if(gapi.client){
			if (!gapi.client.youtube){
				gapi.client.load('youtube', 'v3', function() {
					callback();
				});
			} else {
				callback();
			}
		} else {
			Helper.sleep(2000);
			console.info('waiting for Google API to be loaded');
			this.loadApi(callback);
		}
	};

	this.searchVideo = function(track) {
		var deferred = $q.defer();
		this.loadApi(function() {
			var q = track.artists + " " + track.name;
			var request = gapi.client.youtube.search.list({
				q: q,
				part: 'id'
			});
			request.then(function(response) {
				deferred.resolve(response);
			});	
		});
		return deferred.promise;
	};

	this.searchVideos = function(tracks) {
		var responses = [];
		angular.forEach(tracks, function(track){
			this.searchVideo(track)
			.then(function(response) {
				responses.push(response);
			});
		});
		return $q.when(responses);
	};
}]);

services.directive('youtube', ['$window', function($window) {
  return {
    restrict: "E",

    scope: {
      height: "@",
      width: "@",
      videoid: "="
    },

    template: '<div></div>',

    link: function(scope, element) {
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      var player;

      $window.onYouTubeIframeAPIReady = function() {

        player = new YT.Player(element.children()[0], {
          playerVars: {
            autoplay: 1,
            html5: 1,
            theme: "light",
            modesbranding: 1,
            color: "white",
            iv_load_policy: 3,
            showinfo: 1,
            controls: 1,
            // playlist: scope.videoid.join(),
          },
          height: 400,
          width: 1140,
        });

      }

      scope.$watch('videoid', function(newValue, oldValue) {
        if (newValue == oldValue || newValue === '' || newValue === []) {
          return;
        }

        console.log(newValue);
        player.loadPlaylist({
        	playlist: scope.videoid,
        });

      }); 

      scope.$watch('height + width', function(newValue, oldValue) {
        if (newValue == oldValue) {
          return;
        }

        player.setSize(scope.width, scope.height);

      });
    }  
  };
}]);