/* jshint loopfunc: true */

angular.module('bookshelf.books.read', [
    'ui.router',
    'restangular',
    'services.bookFactory',
    'directives.draggable',
    'modals.recommend',
    'modals.extendCheckout',
    'modals.relatedVideo',
    'modals.relatedChapter',
    'modals.externalResource'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('bookshelf.books-read', {
        url: '/bookshelf/book/read/{bookSlug:[a-z0-9-]+}?page',
        views: {
            'main': {
                controller: 'ReadBookController',
                templateUrl: 'bookshelf/books/read/read.tpl.html'
            },
            'sidebar': {
                templateUrl: 'bookshelf/books/read/read-nav.tpl.html'
            }
        },
        data: {
            pageTitle: 'Read'
        }
    });
}])

.controller('ReadBookController',
        ['$scope', 'Restangular', '$window', '$stateParams', '$timeout', 'urls', 'bookFactory', '$modal',
        function ($scope, Restangular, $window, $stateParams, $timeout, urls, bookFactory, $modal) {

    // Watches window height, resizing frame and whatnot after changes
    $scope.$watch(function () {
        return $window.innerHeight;
    },
    function (newHeight, oldHeight) {
        $scope.frmHeight = newHeight + 'px';
        $scope.textboxHeight = (newHeight - 46) + 'px';
    });

    $scope.rating = { 'max': 10 };  //user's rating of book
    $scope.contentDisplay = 'sub';  //default for displaying book related material
    $scope.showStuff = false;       //related material is not displayed
    $scope.fullscreenMode = false;  //way of keeping track of full screen mode
    $scope.show = { 'relatedMaterial': true };  //div that holds relate material is displayed
    $scope.comment = {};    //no comment is being added or edited

    var idle, nextExtension, tick;  //timer functions canceled upon leaving view

    // Cancels timer functions on leaving view
    $scope.$on('$routeChangeStart', function(){
        $timeout.cancel(nextExtension);
        $timeout.cancel(idle);
        $timeout.cancel(tick);
    });
    $scope.$on('$destroy', function(){
        $timeout.cancel(nextExtension);
        $timeout.cancel(idle);
        $timeout.cancel(tick);
    });

    // Listeners for exiting full screen mode via esc key
    var fullScreenListener = function(listener, documentProperty){
        $window.document.addEventListener(listener, function (evt) {
            if (!$window.document[documentProperty]) {
                returnSettings();
            }
        });
    };
    fullScreenListener('fullscreenchange', 'fullscreen');
    fullScreenListener('mozfullscreenchange', 'mozFullScreen');
    fullScreenListener('webkitfullscreenchange', 'webkitIsFullScreen');

    var returnSettings = function () {
        $scope.fullscreenMode = false;
        $scope.show['relatedMaterial'] = true;
        $scope.$apply();
    };
    // Timer for inactivity
    var idleTime = function (){
        idle = $timeout(function(){
            $scope.timedOut = true;
        }, 1800000);
    };
    // Cancels and restarts inactivity timer
    var restartIdleTime = function(){
        $timeout.cancel(idle);
        idleTime();
    };

    // Prompts the user for continuing if inactive time has been exceeded.
    var promptStillThere = function (){
        checkFullscreenAndExit();
        var modalInstance;
        if (!$scope.extendCheckoutModal) {
            modalInstance = $modal.open({
                templateUrl: 'modals/extend_checkout/extend_checkout.tpl.html',
                controller: 'ExtendCheckoutController'
           });

           modalInstance.result.then(function () {
                   checkReturnFullscreen();
                   $scope.extendCheckoutModal = false;
                   $scope.timedOut = false;
                   extendCheckOut();
                   idleTime();
               },
               function () {
                   $scope.extendCheckoutModal = false;
                   $state.go('bookshelf.books');
               });
       }
       // This variable will only allow one of these modals to be open at a time.
       // It is also probably unnecessary.
       $scope.extendCheckoutModal = true;
   };

    // Extends time for book will be checked out or checks if user is still active.
    var extendCheckOut = function () {
        Restangular
                .one('book', $scope.book.slug)
                .one('extend_checkout')
                .patch({})
                .then(function(moreCheckOut){
            $scope.book.check_in_date = moreCheckOut.check_in_date;
        });
        if($scope.timedOut){
            promptStillThere();
        }
        else{
            // Restarts timer to extend check out again.
            $timeout.cancel(nextExtension);
            nextExtension = $timeout(extendCheckOut, 510000);
        }
    };

    // Updates page number stored in the ending place of the tracking session.
    var updatePageNumber = function(){
        var patchTracking = {'ending_place': $scope.page};
        Restangular.one('book-tracking', $scope.viewing.session.id)
            .patch(patchTracking)
            .then(function(tracking){
        });
    };

    // Sets $scope.currentChapter to the current subchapter.
    $scope.displayBySub = function (){
        $scope.contentDisplay = 'sub';
        var ended = false;
        var len = $scope.book.book_chapters.length;
        for(var i = 1; i < len; i++){
            if($scope.book.book_chapters[i].page > $scope.page){
                $scope.currentChapter = $scope.book.book_chapters[i-1];
                // Sets currentChapter to subchapter if chapter and subchapter have the same page
                if($scope.book.book_chapters[i-1].page == $scope.book.book_chapters[i].page){
                    $scope.currentChapter = $scope.book.book_chapters[i];
                }
                ended = true;
                break;
            }
        }
        if(!ended){
            $scope.currentChapter = $scope.book.book_chapters[len-1];
        }
    };

    // Adds subchapter content to currentChapter.
    var pushSubContent = function(subChapter, property){
        for(var i = 0, len = subChapter[property].length; i < len; i++){
            if(!_.contains($scope.currentChapter[property], subChapter[property][i])){
                $scope.currentChapter[property].push(subChapter[property][i]);
            }
        }
    };

    // Checks if chapter has specific content.
    var checkForSubContent = function(chapter, property){
        if(chapter[property].length > 0){
            pushSubContent(chapter, property);
        }
    };

    // Checks if chapter has content for various properties.
    var checkForVariousSubContent = function(chapter){
        var checkFor = ['comments', 'external_source', 'relevant_book_chapter', 'related_video'];
        for(var i in checkFor){
            checkForSubContent(chapter, checkFor[i]);
        }
    };

    // Looks for subchapter content if there are subchapters.
    var getSubChapterContent = function (chapter){
        if(chapter.sub_chapters.length > 0){
            var chapters = chapter.sub_chapters;
            for(var i = 0, len = chapters.length; i < len; i++){
                checkForVariousSubContent(chapters[i]);
            }
        }
    };

    // Sets $scope.currentChapter to current chapter.
    $scope.displayByMain = function (){
        $scope.contentDisplay = 'main';
        var oldChapter = $scope.currentChapter;
        var ended = false;
        var len = $scope.chapters.length;
        for(var i = 1; i < len; i++){
            if($scope.page < $scope.chapters[i].page){
                if($scope.chapters[i-1].page !== oldChapter.page){
                    $scope.currentChapter = $scope.chapters[i-1];
                    getSubChapterContent($scope.chapters[i-1]);
                }
                ended = true;
                break;
            }
        }
        if(!ended){
            if($scope.chapters[len-1].page !== oldChapter.page){
                $scope.currentChapter = $scope.chapters[len-1];
                getSubChapterContent($scope.chapters[len-1]);
            }
        }
    };

    // Sets $scope.currentChapter to entire book.
    $scope.displayByAll = function(){
        $scope.contentDisplay = 'all';
        $scope.currentChapter = {
            comments: [],
            external_source: [],
            relevant_book_chapter: [],
            related_video: []};
        for(var i = 0, len = $scope.chapters.length; i < len; i++){
            checkForVariousSubContent($scope.chapters[i]);
            getSubChapterContent($scope.chapters[i]);
        }
    };

    // Updates currentChapter after page in pdf viewer changes.
    var getCurrentChapter = function(display){
        if(display == 'sub'){
            $scope.displayBySub();
        }
        else if(display == 'main'){
            $scope.displayByMain();
        }
    };

    Restangular.one('book', $stateParams.bookSlug).get().then(function (book) {
        // Redirects to book detail page if book isn't checked out by current user.
        if(book.book_file == 'available' || !book.book_file){
            $state.go('bookshelf.books-read', {bookSlug: book.slug});
        }
        else{
            Restangular.all('viewing-book').getList({'book': book.id}).then(function(viewing){
                $scope.viewing = viewing[0];
                if($scope.viewing.rate_this){
                    $scope.rating.value = $scope.viewing.rate_this;
                }
                else{
                    $scope.rating.value = 0;
                }
                var trackingHistory = $scope.viewing.tracking;
                $scope.viewing.session = trackingHistory[trackingHistory.length-1];
                // Sets page to load pdf on.
                if ($stateParams.page) {
                    $scope.page = $stateParams.page;
                    updatePageNumber();
                }
                else {
                    $scope.page = $scope.viewing.session.ending_place;
                }
                book.file = 'static/vendor/pdfjs/build/generic/web/viewer.html?file=%2Fmedia%2F' + encodeURIComponent(book.book_file) + '#page=' + $scope.page;
                $scope.book = book;
                // Sets book chapters into chapters with subchapters.
                $scope.chapters = bookFactory.getMainChapters(book.book_chapters);
            });
        }
    });

    // Shows elements and starts inactivity timer when pdf loads.
    $window.document.getElementById('beholdPDF').onload = function () {
        var frm = $window.frames.beholdPDF;
        idleTime();
        frm.addEventListener('documentload', function () {
            $scope.loaded = true;
            $timeout(function tick () {
                if (frm.currentPageNumber !== $scope.page) {
                    $scope.page = frm.currentPageNumber;
                    restartIdleTime();
                    updatePageNumber();
                    getCurrentChapter($scope.contentDisplay);
                }
                $timeout(tick, 5000);
            }, 3000);
            extendCheckOut();
            getCurrentChapter($scope.contentDisplay);
        });
    };

    // Go full screen by click.
    $scope.goFullScreen = function () {
        var element = $window.document.getElementById('pdfStuff');
        $scope.showStuff = false;
        var fullScreens = ['requestFullscreen', 'webkitRequestFullscreen', 'mozRequestFullScreen', 'msRequestFullscreen'];
        for(var i in fullScreens){
            if(element[fullScreens[i]]){
                element[fullScreens[i]]();
                break;
            }
        }
        $scope.show.relatedMaterial = false;
        (function tock () {
            if ($window.outerHeight == screen.height) {
                $scope.fullscreenMode = true;
            }
            else {
                $timeout(tock, 500);
            }
        }) ();
    };

    // Exit full screen by click.
    $scope.exitFullScreen = function(){
        var fullScreens = ['exitFullscreen', 'mozCancelFullScreen', 'webkitExitFullscreen', 'msExitFullscreen'];
        for(var i in fullScreens){
            if ($window.document[fullScreens[i]]){
                $window.document[fullScreens[i]]();
                break;
            }
        }
        $scope.fullscreenMode = false;
        $scope.show.relatedMaterial = true;
    };

    // Toggle showing related material.
    $scope.toggleStuff = function () {
        $scope.showStuff = !$scope.showStuff;
    };

    // Toggle showing specific related content.
    $scope.toggleContent = function (content){
        $scope.show[content] = !$scope.show[content];
    };

    // Shows related material depending on mouse movement.
    $scope.determineBehavior = function(event){
        if($scope.fullscreenMode){
            if(!$scope.showStuff){
                //Straight toggling of event type will not work if cursor hovers
                //over element while transisioning, hence the event type check.
                if(event.type == 'mouseover'){
                    $scope.show.relatedMaterial = true;
                }
                else{
                    $scope.show.relatedMaterial = false;
                }
            }
        }
    };

    // Book rating stars.
    $scope.ratingHover = function (value) {
        $scope.rating.overStar = value;
        $scope.rating.hoverValue = value;
    };

    // Sets user's rating of book.
    $scope.setRating = function (value) {
        Restangular.one('viewing-book', $scope.viewing.id).patch({'rate_this': value}).then(function (response) {
            $scope.viewing = response;
        });
    };

    // Opens modal to recommend book.
    $scope.recommendBook = function () {
        checkFullscreenAndExit();
        restartIdleTime();
        var modalInstance = $modal.open({
            templateUrl: 'modals/recommend/recommend.tpl.html',
            controller: 'RecommendController'
        });

        modalInstance.result.then(function (value) {
            checkReturnFullscreen();
            Restangular
                    .one('viewing-book', $scope.viewing.id)
                    .patch({'recommend_this': true, 'recommend_note': value})
                    .then(function (response) {
                $scope.viewing = response;
            });
        },
        function(){
            checkReturnFullscreen();
        });
    };

   // Saves user's notes on book.
   $scope.saveNotes = function(form){
       var patchViewing = {personal_notes: $scope.viewing.personal_notes};
       Restangular.one('viewing-book', $scope.viewing.id).patch(patchViewing)
           .then(function(response){
               form.$setPristine();
           });
   };

   // If viewer in full screen mode, exit.
   var checkFullscreenAndExit = function(){
       if($scope.fullscreenMode){
           $scope.returnToFullscreen = true;
           $scope.exitFullScreen();
       }
   };

   // If exited full screen mode with intention to return, enter full screen mode.
   var checkReturnFullscreen = function(){
       if($scope.returnToFullscreen){
           $scope.goFullScreen();
           $scope.returnToFullscreen = false;
       }
   };

   // Checks gets current chapter (not currentChapter) for saving on modal or comments.
   var checkCurrentChapter = function(){
       var ended = false;
       var len = $scope.chapters.length;
       var chapter = {};
       var frm = $window.frames.beholdPDF;
       var page = frm.currentPageNumber;
       for(var i = 1; i < len; i++){
           if(page < $scope.chapters[i].page){
               chapter = $scope.chapters[i-1];
               ended = true;
               break;
           }
       }
       if(!ended){
           chapter = $scope.chapters[len-1];
       }
       return {chapter: chapter, page: page};
   };

   // Updates the chapter with the new content.
   var pushSource = function(chap, chapter, response, property1){
       var mainIndex = $scope.chapters.indexOf(chapter);
       if(!chap.section){
           $scope.chapters[mainIndex][property1].push(response);
       }
       else{
          var index = chapter.sub_chapters.indexOf(chap);
          $scope.chapters[mainIndex].sub_chapters[index][property1].push(response);
       }
       if($scope.contentDisplay =='all'){
           $scope.currentChapter[property1].push(response);
       }
   };

   // Modal for adding related video segment(s).
    $scope.addRelatedVideo = function () {
        checkFullscreenAndExit();
        restartIdleTime();
        var modalInstance;
        var place = checkCurrentChapter();
        var chapter = place.chapter;

        modalInstance = $modal.open({
            templateUrl: 'modals/related_video/related_video.tpl.html',
            controller: 'BookAddRelatedVideoController',
            resolve: {
                chapter: function () {
                    return chapter;
                },
                page: function(){
                    return place.page;
                }
            }
        });

        modalInstance.result.then(function (relatedVideos) {
            var post;
            var chap = relatedVideos.chapter;
            for (var i = 0, len = relatedVideos.segments.length; i < len; i++) {
                post = {
                    'video_segment': relatedVideos.segments[i].id,
                    'book_chapter': chap.id,
                    'note': relatedVideos.note
                };
                Restangular.all('related-book-video').post(post).then(function (response) {
                    pushSource(chap, chapter, response, 'related_video');
                });
            }
            checkReturnFullscreen();
        },
        function(){
            checkReturnFullscreen();
        });
    };

    // Modal for adding a related book chapter.
    $scope.addRelatedChapter = function () {
        checkFullscreenAndExit();
        restartIdleTime();
        var modalInstance;
        var place = checkCurrentChapter();
        var chapter = place.chapter;

        modalInstance = $modal.open({
            templateUrl: 'modals/related_chapter/related_chapter.tpl.html',
            controller: 'BookAddRelatedChapterController',
            resolve: {
                chapter: function () {
                    return chapter;
                },
                page: function () {
                    return place.page;
                }
            }
        });

        modalInstance.result.then(function (relatedChapter) {
            var chap = relatedChapter.chapter;
            var post = {book_chapter: chap.id, note: relatedChapter.related.note};
            if(relatedChapter.related.book_sub_chapter){
                post.relevant_book_chapter = relatedChapter.related.book_sub_chapter.id;
            }
            else{
                post.relevant_book_chapter = relatedChapter.related.book_chapter.id;
            }
            checkReturnFullscreen();
            Restangular.all('related-book').post(post).then(function(response){
                pushSource(chap, chapter, response, 'relevant_book_chapter');
            });
        },
        function(){
            checkReturnFullscreen();
        });
    };

    $scope.addExternalResource = function () {
        checkFullscreenAndExit();
        restartIdleTime();
        var modalInstance;
        var place = checkCurrentChapter();
        var chapter = place.chapter;

        modalInstance = $modal.open({
            templateUrl: 'modals/external_resource/external_resource.tpl.html',
            controller: 'BookAddExternalResourceController',
            resolve: {
                chapter: function(){
                    return chapter;
                },
                page: function(){
                    return place.page;
                }
            }
        });

        modalInstance.result.then(function (externalResource) {
            var chap = externalResource.chapter;
            var post = {'book_chapter': chap.id};
            checkReturnFullscreen();
            if(externalResource.resource.existing){
                post.external_source = externalResource.resource.existing.id;
                Restangular.all('supplemental-source-book').post(post).then(function(response){
                    pushSource(chap, chapter, response, 'external_source');
                });
            }
            else if (externalResource.resource.create) {
                post = externalResource.resource.create;
                Restangular.all('supplemental-source').post(post).then(function (source) {
                    var postRelation = {
                        'book_chapter': chap.id,
                        'external_source': source.id
                    };
                    Restangular.all('supplemental-source-book').post(postRelation).then(function(response){
                        pushSource(chap, chapter, response, 'external_source');
                    });
                });
            }
        },
        function(){
            checkReturnFullscreen();
        });
    };

    // Add or update comment form toggles.
    $scope.addComment = function(){
        $scope.show.addComment = !$scope.show.addComment;
        if(!$scope.show.addComment){
            $scope.show.editComment = false;
            $scope.comment = {};
        }
        $scope.show.comments = true;
    };

    // Save comment depending on whether sub is selected for contentDisplay.
    $scope.saveComment = function(form){
        var chapter;
        var place = checkCurrentChapter();
        if($scope.contentDisplay == 'sub'){
            chapter = $scope.currentChapter;
        }
        else{
            chapter = bookFactory.switchChapters(place.chapter, place.page);
        }
        var post = {
            subject: $scope.comment.subject,
            body: $scope.comment.body,
            book_chapter: chapter.id
        };
        restartIdleTime();
        Restangular.all('book-comment').post(post).then(function(response){
            pushSource(chapter, place.chapter, response, 'comments');
            form.$setPristine();
            $scope.comment = {};
            $scope.show.addComment = false;
        });
    };

    // Edit comment without changing comment that is displayed.
    $scope.editComment = function(comment){
        $scope.show.addComment = true;
        $scope.comment = angular.copy(comment);
        $scope.show.editComment = true;
    };

    // Update comment, as well as currentChapter comments, $scope.chapter comments.
    $scope.updateComment = function(form){
        var comment = {
            subject: $scope.comment.subject,
            body: $scope.comment.body
        };
        Restangular.one('book-comment', $scope.comment.id).patch(comment).then(function(response){
            var index;
            for(var i = 0, len = $scope.chapters.length; i < len; i++){
                index = _.findIndex($scope.chapters[i].comments, {'id': response.id});
                 if(index != -1){
                     $scope.chapters[i].comments[index] = response;
                     break;
                 }
            }
            if(!_.contains($scope.currentChapter.comments, response)){
                index = _.findIndex($scope.currentChapter.comments, {'id': response.id});
                if(index != -1){
                    $scope.currentChapter.comments[index] = response;
                }
            }
            form.$setPristine();
        });
    };

    // Delete comment and remove from comment lists.
    $scope.deleteComment = function(comment){
        Restangular.one('book-comment', comment.id).remove().then(function(){
            $scope.currentChapter.comments = _.without($scope.currentChapter.comments, comment);
            for(var i = 0, len = $scope.chapters.length; i < len; i++){
                 if(_.contains($scope.chapters[i].comments, comment)){
                     $scope.chapters[i].comments = _.without($scope.chapters[i].comments, comment);
                     break;
                 }
            }
        });
    };
}]);