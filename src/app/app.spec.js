describe('izops module', function () {
    beforeEach(module('izops'));

    describe('controller AppController', function () {
        var AppController, $scope, $location;

        beforeEach(inject(function ($rootScope, $controller, _$location_) {
            $scope = $rootScope.$new();
            $location = _$location_;
            AppController = $controller('AppController', {
                $scope: $scope,
                $location: $location
            });
        }));

        it('should have `Izeni Ops` as the page title', function() {
            expect($scope.pageTitle).toBe('Izeni Ops');
        });
    });
});