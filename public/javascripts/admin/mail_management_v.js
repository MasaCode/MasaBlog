(function ($) {
    'use strict';

    let Mail = {
        maxMailNumber: 10,
        currentPage: 1,
        maxPage: 1,
        messages: null,
        uploadedFiles: [],
        totalSize: 0,

        initialize () {
            this.$mailTable = $('table#mail-table');
            this.$mailBody = $('tbody#mail-body');
            this.$compose = $('#compose');
            this.$refresh = $('.btn-refresh');
            this.$remove = $('.btn-remove');
            this.$next = $('.btn-next');
            this.$prev = $('.btn-prev');
            this.$move = $('.btn-move');
            this.$loader = $('div#cssload-loader');
            this.$loaderWrapper = $('div.loader-bg');


            this.build(LABEL);
            this.events();
        },

        build (label) {
            let query = '';
            if (label === null) {
                query = 'in:inbox';
            } else if (label === 'Important') {
                query = 'is:important';
            } else if (label === 'Unread') {
                query = 'is:unread';
            } else if (label === 'Starred') {
                query = 'is:starred';
            } else if (label === 'Draft') {
                query = 'in:draft';
            } else if (label === 'Trash') {
                query = 'in:trash';
            } else {
                query = 'in:sent';
            }
            this.search(query);
        },

        events () {
            let _self = this;

            $(window).on('resize', function (event) {
                _self.setMailSidebarHeight();
            });

            // Sidebar events
            $('.btn-list').on('click', function (event) {
                let active = $('.btn-list.btn-active');
                let clicked = $(this);
                if (active === clicked) return;
                active.removeClass('btn-active');
                clicked.addClass('btn-active');
            });

            $('#inbox').on('click', function (event) {
                _self.changeButton(true);
                _self.search("in:inbox");
            });

            $('#unread').on('click', function (event) {
                _self.changeButton(true);
                _self.search("is:unread");
            });

            $('#important').on('click', function (event) {
                _self.changeButton(true);
                _self.search("is:important");
            });

            $('#starred').on('click', function (event) {
                _self.changeButton(true);
                _self.search("is:starred");
            });

            $('#draft').on('click', function (event) {
                _self.changeButton(true);
                _self.search("in:draft");
            });

            $('#sent-mail').on('click', function (event) {
                _self.changeButton(true);
                _self.search("in:sent");
            });

            $('#trash').on('click', function (event) {
                _self.changeButton(false);
                _self.search("in:trash");
            });

            this.$mailTable.on('click', 'input[type="checkbox"]', function (event) {
                let $tr = $(this).closest('tr');
                if ($tr.hasClass('selected')) $tr.removeClass('selected');
                else $tr.addClass('selected');
            }).on('click', 'tbody tr', function (event) {
                if ($(event.target).hasClass('mail-checkbox')) return;
                let id = $(event.currentTarget).data('id');
                if (id === undefined || id === '') return;
                let label = $('.btn-list.btn-active span').text().trim();
                window.location.href = "/admin/messages/" + id + (label !== 'Inbox' ? ('?label=' + label) : '');
            });

            this.$refresh.on('click', function () {
                let label = $('.btn-list.btn-active span').text().trim();
                _self.build(label !== 'Inbox' ? label : null);
            });

            this.$next.on('click', function (event) {
                if (_self.$next.hasClass('disabled')) return false;
                _self.currentPage++;
                if (_self.currentPage === _self.maxPage) _self.$next.addClass('disabled');
                if (_self.currentPage > 1) _self.$prev.removeClass('disabled');
                _self.manageMail(_self.messages);
            });

            this.$prev.on('click', function (event) {
                if (_self.$prev.hasClass('disabled')) return false;
                _self.currentPage--;
                if (_self.currentPage === 1) _self.$prev.addClass('disabled');
                if (_self.currentPage < _self.maxPage) _self.$next.removeClass('disabled');
                _self.manageMail(_self.messages);
            });

            this.$remove.on('click', function (event) {
                let selectedMails = $('tr.selected');
                let length = selectedMails.length;
                if (length === 0) return false;
                let ids = '';
                let glue = '';
                for (let i = 0; i < length; i++) {
                    ids += (glue + selectedMails.eq(i).data('id'));
                    if (glue === '') glue = ',';
                }

                $.ajax({
                    url: '/api/v1/messages',
                    type: 'DELETE',
                    dataType: 'json',
                    data: {ids: ids},
                    timeout: 50000,

                    success (data, status, errorThrown) {
                        let label = $('.btn-list.btn-active span').text().trim();
                        _self.build(label !== 'Inbox' ? label : null);
                        let success = $('#success-dialog');
                        success.text('Messages successfully have been moved to trash');
                        success.fadeIn(1000).delay(3000).fadeOut(1000);
                    },
                    error (data, status, errorThrown) {
                        let error = $('#error-dialog');
                        error.text('Error occurred : ' + errorThrown);
                        error.fadeIn(1000).delay(3000).fadeOut(1000);
                        let label = $('.btn-list.btn-active span').text().trim();
                        _self.build(label !== 'Inbox' ? label : null);
                    }
                });
            });

            this.$move.on('click', function (event) {
                let selectedMails = $('tr.selected');
                let length = selectedMails.length;
                if (length === 0) return false;
                let ids = '';
                let glue = '';
                for (let i = 0; i < length; i++) {
                    ids += (glue + selectedMails.eq(i).data('id'));
                    if (glue === '') glue = ',';
                }

                $.ajax({
                    url: '/api/v1/messages/untrash',
                    type: 'PUT',
                    dataType: 'json',
                    data: {ids: ids},
                    timeout: 50000,

                    success (data, status, errorThrown) {
                        let label = $('.btn-list.btn-active span').text().trim();
                        _self.build(label !== 'Inbox' ? label : null);
                        let success = $('#success-dialog');
                        success.text('Messages successfully have been moved to trash');
                        success.fadeIn(1000).delay(3000).fadeOut(1000);
                    },
                    error (data, status, errorThrown) {
                        let error = $('#error-dialog');
                        error.text('Error occurred : ' + errorThrown);
                        error.fadeIn(1000).delay(3000).fadeOut(1000);
                        let label = $('.btn-list.btn-active span').text().trim();
                        _self.build(label !== 'Inbox' ? label : null);
                    }
                });
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
                    let label = $('.btn-list.btn-active span').text().trim();
                    _self.build(label !== 'Inbox' ? label : null);
                    let success = $('#success-dialog');
                    success.text('Messages successfully have been moved to trash');
                    success.fadeIn(1000).delay(3000).fadeOut(1000);
                },
                error (data, status, errorThrown) {
                    _self.resetForm();
                    let error = $('#error-dialog');
                    error.text('Error occurred : ' + errorThrown);
                    error.fadeIn(1000).delay(3000).fadeOut(1000);
                    let label = $('.btn-list.btn-active span').text().trim();
                    _self.build(label !== 'Inbox' ? label : null);
                }
            });
        },

        search (label) {
            let _self = this;
            this.loader(true);
            $.ajax({
                url: '/api/v1/messages/search',
                type: 'GET',
                dataType: 'json',
                data: {label: label},
                timeout: 50000,

                success (data, status, errorThrown) {
                    _self.loader(false);
                    _self.currentPage = 1;
                    _self.messages = data;
                    _self.maxPage = Math.ceil(data.length / parseFloat(_self.maxMailNumber));
                    if (data.length > _self.maxMailNumber) _self.$next.removeClass('disabled');
                    else if (!_self.$next.hasClass('disabled')) _self.$next.addClass('disabled');
                    if (!_self.$prev.hasClass('disabled')) _self.$prev.addClass('disabled');
                    _self.manageMail(data);
                },
                error (data, status, errorThrown) {
                    _self.loader(false);
                    let error = $('#error-dialog');
                    error.text('Error occurred : ' + errorThrown);
                    error.fadeIn(1000).delay(3000).fadeOut(1000);
                }
            });
        },

        manageMail (data) {
            let start = (this.currentPage - 1) * this.maxMailNumber;
            let mailLength = data.length;
            let length = Math.min(mailLength, (start + this.maxMailNumber));
            let items = this.$mailBody.find('tr');
            let itemLength = items.length;
            let difference = itemLength - (length - start);
            if (difference > 0) {
                items.slice((itemLength - difference), itemLength).remove();
            }
            for (let i = start; i < length; i++) {
                let message = data[i];
                let isRead = message.labelIds.indexOf("UNREAD") === -1;
                let from = this.extractFieldHeader(message, 'From').split(' <')[0].replace(/"/g, '');
                let date = moment(new Date(this.extractFieldHeader(message, 'Received').split(';')[1].trim())).format('MMMM DD');
                let subject = message.snippet.substr(0, 70) + '...';

                if (i >= (start + itemLength)) {
                    let mailContent = [
                        '<tr data-id="' + message.id + '" class="' + (isRead ? 'mail-read' : '') + '">',
                        '<td><input type="checkbox" class="checkbox mail-checkbox" /><span class="sender">' + from + '</span>',
                        '<span class="sm-date">' + date + '</span><span class="sm-desc">' + subject + '</span></td>',
                        '<td>' + subject + '</td><td>' + date + '</td></tr>'
                    ].join(' ');
                    this.$mailBody.append(mailContent);
                } else {
                    let item = items.eq(i - start);
                    let hasReadClass = item.hasClass('mail-read');
                    item.data('id', message.id);
                    item.removeClass('selected');
                    item.find('input[type="checkbox"]').prop('checked', false);
                    if (hasReadClass && !isRead) item.removeClass('mail-read');
                    else if (!hasReadClass && isRead) item.addClass('mail-read');
                    item.find('span.sender').text(from);
                    item.find('span.sm-date').text(date);
                    item.find('sm-desc').text(subject);
                    item.find('td:nth-child(2)').text(subject);
                    item.find('td:nth-child(3)').text(date);
                }
            }

            $('span.showing-start').text(mailLength !== 0 ? (start + 1) : 0);
            $('span.showing-end').text(length);
            $('span.showing-length').text(mailLength);
            $('p.showing-text').css('display', 'block');

            this.setMailSidebarHeight();
        },

        extractFieldHeader (json, fieldName) {
            fieldName = fieldName.toLowerCase();
            let header = json.payload.headers.filter(function(header) {
                return (header.name.toLowerCase() === fieldName);
            });
            return (header.length !== 0 ? header[0].value : '');
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

        changeButton (showRemove) {
            if (showRemove) {
                this.$move.css('display', 'none');
                this.$remove.css('display', 'inline-block');
            } else {
                this.$move.css('display', 'inline-block');
                this.$remove.css('display', 'none');
            }
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