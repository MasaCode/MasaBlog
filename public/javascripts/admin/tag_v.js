(function ($) {
    'use strict';

    let Tag = {
        options: {
            tagBoard: 'div.tag-board',
            tagItem: 'div.tag-item',
            tagInput: 'input.tag-checkbox',
            form: '#modal-form',
            editModal: '#edit-modal',
            deleteModal: '#delete-modal'
        },

        initialize () {
            let _self = this;
            this.$tagBoard = $(this.options.tagBoard);
            this.$tagItem = $(this.options.tagItem);
            this.$form = $(this.options.form);
            this.$editModal = $(this.options.editModal);
            this.$deleteModal = $(this.options.deleteModal);

            this.events();
        },

        refresh () {
            $.getJSON('../../api/v1/tags/', null, function (tags) {
                let items = $('div.tag-item');
                let itemLength = items.length;
                let categoryBoard = $('div.tag-board');
                let tagLength = tags.length;
                let difference = itemLength - tagLength;
                if (difference > 0) {
                    items.slice((itemLength - difference), itemLength).remove();
                }
                for (let i = 0; i < tagLength; i++) {
                    if (i >= itemLength) {
                        let tagItem = [
                            '<div class="tag-item">',
                            '<input type="hidden" class="category-id" value="' + tags[i].id + '" />',
                            '<input type="checkbox" class="checkbox category-checkbox" />',
                            '<span class="tag-name">' + tags[i].name + '</span></div>'
                        ].join(' ');
                        categoryBoard.append(tagItem);
                    } else {
                        let item = $(items.get(i));
                        item.find('input.tag-id').val(tags[i].id);
                        item.find('span.tag-name').text(tags[i].name);
                    }
                }
            });
        },

        events () {
            let _self = this;
            $(document).on('click', this.options.tagInput, function (event) {
                let $box = $(this);
                if ($box.is(':checked')) {
                    $(_self.options.tagInput).prop("checked", false);
                    $box.prop("checked", true);
                } else {
                    $box.prop("checked", false);
                }
            });

            $("#delete").on('click', function (event) {
                event.preventDefault();
                let tag = $(_self.options.tagInput + ':checked').parent();
                if (tag.length === 0) return event.stopPropagation();
                let id = parseInt(tag.find('input.tag-id').val());
                _self.$deleteModal.find('div.modal-body').text('Are you sure you want to delete ' + tag.find('span').text() + '?');
                let executeButton = _self.$deleteModal.find('button:last-child');
                executeButton.on('click', function () {
                    $.ajax({
                        url: '../../api/v1/tags/' + id,
                        type: 'DELETE',
                        dataType: 'json',
                        data: {id: id},
                        timeout: 10000,

                        success (data, status, errorThrown) {
                            let success = $('#success-dialog');
                            success.text('The tag successfully has been deleted');
                            success.fadeIn(1000).delay(3000).fadeOut(1000);
                            executeButton.off('click');
                            _self.refresh();
                        },
                        error (data, status, errorThrown) {
                            let error = $('#error-dialog');
                            error.text('Error occurred : ' + errorThrown);
                            error.fadeIn(1000).delay(3000).fadeOut(1000);
                            _self.refresh();
                        }
                    });
                });
            });

            $('#edit').on('click', function (event) {
                event.preventDefault();
                let tag = $(_self.options.tagInput + ':checked').parent();
                if (tag.length === 0 ) return event.stopPropagation();
                let id = parseInt(tag.find('input.tag-id').val());
                $.ajax({
                    url: '../../api/v1/tags/' + id,
                    type: 'GET',
                    dataType: 'json',
                    timeout: 10000,

                    success (data, status, errorThrown) {
                        $('#modal-input-id').val(data.id);
                        $('#modal-input-name').val(data.name);
                        $('#modal-input-description').val(data.description);
                    },
                    error (data, status, errorThrown) {
                        console.log(status);
                    }
                });
            });

            this.$editModal.on('submit', function (event) {
                event.preventDefault();
                let error = $('#input-error');
                let submit = $('#modal-submit');
                let id = parseInt($('#modal-input-id').val());
                let data = {};
                data.name = $('#modal-input-name').val().trim();
                data.description = $('#modal-input-description').val().trim();

                if (!_self.validateParam(data.name)) {
                    error.text('Tag name is required.');
                    error.show();
                    return false;
                }
                error.hide();

                let method = (!isNaN(id)) ? 'PUT' : 'POST';
                let url = '../../api/v1/tags' + (!isNaN(id) ? '/' + id : '');
                $.ajax({
                    url: url,
                    type: method,
                    dataType: 'json',
                    data: data,
                    timeout: 10000,

                    beforeSend (jqXHR, status) {
                        submit.prop('disabled', true);
                        _self.$form.get(0).reset();
                    },
                    complete (jqXHR, status) {
                        submit.prop('disabled', false);
                    },
                    success (data, status, errorThrown) {
                        let success = $('#success-dialog');
                        success.text('The tag successfully has been ' + (method === 'PUT' ? 'updated' : 'created'));
                        success.fadeIn(1000).delay(3000).fadeOut(1000);
                        _self.$editModal.find('button:last-child').click();
                        _self.refresh();
                    },
                    error (data, status, errorThrown) {
                        let error = $('#error-dialog');
                        error.text('Error occurred : ' + errorThrown);
                        error.fadeIn(1000).delay(3000).fadeOut(1000);
                        _self.$editModal.find('button:last-child').click();
                        _self.refresh();
                    }
                });
            });

            this.$editModal.on({
                'hidden.bs.modal': function (event) {
                    _self.$form.get(0).reset();
                    let error = $('#input-error');
                    error.val('');
                    error.hide();
                    $('#modal-input-id').val('');
                }
            });
        },

        validateParam (value) {
            return (value !== '' && value !== undefined && value !== null);
        },
    };

    $(function () {
        Tag.initialize();
    });
}).apply(this, [jQuery]);