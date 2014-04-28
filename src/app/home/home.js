angular.module('home', [
    'ui.router',
    'home.main'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('home', {
        abstract: true,
        templateUrl: 'templates/sidebar_base.tpl.html'
    });
}]);