angular.module('bookshelf.books', [
    'ui.router',
    'services.bookFactory',
    'bookshelf.books.detail',
    'bookshelf.books.read'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('bookshelf.books', {
        url: '/bookshelf/books',
        views: {
            'main': {
                controller: 'BookController',
                templateUrl: 'bookshelf/books/books.tpl.html'
            },
            'sidebar': {
                templateUrl: 'bookshelf/main/main-nav.tpl.html'
            }
        },
        data: {
            pageTitle: 'Books'
        }
    });
}])

.controller('BookController',
        ['$scope', '$anchorScroll', 'bookFactory', 'urls',
        function ($scope, $anchorScroll, bookFactory, urls) {
    $scope.urls = urls;

    $scope.paginate = {
        'currentPage': 1
    };

    bookFactory
        .getBooks({'queryParams': {'page': 1}})
        .then(function (books) {
            $scope.books = books;

            // Items per page constant for pagination.
            $scope.paginate.itemsPerPage = books._meta.paginate.paginate_by;

            // Count of all the items for pagination.
            $scope.paginate.count = books._meta.paginate.count;
        });

    $scope.$watch('paginate.currentPage', function(newVal, oldVal){
        if(newVal !== oldVal){
            $scope.changePage(newVal);

            $anchorScroll();
        }
    });

    $scope.changePage = function (page) {
        bookFactory
            .getBooks({'queryParams': {'page': page}})
            .then(function (books) {
                $scope.books = books;
            });
    };
}]);