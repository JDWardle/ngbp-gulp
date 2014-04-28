angular.module('crm.document', [
    'ui.router',
    'restangular',
    'crm.document.add'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('crm.document', {
        url: '/crm/document',
        views: {
            'main': {
                controller: 'DocumentController',
                templateUrl: 'crm/document/document.tpl.html'
            },
            'sidebar': {
                templateUrl: 'crm/main/main-nav.tpl.html'
            }
        },
        data: {
            pageTitle: 'Documents'
        }
    });
}])

.controller('DocumentController',
        ['$scope', 'Restangular', '$anchorScroll',
        function ($scope, Restangular, $anchorScroll) {
    $scope.documents = [];
    $scope.paginate = {
        currentPage: 1
    };
    $scope.searchFilter = '';

    Restangular
            .all('share-document')
            .getList()
            .then(function (documents) {
        $scope.documents = documents;

        // Items per page for pagination.
        $scope.paginate.itemsPerPage = documents._meta.paginate.paginate_by;

        // Count of all the items for pagination.
        $scope.paginate.count = documents._meta.paginate.count;
    });

    $scope.searchFor = function (search) {
        $scope.searchFilter = search;

        $scope.paginate.currentPage = 1;
        $scope.changePage(1, true);
    };

    // Updates the current page for pagination.
    $scope.changePage = function (page, reset) {
        $anchorScroll();

        reset = reset || false;

        Restangular
                .all('share-document')
                .getList({
                    page: page,
                    search: $scope.searchFilter
                })
                .then(function (documents) {
            $scope.documents = documents;

            if (reset) {
                // Items per page for pagination.
                $scope.paginate.itemsPerPage = documents._meta.paginate.paginate_by;

                // Count of all the items for pagination.
                $scope.paginate.count = documents._meta.paginate.count;
            }
        });
    };
}]);