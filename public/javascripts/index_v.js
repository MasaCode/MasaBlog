(function ($) {
    'use strict';

    let Index = {

        currentPage: 1,

        initialize () {
            this.build();
        },

        build () {
            let _self = this;
            this._POST_INFO = POST_INFO;
            let totalPage = Math.ceil(parseInt(POST_INFO.length) / parseFloat(POST_INFO.postNum));
            let nav = $('ul#post-pagination');
            nav.twbsPagination({
                totalPages: totalPage,
                visiblePages: 7,
                onPageClick: function (event, page) {
                    let offset = (page - 1) * _self._POST_INFO.postNum;
                    let limit = page * _self._POST_INFO.postNum;
                    if (page === _self.currentPage) return false;
                    _self.currentPage = page;

                    $.ajax({
                        url: '/api/v1/posts/range',
                        type: 'GET',
                        dataType: 'json',
                        data: {
                            offset: offset,
                            limit: limit
                        },
                        timeout: 10000,

                        success (data, status, errorThrown) {
                            _self.changePage(data);
                            let anchor = $('div.post-body-wrapper');
                            window.scrollTo(0, anchor.offset().top - 50);
                        },
                        error (data, status, errorThrown) {
                            let error = $('#error-dialog');
                            error.text('Error occurred : ' + errorThrown);
                            error.fadeIn(1000).delay(3000).fadeOut(1000);
                        }
                    });
                }
            });

            return this;
        },

        changePage (posts) {
            let postLength = posts.length;
            let items = $('div.blog-post-wrapper');
            let itemLength = items.length;
            let difference = itemLength - postLength;
            let wrapper = $('div.post-body-wrapper');
            if (difference > 0) {
                items.slice(postLength, itemLength).remove();
            }
            for (let i = 0; i < postLength; i++) {
                if (i >= itemLength) {
                    let imagePath = '/assets/uploads/' + posts[i].image_path;
                    let newItem = [
                        '<div class="blog-post-wrapper col-md-6 col-sm-6"><div class="blog-post"><h3><a href="/posts/' + posts[i].id + '">' + posts[i].title + '</a></h3>',
                        '<p class="post-info"></p><hr class="post-line"><div style="background: url(' + imagePath + ');" class="post-img"></div><hr class="post-line">',
                        '<p class="post-desc">' + posts[i].description.substr(0, 150) + '</p><a class="btn-read btn btn-primary" href="/posts/' + posts[i].id + '" >Read More <span class="fa fa-chevron-right"></span></a></div></div>',
                    ].join(' ');
                    wrapper.append(newItem);
                } else {
                    let item = items.eq(i);
                    item.find('h3').html('<a href="/posts/' + posts[i].id + '" >'+ posts[i].title + '</a>');
                    item.find('img').attr('src', '/assets/uploads/' + posts[i].image_path);
                    item.find('p.post-desc').text(posts[i].description.substr(0, 150));
                    item.find('a.btn-read').attr('href', '/posts/' + posts[i].id);
                }
            }
        }
    };

    $(function () {
        Index.initialize();
    });
}).apply(this, [jQuery]);