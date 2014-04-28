angular.module('employees.main', [
    'ui.router',
    'restangular',
    'employees.detail',
    'employees.add'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider
        .state('employees.main', {
            url: '/employees',
            views: {
                'main': {
                    controller: 'EmployeesController',
                    templateUrl: 'employees/main/main.tpl.html'
                },
                'sidebar': {
                    templateUrl: 'employees/main/main-nav.tpl.html'
                }
            },
            data: {
                pageTitle: 'Employees'
            }
        });
}])

.controller('EmployeesController',
        ['$scope', '$anchorScroll', 'Restangular',
        function ($scope, $anchorScroll, Restangular) {
    Restangular
            .all('employee')
            .getList()
            .then(function (employees) {
        $scope.employees = employees;

        // Items per page constant for pagination.
        $scope.paginate.itemsPerPage = employees._meta.paginate.paginate_by;

        // Count of all the items for pagination.
        $scope.paginate.count = employees._meta.paginate.count;
    });

    $scope.paginate = {
        'currentPage': 1
    };

    $scope.$watch('paginate.currentPage', function (newVal, oldVal) {
        if (newVal !== oldVal) {
            $scope.changePage(newVal);

            $anchorScroll();
        }
    });

    // Updates the current page for pagination.
    $scope.changePage = function (page) {
        Restangular
                .all('employee')
                .getList({'page': page})
                .then(function (employees) {
            $scope.employees = employees;
        });
    };
}]);