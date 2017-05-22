(function ($) {
    'use strict';

    var Category = {
        options: {
            categoryBoard: 'div.category-board',
            categoryItem: 'div.category-item',
            categoryInput: 'input.category-checkbox',
        },

        initialize: function () {
            var _self = this;
            this.$categoryBoard = $(this.options.categoryBoard);
            this.$categoryItem = $(this.options.categoryItem);

            this.events();
        },

        events: function () {
            var _self = this;
            $(document).on('click', this.options.categoryInput, function (event) {
                var $box = $(this);
                if ($box.is(':checked')) {
                    $(_self.options.categoryInput).prop("checked", false);
                    $box.prop("checked", true);
                } else {
                    $box.prop("checked", false);
                }
            });
        },
    };

    $(function () {
        Category.initialize();
    });
}).apply(this, [jQuery]);