angular.module('applications.main', [
    'ui.router',
    'applications.detail',
    'applications.add'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('applications.main', {
        url: '/applications',
        views: {
            'main': {
                controller: 'ApplicationsController',
                templateUrl: 'applications/main/main.tpl.html'
            },
            'sidebar': {
                templateUrl: 'applications/main/main-nav.tpl.html'
            }
        },
        data: {
            pageTitle: 'Applications'
        }
    });
}])

.controller('ApplicationsController', ['$scope', 'Restangular', function ($scope, Restangular) {
    // Gets applications by page, filtered and sorted.
    var getApplications = function (ordering, page) {
        var params = {'ordering': ordering};
        if (page) {
            params.page = page;
        }
        if ($scope.searchParams) {
            params.search = $scope.searchParams;
        }
        if ($scope.filtering == 'Complete') {
            params.complete = 'True';
        }
        else if ($scope.filtering == 'Incomplete') {
            params.incomplete = 'True';
        }

        Restangular.all ('application-full')
            .getList(params).then(function (applications) {
                $scope.applications = applications;
                if (!$scope.paginate.count) {
                    $scope.paginate.count = applications._meta.paginate.count;
                    $scope.paginate.itemsPerPage = applications._meta.paginate.paginate_by;
                }
            });
    };

    $scope.filterOptions = ['All', 'Complete', 'Incomplete'];

    // Set up for when page loads.
    $scope.paginate = {'currentPage': 1};
    $scope.sort = ['last_name', 'first_name'];

    // Watch for page change in application pagination.
    $scope.$watch('paginate.currentPage', function (newVal) {
        $scope.changePage(newVal);
    });

    // Formats the sort/ordering in manner accepted by django rest.
    var formatOrdering = function () {
        var order;
        if ($scope.sort.length > 1) {
            order = $scope.sort[0] + ',' + $scope.sort[1];
        }
        else {
            order = $scope.sort;
        }
        return order;
    };

    // Updates the current page for pagination.
    $scope.changePage = function (page) {
        getApplications(formatOrdering(), page);
    };

    // Sets the sort/ordering to new value, or reverses it.
    $scope.setSort = function (sort, sortBy) {
        if ($scope[sort][0] == sortBy[0]) {
            for (var i in $scope[sort]) {
                if ($scope[sort][i].indexOf('-') != -1) {
                    $scope[sort][i] = sortBy[i];
                }
                else {
                    $scope[sort][i] = '-' + sortBy[i];
                }
            }
        }
        else {
            $scope[sort] = sortBy;
        }

        if($scope.paginate.currentPage == 1){
            getApplications(formatOrdering());
        }
        else{
            $scope.paginate.currentPage = 1;
        }
    };

    // Toggles filtering applications by complete or all.
    // Clears paginate count so that it will be reset when filtered queryset returns.
    $scope.filterApplications = function () {
        $scope.paginate.count = undefined;
        getApplications(formatOrdering());
    };
}]);