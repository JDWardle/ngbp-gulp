angular.module('applications', [
    'ui.router',
    'applications.main',
    'applications.detail',
    'applications.add'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('applications', {
        abstract: true,
        templateUrl: 'templates/sidebar_base.tpl.html'
    });
}]);