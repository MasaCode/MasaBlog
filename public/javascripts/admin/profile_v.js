(function ($) {
    'use strict';

    let Profile = {

        initialize () {
            let _self = this;
            this.$form = $('form#profile-form');
            this._CREDENTIALS = $('#profile-gmail-credentials').val();

            this.$form.on('submit', function (event) {
                event.preventDefault();
            });

            $('#submit').on('click', function (event) {
                let updatedData = {};
                let credentials = $('#profile-gmail-credentials').val();
                updatedData.username = $('#profile-username').val().trim();
                updatedData.location = $('#profile-location').val().trim();
                updatedData.weather_api = $('#profile-api').val().trim();
                updatedData.credentials = (credentials !== '' ? credentials : null);
                updatedData.isCredentialsUpdated = (_self._CREDENTIALS !== credentials);
                if (updatedData.username === '') return _self.showError('Username is required...');
                if (updatedData.location === '') return _self.showError('Location is required...');
                if (updatedData.weather_api === '') return _self.showError('Weather API Key is required...');
                $('span.error-text').text('');

                $.ajax({
                    url: '/api/v1/users',
                    type: 'PUT',
                    dataType: 'json',
                    data: updatedData,
                    timeout: 10000,

                    success (data, status, errorThrown) {
                        _self.changeMode(false);
                        $('div.admin-user h3').text(updatedData.username);
                        let success = $('#success-dialog');
                        success.text('The profile successfully has been updated');
                        success.fadeIn(1000).delay(3000).fadeOut(1000);
                        setTimeout(function () {
                            window.location.reload();
                        }, 5000);
                    },
                    error (data, status, errorThrown) {
                        _self.changeMode(false);
                        let error = $('#error-dialog');
                        error.text('Error occurred : ' + errorThrown);
                        error.fadeIn(1000).delay(3000).fadeOut(1000);
                    }
                });
            });

            $('#cancel').on('click', function (event) {
                _self.changeMode(false);
                $.ajax({
                    url: '/api/v1/users/' + ID,
                    type: 'GET',
                    dataType: 'json',
                    timeout: 10000,

                    success (data, status, errorThrown) {
                        let user = data.user;
                        let credentials = data.credentials;
                        $('#profile-username').val(user.username);
                        $('#profile-location').val(user.location);
                        $('#profile-api').val(user.weather_api);
                        let credentialInput = $('#profile-gmail-credentials');
                        if (credentials !== null) {
                            credentialInput.val(JSON.stringify(credentials));
                            _self._CREDENTIALS = credentialInput.val();
                        } else {
                            credentialInput.val('');
                        }
                    },
                    error (data, status, errorThrown) {
                        let error = $('#error-dialog');
                        error.text('Error occurred... Please reload page or conteact administrator');
                        error.fadeIn(1000).delay(3000).fadeOut(1000);
                    }
                });
            });

            $('#edit').on('click', function (event) {
                _self.changeMode(true);
            });

            $('#profile-photo').on('change', function (event) {
                let data = new FormData();
                let file = $(this).get(0).files[0];
                data.append('photo', file);
                $.ajax({
                    url: '/api/v1/users/profile',
                    type: 'PUT',
                    dataType: 'json',
                    data: data,
                    contentType: false,
                    processData:false,
                    timeout: 10000,

                    success (data, status, errorThrown) {
                        let reader = new FileReader();
                        reader.onload = function (e) {
                            let image = e.target.result;
                            $('img.img-profile').attr('src', image);
                            $('img.img-me').attr('src', image);
                        };
                        reader.readAsDataURL(file);

                        let success = $('#success-dialog');
                        success.text('The profile photo successfully has been updated');
                        success.fadeIn(1000).delay(3000).fadeOut(1000);

                    },
                    error (data, status, errorThrown) {
                        let error = $('#error-dialog');
                        error.text('Error occurred : ' + errorThrown);
                        error.fadeIn(1000).delay(3000).fadeOut(1000);
                    }
                });
            });
        },

        changeMode (isEditing) {
            let submit = $('#submit');
            let cancel = $('#cancel');
            let edit = $('#edit');

            if (isEditing) {
                submit.css('display', 'inline-block');
                cancel.css('display', 'inline-block');
                edit.css('display', 'none');
            } else {
                submit.css('display', 'none');
                cancel.css('display', 'none');
                edit.css('display', 'inline-block');
            }
            this.$form.find('input, textarea').prop('readonly', !isEditing);
        },

        showError (error) {
            $('span.error-text').text(error);
            return false;
        }
    };

    $(function () {
        Profile.initialize();
    });
}).apply(this, [jQuery]);