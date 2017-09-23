(function ($) {
    'use strict';

    let Gallery = {
        gallery: 'div.grid-item',
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
            this._THUMBNAILS = THUMBNAILS;
            this.initializeGallery().events();
        },

        initializeGallery (needDestroy) {
            if (needDestroy === true) {
                $('.grid').masonry('destroy');
            }
            
            let $grid = $('.grid').masonry({
                itemSelector: '.grid-item',
                columnWidth: '.grid-sizer',
                percentPosition: true
            });

            $grid.imagesLoaded().progress(function () {
                $grid.masonry();
            });

            return this;
        },

        refresh () {
            let _self = this;
            $.getJSON('/api/v1/thumbnails/', null, function (thumbnails) {
                _self.manageGalleryItem(thumbnails);
                if (thumbnails.length === 0) return _self.showNotFound();
                let notFound = $('div.not-found');
                if (notFound.length !== 0) notFound.remove();
            });
        },

        events () {
            let _self = this;

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
                    url: '/api/v1/thumbnails/',
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
                    let thumbnail = $(event.relatedTarget).closest('div.grid-item');
                    let id = parseInt(thumbnail.find('input.gallery-id').val());
                    let title = thumbnail.find('div.caption .title').text().trim();
                    let modal = $(this);
                    let executeButton = modal.find('button:last-child');
                    modal.find('div.modal-body').text('Are you sure you want to delete ' + title + '?');
                    executeButton.on('click', function (event) {
                        $.ajax({
                            url: '/api/v1/thumbnails/' + id,
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

            $(document).on('click', 'div.grid-item', function (event) {
                let target = $(event.target);
                if (target.hasClass('btn-remove') || target.hasClass('remove')) {
                    event.preventDefault();
                    return;
                }

                let thumbnail = $(this);
                let modal = $('#view-modal');
                modal.find('.modal-title').text(thumbnail.find('div.caption .title').text());
                modal.find('img').attr('src', thumbnail.find('img').attr('src'));
                modal.modal('show');
            });

            this.$viewModal.on({
                'hidden.bs.modal': function (event) {
                    let modal = $(this);
                    modal.find('.modal-title').text('');
                    modal.find('img').attr('src', '');
                }
            });
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
                url: '/api/v1/thumbnails/search/' + searchText,
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
            let galleryWrapper = $('div.grid');
            if (galleryWrapper.length === 0) {
                let wrapper = '<div class="grid"><div class="grid-sizer"></div></div>';
                $('div.gallery-wrapper').append(wrapper);
                galleryWrapper = $('div.grid');
            }
            if (difference > 0) {
                this.$gallery.slice((galleryLength - difference), galleryLength).remove();
            }
            for (let i = 0; i < thumbnailLength; i++) {
                if (i >= galleryLength) {
                    let newGallery = [
                        '<div class="grid-item">',
                        '<input type="hidden" value="' + thumbnails[i].id + '" class="gallery-id" />',
                        '<img src="/assets/uploads/' + thumbnails[i].image_path + '" />',
                        '<a data-toggle="modal" data-target="#delete-modal" class="btn btn-remove">',
                        '<span class="sm remove"><i class="fa fa-trash-o"></i></span>',
                        '<span class="lg remove">Remove</span></a>',
                        '<div class="caption"><h3 class="title text-center">' + thumbnails[i].title + '</h3></div></div>'
                    ].join(' ');
                    galleryWrapper.append(newGallery);
                } else {
                    let galleryItem = $(this.$gallery[i]);
                    galleryItem.find('input.gallery-id').val(thumbnails[i].id);
                    galleryItem.find('div.caption .title').text(thumbnails[i].title);
                    galleryItem.find('img').attr('src', '/assets/uploads/' + thumbnails[i].image_path);
                }
            }

            this.$gallery = $(this.gallery);
            this.initializeGallery(difference < 0);
        },

        showError (error) {
            $('span.error-text').text(error);
        },

        showNotFound () {
            $('div.grid').remove();
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