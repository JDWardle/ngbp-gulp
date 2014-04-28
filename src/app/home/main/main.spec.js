describe('home.main module', function () {
    beforeEach(module('home.main'));

    describe('controller HomeController', function () {
        beforeEach(inject(function ($rootScope, $controller) {
            $scope = $rootScope.$new();
            HomeController = $controller('HomeController', {
                $scope: $scope
            });
        }));

        it('should have `Home sweet home.` as the message', function () {
            expect($scope.message).toBe('Home sweet home.');
        });
    });
});
