describe('bookshelf.videos module', function () {
    beforeEach(module('izops'));
    beforeEach(module('bookshelf.videos'));

    it('should have the correct url', inject(function ($state) {
        expect($state.href('bookshelf.videos')).toBe('#/bookshelf/videos');
    }));

    describe('controller VideoController', function () {
        var $scope, VideoController;

        beforeEach(inject(function ($controller, $rootScope, $httpBackend) {
            $httpBackend.when('GET', '/ops/employee-login').respond({});

            $scope = $rootScope.$new();
            VideoController = $controller('VideoController', {
                $scope: $scope
            });

            spyOn($scope, 'changePage').andCallThrough();
        }));

        afterEach(inject(function ($httpBackend) {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        }));

        it('should get a list of videos and set the pagination variables', inject(function ($httpBackend) {
            $httpBackend.expectGET('/ops/video/').respond(izTest.mocks.paginatedResponse);
            $httpBackend.flush();

            expect($scope.videos).toBeDefined();
            expect($scope.paginate.itemsPerPage).toBeDefined();
            expect($scope.paginate.count).toBeDefined();
        }));

        it('should update the list of videos once the page is changed', inject(function ($httpBackend) {
            $httpBackend.expectGET('/ops/video/').respond(izTest.mocks.paginatedResponse);
            $httpBackend.flush();

            $scope.paginate.currentPage = 2;
            
            $httpBackend.expectGET('/ops/video/?page=2').respond(izTest.mocks.paginatedResponse);
            $httpBackend.flush();

            expect($scope.changePage).toHaveBeenCalledWith(2);
        }));
    });
});