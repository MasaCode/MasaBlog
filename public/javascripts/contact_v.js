(function ($) {
    'use strict';

    var Contact = {
        options: {
            form: '#contact-form'
        },

        initialize: function () {
            var _self = this;
            this.$form = $(this.options.form);

            this.$form.on('submit', function (event) {
                event.preventDefault();
                var nameInput = $('#input-name');
                var emailInput = $('#input-email');
                var bodyInput = $('#input-body');
                var subjectInput = $('#input-subject');
                var name = nameInput.val().trim();
                var email = emailInput.val().trim();
                var body = bodyInput.val().trim();
                var subject = subjectInput.val().trim();
                var submit = _self.$form.find('button');

                nameInput.css('border-color', '#ccc');
                emailInput.css('border-color', '#ccc');
                bodyInput.css('border-color', '#ccc');
                subjectInput.css('border-color', '#ccc');

                if (name === '' || email === '' || body === '' || subject === '') {
                    if (name === '') nameInput.css('border-color', 'red');
                    if (email === '') emailInput.css('border-color', 'red');
                    if (body === '') bodyInput.css('border-color', 'red');
                    if (subject === '') subjectInput.css('border-color', 'red');
                    return false;
                }

                $.ajax({
                    url: '/contact',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        name: name,
                        email: email,
                        body: body,
                        subject: subject,
                    },
                    timeout: 10000,

                    beforeSend: function (jqXHR, status) {
                        submit.prop('disabled', true);
                        _self.$form.get(0).reset();
                    },
                    complete: function (jqXHR, status) {
                        submit.prop('disabled', false);
                    },
                    success: function (data, status, jqXHR) {
                        var dialog = $('#success-dialog');
                        console.log(dialog);
                        dialog.text('Email has been successfully sent');
                        dialog.fadeIn(1000).delay(3000).fadeOut(500);
                    },
                    error: function (data, status, jqXHR) {
                        var dialog = $('#error-dialog');
                        dialog.text('Error occurred : ' + jqXHR);
                        dialog.fadeIn(1000).delay(3000).fadeOut(500);
                    }
                });
            });
        },
    };

    $(function () {
        Contact.initialize();
    });
}).apply(this, [jQuery]);