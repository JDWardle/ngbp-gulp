describe('employees.detail module', function () {
    beforeEach(module('izops'));
    beforeEach(module('employees.detail'));

    it('should have the proper url', inject(function ($state) {
        expect($state.href('employees.detail', {employeeId: '1'}))
            .toBe('#/employees/1');
    }));

    describe('controller EmployeeDetailController', function () {
        var $scope, EmployeeDetailController;

        beforeEach(inject(function ($controller, $rootScope, $httpBackend, $location) {
            $httpBackend.when('GET', '/ops/employee-login').respond({});
            $httpBackend.when('GET', '/ops/employee/').respond({});

            $scope = $rootScope.$new();
            EmployeeDetailController = $controller('EmployeeDetailController', {
                $scope: $scope
            });

            $location.path('/employees/1');
        }));

        afterEach(inject(function ($httpBackend) {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        }));

        it('should get an employee from the server', inject(function ($httpBackend) {
            $httpBackend.expectGET('/ops/employee/');
            $httpBackend.flush();

            expect($scope.employee).toBeDefined();
        }));
    });
});