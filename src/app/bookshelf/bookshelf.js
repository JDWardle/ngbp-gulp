angular.module('bookshelf', [
    'ui.router',
    'bookshelf.main',
    'bookshelf.videos',
    'bookshelf.books'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('bookshelf', {
        abstract: true,
        templateUrl: 'templates/sidebar_base.tpl.html'
    });
}]);