angular.module('employees.detail', [
    'ui.router',
    'restangular',
    'directives.gravatar'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider
        .state('employees.detail', {
            url: '/employees/{employeeId:[0-9]+}',
            views: {
                'main': {
                    controller: 'EmployeeDetailController',
                    templateUrl: 'employees/detail/employees-detail.tpl.html'
                },
                'sidebar': {
                    templateUrl: 'employees/detail/employees-detail-nav.tpl.html',
                    controller: ['$scope', '$stateParams', function ($scope, $stateParams) {
                        $scope.stateParams = $stateParams;
                    }]
                }
            },
            data: {
                pageTitle: 'Employee'
            }
        });
}])

.controller('EmployeeDetailController',
        ['$scope', 'Restangular', '$stateParams',
        function ($scope, Restangular, $stateParams) {
    Restangular
            .one('employee', $stateParams.employeeId)
            .get()
            .then(function (employee) {
        $scope.employee = employee;
    });
}]);