describe('crm.document module', function () {
    beforeEach(module('izops'));
    beforeEach(module('crm.document'));

    it('should have the correct url', inject(function ($state) {
        expect($state.href('crm.document')).toBe('#/crm/document');
    }));

    describe('controller DocumentController', function () {
        var $scope, DocumentController;

        beforeEach(inject(function ($rootScope, $controller, $httpBackend) {
            $httpBackend.when('GET', '/ops/employee-login').respond({});

            $scope = $rootScope.$new();
            DocumentController = $controller('DocumentController', {
                $scope: $scope
            });

            spyOn($scope, 'changePage').andCallThrough();
        }));

        afterEach(inject(function ($httpBackend) {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        }));

        it('should grab the list of documents and set the pagination variables', inject(function ($httpBackend) {
            $httpBackend.expectGET('/ops/share-document/').respond(izTest.mocks.paginatedResponse);
            $httpBackend.flush();

            expect($scope.documents).toBeDefined();
            expect($scope.paginate.itemsPerPage).toBeDefined();
            expect($scope.paginate.count).toBeDefined();
        }));

        it('should set the search query parameter and update the list of documents', inject(function ($httpBackend) {
            $httpBackend.expectGET('/ops/share-document/').respond(izTest.mocks.paginatedResponse);

            $scope.paginate.currentPage = 2;

            $scope.searchFor('test');

            expect($scope.paginate.currentPage).toBe(1);
            expect($scope.searchFilter).toBe('test');
            expect($scope.changePage).toHaveBeenCalledWith(1, true);

            $httpBackend.expectGET('/ops/share-document/?page=1&search=test').respond(izTest.mocks.paginatedResponse);
            $httpBackend.flush();
        }));
    });
});