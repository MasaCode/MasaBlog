(function ($) {
    'use strict';

    let PostEditor = {
        options: {
            tagBoard: 'div.tag-board',
            tagInput: 'input#tag-input',
            tagSearchedResult: 'datalist#tag-searched-list',
            thumbnailModal: '#thumbnail-modal',
        },

        initialize () {
            this._POST = POST;
            this.$tagBoard = $(this.options.tagBoard);
            this.$tagInput = $(this.options.tagInput);
            this.$tagSearchedResult = $(this.options.tagSearchedResult);
            this.$thumbnailModal = $(this.options.thumbnailModal);

            this.buildEditor().getThumbnails().tagEvents().thumbnailEvents().postEvents();
            if (this._POST !== null) this.getPostData();
            this.refreshTagAutoComplete();
        },

        buildEditor () {
            this.editor = new SimpleMDE({
                element: document.getElementById('post-editor'),
                renderingConfig: {
                    codeSyntaxHighlighting: true,
                }
            });

            return this;
        },

        getThumbnails () {
            let _self = this;
            $.ajax({
                url: '/api/v1/thumbnails',
                type: 'GET',
                dataType: 'json',
                timeout: 10000,

                success (data, status, errorThrown) {
                    _self.thumbnails = data;
                    let length = data.length;
                    let modalBody = _self.$thumbnailModal.find('div.modal-body');
                    let activePath = (_self._POST !== null) ? _self._POST.image_path : '';
                    for (let i = 0; i  < length; i++) {
                        let url = '/assets/uploads/' + data[i].image_path;
                        let active = (data[i].image_path === activePath ? ' thumbnail-active' : '');
                        let imageItem = '<a data-path="' + data[i].image_path + '" class="post-img' + active + '" style="background-image: url(' + url + ')" ></a>';
                        modalBody.append(imageItem);
                    }
                },
                error (data, status, errorThrown) {
                    let error = $('#error-dialog');
                    error.text('Error occurred : Please Reload the page or contact to administrator');
                    error.fadeIn(1000).delay(5000).fadeOut(1000);
                }
            });

            return this;
        },

        tagEvents () {
            let _self = this;

            $('button.tag-add').on('click', function (event) {
                let tag = _self.$tagInput.val().trim();
                if (tag === '') return false;
                let tags = $('span.tag-name');
                let tagLength = tags.length;
                for (let i = 0; i < tagLength; i++) {
                    if (tags.eq(i).text().trim() === tag) {
                        _self.$tagInput.val('');
                        return false;
                    }
                }

                $.ajax({
                    url: '/api/v1/tags/searchInsert',
                    type: 'POST',
                    dataType: 'json',
                    data: {name: tag},
                    timeout: 10000,

                    success (data, status, errorThrown) {
                        _self.$tagInput.val('');
                        let tagItem = [
                            '<div class="tag-item"><input type="hidden" value="' + data + '" class="tag-id" />',
                            '<span class="tag-name"><i class="fa fa-times-circle"></i> ' + tag + '</span></div>'
                        ].join(' ');
                        _self.$tagBoard.append(tagItem);
                        _self.refreshTagAutoComplete();
                        if (_self._POST !== null) _self.addRelatedTag(data);
                    },
                    error (data, status, errorThrown) {
                        let error = $('#error-dialog');
                        error.text('Error occurred : ' + errorThrown);
                        error.fadeIn(1000).delay(5000).fadeOut(1000);
                    }
                });
            });

            $(document).on('click', 'span.tag-name i', function (event) {
                let tagItem = $(this).closest('div.tag-item');
                let id = tagItem.find('input.tag-id').val();
                tagItem.remove();
                if (_self._POST !== null && !isNaN(parseInt(id)) && id !== '') _self.removeRelatedTag(id);
            });

            return this;
        },

        thumbnailEvents () {
            let isSaved = false;

            this.$thumbnailModal.on('click', 'a.post-img', function (event) {
                let selectedItem = $(this);
                if (selectedItem.hasClass('thumbnail-active')) return false;
                let previousItem = $('a.post-img.thumbnail-active');
                previousItem.removeClass('thumbnail-active');
                selectedItem.addClass('thumbnail-active');
            });

            this.$thumbnailModal.on('click', 'button.btn-image-save', function (event) {
                isSaved = true;
                let path = $('a.post-img.thumbnail-active').data('path');
                let thumbnail = $('a#thumbnail-input');
                let icon = thumbnail.find('span');
                if (icon.length !== 0) icon.remove();
                let preview = $('img.img-preview');
                if (preview.length !== 0) {
                    preview.attr('src', '/assets/uploads/' + path);
                } else {
                    let newPreview = '<img src="/assets/uploads/' + path + '" class="img-preview" />';
                    thumbnail.append(newPreview);
                }
                $('input#post-input-img').val(path);
            });

            this.$thumbnailModal.on({
                'hidden.bs.modal': function (event) {
                    if (isSaved) {
                        isSaved = false;
                        return;
                    }
                    isSaved = false;
                    let items = $('a.post-img');
                    let length = items.length;
                    let currentPath = $('input#post-input-img').val().trim();
                    items.removeClass('thumbnail-active');
                    for (let i = 0; i < length; i++) {
                        if (items.eq(i).data('path') === currentPath) {
                            items.eq(i).addClass('thumbnail-active');
                        }
                    }
                }
            });

            return this;
        },

        postEvents () {
            let _self = this;
            $('#btn-save').on('click', function (event) {
                let isEditing = _self._POST !== null;
                let id = (_self._POST !== null) ? parseInt(_self._POST.id) : null;
                let data = {};
                data.title = $('#post-input-title').val().trim();
                data.description = $('#post-input-description').val().trim();
                data.body = _self.editor.value();
                data.image_path = $('#post-input-img').val().trim();
                data.category_id = $('#post-input-category').val().trim();
                let error = _self.validateParams(data);
                if (error !== null) return _self.showError(error);

                if (id === null) {
                    // It's Creating Post so I need to get tags too.
                    let tags = '';
                    let glue = '';
                    let tagItems = $('input.tag-id');
                    let length = tagItems.length;
                    for (let i = 0; i < length; i++) {
                        tags += (glue + tagItems.eq(i).val());
                        if (glue === '') glue = ',';
                    }
                    data.tags = tags;
                }

                let method = isEditing ? 'PUT' : 'POST';
                let url = '/api/v1/posts' + (isEditing ? ('/' + id) : '');
                $.ajax({
                    url: url,
                    type: method,
                    dataType: 'json',
                    data: data,
                    timeout: 10000,

                    success (data, status, errorThrown) {
                        // TODO: Show Preview ?
                        window.location.href = '/admin/posts';
                    },
                    error (data, status, errorThrown) {
                        let error = $('#error-dialog');
                        error.text('Error occurred : Please Reload the page or contact to administrator');
                        error.fadeIn(1000).delay(5000).fadeOut(1000);
                    }
                });
            });
        },

        getPostData() {
            let _self = this;
            $.ajax({
                url: '../../../admin/posts/data/' + _self._POST.id,
                type: 'GET',
                dataType: 'json',
                timeout: 10000,

                success (data, status, errorThrown) {
                    let length = data.tags.length;
                    if (length === 0) return;
                    for (let i = 0; i < length; i++) {
                        let tagItem = [
                            '<div class="tag-item"><input type="hidden" value="' + data.tags[i].id + '" class="tag-id" />',
                            '<span class="tag-name"><i class="fa fa-times-circle"></i> ' + data.tags[i].name + '</span></div>'
                        ].join(' ');
                        _self.$tagBoard.append(tagItem);
                    }
                },
                error (data, status, errorThrown) {
                    let error = $('#error-dialog');
                    error.text('Error occurred : Please Reload the page or contact to administrator');
                    error.fadeIn(1000).delay(5000).fadeOut(1000);
                }
            });
        },

        refreshTagAutoComplete () {
            let _self = this;
            $.getJSON('/api/v1/tags', null, function (tags) {
                let options = _self.$tagSearchedResult.find('option');
                let optionLength = options.length;
                let tagLength = tags.length;
                let difference = optionLength - tagLength;
                if (difference > 0) {
                    options.slice(tagLength, optionLength).remove();
                }
                for (let i = 0; i < tagLength; i++) {
                    if (i >= optionLength) {
                        let tagOption = '<option value="' + tags[i].name + '" >';
                        _self.$tagSearchedResult.append(tagOption);
                    } else {
                        options.eq(i).val(tags[i].name);
                    }
                }
            });
        },

        addRelatedTag (tag_id) {
            let _self = this;
            $.ajax({
                url: '/api/v1/posts/relatedTag',
                type: 'POST',
                dataType: 'json',
                data: {post_id: _self._POST.id, tag_id: tag_id},
                timeout: 10000,

                error (data, status, errorThrown) {
                    let error = $('#error-dialog');
                    error.text('Error occurred : ' + errorThrown);
                    error.fadeIn(1000).delay(5000).fadeOut(1000);
                }
            });
        },

        removeRelatedTag (tag_id) {
            let _self = this;
            $.ajax({
                url: '/api/v1/posts/relatedTag',
                type: 'DELETE',
                dataType: 'json',
                data: {post_id: _self._POST.id, tag_id: tag_id},
                timeout: 10000,

                error (data, status, errorThrown) {
                    let error = $('#error-dialog');
                    error.text('Error occurred : ' + errorThrown);
                    error.fadeIn(1000).delay(5000).fadeOut(1000);
                }
            });
        },

        validateParams (params) {
            let error = null;
            if (params.title === null || params.title === undefined || params.title === '') error = "Post title is required...";
            if (params.description === null || params.description === undefined || params.description === '') error = "Post description is required...";
            if (params.body === null || params.body === undefined || params.body === '') error = "Post content is required...";
            if (params.image_path === null || params.image_path === undefined || params.image_path === '') error ="Post thumbnail is required...";
            if (params.category_id === null || params.category_id === undefined || params.category_id === '') error = "Category is required...";
            return error;
        },

        showError (error) {
            alert(error);
        },
    };

    $(function () {
        PostEditor.initialize();
    });
}).apply(this, [jQuery]);