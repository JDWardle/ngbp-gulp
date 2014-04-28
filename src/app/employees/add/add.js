angular.module('employees.add', [
    'ui.router',
    'restangular'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('employees.add', {
        url: '/employees/add',
        views: {
            'main': {
                controller: 'AddEmployeeController',
                templateUrl: 'employees/add/add.tpl.html'
            },
            'sidebar': {
                templateUrl: 'employees/main/main-nav.tpl.html'
            }
        },
        data: {
            pageTitle: 'Add Employee'
        }
    });
}])

.controller('AddEmployeeController', ['$scope', '$state', 'Restangular', function ($scope, $state, Restangular) {
    $scope.employee = {
        first_name: '',
        last_name: '',
        employee_email: ''
    };

    $scope.addEmployee = function () {
        Restangular
                .all('employee')
                .post($scope.employee)
                .then(function (response) {
            $state.go('employees.main');
        });
    };
}]);