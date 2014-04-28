describe('crm.document.add module', function () {
    beforeEach(module('izops'));
    beforeEach(module('crm.document.add'));

    it('should have the correct url', inject(function ($state) {
        expect($state.href('crm.document-add')).toBe('#/crm/document/add');
    }));

    describe('controller AddDocumentController', function () {
        beforeEach(module('izops'));
        beforeEach(module('crm.document.add'));

        beforeEach(inject(function ($controller, $rootScope, $httpBackend, $state) {
            $httpBackend.whenGET('/ops/employee-login').respond({});

            $scope = $rootScope.$new();
            AddDocumentController = $controller('AddDocumentController', {
                $scope: $scope
            });

            spyOn($state, 'go').andCallThrough();
        }));

        afterEach(inject(function ($httpBackend) {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        }));

        it('should be able to upload a document to the server', inject(function ($httpBackend, $state) {
            $scope.addDocument();
            $httpBackend.expectPOST('/ops/share-document/').respond({});
            $httpBackend.flush();

            expect($state.go).toHaveBeenCalled();
        }));
    });
});