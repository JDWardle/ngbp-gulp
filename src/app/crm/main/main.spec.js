describe('crm.main module', function () {
    beforeEach(module('izops'));
    beforeEach(module('crm.main'));

    it('should have the proper ulr', inject(function ($state) {
        expect($state.href('crm.main')).toBe('#/crm');
    }));

    describe('controller CRMController', function () {
        var $scope, CRMController;

        beforeEach(inject(function ($httpBackend, $rootScope, $controller) {
            $httpBackend.when('GET', '/ops/employee-login').respond({});
            $httpBackend.when('GET', '/ops/account/').respond([{}]);
            $httpBackend.when('GET', '/ops/account-contact/').respond([{}]);

            $scope = $rootScope.$new();
            CRMController = $controller('CRMController', {
                $scope: $scope
            });
        }));

        it('should get a list of all the accounts', inject(function ($httpBackend) {
            $httpBackend.expectGET('/ops/account/');
            $httpBackend.flush();

            expect($scope.accounts).toBeDefined();
        }));
    });
});