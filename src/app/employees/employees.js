angular.module('employees', [
    'ui.router',
    'employees.main',
    'employees.detail',
    'employees.add'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('employees', {
        abstract: true,
        templateUrl: 'templates/sidebar_base.tpl.html'
    });
}]);