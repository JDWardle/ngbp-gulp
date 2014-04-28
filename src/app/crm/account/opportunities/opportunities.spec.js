describe('crm.account.opportunity module', function () {
    beforeEach(module('izops'));
    beforeEach(module('crm.account.opportunity'));

    it('should have the correct url', inject(function ($state) {
        expect($state.href('crm.account-opportunity', {accountId: 1}))
            .toBe('#/crm/account/1/opportunities');
    }));

    describe('controller OpportunityController', function () {
        var $scope, OpportunityController;

        beforeEach(inject(function ($controller, $rootScope, $httpBackend) {
            $httpBackend.when('GET', '/ops/employee-login').respond({});
            $httpBackend.when('GET', '/ops/account/1/').respond(izTest.mocks.account);
            $httpBackend.when('OPTIONS', '/ops/account/').respond(izTest.mocks.accountOptions);

            $scope = $rootScope.$new();
            OpportunityController = $controller('OpportunityController', {
                $scope: $scope,
                $stateParams: {
                    accountId: 1
                }
            });
        }));

        afterEach(inject(function ($httpBackend) {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        }));

        it('should get the account and sales_stages from the server', inject(function ($httpBackend) {
            $httpBackend.expectGET('/ops/account/1/');
            $httpBackend.expect('OPTIONS', '/ops/account/');
            $httpBackend.flush();

            expect($scope.account.originalElement).toEqual(izTest.mocks.account);
            expect($scope.sales_stages).toEqual(izTest.mocks.accountOptions.sales_stage_choices);
        }));

        describe('function $scope.addOrUpdateOpportunity', function () {
            beforeEach(inject(function ($httpBackend, $modal) {
                $httpBackend.expectGET('/ops/account/1/');
                $httpBackend.expect('OPTIONS', '/ops/account/');
                $httpBackend.flush();

                spyOn($modal, 'open').andReturn(izTest.mocks.modal);
            }));

            it('should open a modal and create an opportunity when creatThis is true', inject(function ($modal, $httpBackend) {
                // TODO: Fix the opportunity controller so it actually works with all of it's features.
                var opportunity = {
                    name: 'testing',
                    stage: '1',
                    closing_probability: 0,
                    estimated_revenue: 0,
                    createThis: true
                };

                // var project = {
                //     title: 'testing',
                //     services: [1, 2],
                //     technologies: [3, 4]
                // };

                $scope.addOrUpdateOpportunity();
                expect($modal.open).toHaveBeenCalled();

                izTest.mocks.modal.close(opportunity);

                $httpBackend.expectPOST('/ops/opportunity/').respond(izTest.mocks.opportunity);
                // $httpBackend.expectPOST('/ops/project/').resond(izTest.mocks.project);
                $httpBackend.flush();

                expect($scope.account.opportunities[0].originalElement).toEqual(izTest.mocks.opportunity);
            }));

            it('should update an opportunity when createThis is false', inject(function ($modal, $httpBackend) {
                var opportunity = {
                    id: 1,
                    name: "testing",
                    stage: "1",
                    estimated_revenue: 0,
                    closing_probability: 0,
                    creaeThis: false
                };

                $scope.account.opportunities.push(izTest.mocks.opportunity);

                // Modify the opportunity a little.
                $scope.account.opportunities[0].name = 'modified';

                $scope.addOrUpdateOpportunity();
                expect($modal.open).toHaveBeenCalled();

                izTest.mocks.modal.close(opportunity);

                $httpBackend.expectPATCH('/ops/opportunity/1/').respond(izTest.mocks.opportunity);
                $httpBackend.flush();

                expect($scope.account.opportunities[0].originalElement).toEqual(izTest.mocks.opportunity);
            }));
        });

    });
});