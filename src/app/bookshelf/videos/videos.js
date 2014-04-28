angular.module('bookshelf.videos', [
    'ui.router',
    'services.videoFactory',
    'bookshelf.videos.detail',
    'bookshelf.videos.watch'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('bookshelf.videos', {
        url: '/bookshelf/videos',
        views: {
            'main': {
                controller: 'VideoController',
                templateUrl: 'bookshelf/videos/videos.tpl.html'
            },
            'sidebar': {
                templateUrl: 'bookshelf/main/main-nav.tpl.html'
            }
        },
        data: {
            pageTitle: 'Videos'
        }
    });
}])

.controller('VideoController',
        ['$scope', '$anchorScroll', 'urls', 'videoFactory',
        function ($scope, $anchorScroll, urls, videoFactory) {
    $scope.urls = urls;

    $scope.paginate = {
        'currentPage': 1
    };

    videoFactory.getAllVideos().then(function (videos) {
        $scope.videos = videos;

        // Items per page constant for pagination.
        $scope.paginate.itemsPerPage = videos._meta.paginate.paginate_by;

        // Count of all the items for pagination.
        $scope.paginate.count = videos._meta.paginate.count;
    });

    $scope.$watch('paginate.currentPage', function (newVal, oldVal) {
        if (newVal !== oldVal) {
            $scope.changePage(newVal);

            $anchorScroll();
        }
    });

    $scope.changePage = function (page) {
        videoFactory.getAllVideos({'page': page}).then(function (videos) {
            $scope.videos = videos;
        });
    };
}]);