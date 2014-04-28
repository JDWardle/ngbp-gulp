describe('User Application Controller', function(){
    var httpBackend, scope;

    // Fake application data.
    var fakeApplication = izTest.mocks.application;

    var getController = function(controller){
        httpBackend
            .whenGET('/ops/application/')
            .respond(fakeApplication);
        httpBackend.expect('OPTIONS', '/ops/application/').respond([]);
        httpBackend.expectGET('/ops/jobs/').respond([]);
        httpBackend.expectGET('/ops/technology/').respond([]);
        httpBackend.expectGET('/ops/category/').respond([]);
        controller('UserApplicationController', {$scope: scope});
        // Flushes initial get requests for application made by controller.
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

    it('should load the application after the controller loads', function(){
        expect(scope.application.originalElement).toEqual(fakeApplication);
    });
});


