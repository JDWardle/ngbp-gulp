describe('employees.add module', function () {
    beforeEach(module('izops'));
    beforeEach(module('employees.add'));

    it('should have the proper url', inject(function ($state) {
        expect($state.href('employees.add')).toBe('#/employees/add');
    }));

    describe('controller AddEmployeeController', function () {
        var $scope, AddEmployeeController;

        beforeEach(inject(function ($controller, $rootScope, $httpBackend, $state) {
            spyOn($state, 'go').andCallThrough();

            $httpBackend.when('GET', '/ops/employee-login').respond({});
            $httpBackend.when('POST', '/ops/employee/').respond({});

            $scope = $rootScope.$new();
            AddEmployeeController = $controller('AddEmployeeController', {
                $scope: $scope
            });
        }));

        it('should start with an empty object', function () {
            expect($scope.employee).toBeDefined();
        });

        it('should create an employee and redirect to the employees.main state', inject(function ($httpBackend, $location, $state) {
            $scope.employee = {
                first_name: 'test',
                last_name: 'test',
                employee_email: 'test@test.com'
            };

            $scope.addEmployee();

            $httpBackend.expectPOST('/ops/employee/');
            $httpBackend.flush();
            
            expect($state.go).toHaveBeenCalled();
            expect($location.path()).toBe('/employees');
        }));
    });
});