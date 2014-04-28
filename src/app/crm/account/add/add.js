angular.module('crm.account.add', [
    'ui.router',
    'restangular'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('crm.account-add', {
        url: '/crm/account/add',
        views: {
            'main': {
                controller: 'AddAccountController',
                templateUrl: 'crm/account/add/add.tpl.html'
            },
            'sidebar': {
                templateUrl: 'crm/main/main-nav.tpl.html'
            }
        },
        data: {
            pageTitle: 'Add Account'
        }
    });
}])

.controller('AddAccountController',
        ['$scope', '$state', 'Restangular',
        function ($scope, $state, Restangular) {
    $scope.account = {};
    $scope.account.status = {};

    // Get all of the status choices.
    Restangular
            .all('account')
            .options()
            .then(function (options) {
        $scope.statusChoices = options.status;
    });

    $scope.addAccount = function (account) {
        var postAccount = {
            company_name: account.company_name,
            website: account.website,
            street_address: account.street_address,
            city: account.city,
            state: account.state,
            zip_code: account.zip_code,
            communication_level: account.status.communication_level,
            share_level: account.status.share_level,
            priority: account.status.priority
        };

        Restangular
                .all('account')
                .post(postAccount)
                .then(function (account) {
            $state.go('crm.account', {accountId: account.id});
        });
    };
}]);