angular.module('bookshelf.main', [
    'ui.router',
    'services.bookFactory',
    'services.videoFactory'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('bookshelf.main', {
        url: '/bookshelf',
        views: {
            'main': {
                controller: 'BookshelfController',
                templateUrl: 'bookshelf/main/main.tpl.html'
            },
            'sidebar': {
                templateUrl: 'bookshelf/main/main-nav.tpl.html'
            }
        },
        data: {
            pageTitle: 'Bookshelf'
        }
    });
}])

.controller('BookshelfController',
        ['$scope', 'urls', 'bookFactory', 'videoFactory',
        function ($scope, urls, bookFactory, videoFactory) {
    $scope.urls = urls;

    bookFactory.getBooks().then(function(books){
        $scope.books = books;
    });

    videoFactory.getAllVideos({'order_by': '-update_date', 'count': 5}).then(function (videos) {
        $scope.videos = videos;
    });
}]);