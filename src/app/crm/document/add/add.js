angular.module('crm.document.add', [
    'ui.router',
    'restangular',
    'directives.fileUpload',
    'services.shortcuts'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('crm.document-add', {
        url: '/crm/document/add',
        views: {
            'main': {
                controller: 'AddDocumentController',
                templateUrl: 'crm/document/add/add.tpl.html'
            },
            'sidebar': {
                templateUrl: 'crm/main/main-nav.tpl.html'
            }
        },
        data: {
            pageTitle: 'Add Document'
        }
    });
}])

.controller('AddDocumentController',
        ['$scope', 'Restangular', '$state', 'shortcuts',
        function ($scope, Restangular, $state, shortcuts) {
    $scope.document = {
        name: '',
        description: '',
        doc_type: '',
        document: ''
    };

    function getFileType(file) {
        /**
         * Get the file type for the passed in file.
         *
         * Files types are grabbed from the server.
         */
        var i,
            fileType;

        fileType = file.type.split('/')[1];

        Restangular
                .all('document-type')
                .getList()
                .then(function (docTypes) {
            var ext;

            docTypes = docTypes.originalElement;

            for (ext in docTypes) {
                if (docTypes[ext].extension == fileType) {
                    $scope.document.doc_type = docTypes[ext].id;
                }
            }
        });
    }

    // Listen for the file selected event.
    $scope.$on('fileSelected', function (event, args) {
        $scope.document.document = args.file;
        
        getFileType(args.file);
    });

    $scope.addDocument = function () {
        var formData = shortcuts.buildFormData({
            name: $scope.document.name,
            description: $scope.document.description,
            doc_type: $scope.document.doc_type,
            document: $scope.document.document
        });

        Restangular
                .all('share-document')
                .withHttpConfig({transformRequest: angular.identity})
                .customPOST(formData, '', {}, {'Content-Type': undefined})
                .then(function () {
            $state.go('crm.document');
        });
    };
}]);