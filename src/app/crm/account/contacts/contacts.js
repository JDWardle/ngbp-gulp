/* jshint loopfunc: true */

angular.module('crm.account.contact', [
    'ui.router',
    'restangular',
    'modals.contact',
    'modals.removeContact'
])

.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state('crm.account-contact', {
        url: '/crm/account/{accountId:[0-9]+}/contacts',
        views: {
            'main': {
                controller: 'ContactController',
                templateUrl: 'crm/account/contacts/contacts.tpl.html'
            },
            'sidebar': {
                templateUrl: 'crm/account/account-nav.tpl.html',
                controller: ['$scope', '$stateParams', function ($scope, $stateParams) {
                    $scope.stateParams = $stateParams;
                }]
            }
        },
        data: {
            pageTitle: 'Contacts'
        }
    });
}])

.controller('ContactController',
        ['$scope', '$modal', '$stateParams', 'Restangular', 'urls',
        function ($scope, $modal, $stateParams, Restangular, urls) {
    Restangular
            .one('account', $stateParams.accountId)
            .get()
            .then(function (account) {
        var i;

        $scope.account = account;
        for (i = 0, len = account.contact.length; i < len; i++) {
            (function (i) {
                Restangular
                        .one('account-contact', account.contact[i])
                        .get()
                        .then(function (contact) {
                    $scope.account.contact[i] = contact;
                });
            }) (i);
        }
    });

    // Modal for adding a contact.
    $scope.addContact = function () {
        // Open a modal for adding a new contact.
        var modalInstance = $modal.open({
            templateUrl: 'modals/contact/contact.tpl.html',
            controller: 'AddOrUpdateContactController',
            resolve: {
                contact: function () {
                    return undefined;
                }
            }
        });

        // Modal was closed/dismissed.
        modalInstance.result.then(function (contact) {
            var newContact,
                postContact = {
                    title: contact.title,
                    first_name: contact.first_name,
                    last_name: contact.last_name,
                    position: contact.position,
                    decision_maker: contact.decision_maker
                };

            Restangular
                .all('account-contact')
                .post(postContact)
                .then(function (response) {
                    // Grab all the current account contact ID's and add the newly created contact ID.
                    var contactsId = [];

                    newContact = response;

                    contactsId.push(response.id);

                    for (var i = 0, len = $scope.account.contact.length; i < len; i++) {
                        contactsId.push($scope.account.contact[i].id);
                    }

                    // Post the new contact id list to the database.
                    return Restangular.one('account', $stateParams.accountId).patch({contact: contactsId});
                })
                .then(function (response) {
                    var i,
                        postPhone,
                        postEmail,
                        postSocialMedia;

                    // Check to see if a phone number was added to this contact.
                    if (contact.phone) {
                        for (i = 0, len = contact.phone.length; i < len; i++) {
                            postPhone = {
                                contact: newContact.id,
                                number: contact.phone[i].number,
                                extension: contact.phone[i].extension,
                                phone_type: contact.phone[i].phone_type
                            };

                            Restangular
                                .all('contact-phone')
                                .post(postPhone)
                                .then(function (response) {
                                    // Add the phone number to the view.
                                    newContact.phone.push(response);
                                },
                                function (response) {
                                    alert('FAIL ' + response.status);
                                });
                        }
                    }

                    // Check if an email was added to this contact.
                    if (contact.email) {
                        for (i = 0, len = contact.email.length; i < len; i++) {
                            postEmail = {
                                contact: newContact.id,
                                email_address: contact.email[i].email_address
                            };

                            Restangular
                                .all('contact-email')
                                .post(postEmail)
                                .then(function (response) {
                                    // Add the email to the view.
                                    newContact.email.push(response);
                                },
                                function (response) {
                                    alert('FAIL ' + response.status);
                                });
                        }
                    }

                    // Check if any social media links were added to this contact.
                    if (contact.social_media) {
                        for (i = 0, len = contact.social_media.length; i < len; i++) {
                            postSocialMedia = {
                                contact: newContact.id,
                                media_name: contact.social_media[i].media_name,
                                media_link: contact.social_media[i].media_link
                            };

                            Restangular
                                .all('contact-socialmedia')
                                .post(postSocialMedia)
                                .then(function (response) {
                                    // Add the social media to the view.
                                    newContact.social_media.push(response);
                                },
                                function (response) {
                                    alert('FAIL ' + response.status);
                                });
                        }
                    }

                    // Add the new contact to the scope.
                    $scope.account.contact.push(newContact);
                },
                function (response) {
                    alert('FAIL ' + response.status);
                });
        });
    };

    // Modal for updating a contact.
    $scope.updateContact = function (contact) {
        // Open a modal for updating a contact.
        var modalInstance = $modal.open({
            templateUrl: 'modals/contact/contact.tpl.html',
            controller: 'AddOrUpdateContactController',
            resolve: {
                contact: function () {
                    return contact;
                }
            }
        });

        // Modal was closed/dismissed.
        modalInstance.result.then(function (contact) {
            var updateContact,
                patchContact = {
                    title: contact.title,
                    first_name: contact.first_name,
                    last_name: contact.last_name,
                    position: contact.position,
                    decision_maker: contact.decision_maker
                };

            Restangular.one('account-contact', contact.id).patch(patchContact).then(function (response) {
                var i,
                    createPhone,
                    updatePhone,
                    createEmail,
                    updateEmail,
                    createSocialMedia,
                    updateSocialMedia;

                updateContact = response;

                // Remove any phone numbers in the contact.remove.phone object.
                if (contact.remove.phone) {
                    for (i = 0, len = contact.remove.phone.length; i < len; i++) {
                        Restangular.one('contact-phone', contact.remove.phone[i].id).remove().then(function () {

                        },
                        function (response) {
                            alert('FAIL ' + response.status);
                        });
                    }
                }

                // Remove any emails in the contact.remove.email object.
                if (contact.remove.email) {
                    for (i = 0, len = contact.remove.email.length; i < len; i++) {
                        Restangular.one('contact-email', contact.remove.email[i].id).remove().then(function () {

                        },
                        function (response) {
                            alert('FAIL ' + response.status);
                        });
                    }
                }

                // Remove any social medias in the contact.remove.social_media
                // object.
                if (contact.remove.social_media) {
                    for (i = 0, len = contact.remove.social_media.length; i < len; i++) {
                        Restangular.one('contact-socialmedia', contact.remove.social_media[i].id).remove().then(function () {

                        },
                        function (response) {
                            alert('FAIL ' + response.status);
                        });
                    }
                }

                // Update or create any phone numbers.
                if (contact.phone) {
                    for (i = 0, len = contact.phone.length; i < len; i++) {
                        if (contact.phone[i].create) {
                            // Create a new phone number for the contact.
                            createPhone = {
                                contact: contact.id,
                                number: contact.phone[i].number,
                                extension: contact.phone[i].extension,
                                cell: contact.phone[i].cell
                            };

                            Restangular
                                .all('contact-phone')
                                .post(createPhone)
                                .then(function (response) {
                                    // Add the phone number to the view.
                                    updateContact.phone.push(response);
                                },
                                function (response) {
                                    alert('FAIL ' + response.status);
                                });
                        }
                        else {
                            // Update a phone number for the contact.
                            updatePhone = {
                                number: contact.phone[i].number,
                                extension: contact.phone[i].extension,
                                cell: contact.phone[i].cell
                            };

                            Restangular
                                .one('contact-phone', contact.phone[i].id)
                                .patch(updatePhone)
                                .then(function (response) {
                                    var update = _.find(updateContact.phone, {'id': response.id});

                                    // Update the phone number on the view.
                                    update = response;
                                },
                                function (response) {
                                    alert('FAIL ' + response.status);
                                });
                        }
                    }
                }

                // Update or create any email addresses.
                if (contact.email) {
                    for (i = 0, len = contact.email.length; i < len; i++) {
                        if (contact.email[i].create) {
                            // Create a new email for the contact.
                            createEmail = {
                                contact: contact.id,
                                email_address: contact.email[i].email_address
                            };

                            Restangular
                                .all('contact-email')
                                .post(createEmail)
                                .then(function (response) {
                                    // Add the email to the view.
                                    updateContact.email.push(response);
                                },
                                function (response) {
                                    alert('FAIL ' + response.status);
                                });
                        }
                        else {
                            // Update an email for the contact.
                            updateEmail = {
                                email_address: contact.email[i].email_address
                            };

                            Restangular
                                    .one('contact-email', contact.email[i].id)
                                    .patch(updateEmail)
                                    .then(function (response) {
                                var update = _.find(updateContact.email, {'id': response.id});

                                // Update the phone number on the view.
                                update = response;
                            },
                            function (response) {
                                alert('FAIL ' + response.status);
                            });
                        }
                    }
                }

                // Update or create any social media entries.
                if (contact.social_media) {
                    for (i = 0, len = contact.social_media.length; i < len; i++) {
                        if (contact.social_media[i].create) {
                            createSocialMedia = {
                                contact: contact.id,
                                media_name: contact.social_media[i].media_name,
                                media_link: contact.social_media[i].media_link
                            };

                            // Create the social media information.
                            Restangular
                                    .all('contact-socialmedia')
                                    .post(createSocialMedia)
                                    .then(function (response) {
                                // Add the social media information to the view.
                                updateContact.social_media.push(response);
                            });
                        }
                        else {
                            updateSocialMedia = {
                                media_name: contact.social_media[i].media_name,
                                media_link: contact.social_media[i].media_link
                            };

                            Restangular
                                    .one('contact-socialmedia', contact.social_media[i].id)
                                    .patch(updateSocialMedia)
                                    .then(function (response) {
                                var update = _.find(updateContact.social_media, {'id': response.id});

                                // Update social media information on the view.
                                update = response;
                            },
                            function (response) {
                                alert('FAIL ' + response.status);
                            });
                        }
                    }
                }
                
                // Update the contact on the view.
                for (i = 0, len = $scope.account.contact.length; i < len; i++) {
                    if ($scope.account.contact[i].id == contact.id) {
                        $scope.account.contact[i] = contact;
                    }
                }
            },
            function (response) {
                alert('FAIL ' + response.status);
            });
        });
    };

    // Modal for removing a contact.
    $scope.removeContact = function (contact) {
        // Open a modal for removing a contact.
        var modalInstance = $modal.open({
            templateUrl: 'modals/remove_contact/remove_contact.tpl.html',
            controller: 'RemoveContactController',
            resolve: {
                contact: function () {
                    return contact;
                }
            }
        });

        // Modal was closed/dismissed.
        modalInstance.result.then(function (contact) {
            // Remove the contact.
            Restangular.one('account-contact', contact.id).remove().then(function (response) {
                for (var i = 0, len = $scope.account.contact.length; i < len; i++) {
                    if ($scope.account.contact[i].id == contact.id) {
                        $scope.account.contact = _.without($scope.account.contact, $scope.account.contact[i]);
                    }
                }
            });
        });
    };
}]);