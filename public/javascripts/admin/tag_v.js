(function ($) {
    'use strict';

    let Tag = {
        options: {
            tagBoard: 'div.tag-board',
            tagItem: 'div.tag-item',
            tagInput: 'input.tag-checkbox',
        },

        initialize () {
            let _self = this;
            this.$tagBoard = $(this.options.tagBoard);
            this.$tagItem = $(this.options.tagItem);

            this.events();
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
        },
    };

    $(function () {
        Tag.initialize();
    });
}).apply(this, [jQuery]);