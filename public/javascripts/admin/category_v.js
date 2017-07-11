(function ($) {
    'use strict';

    let Category = {
        options: {
            categoryBoard: 'div.category-board',
            categoryItem: 'div.category-item',
            categoryInput: 'input.category-checkbox',
            editModal: '#edit-modal',
            deleteModal: '#delete-modal',
            form: '#modal-form',
        },

        initialize () {
            let _self = this;
            this.$categoryBoard = $(this.options.categoryBoard);
            this.$categoryItem = $(this.options.categoryItem);
            this.$editModal = $(this.options.editModal);
            this.$deleteModal = $(this.options.deleteModal);
            this.$form = $(this.options.form);

            this.events();
        },

        refresh () {
            $.getJSON('../../api/v1/categories/', null, function (categories) {
                let items = $('div.category-item');
                let itemLength = items.length;
                let categoryBoard = $('div.category-board');
                let categoryLength = categories.length;
                let difference = itemLength - categoryLength;
                if (difference > 0) {
                    items.slice((itemLength - difference), itemLength).remove();
                }
                for (let i = 0; i < categoryLength; i++) {
                    if (i >= itemLength) {
                        let categoryItem = [
                            '<div class="category-item">',
                            '<input type="hidden" class="category-id" value="' + categories[i].id + '" />',
                            '<input type="checkbox" class="checkbox category-checkbox" />',
                            '<span class="category-name">' + categories[i].name + '</span></div>'
                        ].join(' ');
                        categoryBoard.append(categoryItem);
                    } else {
                        let item = $(items.get(i));
                        item.find('input.category-id').val(categories[i].id);
                        item.find('span.category-name').text(categories[i].name);
                    }
                }
            });
        },

        events () {
            let _self = this;
            $(document).on('click', this.options.categoryInput, function (event) {
                let $box = $(this);
                if ($box.is(':checked')) {
                    $(_self.options.categoryInput).prop("checked", false);
                    $box.prop("checked", true);
                } else {
                    $box.prop("checked", false);
                }
            });

            $("#delete").on('click', function (event) {
                event.preventDefault();
                let category = $(_self.options.categoryInput + ':checked').parent();
                if (category.length === 0 ) return event.stopPropagation();
                let id = parseInt(category.find('input.category-id').val());
                _self.$deleteModal.find('div.modal-body').text('Are you sure you want to delete ' + category.find('span').text() + '?');
                let executeButton = _self.$deleteModal.find('button:last-child');
                executeButton.on('click', function () {
                    $.ajax({
                        url: '../../api/v1/categories/' + id,
                        type: 'DELETE',
                        dataType: 'json',
                        data: {id: id},
                        timeout: 10000,

                        success (data, status, errorThrown) {
                            let success = $('#success-dialog');
                            success.text('The category successfully has been deleted');
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
                let category = $(_self.options.categoryInput + ':checked').parent();
                if (category.length === 0 ) return event.stopPropagation();
                let id = parseInt(category.find('input.category-id').val());
                $.ajax({
                    url: '../../api/v1/categories/' + id,
                    type: 'GET',
                    dataType: 'json',
                    timeout: 10000,

                    success (data, status, errorThrown) {
                        $('#modal-input-id').val(data.id);
                        $('#modal-input-name').val(data.name);
                        $('#modal-input-icon').val(data.icon);
                        $('#modal-input-description').val(data.description);
                    },
                    error (data, status, errorThrown) {
                        console.log(status);
                        let error = $('#error-dialog');
                        error.text('Error occurred : ' + errorThrown);
                        error.fadeIn(1000).delay(3000).fadeOut(1000);
                    }
                });
            });

            this.$editModal.on('submit', function (event) {
                event.preventDefault();
                let error = $('#input-error');
                let submit = $('#input-submit');
                let id = parseInt($('#modal-input-id').val());
                let data = {};
                data.name = $('#modal-input-name').val().trim();
                data.icon = $('#modal-input-icon').val().trim();
                data.description = $('#modal-input-description').val().trim();

                if (!_self.validateParam(data.name)) {
                    error.text('Category name is required.');
                    error.show();
                    return false;
                }
                error.hide();

                let method = (!isNaN(id)) ? 'PUT' : 'POST';
                let url = '../../api/v1/categories' + (!isNaN(id) ? '/' + id : '');
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
                        success.text('The category successfully has been ' + (method === 'PUT' ? 'updated' : 'created'));
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
        Category.initialize();
    });
}).apply(this, [jQuery]);