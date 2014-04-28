angular.module('bookshelf.videos.detail', [
    'ui.router',
    'services.videoFactory'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('bookshelf.videos-detail', {
        url: '/bookshelf/video/{videoId:[0-9]+}?segment&section',
        views: {
            'main': {
                controller: 'VideoDetailController',
                templateUrl: 'bookshelf/videos/detail/detail.tpl.html'
            },
            'sidebar': {
                templateUrl: 'bookshelf/videos/detail/detail-nav.tpl.html'
            }
        },
        data: {
            pageTitle: 'Videos'
        }
    });
}])

.controller('VideoDetailController',
        ['$scope', '$stateParams', '$state', '$location', '$anchorScroll', 'Restangular', 'videoFactory', 'urls',
        function ($scope, $stateParams, $state, $location, $anchorScroll, Restangular, videoFactory, urls) {
    $scope.urls = urls;

    videoFactory.getVideo($stateParams.videoId).then(function (video) {
        var segment,
            today = new Date(),
            segmentCheckInDate;

        // Find any segments that are checked out.
        for (var i = 0, len = video.video_sections.length; i < len; i++) {
            for (var j = 0, lenJ = video.video_sections[i].video_segments.length; j < lenJ; j++) {
                segment = video.video_sections[i].video_segments[j];
                segment.checked_out = false;

                if (segment.check_in_date) {
                    segmentCheckInDate = new Date(segment.check_in_date);

                    if (today < segmentCheckInDate) {
                        segment.checked_out = true;
                    }
                }
            }
        }

        $scope.video = video;

        // Find any segments that are checked out by the current user.
        Restangular
                .all('video-segment')
                .getList({'checked_out': 'True'})
                .then(function (videoSegments) {
            for (var i = 0, len = $scope.video.video_sections.length; i < len; i++) {
                for (var j = 0, lenJ = $scope.video.video_sections[i].video_segments.length; j < lenJ; j++) {
                    segment = $scope.video.video_sections[i].video_segments[j];
                    segment.checkedOutByCurrentUser = false;

                    for (var k = 0, lenK = videoSegments.length; k < lenK; k++) {
                        if (segment.id == videoSegments[k].id) {
                            segment.checkedOutByCurrentUser = true;
                        }
                    }
                }
            }
        });

        // Find any segments that are queued by the current user.
        Restangular
                .all('viewing-video-segment')
                .getList({'queued': 'True'})
                .then(function (viewingVideo) {
            for (var i = 0, len = $scope.video.video_sections.length; i < len; i++) {
                for (var j = 0, lenJ = $scope.video.video_sections[i].video_segments.length; j < lenJ; j++) {
                    segment = $scope.video.video_sections[i].video_segments[j];
                    segment.queuedByCurrentUser = false;

                    for (var k = 0, lenK = viewingVideo.length; k < lenK; k++) {
                        if (segment.title == viewingVideo[k].video_segment) {
                            segment.queuedByCurrentUser = true;
                        }
                    }
                }
            }

            // Scroll to the element if the section or segment query parameter
            // is set.
            if ($stateParams.section) {
                $scope.scrollTo($stateParams.section);
            } 
            else if ($stateParams.segment) {
                $scope.scrollTo($stateParams.segment);
            }
        });
    });

    $scope.queueSegment = function (segment) {
        Restangular
                .all('viewing-video-segment')
                .post({'video_segment': segment.id})
                .then(function (response) {
            segment.queuedByCurrentUser = true;
        });
    };

    $scope.checkOut = function (segment, checkout) {
        // Optional argument to not checkout the video but still redirect to the segment.
        if (checkout) {
            Restangular
                    .one('video-segment', segment.id)
                    .one('checkout').patch({})
                    .then(function () {
                segment.checked_out = true;
                $state.go('bookshelf.videos-watch', {segmentId: segment.id});
            });
        }
        else {
            $state.go('bookshelf.videos-watch', {segmentId: segment.id});
        }
    };

    $scope.scrollTo = function (id) {
        var element = angular.element(document.getElementById(id).parentElement);
        element.css('background-color', 'yellow');

        $location.hash(id);
        $anchorScroll();
        $location.hash('');

        element.css('background-color', '');
        element.css('transition', 'background-color 2s linear');
    };
}]);