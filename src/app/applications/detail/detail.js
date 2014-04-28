/* jshint loopfunc: true */

angular.module('applications.detail', [
    'ui.router',
    'services.dateTime',
    'modals.applicationHistory',
    'user-application'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('applications.detail', {
        url: '/applications/{applicationUUID:[a-z0-9]{32}}',
        views: {
            'main': {
                controller: 'ApplicationsDetailController',
                templateUrl: 'applications/detail/detail.tpl.html'
            },
            'sidebar': {
                templateUrl: 'applications/detail/detail-nav.tpl.html'
            }
        },
        data: {
            pageTitle: 'Applications'
        }
    });
}])

.controller('ApplicationsDetailController',
        ['$scope', 'Restangular', '$modal', 'DateTime', 'urls', '$stateParams',
        function ($scope, Restangular, $modal, DateTime, urls, $stateParams) {
    $scope.editingScore = false;
    $scope.editingVerified = {};

    var application = Restangular.one('application-full', $stateParams.applicationUUID);
    application.get().then(function (response) {
        $scope.application = response;
        Restangular.all('application-status').getList().then(function (statuses) {
            $scope.statuses = statuses;
        });
    });

    // Get contact choices- email, meeting, etc.
    application.options().then(function (opt) {
        $scope.contactTypes = opt.contact_type_choices;
        $scope.sourceTypes = opt.source_choices;
    });

    // Toggle editing the overall application score.
    $scope.editScore = function () {
        $scope.editingScore = !$scope.editingScore;
    };

    // Toggle editing an individual skill score.
    $scope.editVerified = function (item) {
        $scope.editingVerified[item] = !$scope.editingVerified[item];
    };

    // Save overall application score.
    $scope.saveScore = function () {
        var p = {score: $scope.application.score};
        Restangular
            .one('application-full', $scope.application.uuid)
            .patch(p).then(function (response) {
            $scope.editScore();
        },
        function (response) {
            alert('FAIL ' + response.status);
        });
    };

    // Save individual skill score.
    $scope.saveVerified = function (skill) {
        var patch_skill = {
            skill_level_verified: skill.skill_level_verified
        };

        Restangular.one('application-skill-full', skill.id).patch(patch_skill).then(function (response) {
            $scope.editVerified(skill.id);
        },
        function (response) {
            alert('FAIL ' + response.status);
        });
    };

    // Updates status, source, recruiter_notes.
    $scope.update = function(attribute){
        var patch = {};
        patch[attribute] = $scope.application[attribute];
        application.patch(patch).then(function(response){
        });
    };

    //Opens modal to add communication event to contact history.
    $scope.editCommunication = function (history) {
        var modalInstance = $modal.open({
            templateUrl: 'modals/application_history/application_history.tpl.html',
            controller: 'CommunicationController',
            resolve: {
                history: function () {
                    return history;
                },
                contact_types: function () {
                    return $scope.contactTypes;
                }
            }
        });

        // Saves communication event at modal closing.
        modalInstance.result.then(function (history) {
            var p = {
                applicant: $scope.application.id,
                contact_type: history.contact_type,
                notes: history.notes,
                contacted_on: history.contacted_on,
                follow_up: history.follow_up
            };
            if(history.createThis){
                Restangular.all('application-history').post(p).then(function (response) {
                    history = response;
                    history.datetime = DateTime.split(response.contacted_on);
                    history.followUp = DateTime.split(response.follow_up);
                    $scope.application['applicant_history'].push(history);
                },
                function (response) {
                    alert('FAIL ' + response.status);
                });
            }
            else{
                Restangular.one('application-history', history.id).patch(p).then(function (response) {
                },
                function (response) {
                    alert('FAIL ' + response.status);
                });
            }
        });
    };
}]);