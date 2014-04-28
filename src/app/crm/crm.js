angular.module('crm', [
    'ui.router',
    'crm.main',
    'crm.account',
    'crm.document'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('crm', {
        abstract: true,
        templateUrl: 'templates/sidebar_base.tpl.html'
    });
}]);