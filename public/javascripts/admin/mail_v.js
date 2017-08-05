(function ($) {
    'use strict';

    let Mail = {
        initialize () {
            this.$loader = $('div#cssload-loader');
            this.$loaderWrapper = $('div.loader-bg');
            this._attachments = ATTACHMENTS;

            if (!IS_READ) {
                this.markAsRead();
            }
            if (this._attachments.length !== 0) {
                this.getAttachments();
            }

            this.events();
            this.setMailSidebarHeight();
            this.loader(false);
        },

        events () {
            let _self = this;

            $('iframe').on('load', function() {
                this.style.height = this.contentWindow.document.body.offsetHeight + 40 +  'px';
                _self.setMailSidebarHeight();
            });

            $(window).on('resize', function (event) {
                _self.setMailSidebarHeight();
            });

            // Sidebar events
            $('#inbox').on('click', function (event) {
                window.location.href = "/admin/messages";
            });

            $('#unread').on('click', function (event) {
                window.location.href = "/admin/messages?label=Unread";
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

            $(document).on('click', 'div.attachment-item', function (event) {
                let itemIndex = $(this).data('index');
                _self.saveAttachment(_self._attachments[itemIndex]);
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

        getAttachments () {
            let _self = this;
            let ids = '', glue = '';
            let length = this._attachments.length;
            for (let i = 0; i < length; i++) {
                ids += (glue + this._attachments[i].id);
                if (glue === '') glue = ',';
            }
            $.ajax({
                url: '/api/v1/messages/attachments/' + ID,
                type: 'GET',
                dataType: 'json',
                data: {attachmentIds: ids},
                timeout: 50000,

                success (data, status, errorThrown) {
                    let attachmentWrapper = $('div.attachmet-wrapper');
                    for (let i = 0; i < length; i++) {
                        _self._attachments[i].data = data[i].data.replace(/-/g, '+').replace(/_/g, '/');
                        _self._attachments[i].size = data[i].size;

                        let type = _self._attachments[i].contentType.toLowerCase();
                        let icon = 'fa fa-file-o';
                        if (type.indexOf('image') !== -1) {
                            icon = 'fa fa-file-image-o';
                        } else if (type.indexOf('pdf') !== -1) {
                            icon = 'fa fa-file-pdf-o';
                        } else if (type.indexOf('word') !== -1) {
                            icon = 'fa fa-file-word-o';
                        }
                        let attachmentIcon = [
                            '<div data-index="' + i + '" class="icon-wrapper attachment-item"><i class="' + icon + ' box-icon"><span class="fix-editor">' + _self._attachments[i].filename + '</span></i></div>'
                        ].join(' ');
                        attachmentWrapper.append(attachmentIcon);
                    }
                    _self.setMailSidebarHeight();

                    $('div.attachment-item').on('mouseover', function (event) {
                        _self.setMailSidebarHeight();
                    });
                },
                error (data, status, errorThrown) {
                    let error = $('#error-dialog');
                    error.text('Error occurred : ' + errorThrown);
                    error.fadeIn(1000).delay(3000).fadeOut(1000);
                }
            });
        },

        saveAttachment (data) {
            let byteString = atob(data.data);

            // Convert that text into a byte array.
            let ab = new ArrayBuffer(byteString.length);
            let ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            // Blob for saving.
            let blob = new Blob([ia], { type: data.contentType });

            // Tell the browser to save as report.pdf.
            saveAs(blob, data.filename);
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