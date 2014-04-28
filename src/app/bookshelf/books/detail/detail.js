angular.module('bookshelf.books.detail', [
    'ui.router',
    'restangular',
    'services.bookFactory'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('bookshelf.books-detail', {
        url: '/bookshelf/book/{bookSlug:[a-z0-9-]+}?chapter',
        views: {
            'main': {
                controller: 'BookDetailController',
                templateUrl: 'bookshelf/books/detail/detail.tpl.html'
            },
            'sidebar': {
                templateUrl: 'bookshelf/books/detail/detail-nav.tpl.html'
            }
        },
        data: {
            pageTitle: 'Books'
        }
    });
}])

.controller('BookDetailController',
        ['$scope', '$stateParams', '$state', '$location', 'Restangular', 'bookFactory', 'urls', '$anchorScroll',
        function ($scope, $stateParams, $state, $location, Restangular, bookFactory, urls, $anchorScroll) {

    // Get viewing info for user and book.
    var getViewing = function(){
        bookFactory.getSpecificViewingHistory($scope.book.id).then(function(viewed){
            $scope.viewing = viewed[0];
            $scope.canAddIt = !viewed[0];

            // Scroll to specified chapter in table of contents if in stateParams.
            if ($stateParams.chapter) {
                $scope.scrollTo($stateParams.chapter);
            }
        });
    };

    // Sets the starting place for when book is opened.
    var setStartingPlace = function(place){
        if(postTracking){
            var startingPlace = 1;
            if(place){
                startingPlace = place;
            }
            else if($scope.viewing.tracking.length > 0){
                startingPlace = $scope.viewing.tracking[$scope.viewing.tracking.length-1].ending_place;
            }
            postTracking($scope.viewing.id, startingPlace);
        }
    };

    // Figures out it book is checked out by user, someone else, or generally available.
    var checkOutStatus = function(){
        if($scope.book.book_file){
            if($scope.book.book_file == 'unavailable'){
                $scope.checkedOut = true;
            }
            else if($scope.book.book_file !== 'available'){
                $scope.checkedOutByCurrentUser = true;
            }
        }
        else{
            $scope.checkedOut = true;
        }
    };

    Restangular.one('book', $stateParams.bookSlug).get().then(function(book){
        book.picture = urls.media + book.picture;
        $scope.book = book;
        checkOutStatus();
        getViewing();
        if ($scope.book.book_chapters.length > 0) {
            $scope.chapters = bookFactory.getMainChapters($scope.book.book_chapters);
        }
    });

    // Starts a new tracking session.
    var postTracking = function(viewingId, startingPlace){
        var postTracking = {
            'starting_place': startingPlace,
            'view_history': viewingId,
            'ending_place': startingPlace
        };

        Restangular
                .all('book-tracking')
                .post(postTracking)
                .then(function(tracking){
            $state.go('bookshelf.books-read', {bookSlug: $scope.book.slug});
        });
    };

    // Generic check out.
    var genericCheckOut = function(page){
        Restangular
            .one('book', $stateParams.bookSlug)
            .one('checkout')
            .patch({})
            .then(function(checkOut){

            if(!$scope.viewing){
                bookFactory.getSpecificViewingHistory($scope.book.id).then(function(viewed){
                    $scope.viewing = viewed[0];
                    setStartingPlace(page);
                });
            }
            else{
                setStartingPlace(page);
            }
        });
    };

    // Checks out book.
    $scope.checkOut = function () {
        genericCheckOut();
    };

    // Checks out book or opens book at specified chapter.
    $scope.checkOutChapter = function (chapter) {
        if (!$scope.checkedOutByCurrentUser && !$scope.checkedOut) {
            genericCheckOut(chapter.page);
        }
        else if ($scope.checkedOutByCurrentUser) {
            $state.go('bookshelf.books-read', {
                bookSlug: $scope.book.slug,
                page: chapter.page
            });
        }
    };

    // Opens book user has already checked out.
    $scope.goBackToReading = function (book) {
        $state.go('bookshelf.books-read', {bookSlug: book.slug});
    };

    // Adds book to reading queue when it is checked out by another user.
    $scope.addToQueue = function (book){
        Restangular
                .one('book', $stateParams.bookSlug)
                .one('add_to_queue')
                .patch({})
                .then(function(added){
            getViewing();
        });
    };

    // Scrolls to specified chapter.
    $scope.scrollTo = function (id) {
        var element = angular.element(document.getElementById(id).parentElement);
        element.css('background-color', 'yellow');

        $location.hash(id);
        $anchorScroll();
        $location.hash('');

        element.css('background-color', '');
        element.css('transition', 'background-color 2s linear');
    };
}]);