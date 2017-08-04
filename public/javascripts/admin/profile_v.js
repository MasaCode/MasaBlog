(function ($) {
    'use strict';

    let Profile = {

        initialize () {
            let _self = this;
            this.$form = $('form#profile-form');

            this.$form.on('submit', function (event) {
                event.preventDefault();
                let updatedData = {};
                let credentials = $('#profile-gmail-credentials').val();
                updatedData.username = $('#profile-username').val().trim();
                updatedData.location = $('#profile-location').val().trim();
                updatedData.weather_api = $('#profile-api').val().trim();
                updatedData.credentials = (credentials !== '' ? credentials : null);
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
                        $('div.admin-user h3').text(updatedData.username);
                        let success = $('#success-dialog');
                        success.text('The profile successfully has been updated');
                        success.fadeIn(1000).delay(3000).fadeOut(1000);
                        setTimeout(function () {
                            window.location.reload();
                        }, 5000);
                    },
                    error (data, status, errorThrown) {
                        let error = $('#error-dialog');
                        error.text('Error occurred : ' + errorThrown);
                        error.fadeIn(1000).delay(3000).fadeOut(1000);
                    }
                });
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

        showError (error) {
            $('span.error-text').text(error);
            return false;
        }
    };

    $(function () {
        Profile.initialize();
    });
}).apply(this, [jQuery]);