(function ($) {
    'use strict';

    let Post = {
        options: {
            searchIcon: '#search-icon-wrapper',
            searchClose: 'span.search-close',
            searchInput: 'input.search-input',
            searchBody: 'div.search-input-wrapper',
            wrapper: 'div.row.post-wrapper',
            thumbnail: 'div.post-thumbnail-wrapper',
        },
        thumbnailWidth: 0,
        offsetLeft: 0,
        offsetTop: 0,
        index: 0,
        margin: 5,
        breakPoints: [500,991, 10000],
        rowCounts: [1, 2, 3],
        menuBreakpoint: 768,
        menuOffsetTop: 76,
        menuTop: 216,
        isResized: false,

        initialize () {
            this.$searchIcon = $(this.options.searchIcon);
            this.$searchClose = $(this.options.searchClose);
            this.$searchInput = $(this.options.searchInput);
            this.$searchBody = $(this.options.searchBody);
            this.$wrapper = $(this.options.wrapper);
            this.$thumbnail = $(this.options.thumbnail);
            this.setVariables();
            this.styleGallery();
            this.events();
        },

        events () {
            let _self = this;

            $(window).on('resize', this.onResize.bind(this));

            this.$searchIcon.on('click', function (event) {
                event.preventDefault();
                _self.$searchBody.show();
            });
            this.$searchClose.on('click', function (event) {
                event.preventDefault();
                _self.$searchBody.hide();
            });
            this.$searchInput.on('keydown', function (event) {
                if (event.keyCode === 13) {
                    _self.search($(this).val().trim());
                }
            });
        },

        onResize () {
            let _self = this;
            if (this.isResized === false) {
                this.isResized = setTimeout(function () {
                    _self.setletiables();
                    _self.styleGallery();
                    _self.isResized = false;
                }, 200);
            }
        },

        setVariables () {
            let wrapperWidth = this.$wrapper.width();
            this.offsetLeft = this.$wrapper[0].offsetLeft;
            this.offsetTop = ($(window).width() <= this.menuBreakpoint) ? this.menuOffsetTop: 0;
            let length = this.rowCounts.length;
            for (let i = 0; i < length; i++) {
                if (wrapperWidth <= this.breakPoints[i]) {
                    this.index = i;
                    break;
                }
            }
            this.thumbnailWidth = (wrapperWidth - (this.rowCounts[this.index]) * this.margin * 2) / parseFloat(this.rowCounts[this.index]);
        },

        styleGallery () {
            let length = this.$thumbnail.length;
            let lastRows = length - (this.rowCounts[this.index] + 1);
            let count = this.rowCounts[this.index];
            let bottom = 0;
            let defaultTop = ($(window).width() <= this.menuBreakpoint) ? 10 : 0;
            for (let i = 0; i < length; i++) {
                let rowIndex = (i % count);
                let left = rowIndex * (this.thumbnailWidth + this.margin) + this.margin * (rowIndex + 1);
                let top = (i >= count) ? this.$thumbnail[i - count].offsetHeight + parseInt(this.$thumbnail[i - count].style.top.replace('px', '')) + 10 : defaultTop;
                this.$thumbnail[i].style.cssText += ''.concat(
                    'top: ' + top + 'px;', 'left: ' + left + 'px;', 'width: ' + this.thumbnailWidth + 'px;', 'position: absolute;'
                );
                let imgBottom = top + $(this.$thumbnail[i]).height();
                if (imgBottom >= bottom) {
                    bottom = imgBottom;
                }

            }

            this.$wrapper.css('height', (bottom + this.margin * 2));
        },

        search (searchText) {

        },
    };

    $(function () {
        Post.initialize();
    });
}).apply(this, [jQuery]);