describe('Applications Detail Controller', function(){
    var httpBackend, scope;

    // Fake application data.
    var fakeApplication = izTest.mocks.application;

    var getController = function(controller){
        httpBackend
            .whenGET('/ops/application-full/')
            .respond(fakeApplication);
        httpBackend.expect('OPTIONS', '/ops/application-full/').respond([]);
        httpBackend.expectGET('/ops/application-status/').respond([]);
        controller('ApplicationsDetailController', {$scope: scope});
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

    it('ought to patch application attributes passed in', function(){
        httpBackend.expectPATCH('/ops/application-full/').respond({});
        scope.application.status = 1;
        scope.update('status');
        httpBackend.flush();
    });

    it('allegedly scores a skill, then stops editing score', function(){
        httpBackend.expectPATCH('/ops/application-skill-full/1/').respond({});
        var editingStatus = scope.editingVerified[1] = true;
        scope.saveVerified({id: 1, skill_level_verified: 4});
        httpBackend.flush();
        expect(editingStatus).toEqual(!scope.editingVerified[1]);
    });

    it('will toggle the editing status of the applications over all score', function(){
        var editingStatus = scope.editingScore;
        scope.editScore();
        expect(editingStatus).toEqual(!scope.editingScore);
    });

    describe('Applicant communication history, which unfortunately uses a modal', function(){
        var modal;
        var fakeModal = izTest.mocks.modal;

        beforeEach(inject(function($modal){
            modal = $modal;
            spyOn(modal, 'open').andReturn(fakeModal);
        }));

        it('should post new communication history, and add to history list', function(){
            var historyLength = scope.application.applicant_history.length;
            scope.editCommunication();
            httpBackend.expectPOST('/ops/application-history/').respond({});
            fakeModal.close({createThis: true});
            httpBackend.flush();
            expect(scope.application.applicant_history.length).toEqual(historyLength + 1);
        });

        it('should patch previously created communication history', function(){
            var history = scope.application.applicant_history[0];
            scope.editCommunication(history);
            httpBackend.expectPATCH('/ops/application-history/1/').respond({});
            fakeModal.close({id: 1});
            httpBackend.flush();
        });
    });
});

