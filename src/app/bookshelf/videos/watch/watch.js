/* jshint loopfunc: true */

angular.module('bookshelf.videos.watch', [
    'ui.router',
    'restangular',
    'directives.videoJs',
    'modals.recommend',
    'modals.relatedVideo',
    'modals.relatedChapter',
    'modals.externalResource',
    'modals.extendCheckout'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('bookshelf.videos-watch', {
        url: '/bookshelf/video/watch/{segmentId:[0-9]+}',
        views: {
            'main': {
                controller: 'VideoWatchController',
                templateUrl: 'bookshelf/videos/watch/watch.tpl.html'
            },
            'sidebar': {
                templateUrl: 'bookshelf/videos/watch/watch-nav.tpl.html'
            }
        },
        data: {
            pageTitle: 'Videos'
        }
    });
}])

.controller('VideoWatchController',
        ['$scope', 'Restangular', '$stateParams', '$modal', '$state', '$timeout', 'urls', 'DateTime',
        function ($scope, Restangular, $stateParams, $modal, $state, $timeout, urls, DateTime) {
    // TODO: See if this will work with $document or $window.
    var video = document.getElementsByTagName('video')[0],
        activityTimer;

    // Max value for the video rating.
    $scope.rating = {
        'max': 10
    };

    // Model for new comment information.
    $scope.newComment = {};

    // Date for keeping track of when the video was first loaded.
    $scope.lastExtensionDate = new Date();

    // Initialize the editingComment variable to be false so the correct comment button is shown.
    $scope.editingComment = false;

    Restangular
            .all('viewing-video-segment')
            .getList({'segment': $stateParams.segmentId})
            .then(function (response) {
        var prevTracking,
            create;

        $scope.viewingVideo = response[0];
        $scope.start = '0';

        // Set the current rating value if one exists.
        if (response.rate_this !== null) {
            $scope.rating.value = $scope.viewingVideo.rate_this;
        }
        else {
            $scope.rating.value = 0;
        }

        // Find the latest tracking session for this video to set the starting position.
        if ($scope.viewingVideo.tracking.length) {
            for (var i = 0, len = $scope.viewingVideo.tracking.length; i < len; i++) {
                if (prevTracking !== undefined) {
                    if (prevTracking.date_created < $scope.viewingVideo.tracking[i].date_created) {
                        prevTracking = $scope.viewingVideo.tracking[i];
                    }
                }
                else {
                    prevTracking = $scope.viewingVideo.tracking[i];
                }
            }

            if (prevTracking.ending_place === null) {
                prevTracking.ending_place = '00:00:00';
            }

            $scope.start = DateTime.timeToSeconds(prevTracking.ending_place);
        }

        // Create a new tracking session.
        $scope.start = DateTime.secondsToTime($scope.start);
        create = {
            'video': $scope.viewingVideo.id,
            'starting_place': $scope.start,
            'ending_place': $scope.start
        };

        return Restangular
                .all('video-tracking')
                .post(create);
    })
    .then(function (response) {
        $scope.tracking = response;
        $scope.start = DateTime.timeToSeconds($scope.tracking.starting_place);

        // Finally grab the video segment once everything that is needed has been created.
        return Restangular
                .one('video-segment', $stateParams.segmentId)
                .get();
    })
    .then(function (segment) {
        segment.video_chapter_file = urls.media + segment.video_chapter_file;
        // segment.video_chapter_file = 'http://video-js.zencoder.com/oceans-clip.mp4';
        $scope.segment = segment;

        // Extend the checkout once we have successfully received the
        // segment just in case the checkout session is about to expire.
        extendCheckoutSession();
    },
    function (error) {
        // Redirect the user if the video is not currently checked out by them.
        if (error.status == '403' && error.data.data == 'Video is not checked out to you.') {
            $state.go('bookshelf.videos');
        }
    });

    $scope.ratingHover = function (value) {
        $scope.rating.overStar = value;
        $scope.rating.hoverValue = value;
    };

    $scope.setRating = function (value) {
        Restangular
                .one('viewing-video-segment', $scope.viewingVideo.id)
                .patch({'rate_this': value})
                .then(function (response) {
            $scope.viewingVideo = response;
        });
    };

    $scope.recommendVideo = function () {
        modalInstance = $modal.open({
            templateUrl: 'modals/recommend/recommend.tpl.html',
            controller: 'RecommendController'
        });

        modalInstance.result.then(function (value) {
            Restangular
                    .one('viewing-video-segment', $scope.viewingVideo.id)
                    .patch({'recommend_this': true, 'recommend_note': value})
                    .then(function (response) {
                $scope.viewingVideo = response;
            });
        });
    };

    $scope.updatePersonalNotes = function () {
        Restangular
                .one('viewing-video-segment', $scope.viewingVideo.id)
                .patch({'personal_notes': $scope.viewingVideo.personal_notes})
                .then(function (response) {
            $scope.editPersonalNotes = false;
            $scope.viewingVideo = response;
        });
    };

    var checkActivity = function () {
        // Check if the video is paused and we have set the lastActiveDate variable.
        if (video.paused && $scope.lastActiveDate) {
            // Check if it has been more than 9 minutes since the user was last active.
            if (Math.abs($scope.lastActiveDate - new Date()) > 540000) {
                $scope.extendCheckoutSessionModal();
            }
        }
        else if (!video.paused) {
            // Extend the checkout if the video is not paused and if it has been 9 minutes since
            // the last extension.
            if (Math.abs($scope.lastExtensionDate - new Date()) > 540000) {
                extendCheckoutSession();
            }
        }
        else {
            // Video has not been started.
            if (Math.abs($scope.lastExtensionDate - new Date()) > 540000) {
                $scope.extendCheckoutSessionModal();
            }
        }

        activityTimer = $timeout(checkActivity, 60000);
    };

    var extendCheckoutSession = function () {
        Restangular
                .one('video-segment', $scope.segment.id)
                .one('extend_checkout')
                .patch({})
                .then(function (response) {
            $scope.lastExtensionDate = new Date();
            $scope.lastActiveDate = new Date();
        },
        function (error) {
            // If the extend checkout resulted in an error we will redirect the
            // user to the videos detail page.
            $state.go('bookshelf.videos-detail', {
                videoId: $scope.segment.video_section.video,
                segment: $scope.segment.id
            });
        });
    };

    $scope.extendCheckoutSessionModal = function () {
        var modalInstance;

        if (!$scope.extendCheckoutModal) {
            modalInstance = $modal.open({
                templateUrl: 'modals/extend_checkout/extend_checkout.tpl.html',
                controller: 'ExtendCheckoutController'
            });

            modalInstance.result.then(function () {
                $scope.extendCheckoutModal = false;
                extendCheckoutSession();
            },
            function () {
                $scope.extendCheckoutModal = false;
                $state.go('bookshelf.videos-detail', {
                    videoId: $scope.segment.video_section.video,
                    segment: $scope.segment.id
                });
            });
        }

        // This variable will only allow one of these modals to be open at a time.
        $scope.extendCheckoutModal = true;
    };

    var updateTracking = function () {
        var savedTime,
            videoTime;

        if (angular.isDefined($scope.tracking)) {
            savedTime = DateTime.timeToSeconds($scope.tracking.ending_place),
            videoTime = DateTime.timeToSeconds(DateTime.secondsToTime(video.currentTime));

            // Checks if the time on the server is different than the videos current time.
            // This will help avoid requests to the server that are not needed.
            if (savedTime !== videoTime) {
                var patch = {
                    'ending_place': DateTime.secondsToTime(video.currentTime)
                };

                Restangular
                        .one('video-tracking', $scope.tracking.id)
                        .patch(patch)
                        .then(function (response) {
                    $scope.tracking = response;
                });
            }
        }

        if (!video.paused) {
            trackingTimer = $timeout(updateTracking, 20000);
        }
    };

    // Update the tracking on a pause event.
    video.addEventListener('pause', function () {
        $scope.lastActiveDate = new Date();
        updateTracking();
    });

    // Update the completed boolean on the video end event.
    video.addEventListener('ended', function () {
        Restangular
                .one('viewing-video-segment', $scope.viewingVideo.id)
                .patch({'completed': true})
                .then(function (response) {
            $scope.viewingVideo = response;
        });
    });

    // Watch for route changes.
    $scope.$on('$routeChangeStart', function (event, next, current) {
        // Update the tracking before we leave the page.
        updateTracking();

        // Clean up the timers.
        $timeout.cancel(activityTimer);
        $timeout.cancel(trackingTimer);
    });

    $scope.postComment = function (comment) {
        // Creates a new comment for this video segment.
        var post = {
            'body': comment.body,
            'video_segment': $scope.segment.id
        };

        Restangular
                .all('video-comment')
                .post(post)
                .then(function (videoComment) {
            $scope.segment.comments.push(videoComment);

            // Reset the newComment.body model.
            $scope.newComment.body = null;
        });
    };

    $scope.deleteComment = function (comment) {
        // Removes the comment from this video segment.
        Restangular
                .one('video-comment', comment.id)
                .remove()
                .then(function (response) {
            $scope.segment.comments = _.without($scope.segment.comments, comment);
        });
    };

    $scope.editComment = function (comment) {
        // Updates the textarea with the comment to be edited.
        $scope.newComment = angular.copy(comment);
        $scope.editingComment = true;
    };

    $scope.updateComment = function (comment) {
        // Updates the passed in comment.
        var patch = {
            'body': comment.body
        };

        Restangular
                .one('video-comment', comment.id)
                .patch(patch)
                .then(function (videoComment) {
            for (var i = 0, len = $scope.segment.comments.length; i < len; i++) {
                if ($scope.segment.comments[i].id == videoComment.id) {
                    $scope.segment.comments[i] = videoComment;
                }
            }

            $scope.editingComment = false;

            // Reset the newComment.body model.
            $scope.newComment.body = null;
        });
    };

    // Modal for adding a related video.
    $scope.addRelatedVideo = function (segment) {
        var modalInstance;

        // Open a modal instance for adding a related video to the current segment.
        modalInstance = $modal.open({
            templateUrl: 'modals/related_video/related_video.tpl.html',
            controller: 'AddRelatedVideoController',
            resolve: {
                segment: function () {
                    return $scope.segment;
                }
            }
        });

        modalInstance.result.then(function (relatedVideos) {
            var postRelatedVideo;

            for (var i = 0, len = relatedVideos.segments.length; i < len; i++) {
                postRelatedVideo = {
                    'video_segment': $scope.segment.id,
                    'relevant_video_segment': relatedVideos.segments[i].id,
                    'note': relatedVideos.note
                };

                Restangular
                        .all('related-video')
                        .post(postRelatedVideo)
                        .then(function (relatedVideo) {
                    // Add the newly created related video to the scope.
                    $scope.segment.related_video.push(relatedVideo);
                });
            }
        });
    };

    // Modal for adding a related book chapter.
    $scope.addRelatedChapter = function (segment) {
        var modalInstance;

        // Open a modal instance for adding a related book chapter to the current segment.
        modalInstance = $modal.open({
            templateUrl: 'modals/related_chapter/related_chapter.tpl.html',
            controller: 'AddRelatedChapterController',
            resolve: {
                segment: function () {
                    return $scope.segment;
                }
            }
        });

        modalInstance.result.then(function (relatedChapter) {
            var chapter;
            if(relatedChapter.book_sub_chapter){
                chapter = relatedChapter.book_sub_chapter;
            }
            else{
                chapter = relatedChapter.book_chapter;
            }
            var post = {
                'video_segment': $scope.segment.id,
                'book_chapter': chapter.id,
                'note': relatedChapter.note
            };

            Restangular
                    .all('related-book-video')
                    .post(post)
                    .then(function (response) {
                $scope.segment.related_books.push(response);
            });
        });
    };

    $scope.addExternalResource = function (segment) {
        var modalInstance;
        // Open a modal instance for adding an external resource to the current segment.
        modalInstance = $modal.open({
            templateUrl: 'modals/external_resource/external_resource.tpl.html',
            controller: 'VideoAddExternalResourceController'
        });

        modalInstance.result.then(function (externalResource) {
            var post;

            // Check if an already existing external resource was selected.
            if (externalResource.existing) {
                post = {
                    'video_segment': $scope.segment.id,
                    'external_source': externalResource.existing.id
                };

                Restangular
                        .all('supplemental-source-video')
                        .post(post)
                        .then(function (response) {
                    // Add the newly created external resource to the scope.
                    $scope.segment.external_sources.push(response);
                });
            }
            else if (externalResource.create) {
                Restangular
                        .all('supplemental-source')
                        .post(externalResource.create)
                        .then(function (response) {
                    post = {
                        'video_segment': $scope.segment.id,
                        'external_source': response.id
                    };

                    return Restangular.all('supplemental-source-video').post(post);
                })
                .then(function (response) {
                    // Add the newly created external resource to the scope.
                    $scope.segment.external_sources.push(response);
                });
            }
            
        });
    };

    // Check for activity every minute.
    activityTimer = $timeout(checkActivity, 60000);

    // Update video tracking every 20 seconds.
    trackingTimer = $timeout(updateTracking, 20000);
}]);