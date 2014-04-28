/* jshint loopfunc: true */

angular.module('user-application', [
    'ui.router',
    'restangular',
//    'user-application.sections',
    'directives.fileUpload'
])

.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider) {
    $stateProvider.state('user-application', {
        url: '/job-application/{uuid:[a-z0-9]{32}}',
        templateUrl: 'applications/user-application/user-application-nav.tpl.html',
        controller: 'UserApplicationController',
        data: {
            pageTitle: 'Job Application'
        }
    });
}])

.controller('UserApplicationController',
        ['$scope', '$stateParams', 'Restangular', '$state', '$http',
        function ($scope, $stateParams, Restangular, $state, $http) {

    var application = Restangular.one('application', $stateParams.uuid);
    $scope.errorSaving = {};
    $scope.documentUpload = [];
    // These are used to change the route.
    $scope.sections = ['general', 'contact', 'position', 'documents', 'skills', 'extra'];

    var currentIndex = 0;
    $scope.currentSection = $scope.sections[currentIndex];
    // Gets list of objects from view.
    var genericGetList = function(view, attribute){
        Restangular.all(view).getList().then(function(response){
            $scope[attribute] = response;
        });
    };

    // Patch data to application view.
    $scope.genericApplicationPatch = function(data){
        application.patch(data).then(function(){
        },
        function(response){
            console.log('Fiddlesticks', response.status);
        });
    };

    // Get the application.
    application.get().then(function (response) {
        for(var i = 0, len = response.skills.length; i < len; i++){
            response.skills[i].years_of_experience = parseFloat(response.skills[i].years_of_experience);
        }
        $scope.application = response;
        $scope.application.hourly_rate = parseFloat(response.hourly_rate);
        // Get available jobs, technologies, and categories for technologies.
        genericGetList('jobs', 'jobs');
        genericGetList('technology', 'technologies');
        genericGetList('category', 'categories');
    },
    function (response) {
        if (response.status === 404) {
            $scope.notFound = true;
        }
        else {
            alert("Something went wrong.");
        }
    });

    // Get the choices for various select boxes.
    application.options().then(function (response) {
        $scope.degreeChoices = response['degree_choices'];
        $scope.positionTypeChoices = response['position_type_choices'];
        $scope.phoneTypes = response['phone_types'];
    });

    // Patches complete status to application view.
    $scope.complete = function () {
        var patch_application = {
            complete: $scope.application.complete
        };
        $scope.genericApplicationPatch(patch_application);
    };

    // Add another skill, document, or phone number.
    $scope.addInfo = function(infoType){
        $scope.application[infoType].push({
            create: true
        });
    };

    // Remove an unsaved skill, document, or phone number.
    $scope.removeInfo = function(infoType, item){
        $scope.application[infoType] = _.without($scope.application[infoType], item);
    };

    // Deletes phone number, skill, document.
    $scope.deleteInfo = function(infoType, view, item){
        Restangular.one(view, item.id).remove().then(function(){
            $scope.application[infoType] = _.without($scope.application[infoType], item);
        },
        function(response){
            console.log("'Twas a most unfortunate failure", response.status);
        });
    };

    // Post data to view.
    var genericPost = function(data, view, item){
        Restangular.all(view).post(data).then(function(response){
            item.create = false;
            item.id = response.id;
        },
        function(response){
            console.log('Houston, we have a problem', response.status);
        });
    };

    // Patch data to view.
    var genericPatch = function(data, view, item){
        Restangular.one(view, item.id).patch(data).then(function(){
        },
        function(response){
            console.log("Don't sell the bike shop", response.status);
        });
    };

    // Saves contact information, including unposted phone numbers.
    $scope.saveContactInformation = function (form) {
        var patch = {
            first_name: $scope.application.first_name,
            last_name: $scope.application.last_name,
            email: $scope.application.email,
            newsletter: $scope.application.newsletter,
            email_related_jobs: $scope.application.email_related_jobs
        };

        for (var i = 0, len = $scope.application.applicant_phones.length; i < len; i++) {
            var phone = $scope.application.applicant_phones[i];
            var p = {
                number: phone.number,
                extension: phone.extension,
                phone_type: phone.phone_type
            };
            if (phone.create) {
                p.contact = $scope.application.id;
                genericPost(p, 'other-contact-phone', phone);
            }
            else {
                genericPatch(p, 'other-contact-phone', phone);
            }
        }
        $scope.genericApplicationPatch(patch, form);
    };

    $scope.saveSocialMedia = function (form) {
        var patch = {
            git_hub_account: $scope.application.git_hub_account,
            twitter_account: $scope.application.twitter_account,
            facebook_account: $scope.application.facebook_account,
            linkedin_account: $scope.application.linkedin_account
        };
        $scope.genericApplicationPatch(patch, form);
    };

    $scope.saveEducation = function (form) {
        var patch = {
            degree: $scope.application.degree,
            completed_credits: $scope.application.completed_credits
        };
        $scope.genericApplicationPatch(patch, form);
    };

    $scope.savePositionDetails = function (form) {
        var patch = {
            job: $scope.application.job,
            position_type: $scope.application.position_type,
            weekly_hours: $scope.application.weekly_hours,
            hourly_rate: $scope.application.hourly_rate,
            available_on: $scope.application.available_on,
            currently_employed: $scope.application.currently_employed
        };
        $scope.genericApplicationPatch(patch, form);
    };

    $scope.saveExtraInformation = function (form) {
        var patch = {
            other_related_tech: $scope.application.other_related_tech,
            goals: $scope.application.goals,
            comments: $scope.application.comments
        };
        $scope.genericApplicationPatch(patch, form);
    };

    // Patches skill, unless a skill for the same technology has already exists
    // for that applicant.
    $scope.saveSkill = function (skill) {
        var years_experience = Math.round(skill.years_of_experience*10)/10;
        var p = {
            tech: skill.tech.id,
            skill_level_claim: skill.skill_level_claim,
            years_of_experience: years_experience,
            described_experience: skill.described_experience
        };
        if(skill.create){
            p.application = $scope.application.uuid;
            genericPost(p, 'application-skill', skill);
        }
        else{
            Restangular.one('application-skill', skill.id)
                    .patch(p)
                    .then(function () {
            },
            function (response) {
                if (response.status === 400) {
                    delete skill.warnings;
                    skill.errors = 'You can\'t have the same technology twice.';
                }
                else {
                    alert('Something went wrong.');
                }
            });
        }
    };

    $scope.saveSkills = function(){
        for(var i in $scope.application.skills){
            $scope.saveSkill($scope.application.skills[i]);
        }
    };

    $scope.deletePhoneNumber = function(phone){
        $scope.deleteInfo('applicant_phones', 'other-contact-phone', phone);
    };

    $scope.deleteSkill = function (skill) {
        $scope.deleteInfo('skills', 'application-skill', skill);
    };

    // Checks if tech has already been used in skill by applicant.
    $scope.usedTech = function (skill) {
        delete skill.errors;

        var usedSkillIds = _.pluck($scope.application.skills.filter(function (s) {
            return s !== skill;
        }), 'tech');
        for (var i = 0, len = usedSkillIds.length; i < len; i++) {
            var id = usedSkillIds[i].id;
            if (skill.tech.id === id) {
                skill.warnings = 'That technology is already in use.';
                return;
            }
        }
        delete skill.warnings;
    };

    // Uploads applicant document.
    $scope.saveDocument = function (document, uploadFile) {
        // AJAX file upload.
        $http({
            method: 'POST',
            url: '/ops/application-document/',
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            // The data that will be transformed.
            data: {
                document: uploadFile,
                application: $scope.application.id,
                title: document.title || "Untitled"
            },
            transformRequest: function (data) {
                // Transform the data with FormData().
                var formData = new FormData();
                formData.append('document', data.document);
                formData.append('application', data.application);
                formData.append('title', data.title);

                return formData;
            }
        })
        .success(function (data, status, headers, config) {
            // Bind the document with the newly created data, for some reason
            // just assigning document = data does not work.
            document.document = data.document;
            document.id = data.id;
            delete document.create;
        })
        .error(function (data, status, headers, config) {
            alert('FAIL ' + status);
        });
    };

    $scope.saveDocuments = function(){
        for(var i in $scope.application.documents){
            if($scope.application.documents[i].create){
                $scope.saveDocument($scope.application.documents[i], $scope.documentUpload[i]);
            }
        }
        $scope.documentUpload = [];
    };

    // Listen for the file selected event.
    $scope.$on('fileSelected', function (event, args) {
        $scope.$apply(function () {
            // Add the file object to the scope's file collection.
            $scope.documentUpload.push(args.file);
        });
    });

    $scope.deleteDocument = function (document) {
        $scope.deleteInfo('documents', 'application-document', document);
    };

    var saveFunctions = {
        general: $scope.saveEducation,
        contact: $scope.saveContactInformation,
        position: $scope.savePositionDetails,
        documents: $scope.saveDocuments,
        skills: $scope.saveSkills,
        extra: $scope.saveExtraInformation
    };

    var savePortion = function(form, saveFunction){
        if(form.$dirty && form.$valid){
            delete $scope.errorSaving[currentIndex];
            saveFunction(form);
        }
        else if(form.$dirty && form.$invalid){
            $scope.errorSaving[currentIndex] = "Part of the form is invalid for the " + $scope.currentSection + " section.";
        }
        $scope.showErrors = Object.keys($scope.errorSaving).length > 0;
        form.$setPristine();
    };

    var doOnSwitch = function(){
        var saveStuff = saveFunctions[$scope.currentSection];
        savePortion($scope.giantForm, saveStuff);
        $scope.currentSection = $scope.sections[currentIndex];
    };

    $scope.previousSection = function(){
        if(0 < currentIndex && currentIndex <= $scope.sections.length - 1){
            currentIndex--;
            doOnSwitch();
        }
    };

    $scope.nextSection = function(){
        if(0 <= currentIndex && currentIndex < $scope.sections.length - 1){
            currentIndex++;
            doOnSwitch();
        }
    };
}]);