/* jshint loopfunc: true */
angular.module('crm.account.opportunity', [
    'ui.router',
    'restangular',
    'modals.addOrUpdateOpportunity'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('crm.account-opportunity', {
        url: '/crm/account/{accountId:[0-9]+}/opportunities',
        views: {
            'main': {
                controller: 'OpportunityController',
                templateUrl: 'crm/account/opportunities/opportunities.tpl.html'
            },
            'sidebar': {
                templateUrl: 'crm/account/account-nav.tpl.html',
                controller: ['$scope', '$stateParams', function ($scope, $stateParams) {
                    $scope.stateParams = $stateParams;
                }]
            }
        },
        data: {
            pageTitle: 'Opportunities'
        }
    });
}])

.controller('OpportunityController',
        ['$scope', '$modal', '$stateParams', 'Restangular', 'urls',
        function ($scope, $modal, $stateParams, Restangular, urls) {
    Restangular
            .one('account', $stateParams.accountId)
            .get()
            .then(function (response) {
        $scope.account = response;
    });

    // Get the sales stages to display the name of the sales stage on an
    // opportunity instead of just the id.
    Restangular
            .all('account')
            .options()
            .then(function (response) {
        $scope.sales_stages = response.sales_stage_choices;
    });

    // Modal for adding an opportunity.
    $scope.addOrUpdateOpportunity = function (opportunity) {
        // Open a modal for adding a new opportunity.
        var modalInstance = $modal.open({
            templateUrl: 'modals/opportunity/opportunity.tpl.html',
            controller: 'AddOrUpdateOpportunityController',
            resolve: {
                accountId: function () {
                    return $stateParams.accountId;
                },
                opportunity: function(){
                    return opportunity;
                }
            }
        });

        // Modal was closed/dismissed.
        modalInstance.result.then(function (opportunity) {
            // Save the new opportunity.
            var post_opportunity = {
                account: parseInt($stateParams.accountId, 10),
                name: opportunity.name,
                stage: opportunity.stage,
                closing_probability: opportunity.closing_probability,
                estimated_revenue: opportunity.estimated_revenue
            };

            var addSharedDocument = function (opportunityId) {
                //TODO: fix all this. opportunity is atually on 'share', not 'share-document'
                /*
                // Patch each document adding the opportunity id to the list of opportunities.
                    Restangular.all('share-document').getList().then(function (response) {
                        for (var i = 0, len = response.length; i < len; i++) {
                            for (var j = 0, lenJ = opportunity.shared_documents.length; j < lenJ; j++) {
                                // Check if the current document has the same id
                                // as the ones selected for the opportunity.

                                if (response[i].id == opportunity.shared_documents[j]) {
                                    console.log(response[i]);
                                    // Push the new opportunity id to the
                                    // documents list of opportunities.
                                    response[i].opportunity.push(opportunityId);

                                    // Use _.uniq() to remove any duplicate id's.
                                    Restangular.one('share-document', opportunity.shared_documents[j]).patch({opportunity: _.uniq(response[i].opportunity)}).then(function (response) {
                                        // Add the document to the view.
                                    },
                                    function (response) {
                                        alert('FAIL ' + response.status);
                                    });
                                }
                            }
                        }
                    });
                    */
            };

            if (opportunity.createThis) {
                Restangular
                        .all('opportunity')
                        .post(post_opportunity).then(function (response) {
                    var opportunityId = response.id;

                    if (opportunity.project) {
                        var post_project = {
                            title: opportunity.project.title,
                            services: opportunity.project.services,
                            technologies: opportunity.project.technologies
                        };

                        Restangular
                                .all('project')
                                .post(post_project)
                                .then(function (response) {
                            // Push the project onto the view.
                        },
                        function (response) {
                            alert('FAIL ' + response.status);
                        });
                    }

                    if (opportunity.shared_documents !== undefined) {
                        addSharedDocument(opportunityId);
                    }

                    // Push the new opportunity to the view.
                    $scope.account.opportunities.push(response);
                },
                function (response) {
                    alert('FAIL ' + response.status);
                });
            }
            else {
                Restangular
                        .one('opportunity', opportunity.id)
                        .patch(post_opportunity)
                        .then(function (response) {
                    var i;
                    for (i = 0, len = $scope.account.opportunities.length; i < len; i++) {
                        if ($scope.account.opportunities[i].id == response.id) {
                            $scope.account.opportunities[i] = response;
                        }
                        if(opportunity.shared_documents !== undefined){
                            addSharedDocument(response.id);
                        }
                    }
                },
                function (response) {
                    alert('FAIL ' + response.status);
                });
            }
        });
    };
}]);