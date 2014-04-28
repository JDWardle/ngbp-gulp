describe('employees.main module', function () {
    beforeEach(module('izops'));
    beforeEach(module('employees.main'));

    describe('controller EmployeesController', function () {
        var EmployeesController, $scope, paginatedResponse;

        beforeEach(inject(function ($rootScope, $controller, $httpBackend) {
            $scope = $rootScope.$new();

            $httpBackend.when('GET', '/ops/employee/').respond(izTest.mocks.paginatedResponse);

            // Don't care about the employee-login request here.
            $httpBackend.when('GET', '/ops/employee-login').respond({});

            EmployeesController = $controller('EmployeesController', {
                $scope: $scope
            });
        }));

        afterEach(inject(function ($httpBackend) {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        }));

        it('should get a list of employees and set pagination variables', inject(function ($httpBackend) {
            expect($scope.paginate.currentPage).toBe(1);

            $httpBackend.expectGET('/ops/employee/');
            $httpBackend.flush();

            expect($scope.employees).toBeDefined();
            expect($scope.paginate.itemsPerPage).toBeDefined();
            expect($scope.paginate.count).toBeDefined();
        }));

        it('should get a new list of employees when the page is changed', inject(function ($httpBackend) {
            $httpBackend.expectGET('/ops/employee/');
            $httpBackend.flush();

            $scope.paginate.currentPage = 2;
            $httpBackend.expectGET('/ops/employee/?page=2').respond(izTest.mocks.paginatedResponse);
            $httpBackend.flush();
        }));
    });
});