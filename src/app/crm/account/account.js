angular.module('crm.account', [
    'ui.router',
    'restangular',
    'services.eventFactory',
    'modals.addEmployee',
    'directives.events',
    'crm.account.contact',
    'crm.account.opportunity'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('crm.account', {
        url: '/crm/account/{accountId:[0-9]+}',
        views: {
            'main': {
                controller: 'AccountController',
                templateUrl: 'crm/account/account.tpl.html'
            },
            'sidebar': {
                templateUrl: 'crm/account/account-nav.tpl.html',
                controller: ['$scope', '$stateParams', function ($scope, $stateParams) {
                    $scope.stateParams = $stateParams;
                }]
            }
        },
        data: {
            pageTitle: 'Account'
        }
    });
}])

.controller('AccountController',
        ['$scope', '$modal', '$stateParams', 'Restangular', 'eventFactory',
        function ($scope, $modal, $stateParams, Restangular, eventFactory) {
    Restangular
            .one('account', $stateParams.accountId)
            .get()
            .then(function (response) {
        $scope.account = response;
        $scope.account.events = [];

        // Get all the status choices.
        return Restangular.all('account').options();
    })
    .then(function (options) {
        var i;

        $scope.statusChoices = options.status;
        $scope.stateChoices = options.state_choices;

        // Change the status levels to their full names, ag will change to Aggressive etc....
        for (i = 0, len = $scope.statusChoices.length; i < len; i++) {
            if ($scope.account.communication_level == $scope.statusChoices[i][0]) {
                $scope.account.communication_level = {
                    lower: $scope.statusChoices[i][0],
                    upper: $scope.statusChoices[i][1]
                };
            }
            if ($scope.account.share_level == $scope.statusChoices[i][0]) {
                $scope.account.share_level = {
                    lower: $scope.statusChoices[i][0],
                    upper: $scope.statusChoices[i][1]
                };
            }
            if ($scope.account.priority == $scope.statusChoices[i][0]) {
                $scope.account.priority = {
                    lower: $scope.statusChoices[i][0],
                    upper: $scope.statusChoices[i][1]
                };
            }
        }
    });

    $scope.editEvent = eventFactory.modal.editEvent;
    $scope.addEvent = eventFactory.modal.addEvent;
    $scope.checkIfPassed = eventFactory.checkIfPassed;

    $scope.editing = {status: false, website: false, address: false};

    // Toggles edits
    $scope.editStatus = function () {
        $scope.account.statusCopy = {
            communication_level: angular.copy($scope.account.communication_level.lower),
            share_level: angular.copy($scope.account.share_level.lower),
            priority: angular.copy($scope.account.priority.lower)
        };

        $scope.editing.status = !$scope.editing.status;
    };

    $scope.editWebsite = function () {
        $scope.account.websiteCopy = angular.copy($scope.account.website);
        $scope.editing.website = !$scope.editing.website;
    };

    $scope.editAddress = function () {
        $scope.account.addressCopy = {
            street_address: angular.copy($scope.account.street_address),
            city: angular.copy($scope.account.city),
            state: angular.copy($scope.account.state),
            zip_code: angular.copy($scope.account.zip_code)
        };

        $scope.editing.address = !$scope.editing.address;
    };

    // Save any edit to the account status.
    $scope.saveStatus = function (status) {
        var oldStatus = {
                communication_level: $scope.account.communication_level.lower,
                share_level: $scope.account.share_level.lower,
                priority: $scope.account.priority.lower
            };

        if (!_.isEqual(status, oldStatus)) {
            Restangular
                    .one('account', $scope.account.id)
                    .patch(status)
                    .then(function (response) {
                var i;

                for (i = 0, len = $scope.statusChoices.length; i < len; i++) {
                    if (status.communication_level == $scope.statusChoices[i][0]) {
                        $scope.account.communication_level = {
                            lower: $scope.statusChoices[i][0],
                            upper: $scope.statusChoices[i][1]
                        };
                    }
                    if (status.share_level == $scope.statusChoices[i][0]) {
                        $scope.account.share_level = {
                            lower: $scope.statusChoices[i][0],
                            upper: $scope.statusChoices[i][1]
                        };
                    }
                    if (status.priority == $scope.statusChoices[i][0]) {
                        $scope.account.priority = {
                            lower: $scope.statusChoices[i][0],
                            upper: $scope.statusChoices[i][1]
                        };
                    }
                }
            });
        }

        $scope.editStatus();
    };

    $scope.saveWebsite = function (website) {
        /**
         * Saves changes to the accounts website.
         */
        if (website != $scope.account.website) {
            Restangular
                    .one('account', $stateParams.accountId)
                    .patch({website: website})
                    .then(function (response) {
                $scope.account.website = website;
            },
            function (response) {
                alert('FAIL ' + response.status);
            });
        }
        $scope.editWebsite();
    };

    $scope.saveAddress = function (address) {
        /**
         * Saves changes to the accounts address.
         */
        var oldAddress = {
                street_address: $scope.account.street_address,
                city: $scope.account.city,
                state: $scope.account.state,
                zip_code: $scope.account.zip_code
            };

        if (!_.isEqual(address, oldAddress)) {
            Restangular
                    .one('account', $stateParams.accountId)
                    .patch(address)
                    .then(function (response) {
                $scope.account.street_address = address.street_address;
                $scope.account.city = address.city;
                $scope.account.state = address.state;
                $scope.account.zip_code = address.zip_code;
            },
            function (response) {
                alert('FAIL ' + response.status);
            });
        }
        $scope.editAddress();
    };

    // Modal for adding an employee.
    $scope.addEmployee = function () {
        // Open a modal for adding a new employee.
        var modalInstance = $modal.open({
            templateUrl: 'modals/add_employee/add_employee.tpl.html',
            controller: 'AddEmployeeDutyController'
        });

        // Modal was closed/dismissed.
        modalInstance.result.then(function (duty) {
            var content = {
                account: $stateParams.accountId,
                employee: duty.employee,
                description: duty.description
            };

            Restangular
                    .all('employee-duty')
                    .post(content)
                    .then(function (response) {
                // Add the employee's duty to the scope.
                $scope.account.duty.push(response);

                // Grab the employee from the database.
                return Restangular.one('employee', response.employee).get();
            })
            .then(function (response) {
                var duty = _.find($scope.account.duty, {'employee': response.id});

                // Append the employees detail to their duty for this account.
                duty.employee = response;
            },
            function (response) {
                alert('FAIL ' + response.status);
            });
        });
    };
}]);