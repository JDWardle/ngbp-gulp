describe('crm.account.contact module', function () {
    beforeEach(module('izops'));
    beforeEach(module('crm.account.contact'));

    it('should have the correct url', inject(function ($state) {
        expect($state.href('crm.account-contact', {accountId: 1}))
            .toBe('#/crm/account/1/contacts');
    }));

    describe('controller ContactController', function () {
        var $scope, ContactController;

        beforeEach(inject(function ($httpBackend, $rootScope, $controller) {
            $httpBackend.when('GET', '/ops/employee-login').respond({});
            $httpBackend.when('GET', '/ops/account/1/').respond(izTest.mocks.account);

            $scope = $rootScope.$new();
            ContactController = $controller('ContactController', {
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

        it('should get the account', inject(function ($httpBackend) {
            $httpBackend.expectGET('/ops/account/1/');
            $httpBackend.flush();

            expect($scope.account.originalElement).toEqual(izTest.mocks.account);
        }));

        describe('function $scope.addContact', function () {
            beforeEach(inject(function ($modal, $httpBackend) {
                $httpBackend.expectGET('/ops/account/1/');
                $httpBackend.flush();

                spyOn($modal, 'open').andReturn(izTest.mocks.modal);
            }));

            it('should open a modal and create a new contact when `Ok` is clicked', inject(function ($modal, $httpBackend) {
                var contact = {
                    title: 'testing',
                    first_name: 'test',
                    last_name: 'test',
                    position: 'CEO of test',
                    decision_maker: true
                };

                $scope.addContact();
                expect($modal.open).toHaveBeenCalled();

                izTest.mocks.modal.close(contact);

                $httpBackend.expectPOST('/ops/account-contact/').respond(izTest.mocks.accountContact);
                $httpBackend.expectPATCH('/ops/account/1/').respond(izTest.mocks.account);
                $httpBackend.flush();

                expect($scope.account.contact[0].originalElement).toEqual(izTest.mocks.accountContact);
            }));
        });

        describe('function $scope.updateContact', function () {
            beforeEach(inject(function ($modal, $httpBackend) {
                $httpBackend.expectGET('/ops/account/1/');
                $httpBackend.flush();

                spyOn($modal, 'open').andReturn(izTest.mocks.modal);
            }));

            it('should open a modal and update an existing contact when `Ok` is clicked', inject(function ($modal, $httpBackend) {
                var contact = izTest.mocks.accountContact;
                $scope.account.contact.push(contact);

                $scope.updateContact(izTest.mocks.accountContact);
                expect($modal.open).toHaveBeenCalled();

                // Modify the contact a little.
                contact.title = 'modified';
                contact.remove = {};

                izTest.mocks.modal.close(contact);

                $httpBackend.expectPATCH('/ops/account-contact/1/').respond(contact);
                $httpBackend.flush();

                expect($scope.account.contact[0]).toEqual(contact);
            }));
        });
    });
});