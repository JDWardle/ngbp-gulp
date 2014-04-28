describe('crm.account.add module', function () {
    beforeEach(module('izops'));
    beforeEach(module('crm.account.add'));

    it('should have the correct url', inject(function ($state) {
        expect($state.href('crm.account-add')).toBe('#/crm/account/add');
    }));

    describe('controller AddAccountController', function () {
        var $scope, AddAccountController;

        beforeEach(inject(function ($rootScope, $controller, $httpBackend) {
            $httpBackend.when('GET', '/ops/employee-login').respond({});

            $scope = $rootScope.$new();
            AddAccountController = $controller('AddAccountController', {
                $scope: $scope
            });
        }));

        afterEach(inject(function ($httpBackend) {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        }));

        it('should get statusChoices from an OPTIONS request', inject(function ($httpBackend) {
            $httpBackend.expect('OPTIONS', '/ops/account/').respond(izTest.mocks.accountOptions);
            $httpBackend.flush();

            expect($scope.statusChoices).toEqual(izTest.mocks.accountOptions.status);
        }));

        describe('function $scope.addAccount()', function () {
            beforeEach(inject(function ($httpBackend, $state) {
                $httpBackend.expect('OPTIONS', '/ops/account/').respond(izTest.mocks.accountOptions);
                $httpBackend.flush();

                spyOn($state, 'go').andCallThrough();
            }));

            it('should add a new account', inject(function ($httpBackend, $state) {
                var account = {
                    company_name: 'testing',
                    website: 'http://test.com/',
                    street_address: 'test',
                    city: 'test',
                    state: 'UT',
                    zip_code: '1234',
                    status: {
                        communication_level: 'ag',
                        share_level: 'ag',
                        priority: 'ag'
                    }
                };

                $scope.addAccount(account);

                $httpBackend.expectPOST('/ops/account/').respond(izTest.mocks.account);
                $httpBackend.flush();

                expect($state.go).toHaveBeenCalled();
            }));
        });
    });
});