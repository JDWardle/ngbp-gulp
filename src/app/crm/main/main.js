angular.module('crm.main', [
    'ui.router',
    'restangular',
    'crm.account.add'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('crm.main', {
        url: '/crm',
        views: {
            'main': {
                controller: 'CRMController',
                templateUrl: 'crm/main/main.tpl.html'
            },
            'sidebar': {
                templateUrl: 'crm/main/main-nav.tpl.html'
            }
        },
        data: {
            pageTitle: 'CRM'
        }
    });
}])

.controller('CRMController', ['$scope', 'Restangular', function ($scope, Restangular) {
    Restangular
            .all('account')
            .getList()
            .then(function (response) {
        $scope.accounts = response;
    },
    function (error) {
        if(error.status == 403){
            $scope.message = 'You are not authorized to view this page.';
        }
    });
}]);