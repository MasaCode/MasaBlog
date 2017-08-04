(function ($) {
    'use strict';

    let Mail = {
        initialize () {
            this.$loader = $('div#cssload-loader');
            this.$loaderWrapper = $('div.loader-bg');

            if (!IS_READ) {
                this.markAsRead();
            }
            this.events();
            this.setMailSidebarHeight();
            this.loader(false);
        },

        events () {
            let _self = this;

            $(window).on('resize', function (event) {
                _self.setMailSidebarHeight();
            });

            // Sidebar events
            $('#inbox').on('click', function (event) {
                window.location.href = "/admin/messages";
            });

            $('#important').on('click', function (event) {
                window.location.href = "/admin/messages?label=Important";
            });

            $('#starred').on('click', function (event) {
                window.location.href = "/admin/messages?label=Starred";
            });

            $('#draft').on('click', function (event) {
                window.location.href = "/admin/messages?label=Draft";
            });

            $('#sent-mail').on('click', function (event) {
                window.location.href = "/admin/messages?label=Sent Mail";
            });

            $('#trash').on('click', function (event) {
                window.location.href = "/admin/messages?label=Trash";
            });

            return this;
        },

        loader (show) {
            let buttons = $('.btn-manage');
            if (show) {
                buttons.addClass('disabled');
                this.$loaderWrapper.fadeIn();
                this.$loader.fadeIn();
            } else {
                buttons.removeClass('disabled');
                this.$loaderWrapper.fadeOut();
                this.$loader.fadeOut();
            }
        },

        markAsRead() {
            let _self = this;
            $.ajax({
                url: '/api/v1/messages/markAsRead/' + ID,
                type: 'PUT',
                dataType: 'json',
                timeout: 50000,

                error (data, status, errorThrown) {
                    let error = $('#error-dialog');
                    error.text('Error occurred : ' + errorThrown);
                    error.fadeIn(1000).delay(3000).fadeOut(1000);
                }
            });
        },

        setMailSidebarHeight () {
            let sidebar = $('div.mail-sidebar');
            if ($(window).width() >= 991) {
                let mailWrapper = $('div.mail-wrapper');
                let height = mailWrapper.height() + parseInt(mailWrapper.css('padding-top').replace('px', '')) * 2;
                sidebar.height(height - 30);
            } else {
                sidebar.height('auto');
            }
        }
    };

    $(function () {
        Mail.initialize();
    });
}).apply(this, [jQuery]);