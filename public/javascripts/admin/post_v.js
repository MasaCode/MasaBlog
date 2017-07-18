// TODO: Implement Not Found
(function ($) {
    'use strict';

    let Post = {
        options: {
            searchIcon: '#search-icon-wrapper',
            searchClose: 'span.search-close',
            searchInput: 'input.search-input',
            searchBody: 'div.search-input-wrapper',
            wrapper: 'div.row.post-wrapper',
            post: 'div.post-thumbnail-wrapper',
            deleteModal: '#delete-modal',
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
        pagePost: 0,
        currentPage: 1,

        initialize () {
            this.$searchIcon = $(this.options.searchIcon);
            this.$searchClose = $(this.options.searchClose);
            this.$searchInput = $(this.options.searchInput);
            this.$searchBody = $(this.options.searchBody);
            this.$wrapper = $(this.options.wrapper);
            this.$post = $(this.options.post);
            this.$deleteModal = $(this.options.deleteModal);
            this._POSTS = POSTS;
            this.pagePost = parseInt(POST_PER_PAGE);
            this.setVariables();
            this.stylePost();
            this.build(false, this._POSTS).events();
        },

        refresh () {
            let _self = this;
            $.getJSON('../../api/v1/posts', null, function (posts) {
                _self.managePost(posts);
                _self.build(true, posts);
            });
        },

        build (rebuild, posts) {
            let _self = this;
            let totalPage = Math.ceil(parseInt(posts.length) / parseFloat(this.pagePost));
            let nav = $('ul#post-pagination');
            if (rebuild) {
                nav.empty();
                nav.removeData("twbs-pagination");
                nav.unbind("page");
            }
            if (totalPage < 1) return;

            nav.twbsPagination({
                totalPages: totalPage,
                visiblePages: _self.pagePost,
                onPageClick: function (event, page) {
                    let offset = (page - 1) * _self.pagePost;
                    let limit = page * _self.pagePost;
                    if (page === _self.currentPage) return false;
                    _self.currentPage = page;
                    _self.managePost(posts.slice(offset, limit));
                }
            });

            return this;
        },

        events () {
            let _self = this;

            $(window).on('resize', this.onResize.bind(this));

            this.$searchIcon.on('click', function (event) {
                event.preventDefault();
                _self.$searchBody.show();
                $('body').css('position', 'fixed');
                $('input.search-input').focus().select();
            });

            this.$searchClose.on('click', function (event) {
                event.preventDefault();
                _self.$searchBody.hide();
                $('body').css('position', 'relative');
                $('input.search-input').val('');
            });

            this.$searchInput.on('keydown', function (event) {
                if (event.keyCode === 13) {
                    _self.search($(this).val().trim());
                }
            });

            $(document).on('click', 'a.btn-delete', function (event) {
                let $this = $(this);
                let id = $this.data('id');
                let title = $this.parent().parent().find('h3.post-title').text();
                let executeButton = _self.$deleteModal.find('button:last-child');
                _self.$deleteModal.find('div.modal-body').text("Are you sure you want to delete " + title + "?");
                executeButton.on('click', function (event) {
                    $.ajax({
                        url: '../../api/v1/posts/' + id,
                        type: 'DELETE',
                        dataType: 'json',
                        data: {id: id},
                        timeout: 10000,

                        success (data, status, errorThrown) {
                            _self.refresh();
                            _self.$deleteModal.find('button:first-child').click();
                            executeButton.off('click');
                            let success = $('#success-dialog');
                            success.text('The post has been successfully deleted');
                            success.fadeIn(1000).delay(3000).fadeOut(1000);
                        },
                        error (data, status, errorThrown) {
                            _self.refresh();
                            _self.$deleteModal.find('button:first-child').click();
                            executeButton.off('click');
                            let error = $('#error-dialog');
                            error.text('Error occurred : ' + errorThrown);
                            error.fadeIn(1000).delay(3000).fadeOut(1000);
                        }
                    });
                });
            });
        },

        onResize () {
            let _self = this;
            if (this.isResized === false) {
                this.isResized = setTimeout(function () {
                    _self.setVariables();
                    _self.stylePost();
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

        stylePost () {
            let length = this.$post.length;
            let lastRows = length - (this.rowCounts[this.index] + 1);
            let count = this.rowCounts[this.index];
            let bottom = 0;
            let defaultTop = ($(window).width() <= this.menuBreakpoint) ? 10 : 0;
            for (let i = 0; i < length; i++) {
                let rowIndex = (i % count);
                let left = rowIndex * (this.thumbnailWidth + this.margin) + this.margin * (rowIndex + 1);
                let top = (i >= count) ? this.$post[i - count].offsetHeight + parseInt(this.$post[i - count].style.top.replace('px', '')) + 10 : defaultTop;
                this.$post[i].style.cssText += ''.concat(
                    'top: ' + top + 'px;', 'left: ' + left + 'px;', 'width: ' + this.thumbnailWidth + 'px;', 'position: absolute;'
                );
                let imgBottom = top + $(this.$post[i]).height();
                if (imgBottom >= bottom) {
                    bottom = imgBottom;
                }

            }

            this.$wrapper.css('height', (bottom + this.margin * 2));
        },

        managePost (posts) {
            let length = Math.min(posts.length, this.pagePost);
            let postBox = $(this.options.post);
            let postLength = postBox.length;
            let difference = postLength - length;
            if (difference > 0) {
                postBox.slice((postLength - difference), postLength).remove();
            }

            for (let i = 0; i < length; i++) {
                if (i >= postLength) {
                    let imagePath = '/assets/uploads/' + posts[i].image_path;
                    let editReference = '/admin/posts/edit/' + posts[i].id;
                    let newItem = [
                        '<div class="post-thumbnail-wrapper"><div class="thumbnail post-thumbnail">',
                        '<div class="img-post" style="background-image: url(' + imagePath + ');"></div>',
                        '<div class="caption"><h3 class="text-center post-title">' + posts[i].title + '</h3>',
                        '<p class="thumbnail-desc">' + posts[i].description.substr(0, 150) + '</p>',
                        '<p class="btn-thumbnail"><a href="' + editReference + '" class="btn btn-success btn-edit">Edit</a>',
                        '<a data-toggle="modal" data-target="#delete-modal" class="btn btn-danger btn-delete" data-id="' + posts[i].id + '">Delete</a></p></div></div></div>'
                    ].join(' ');
                    this.$wrapper.append(newItem);
                } else {
                    let item = $(postBox[i]);
                    item.get(0).style = '';
                    item.find('div.img-post').css('background-image', 'url("/assets/uploads/' + posts[i].image_path + '");');
                    item.find('.post-title').text(posts[i].title);
                    item.find('p.thumbnail-desc').text(posts[i].description.substr(0, 150));
                    item.find('.btn-edit').attr('href', '/admin/posts/edit/' + posts[i].id);
                }
            }

            this.$post = $(this.options.post);
            this.setVariables();
            this.stylePost();
        },

        search (searchText) {
            let _self = this;
            if (searchText === '') {
                this.refresh();
                this.$searchBody.hide();
                $('body').css('position', 'relative');
                $('input.search-input').val('');
                return;
            }

            $.ajax({
                url: '../../api/v1/posts/search/' + searchText,
                type: 'GET',
                dataType: 'json',
                timeout: 10000,

                success (data, status, errorThrown) {
                    _self.managePost(data);
                    _self.build(true, data);
                    $('body').css('position', 'relative');
                    $('div.search-input-wrapper').hide('fast');
                },
                error (data, status, errorThrown) {
                    $('body').css('position', 'relative');
                    $('input.search-input').val('');
                    $('div.search-input-wrapper').hide('fast');
                    let error = $('#error-dialog');
                    error.text('Error occurred : ' + errorThrown);
                    error.fadeIn(1000).delay(3000).fadeOut(1000);
                }
            });
        },
    };

    $(function () {
        Post.initialize();
    });
}).apply(this, [jQuery]);