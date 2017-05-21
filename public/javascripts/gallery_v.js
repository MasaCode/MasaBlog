(function ($) {
    'use strict';

    var Gallery = {
        gallery: 'div.img-gallery',
        wrapper: 'div.row.gallery-wrapper',
        galleryWidth: 0,
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

        initialize: function () {
            this.$gallery = $(this.gallery);
            this.$wrapper = $(this.wrapper);
            this.setVariables();
            this.styleGallery();
            this.events();
        },

        events: function () {
            var _self = this;

            $(window).on('resize', this.onResize.bind(this));

            $('#menu-content').on({
                'show.bs.collapse' : function (event) {
                    setTimeout(function () {
                        _self.setMarginTop(_self.menuTop);
                    }, 100);
                },
                'hide.bs.collapse' : function (event) {
                    setTimeout(function () {
                        _self.setMarginTop(-1 * _self.menuTop);
                    }, 150);
                }
            });

            $('#search-icon-wrapper').on('click', function (event) {
                event.preventDefault();
                $('div.search-input-wrapper').show('fast');
                $('body').css('position', 'fixed');
            });

            $('span.search-close').on('click', function (event) {
                event.preventDefault();
                $('body').css('position', 'relative');
                $('input.search-input').val('');
                $('div.search-input-wrapper').hide('fast');
            });

            $('input.search-input').on('keydown', function (event) {
                if (event.keyCode === 13) {
                    _self.search($(this).val().trim());
                }
            });
        },

        onResize: function () {
            var _self = this;
            if (this.isResized === false) {
                this.isResized = setTimeout(function () {
                    _self.setVariables();
                    _self.styleGallery();
                    _self.isResized = false;
                }, 200);
            }
        },

        setVariables: function () {
            var wrapperWidth = this.$wrapper.width();
            this.offsetLeft = this.$wrapper[0].offsetLeft;
            this.offsetTop = ($(window).width() <= this.menuBreakpoint) ? this.menuOffsetTop: 0;
            var length = this.rowCounts.length;
            for (var i = 0; i < length; i++) {
                if (wrapperWidth <= this.breakPoints[i]) {
                    this.index = i;
                    break;
                }
            }
            this.galleryWidth = (wrapperWidth - (this.rowCounts[this.index]) * this.margin * 2) / parseFloat(this.rowCounts[this.index]);
        },

        styleGallery: function () {
            var length = this.$gallery.length;
            var lastRows = length - (this.rowCounts[this.index] + 1);
            var count = this.rowCounts[this.index];
            var bottom = 0;
            var overrideCount = count;
            for (var i = 0; i < length; i++) {
                var rowIndex = (i % count);
                var left = this.offsetLeft + rowIndex * (this.galleryWidth + this.margin) + this.margin * rowIndex;
                var top = (i >= count) ? this.$gallery[i - count].offsetHeight + parseInt(this.$gallery[i - count].style.top.replace('px', '')) + 10 : this.offsetTop;
                if (i > lastRows && count !== 1) {
                    var topIndex = 0;
                    var defaultTop = 9999;
                    for (var j = i - overrideCount; j < i; j++) {
                        var elementTop = parseInt(this.$gallery[j].style.top.replace('px', ''));
                        if (defaultTop >= elementTop) {
                            topIndex = j;
                            defaultTop = elementTop;
                        }
                    }

                    if (topIndex !== (i - overrideCount)) {
                        top = this.$gallery[topIndex].offsetHeight + defaultTop + 10;
                        var overrideRowIndex = (topIndex % overrideCount);
                        left = this.offsetLeft + overrideRowIndex * (this.galleryWidth + this.margin) + this.margin * overrideRowIndex;
                        overrideCount--;
                    }
                }
                this.$gallery[i].style.cssText += ''.concat(
                    'top: ' + top + 'px;', 'left: ' + left + 'px;', 'width: ' + this.galleryWidth + 'px;', 'position: absolute;'
                );

                var imgBottom = top + $(this.$gallery[i]).height();
                if (imgBottom >= bottom) {
                    bottom = imgBottom;
                }

            }

            this.$wrapper.css('height', (bottom + this.margin * 2));
        },

        setMarginTop: function (additionalTop) {
            var length = this.$gallery.length;
            for (var i = 0; i < length; i++) {
                this.$gallery[i].style.top = (parseInt(this.$gallery[i].style.top.replace('px', '')) + additionalTop) + 'px';
            }
        },

        search: function (searchText) {
            console.log(searchText);
        },
    };

    $(function () {
        Gallery.initialize();
    });
}).apply(this, [jQuery]);