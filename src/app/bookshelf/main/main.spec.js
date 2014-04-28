describe('bookshelf.main module', function () {
    beforeEach(module('izops'));
    beforeEach(module('bookshelf.main'));

    it('should have the correct url', inject(function ($state) {
        expect($state.href('bookshelf.main')).toBe('#/bookshelf');
    }));

    describe('controller BookshelfController', function () {
        var $scope, BookshelfController;

        beforeEach(inject(function ($rootScope, $controller, $httpBackend) {
            $httpBackend.when('GET', '/ops/employee-login').respond({});

            $scope = $rootScope.$new();
            BookshelfController = $controller('BookshelfController', {
                $scope: $scope
            });
        }));

        afterEach(inject(function ($httpBackend) {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        }));

        it('should the a list of books and videos', inject(function ($httpBackend) {
            $httpBackend.expectGET('/ops/book/').respond([{}]);
            $httpBackend.expectGET('/ops/video/?count=5&order_by=-update_date').respond([{}]);
            $httpBackend.flush();

            expect($scope.books).toBeDefined();
            expect($scope.videos).toBeDefined();
        }));
    });
});