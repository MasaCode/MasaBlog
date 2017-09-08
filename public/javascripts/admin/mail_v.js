(function ($) {
    'use strict';

    let Mail = {
        uploadedFiles: [],
        replyFiles: [],
        totalSize: 0,
        replySize: 0,

        initialize () {
            this.$loader = $('div#cssload-loader');
            this.$loaderWrapper = $('div.loader-bg');
            this._message = MESSAGE;
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

            $(document).on('click', 'i.attachment-remove', function (event) {
                let item = $(this).closest('div.upload-attachment');
                let index = item.index();
                _self.uploadedFiles.splice(index, 1);
                _self.totalSize -= parseInt(item.data('size'));
                item.remove();
            });

            $('button.error-close').on('click', function (event) {
                $('div.error-wrapper').fadeOut();
            });

            $('#compose-modal').on({
                'hidden.bs.modal': function (event) {
                    _self.resetForm();
                }
            });

            $('#modal-input-attachments').on('change', function (event) {
                let files = this.files;
                let length = files.length;
                if (length === 0) return;
                let attachmentPreview = $('div.attachment-preview');
                let submit = $('#modal-submit');
                submit.prop('disabled', true);
                for (let i = 0; i < length; i++) {
                    (function (file, index) {
                        let reader = new FileReader();
                        reader.onload = function (event) {
                            _self.uploadedFiles.push({data: event.target.result.split('base64,')[1], name: file.name, type: file.type});
                            _self.totalSize += file.size;
                            let item = '<div data-size="' + file.size +'" class="upload-attachment"><span>' + file.name +' (' + _self.convertFileSize(file.size, true) + ')<i class="fa fa-times attachment-remove"></i></span></div>';
                            attachmentPreview.append(item);

                            if (index === (length - 1)) {
                                submit.prop('disabled', false);
                            }
                        };
                        reader.readAsDataURL(file);
                    })(files[i], i);
                }
            });

            $('form#modal-form').on('submit', function (event) {
                event.preventDefault();
                let to = $('#modal-input-to').val().trim();
                let subject = $('#modal-input-subject').val().trim();
                let body = $('#modal-input-body').val().trim();
                let hasAttachments = _self.uploadedFiles.length !== 0;
                if (to === '' || (subject === '' && body === '')) {
                    return _self.showError("You need to fill out all inputs...");
                }

                let data = new FormData();
                data.append('to', to);
                data.append('subject', subject);
                data.append('body', body);
                data.append('hasAttachment', hasAttachments);

                if (hasAttachments) {
                    data.append('boundary', 'masa_blog_mail');
                    data.append('attachments', JSON.stringify(_self.uploadedFiles));
                }

                let dataSize = (body.length * 2 /* 1 character -> 2byte */) + _self.totalSize;
                if (dataSize > (3 * 1024 * 1024 /* 3MB */)) {
                    return _self.showError("Message content and file size (" + dataSize + " byte) is too large...");
                }

                _self.sendEmail(data);
            });

            // Reply Events
            $('a.btn-reply').on('click', function (event) {
                $('div.reply-form').show();
                $(this).parent().hide();
                _self.setMailSidebarHeight();
            });

            $('#reply-cancel').on('click', function (event) {
                $('div.reply-form').hide();
                $('span.reply-message').show();
                $('textarea#reply-input-body').val('');
                $('div.reply-preview').find('div.upload-attachment').remove();
                _self.replyFiles = [];
                _self.replySize = 0;
                _self.setMailSidebarHeight();
            });

            $('#reply-input-attachments').on('change', function (event) {
                let files = this.files;
                let length = files.length;
                if (length === 0) return;

                let attachmentPreview = $('div.reply-preview');
                let submit = $('#reply-submit');
                submit.prop('disabled', true);
                for (let i = 0; i < length; i++) {
                    (function (file, index) {
                        let reader = new FileReader();
                        reader.onload = function (event) {
                            _self.replyFiles.push({data: event.target.result.split('base64,')[1], name: file.name, type: file.type});
                            _self.replySize += file.size;
                            let item = '<div data-size="' + file.size +'" class="upload-attachment"><span>' + file.name +' (' + _self.convertFileSize(file.size, true) + ')<i class="fa fa-times reply-attachment-remove"></i></span></div>';
                            attachmentPreview.append(item);

                            if (index === (length - 1)) {
                                submit.prop('disabled', false);
                            }
                        };
                        reader.readAsDataURL(file);
                    })(files[i], i);
                }
            });

            $(document).on('click', 'i.reply-attachment-remove', function (event) {
                let item = $(this).closest('div.upload-attachment');
                let index = item.index();
                _self.replyFiles.splice(index, 1);
                _self.replySize -= parseInt(item.data('size'));
                item.remove();
            });

            $('#reply-submit').on('click', function (event) {
                let id = $('input#reply-input-id').val();
                let to = $('input#reply-input-to').val();
                let subject = $('input#reply-input-subject').val();
                let body = $('textarea#reply-input-body').val();
                let hasAttachments = _self.replyFiles.length !== 0;
                if (id === '' || to === '' || subject === '') {
                    return _self.showError("Something is wrong with this email, please reload the page...");
                }

                let data = new FormData();
                data.append('inReplyTo', id);
                data.append('to', to);
                data.append('subject', subject);
                data.append('body', body);
                data.append('hasAttachment', hasAttachments);
                if (hasAttachments) {
                    data.append('boundary', 'masa_blog_mail');
                    data.append('attachments', JSON.stringify(_self.replyFiles));
                }

                let dataSize = (body.length * 2 /* 1 character -> 2byte */) + _self.replySize;
                if (dataSize > (3 * 1024 * 1024 /* 3MB */)) {
                    return _self.showError("Message content and file size (" + dataSize + " byte) is too large...");
                }

                _self.replyEmail(data);
            });

            return this;
        },

        sendEmail (data) {
            let _self = this;
            let cancel = $('#compose-modal').find('button:last-child');
            let submit = $('#modal-submit');
            $.ajax({
                url: '/api/v1/messages',
                type: 'POST',
                dataType: 'json',
                data: data,
                processData: false,
                contentType: false,
                timeout: 50000,

                beforeSend (xhr, settings) {
                    submit.prop('disabled', true);
                    cancel.click();
                },
                complete (xhr, settings) {
                    submit.prop('disabled', false);
                },
                success (data, status, errorThrown) {
                    _self.resetForm();
                    let success = $('#success-dialog');
                    success.text('Messages successfully have been sent');
                    success.fadeIn(1000).delay(3000).fadeOut(1000);
                },
                error (data, status, errorThrown) {
                    _self.resetForm();
                    let error = $('#error-dialog');
                    error.text('Error occurred : ' + errorThrown);
                    error.fadeIn(1000).delay(3000).fadeOut(1000);
                }
            });
        },

        replyEmail (data) {
            let _self = this;
            let cancel = $('#reply-cancel');
            let submit = $('#reply-submit');
            $.ajax({
                url: '/api/v1/messages/reply',
                type: 'POST',
                dataType: 'json',
                data: data,
                processData: false,
                contentType: false,
                timeout: 50000,

                beforeSend (xhr, settings) {
                    submit.prop('disabled', true);
                    cancel.click();
                },
                complete (xhr, settings) {
                    submit.prop('disabled', false);
                },
                success(data, status, errorThrown) {
                    let success = $('#success-dialog');
                    success.text('Reply messages successfully have been sent');
                    success.fadeIn(1000).delay(3000).fadeOut(1000);
                },
                error(data, status, errorThrown) {
                    let error = $('#error-dialog');
                    error.text('Error occurred : ' + errorThrown);
                    error.fadeIn(1000).delay(3000).fadeOut(1000);
                }
             });
        },

        resetForm () {
            $('form#modal-form').get(0).reset();
            $('#modal-input-attachments').val('');
            $('div.attachment-preview').find('div.upload-attachment').remove();
            this.uploadedFiles = [];
            this.totalSize = 0;
        },

        convertFileSize (bytes, si) {
            let thresh = si ? 1000 : 1024;
            if(Math.abs(bytes) < thresh) {
                return bytes + ' B';
            }
            let units = si ? ['kB','MB','GB','TB','PB','EB','ZB','YB'] : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
            let u = -1;
            do {
                bytes /= thresh;
                ++u;
            } while(Math.abs(bytes) >= thresh && u < units.length - 1);

            return bytes.toFixed(1)+' '+units[u];
        },

        showError (error) {
            $('.error-text').text(error);
            $('div.error-wrapper').fadeIn();
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
            let wrapper = $('div.box-wrapper');
            if ($(window).width() >= 991) {
                let mailWrapper = $('div.mail-wrapper');
                let height = mailWrapper.height() + parseInt(mailWrapper.css('padding-top').replace('px', '')) * 2;
                sidebar.height(height - 30);
                wrapper.height(height);
            } else {
                sidebar.height('auto');
                wrapper.height('auto');
            }
        }
    };

    $(function () {
        Mail.initialize();
    });
}).apply(this, [jQuery]);