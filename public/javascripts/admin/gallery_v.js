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
        currentPage: 1,

        initialize () {
            this.$addModal = $('#add-modal');
            this.$form = $('#modal-form');
            this.$deleteModal = $('#delete-modal');
            this.$viewModal = $('#view-modal');
            this.$gallery = $(this.gallery);
            this.$wrapper = $(this.wrapper);
            this._THUMBNAILS = THUMBNAILS;
            this.setVariables();
            this.styleGallery();
            this.events();
        },

        refresh () {
            let _self = this;
            $.getJSON('../../api/v1/thumbnails/', null, function (thumbnails) {
                _self.manageGalleryItem(thumbnails);
                if (thumbnails.length === 0) return _self.showNotFound();
                let notFound = $('div.not-found');
                if (notFound.length !== 0) notFound.remove();
            });
        },

        events () {
            let _self = this;

            $(window).on('resize', this.onResize.bind(this));

            $('#search-icon-wrapper').on('click', function (event) {
                event.preventDefault();
                $('div.search-input-wrapper').show('fast');
                $('body').css('position', 'fixed');
                $('input.search-input').focus().select();
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

            $('input#modal-input-image').on('change', function (event) {
                let image = $(this).get(0).files[0];
                if (image !== undefined) {
                    let reader = new FileReader();
                    reader.readAsDataURL(image);
                    reader.onload = function (event) {
                        let preview = $('div.upload-preview img');
                        preview.attr('src', event.target.result).on('load', function () {
                            preview.css('padding-left', ((preview.parent().width() / 2.0) - (preview.width() / 2.0)))
                        });
                    };
                }

                $('div.upload-preview').css('display', (image === undefined ? 'none' : 'block'));
                $('div.upload-texts').css('display', (image === undefined ? 'block' : 'none'));
                if (image === undefined) $('div.upload-preview img').attr('src', '');
            });

            this.$addModal.on({
                'hidden.bs.modal': function (event) {
                    _self.$form.get(0).reset();
                    $('span.error-text').text('');
                    $('div.upload-texts').css('display', 'block');
                    $('div.upload-preview').css('display', 'none');
                    $('div.upload-preview img').attr('src', '');
                },
            });

            this.$form.on('submit', function (event) {
                event.preventDefault();
                let title = $('#modal-input-title').val().trim();
                let image = $('#modal-input-image').get(0).files[0];
                if (title === '' || title === null || title === undefined) return _self.showError('Title is required...');
                if (image === undefined || image === null) return _self.showError('Thumbnail is required...');

                let data = new FormData();
                data.append('title', title);
                data.append('thumbnail', image);

                $.ajax({
                    url: '../../api/v1/thumbnails/',
                    type: 'POST',
                    dataType: 'json',
                    data: data,
                    processData: false,
                    contentType: false,
                    timeout: 10000,

                    success (data, status, errorThrown) {
                        let success = $('#success-dialog');
                        success.text('The thumbnail successfully has been uploaded');
                        success.fadeIn(1000).delay(3000).fadeOut(1000);
                        _self.$addModal.find('button:last-child').click();
                        _self.refresh();
                    },
                    error (data, status, errorThrown) {
                        let error = $('#error-dialog');
                        error.text('Error occurred : ' + errorThrown);
                        error.fadeIn(1000).delay(3000).fadeOut(1000);
                        _self.$addModal.find('button:last-child').click();
                        _self.refresh();
                    }
                });
            });

            this.$deleteModal.on({
                'show.bs.modal': function (event) {
                    let thumbnail = $(event.relatedTarget).closest('div.img-gallery');
                    let id = parseInt(thumbnail.find('input.gallery-id').val());
                    let title = thumbnail.find('.gallery-title').text().trim();

                    let modal = $(this);
                    let executeButton = modal.find('button:last-child');
                    modal.find('div.modal-body').text('Are you sure you want to delete ' + title + '?');
                    executeButton.on('click', function (event) {
                        $.ajax({
                            url: '../../api/v1/thumbnails/' + id,
                            type: 'DELETE',
                            dataType: 'json',
                            data: {id: id},
                            timeout: 10000,

                            success (data, status, errorThrown) {
                                let success = $('#success-dialog');
                                success.text('The thumbnail successfully has been deleted');
                                success.fadeIn(1000).delay(3000).fadeOut(1000);
                                modal.find('button:first-child').click();
                                _self.refresh();
                                executeButton.off('click');
                            },
                            error (data, status, errorThrown) {
                                let error = $('#error-dialog');
                                error.text('Error occurred : ' + errorThrown);
                                error.fadeIn(1000).delay(3000).fadeOut(1000);
                                modal.find('button:first-child').click();
                                _self.refresh();
                                executeButton.off('click');
                            }
                        });
                    });
                }
            });

            this.$viewModal.on({
                'show.bs.modal': function (event) {
                    let thumbnail = $(event.relatedTarget).closest('div.img-gallery');
                    let modal = $(this);
                    modal.find('.modal-title').text(thumbnail.find('.gallery-title').text());
                    modal.find('img').attr('src', thumbnail.find('img').attr('src'));
                },
                'hidden.bs.modal': function (event) {
                    let modal = $(this);
                    modal.find('.modal-title').text('');
                    modal.find('img').attr('src', '');
                }
            })
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
            if (searchText === '') {
                this.refresh();
                $('body').css('position', 'relative');
                $('div.search-input-wrapper').hide('fast');
                return;
            }

            let _self = this;
            $.ajax({
                url: '../../api/v1/thumbnails/search/' + searchText,
                type: 'GET',
                dataType: 'json',
                timeout: 10000,

                success (data, status, errorThrown) {
                    _self.manageGalleryItem(data);
                    $('body').css('position', 'relative');
                    $('div.search-input-wrapper').hide('fast');
                    if (data.length === 0) return _self.showNotFound();
                    let notFound = $('div.not-found');
                    if (notFound.length !== 0) notFound.remove();
                },
                error (data, status, errorThrown) {
                    $('body').css('position', 'relative');
                    $('input.search-input').val('');
                    $('div.search-input-wrapper').hide('fast');
                    let error = $('#error-dialog');
                    error.text('Error occurred : ' + errorThrown);
                    error.fadeIn(1000).delay(3000).fadeOut(1000);
                }
            })
        },

        manageGalleryItem (thumbnails) {
            let thumbnailLength = thumbnails.length;
            let galleryLength = this.$gallery.length;
            let difference = galleryLength - thumbnailLength;
            let galleryWrapper = $('div.gallery-wrapper');
            if (difference > 0) {
                this.$gallery.slice((galleryLength - difference), galleryLength).remove();
            }
            for (let i = 0; i < thumbnailLength; i++) {
                if (i >= galleryLength) {
                    let newGallery = [
                        '<div class="img-gallery">',
                        '<div class="gallery-layer"><h3 class="text-center gallery-title">' + thumbnails[i].title + '</h3>',
                        '<div class="gallery-button-wrapper"><button data-toggle="modal" data-target="#view-modal" class="gallery-view">View</button></div>',
                        '<div class="gallery-button-wrapper button-wrapper-remove"><button data-toggle="modal" data-target="#delete-modal" class="gallery-remove">Remove</button></div></div>',
                        '<input type="hidden" value="' + thumbnails[i].id + '" class="gallery-id" />',
                        '<img src="/assets/uploads/' + thumbnails[i].image_path + '" /></div>'
                    ].join(' ');
                    galleryWrapper.append(newGallery);
                } else {
                    let galleryItem = $(this.$gallery[i]);
                    galleryItem.get(0).style = '';
                    galleryItem.find('input.gallery-id').val(thumbnails[i].id);
                    galleryItem.find('.gallery-title').text(thumbnails[i].title);
                    galleryItem.find('img').attr('src', '/assets/uploads/' + thumbnails[i].image_path);
                }
            }

            this.$gallery = $(this.gallery);
            this.setVariables();
            this.styleGallery();
        },

        showError (error) {
            $('span.error-text').text(error);
        },

        showNotFound () {
            let notFound = $('div.not-found');
            if (notFound.length !== 0) return;
            let item = '<div class="not-found"><div class="not-found-content"></div></div>';
            $('div.gallery-wrapper').append(item);
        },
    };

    $(function () {
        Gallery.initialize();
    });
}).apply(this, [jQuery]);