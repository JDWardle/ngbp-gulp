describe('crm.account module', function () {
    beforeEach(module('izops'));
    beforeEach(module('crm.account'));

    it('should have the proper url', inject(function ($state) {
        expect($state.href('crm.account', {accountId: 1})).toBe('#/crm/account/1');
    }));

    describe('controller AccountController', function () {
        var $scope, AccountController;

        beforeEach(inject(function ($controller, $rootScope, $httpBackend, $location, $state) {
            $httpBackend.when('GET', '/ops/employee-login').respond({});
            $httpBackend.when('GET', '/ops/account/1/').respond(izTest.mocks.account);

            $httpBackend.when('OPTIONS', '/ops/account/').respond(izTest.mocks.accountOptions);

            $scope = $rootScope.$new();
            AccountController = $controller('AccountController', {
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

        it('should get the account from the server and set all variables needed for setup', inject(function ($state, $httpBackend, $location) {
            $httpBackend.expectGET('/ops/account/1/');
            $httpBackend.flush();

            expect($scope.account).toBeDefined();
            expect($scope.statusChoices).toBeDefined();
            expect($scope.stateChoices).toBeDefined();
        }));

        it('should have $scope.editStatus make a copy of status and toggle the editing variable', inject(function ($httpBackend) {
            var editingStatus;
            $httpBackend.expectGET('/ops/account/1/');
            $httpBackend.flush();

            editingStatus = $scope.editing.status;

            $scope.editStatus();

            expect($scope.account.statusCopy).toBeDefined();
            expect($scope.editing.status).not.toBe(editingStatus);
        }));

        it('should have $scope.editWebsite make a website copy and toggle the editing variable', inject(function ($httpBackend) {
            var editingWebsite;
            $httpBackend.expectGET('/ops/account/1/');
            $httpBackend.flush();

            editingWebsite = $scope.editing.website;

            $scope.editWebsite();

            expect($scope.account.websiteCopy).toBeDefined();
            expect($scope.editing.website).not.toBe(editingWebsite);
        }));

        describe('function $scope.saveStatus', function () {
            beforeEach(inject(function($httpBackend) {
                $httpBackend.expectGET('/ops/account/1/');
                $httpBackend.flush();
            }));

            it('should be able to update the status for the account', inject(function ($httpBackend) {
                var status = {
                    communication_level: 'ag',
                    share_level: 'ag',
                    priority: 'ag'
                };

                $scope.saveStatus(status);

                $httpBackend.expectPATCH('/ops/account/1/').respond(izTest.mocks.account);
                $httpBackend.flush();

                expect($scope.account.communication_level.lower).toBe(status.communication_level);
                expect($scope.account.share_level.lower).toBe(status.share_level);
                expect($scope.account.priority.lower).toBe(status.priority);
            }));

            it('should not send a PATCH request to the server if the status has not changed', function() {
                var status = {
                    communication_level: $scope.account.communication_level.lower,
                    share_level: $scope.account.share_level.lower,
                    priority: $scope.account.priority.lower
                };

                $scope.saveStatus(status);

                expect($scope.account.communication_level.lower).toBe(status.communication_level);
                expect($scope.account.share_level.lower).toBe(status.share_level);
                expect($scope.account.priority.lower).toBe(status.priority);
            });
        });
        
        describe('function $scope.saveWebsite', function () {
            beforeEach(inject(function($httpBackend) {
                $httpBackend.expectGET('/ops/account/1/');
                $httpBackend.flush();
            }));

            it('should be able to update the website for the account', inject(function ($httpBackend) {
                var website = 'http://hello.com/';

                $scope.saveWebsite(website);

                $httpBackend.expectPATCH('/ops/account/1/').respond(izTest.mocks.account);
                $httpBackend.flush();

                expect($scope.account.website).toBe(website);
            }));

            it('should not send a PATCH request if the status has not changed', function () {
                var website = $scope.account.website;

                $scope.saveWebsite(website);

                expect($scope.account.website).toBe(website);
            });
        });

        describe('function $scope.saveAddress', function () {
            beforeEach(inject(function($httpBackend) {
                $httpBackend.expectGET('/ops/account/1/');
                $httpBackend.flush();
            }));

            it('should be able to update the address for the account', inject(function ($httpBackend) {
                var address = {
                    street_address: 'testing',
                    city: 'test',
                    state: 'UT',
                    zip_code: '1337'
                };

                $scope.saveAddress(address);

                $httpBackend.expectPATCH('/ops/account/1/').respond(izTest.mocks.account);
                $httpBackend.flush();

                expect($scope.account.street_address).toBe(address.street_address);
                expect($scope.account.city).toBe(address.city);
                expect($scope.account.state).toBe(address.state);
                expect($scope.account.zip_code).toBe(address.zip_code);
            }));

            it('should not send a PATCH request if the address has not changed', function () {
                var address = {
                    street_address: $scope.account.street_address,
                    city: $scope.account.city,
                    state: $scope.account.state,
                    zip_code: $scope.account.zip_code
                };

                $scope.saveAddress(address);

                expect($scope.account.street_address).toBe(address.street_address);
                expect($scope.account.city).toBe(address.city);
                expect($scope.account.state).toBe(address.state);
                expect($scope.account.zip_code).toBe(address.zip_code);
            });
        });
    
        describe('function $scope.addEmployee', function () {
            beforeEach(inject(function($httpBackend, $modal) {
                $httpBackend.expectGET('/ops/account/1/');
                $httpBackend.flush();

                spyOn($modal, 'open').andReturn(izTest.mocks.modal);
            }));

            it('should open a modal and add an employee to an account when the user clicks `Ok`', inject(function ($modal, $httpBackend) {
                var duty = {
                    employee: 1,
                    description: 'testing'
                };

                $scope.addEmployee();
                expect($modal.open).toHaveBeenCalled();

                izTest.mocks.modal.close(duty);
                $httpBackend.expectPOST('/ops/employee-duty/').respond(izTest.mocks.employeeDuty);
                $httpBackend.expectGET('/ops/employee/1/').respond(izTest.mocks.employee);
                $httpBackend.flush();

                expect($scope.account.duty[0].originalElement).toEqual(izTest.mocks.employeeDuty);
                expect($scope.account.duty[0].employee.originalElement).toEqual(izTest.mocks.employee);
            }));
        });
    });
});