(function ($) {
    'use strict';

    let Contact = {
        options: {
            form: '#contact-form'
        },

        initialize () {
            let _self = this;
            this.$form = $(this.options.form);

            this.$form.on('submit', function (event) {
                event.preventDefault();
                let nameInput = $('#input-name');
                let emailInput = $('#input-email');
                let bodyInput = $('#input-body');
                let subjectInput = $('#input-subject');
                let name = nameInput.val().trim();
                let email = emailInput.val().trim();
                let body = bodyInput.val().trim();
                let subject = subjectInput.val().trim();
                let submit = _self.$form.find('button');

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

                    beforeSend (jqXHR, status) {
                        submit.prop('disabled', true);
                        _self.$form.get(0).reset();
                    },
                    complete (jqXHR, status) {
                        submit.prop('disabled', false);
                    },
                    success (data, status, jqXHR) {
                        let dialog = $('#success-dialog');
                        console.log(dialog);
                        dialog.text('Email has been successfully sent');
                        dialog.fadeIn(1000).delay(3000).fadeOut(500);
                    },
                    error (data, status, jqXHR) {
                        let dialog = $('#error-dialog');
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