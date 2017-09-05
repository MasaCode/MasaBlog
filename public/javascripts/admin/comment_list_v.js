(function ($) {
    'use strict';

    let CommentList = {
        commentMaxLength: 0,
        currentPage: 0,

        initialize () {
            let _self = this;
            this.commentMaxLength = parseInt(COMMENT_MAX_LENGTH);
            this._comments = COMMENTS;
            let totalPage = Math.ceil(parseInt(this._comments.length) / parseFloat(this.commentMaxLength));
            let nav = $('ul#comment-pagination');
            this.currentPage = 1;

            if (totalPage <= 1) return this;

            nav.twbsPagination({
                totalPages: totalPage,
                visiblePages: _self.commentMaxLength,
                onPageClick: function (event, page) {
                    let offset = (page - 1) * _self.commentMaxLength;
                    let limit = page * _self.commentMaxLength;
                    if (page === _self.currentPage) return false;
                    _self.currentPage = page;
                    _self.changeComments(_self._comments.slice(offset, limit));
                }
            });
        },

        changeComments (comments) {
            let length = Math.min(comments.length, this.commentMaxLength);
            let commentBox = $('div.comment-wrapper');
            let item = $('div.comment');
            let itemLength = item.length;
            let difference = itemLength - length;

            if (difference > 0) {
                item.slice((itemLength - difference), itemLength).remove();
            }

            for (let i = 0; i < length; i++) {
                if (i >= itemLength) {
                    let newItem = [
                        '<div class="comment col-md-6"><a href="/admin/comments/' + comments[i].post_id + '" class="content-wrapper">',
                        '<div class="col comment-count"><span class="count">' + comments[i].count + '</span></div>',
                        '<div class="col comment-title"><p class="title">' + comments[i].title + '</p></div></a></div>'
                    ].join(' ');
                    commentBox.append(newItem);
                } else {
                    let comment = $(item[i]);
                    comment.find('a.content-wrapper').attr('href', '/admin/comments/' + comments[i].post_id);
                    comment.find('span.count').text(comments[i].count);
                    comment.find('p.title').text(comments[i].title);
                }
            }
        }
    };

    $(function () {
        CommentList.initialize();
    });
}).apply(this, [jQuery]);