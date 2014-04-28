describe('ApplicationsController', function () {
    var scope, httpBackend;

    // Fake applications list.
    var fakeApplications = [izTest.mocks.application];

    // Fake data to respond with, instead of actually using the server.
    var fakeListResponse = izTest.mocks.paginatedResponse;
    fakeListResponse.results = fakeApplications;

    var getController = function(controller){
        httpBackend
            .expectGET('/ops/application-full/?ordering=last_name,first_name&page=1')
            .respond(fakeListResponse);
        controller('ApplicationsController', {$scope: scope});
        // Flushes initial get request for applications list made by controller.
        httpBackend.flush();
    };

    // Inject 'izops' module to configure Restangular.
    izTest.injectIzops();
    beforeEach(inject(function($controller, $httpBackend, $rootScope){
        httpBackend = $httpBackend;
        scope = $rootScope.$new();
        izTest.takeCareOfLogin(httpBackend);
        getController($controller);
    }));

    // Check to make sure there aren't any unfulfilled or extra requests.
    afterEach(function(){
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('should get applications automatically on load, and parse the response properly.', function(){
        expect(scope.applications.originalElement).toEqual(fakeApplications);
    });

    // Checks initial sort order, changing, reversing, and their accompanying get requests.
    it('should change the sorting order of the applications when setSort is called', function(){
        expect(scope.sort).toEqual(['last_name', 'first_name']);
        httpBackend.expectGET('/ops/application-full/?ordering=email').respond([]);
        scope.setSort('sort', ['email']);
        httpBackend.flush();
        expect(scope.sort).toEqual(['email']);
        httpBackend.expectGET('/ops/application-full/?ordering=-email').respond([]);
        scope.setSort('sort', ['email']);
        httpBackend.flush();
        expect(scope.sort).toEqual(['-email']);
    });

    it('should set pagination values', function(){
        // Initially the first page ought to be displayed.
        expect(scope.paginate.currentPage).toEqual(1);
        // These values would vary depending on the data provided.
        expect(scope.paginate.count).toBeDefined();
        expect(scope.paginate.itemsPerPage).toBeDefined();
    });

    it('should make another get request when the paginated page changes', function(){
        httpBackend.expectGET('/ops/application-full/?ordering=last_name,first_name&page=2').respond([]);
        scope.paginate.currentPage = 2;
        httpBackend.flush();
    });

    it('should not make another get request when the paginated page remains the same', function(){
        scope.paginate.currentPage = 1;
    });

    it('should make another get request when the applications are filtered, and reset the pagination', function(){
        httpBackend.expectGET('/ops/application-full/?complete=True&ordering=last_name,first_name').respond(fakeListResponse);
        scope.filtering = 'Complete';
        scope.filterApplications();
        expect(scope.paginate.count).not.toBeDefined();
        httpBackend.flush();
        expect(scope.paginate.count).toBeDefined();
    });
});