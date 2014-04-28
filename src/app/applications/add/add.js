angular.module('applications.add', [
    'ui.router',
    'restangular'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('applications.add', {
        url: '/applications/add',
        views: {
            'main': {
                controller: 'AddApplicationsController',
                templateUrl: 'applications/add/add.tpl.html'
            },
            'sidebar': {
                templateUrl: 'applications/main/main-nav.tpl.html'
            }
        },
        data: {
            pageTitle: 'Add Applications'
        }
    });
}])

.controller('AddApplicationsController', ['$scope', 'Restangular',
    function ($scope, Restangular) {
    $scope.applications = [{}];

    $scope.add = function(){
        $scope.applications.push({});
    };

    $scope.remove = function(application){
        $scope.applications = _.without($scope.applications, application);
    };

    $scope.save = function(){
        $scope.applicationForm.$setPristine();
        Restangular.all('application-full')
            .post($scope.applications)
            .then(function(){
                $scope.applications = [{}];
        });
    };
}]);