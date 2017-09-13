(function ($) {
    'use strict';

    let ForgotPassword = {
        initialize () {
            this.$form = $('#forgot-password-form');

            this.$form.on('submit', function (e) {
                let username = $('input#username').val();
                let email = $('input#email').val();
                let error = $('span.forgot-password-error');

                if (username === '' || email === '') {
                    error.text('Please fill out all the input');
                    e.preventDefault();
                    return;
                }
                error.text('');
            });
        },
    };

    $(function () {
        ForgotPassword.initialize();
    });
}).apply(this, [jQuery]);