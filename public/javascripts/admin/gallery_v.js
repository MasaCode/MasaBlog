(function ($) {
    'use strict';

    let Gallery = {
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

        initialize () {
            this.$gallery = $(this.gallery);
            this.$wrapper = $(this.wrapper);
            this.setVariables();
            this.styleGallery();
            this.events();
        },

        events () {
            let _self = this;

            $(window).on('resize', this.onResize.bind(this));

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

        onResize () {
            let _self = this;
            if (this.isResized === false) {
                this.isResized = setTimeout(function () {
                    _self.setVariables();
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
            this.galleryWidth = (wrapperWidth - (this.rowCounts[this.index]) * this.margin * 2) / parseFloat(this.rowCounts[this.index]);
        },

        styleGallery () {
            let length = this.$gallery.length;
            let lastRows = length - (this.rowCounts[this.index] + 1);
            let count = this.rowCounts[this.index];
            let bottom = 0;
            let overrideCount = count;
            let defTop = ($(window).width() <= this.menuBreakpoint) ? 10 : 0;
            for (let i = 0; i < length; i++) {
                let rowIndex = (i % count);
                let left = rowIndex * (this.galleryWidth + this.margin) + this.margin * rowIndex;
                let top = (i >= count) ? this.$gallery[i - count].offsetHeight + parseInt(this.$gallery[i - count].style.top.replace('px', '')) + 10 : defTop;
                if (i > lastRows && count !== 1) {
                    let topIndex = 0;
                    let defaultTop = 9999;
                    for (let j = i - overrideCount; j < i; j++) {
                        let elementTop = parseInt(this.$gallery[j].style.top.replace('px', ''));
                        if (defaultTop >= elementTop) {
                            topIndex = j;
                            defaultTop = elementTop;
                        }
                    }

                    if (topIndex !== (i - overrideCount)) {
                        top = this.$gallery[topIndex].offsetHeight + defaultTop + 10;
                        let overrideRowIndex = (topIndex % overrideCount);
                        left = overrideRowIndex * (this.galleryWidth + this.margin) + this.margin * overrideRowIndex;
                        overrideCount--;
                    }
                }
                this.$gallery[i].style.cssText += ''.concat(
                    'top: ' + top + 'px;', 'left: ' + left + 'px;', 'width: ' + this.galleryWidth + 'px;', 'position: absolute;'
                );

                let imgBottom = top + $(this.$gallery[i]).height();
                if (imgBottom >= bottom) {
                    bottom = imgBottom;
                }

            }

            this.$wrapper.css('height', (bottom + this.margin * 2));
        },

        search (searchText) {
            console.log(searchText);
        },
    };

    $(function () {
        Gallery.initialize();
    });
}).apply(this, [jQuery]);