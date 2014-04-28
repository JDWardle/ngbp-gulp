angular.module('izops', [
    'templates-app',    // Module for the app html templates.
    'templates-common', // Module for the common html templates.
    'ngCookies',
    'ngRoute',
    'ui.router',
    'ui.bootstrap',
    'restangular',
    'directives.loadingWidget',
    'home',
    'bookshelf',
    'crm',
    'employees',
    // 'suggest',
    'applications'
])

// TODO: Remove this placeholder.
.constant('urls', {
    media: '/media/',
    static: '/static/'
})

.config(['$httpProvider', '$routeProvider', '$sceProvider', '$urlRouterProvider', 'RestangularProvider', 'urls',
    function ($httpProvider, $routeProvider, $sceProvider, $urlRouterProvider, RestangularProvider, urls) {
    RestangularProvider.setBaseUrl('/ops/');
    RestangularProvider.setRequestSuffix('/');
    $sceProvider.enabled(false);
    $urlRouterProvider.otherwise('/');
}])

.run(['Restangular', '$rootScope', '$window', '$location', '$routeParams', '$templateCache', '$http', '$cookies',
    function (Restangular, $rootScope, $window, $location, $routeParams, $templateCache, $http, $cookies) {
    $http.defaults.headers.common['X-CSRFToken'] = $cookies.csrftoken;

    // Override the pagination template for ui.bootstrap to fix a small issue
    // with the pagination links.
    $templateCache.put('template/pagination/pagination.html',
        '<span class="pagination">\n' +
        '  <ul>\n' +
        '    <li ng-repeat="page in pages" ng-class="{active: page.active, disabled: page.disabled}">\n' +
        '      <a href="" ng-click="selectPage(page.number)">{{ page.text }}</a>\n' +
        '    </li>\n' +
        '  </ul>\n' +
        '</span>\n');

    $http.get('/ops/employee-login').success(function(response){
        var currentUser;
        if(response.count == 1){
            currentUser = response.results[0];
            $rootScope.user = currentUser;
        }
        // Checks if the current route requires the user to be an admin.
        $rootScope.$on('$routeChangeStart', function (event, current, previous) {
            if (current.admin) {
                if (!currentUser.is_staff || !currentUser.is_superuser) {
                    // Redirect the user if they are not an admin.
                    $location.path('#/');
                    event.preventDefault();
                }
            }
        });
    });

    // Variable to keep track of the number of current requests.
    var requestCount = 0;

    Restangular.addRequestInterceptor(function (element, operation, what, url) {
        // Add one to the requestCount if a request was sent to the server.
        requestCount++;
        $rootScope.$broadcast('retrievingResource');

        return element;
    });

    Restangular.addResponseInterceptor(function (data, operation, what, url, response, deferred) {
       // Extract information about pagination on a getList operation.
        var newResponse;
        if (operation == 'getList' && response.data.results) {
            newResponse = response.data.results;
            newResponse._meta = {
                'paginate': {
                    'pages': _.range(1, Math.ceil(response.data.count / response.data.results.length || 1) + 1),
                    'page_count': Math.ceil(response.data.count / response.data.results.length),
                    'paginate_by': response.data.results.length,
                    'count': response.data.count,
                    'next': response.data.next,
                    'previous': response.data.previous
                }
            };
            newResponse.originalElement = [];
            angular.forEach(newResponse, function(value, key) {
                newResponse.originalElement[key] = angular.copy(value);
            });
        }
        else {
            newResponse = response.data;
            newResponse.originalElement = angular.copy(response.data);
        }

        // Subtract one from the requestCount once a response is received from the server.
        requestCount--;

        // Only broadcast this message if there are no more requests.
        if (requestCount < 1) {
            $rootScope.$broadcast('receivedResource');
        }

        // return data;
        return newResponse;
    });

    Restangular.setErrorInterceptor(function (response) {
        // Redirect the user to the login page if they are not logged in.
        if (response.status == '403' && response.data.detail == 'Authentication credentials were not provided.') {
            var next = $window.location.pathname + $window.location.hash;
            
            $window.location.href = '/accounts/login/?next=' + next;
        }

        // Redirect the user on a 404.
        if (response.status == '404' && response.data.detail == 'Not found') {
            // TODO: Redirect to a 404 page.
            $window.location.href = '/#/';
        }

        // Subtract one from the requestCount once an error response is received from the server.
        requestCount--;

        // Only broadcast this message if there are no more requests.
        if (requestCount < 1) {
            $rootScope.$broadcast('receivedResource');
        }

        return response;
    });
}])

.controller('AppController', ['$scope', '$location', function ($scope, $location) {
    $scope.pageTitle = 'Izeni Ops';

    $scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
        toState.data = toState.data || {};

        // Update the page title.
        if (angular.isDefined(toState.data.pageTitle)) {
            $scope.pageTitle = toState.data.pageTitle + ' | Izeni Ops';
        }
    });
}]);