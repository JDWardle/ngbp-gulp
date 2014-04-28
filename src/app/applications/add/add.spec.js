describe('Add Applications Controller', function(){
    var controller, httpBackend, scope;

    // Fake application data.
    var fakeApplication1 = {first_name: "Larry", last_name: "Von Trap"};
    var fakeApplication2 = {first_name: "Harry", last_name: "Von Trap"};

    // Inject 'izops' module to configure Restangular.
    izTest.injectIzops();
    beforeEach(inject(function($controller, $httpBackend, $rootScope){
        httpBackend = $httpBackend;
        scope = $rootScope.$new();
        izTest.takeCareOfLogin(httpBackend);
        controller = $controller('AddApplicationsController', {$scope: scope});
    }));

    // Check to make sure there aren't any unfulfilled or extra requests.
    afterEach(function(){
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('should have one blank application on load', function(){
        expect(scope.applications.length).toEqual(1);
    });

    it('should add another blank application to the list when told to', function(){
        var initialList = scope.applications.length;
        scope.add();
        expect(scope.applications.length).toEqual(initialList + 1);
    });

    it('should remove the application from the list', function(){
        scope.applications = [fakeApplication1, fakeApplication2];
        scope.remove(fakeApplication2);
        expect(scope.applications).toEqual([fakeApplication1]);
    });

    it('should save all the applications in the list and reset the list to 1', function(){
        scope.applications = [fakeApplication1, fakeApplication2];
        scope.applicationForm = {$setPristine: function(){}};
        spyOn(scope.applicationForm, '$setPristine');
        httpBackend.expectPOST('/ops/application-full/').respond({status: 200});
        scope.save();
        httpBackend.flush();
        expect(scope.applicationForm.$setPristine).toHaveBeenCalled();
        expect(scope.applications).toEqual([{}]);
    });
});


