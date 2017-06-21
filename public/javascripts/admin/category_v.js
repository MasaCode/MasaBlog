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
                        $('#modal-input-name').val(data.name);
                        $('#modal-input-description').val(data.description);
                    },
                    error (data, status, errorThrown) {
                        console.log(status);
                    }
                });
            });

            this.$editModal.on({
                'hidden.bs.modal': function (event) {
                    _self.$form.get(0).reset();
                }
            });
        },
    };

    $(function () {
        Category.initialize();
    });
}).apply(this, [jQuery]);