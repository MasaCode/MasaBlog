(function ($) {

    let PasswordReset = {
        initialize () {
            let _self = this;
            this.$form = $('form');

            this.$form.on('submit', function (event) {
                event.preventDefault();

                let currentPassword = $('input#current-pass').val().trim();
                let newPassword = $('input#new-pass').val().trim();
                let rePassword = $('input#re-pass').val().trim();

                let error = _self.validateParams(currentPassword, newPassword, rePassword);
                let errorWrapper = $('span.error-text');
                if (error) {
                    errorWrapper.text(error);
                    return false;
                } else {
                    errorWrapper.text('');
                }

                $.ajax({
                    url: '/api/v1/users/resetPassword',
                    type: 'PUT',
                    dataType: 'json',
                    data: {
                        currentPassword: currentPassword,
                        newPassword: newPassword
                    },
                    timeout: 10000,

                    success (data, status, errorThrown) {
                        $('input#current-pass').val('');
                        $('input#new-pass').val('');
                        $('input#re-pass').val('');
                        if (data.error) {
                            errorWrapper.text(data.error);
                            return false;
                        }
                        let success = $('#success-dialog');
                        success.text('The password successfully has been reset');
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

        validateParams (currentPassword, newPassword, rePassword) {
            let error = null;
            if (currentPassword === '' || newPassword === '' || rePassword === '') error = 'All of the input is required...';
            if (newPassword !== rePassword) error = 'New password did not match...';
            return error;
        }
    };

    $(function () {
        PasswordReset.initialize();
    });
}).apply(this, [jQuery]);