angular.module('home.main', [
    'ui.router'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('home.main', {
        url: '/',
        views: {
            'main': {
                controller: 'HomeController',
                templateUrl: 'home/main/main.tpl.html'
            },
            'sidebar': {
                templateUrl: 'home/main/main-nav.tpl.html'
            }
        },
        data: {
            pageTitle: 'Home'
        }
    });
}])

.controller('HomeController', ['$scope', function ($scope) {
    $scope.message = 'Home sweet home.';
}]);