(function ($) {
    'use strict';

    let PostContent = {
        COMMENT_MAX_HEIGHT: 120,

        initialize () {
            this._post = POST;
            this._tags = TAGS;
            this.build().events();
        },

        build () {
            // Setting post informations (tag, date)
            let date = moment(new Date(this._post.created_at)).format('MMMM Do YYYY');
            let tagLength = this._tags.length;
            let tagInfo = '', glue = '';
            for (let i = 0; i < tagLength; i++) {
                tagInfo += (glue + this._tags[i].name);
                if (glue === '') glue = ', ';
            }
            let info = '<i class="fa fa-calendar"></i> ' + date + (tagInfo !== '' ? ' <i class="fa fa-tags"></i> ' + tagInfo : '');
            $('p.post-info').html(info);

            // Setting comments element
            this.setCommentAdditionals();

            // Updating Post's sequence -> previous value + 1
            $.ajax({
                url: '/api/v1/posts/sequence/' + this._post.id,
                type: 'PUT',
                dataType: 'json',
                timeout: 10000,

                error (data, status, errorThrown) {
                    let error = $('#error-dialog');
                    error.text('Error Occurred.. Please check your internet connection and contact administrator.');
                    error.fadeIn(1000).delay(3000).fadeOut(1000);
                }
            });

            return this;
        },

        events () {
            let _self = this;

            $(document).on('click', '#comment-show', function (event) {
                let icon = $(this).find('span');
                let commentContent = $('div.comment-content');
                let layer = $('div.comment-layer');
                if (icon.hasClass('fa-chevron-down')) {
                    icon.removeClass('fa-chevron-down');
                    icon.addClass('fa-chevron-up');
                    commentContent.css('overflow-y', 'visible');
                    commentContent.css('max-height', 'inherit');
                    layer.hide();
                } else {
                    icon.removeClass('fa-chevron-up');
                    icon.addClass('fa-chevron-down');
                    commentContent.css('overflow-y', 'hidden');
                    commentContent.css('max-height', _self.COMMENT_MAX_HEIGHT + 'px');
                    layer.show();
                }
            });

            $('#comment-form').on('submit', function (event) {
                event.preventDefault();

                let data = {};
                data.post_id = _self._post.id;
                data.username = $('#comment-input-name').val().trim();
                data.email = $('#comment-input-email').val().trim();
                data.comments = $('#comment-input-body').val().trim();

                let error = $('span.error-text');
                if (data.username === '' || data.email === '' || data.comments === '') {
                    error.text('Please input all fields');
                    return;
                }
                let regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                if (!regex.test(data.email)) {
                    error.text('Invalid Email Addres...');
                    return;
                }
                error.text('');

                let submit = $('.comment-submit');
                $.ajax({
                    url: '/api/v1/comments',
                    type: 'POST',
                    dataType: 'json',
                    data: data,
                    timeout: 10000,

                    beforeSend (xhr, settings) {
                        submit.prop('disabled', true);
                    },
                    complete (xhr, settings) {
                        submit.prop('disabled', false);
                        $('#comment-input-name').val('');
                        $('#comment-input-email').val('');
                        $('#comment-input-body').val('');
                    },
                    success (data, status, errorThrown) {
                        _self.refreshComments();
                        let success = $('#success-dialog');
                        success.text('Comment has been successfully created.');
                        success.fadeIn(1000).delay(3000).fadeOut(1000);
                    },
                    error (data, status, errorThrown) {
                        _self.refreshComments();
                        let error = $('#error-dialog');
                        error.text('Error Occurred: ' + errorThrown);
                        error.fadeIn(1000).delay(3000).fadeOut(1000);
                    }
                });
            });
        },

        refreshComments () {
            let _self = this;
            $.getJSON('/api/v1/comments/post/' + this._post.id, null, function (comments) {
                let content = $('div.comment-content');
                let items = $('div.comment');
                let itemLength = items.length;
                let commentLength = comments.length;
                let difference = itemLength - commentLength;

                if (commentLength !== 0) {
                    $('div.comment-wrapper').css('display', 'block');
                }
                if (difference > 0) {
                    items.slice((itemLength - difference), itemLength).remove();
                }

                for (let i = 0; i < commentLength; i++) {
                    let date = moment(new Date(comments[i].date)).format('MMM Do, YYYY');
                    if (i >= itemLength) {
                        let commentItem = [
                            '<div class="comment"><h4 class="commenter">' + comments[i].username + ' <small>on ' + date + '</small></h4>',
                            '<p class="comment-body">' + comments[i].comments + '</p></div>'
                        ].join(' ');
                        content.append(commentItem);
                    } else {
                        let item = items.eq(i);
                        item.find('h4.commenter').html(comments[i].username + ' <small>on ' + date + '</small>')
                        item.find('p.comment-body').text(comments[i].comments);
                    }
                }

                _self.setCommentAdditionals();
            });
        },

        setCommentAdditionals () {
            let comments = $('div.comment');
            let commentLength = comments.length;
            if (commentLength !== 0) {
                let height = 0;
                for (let j = 0; j < commentLength; j++) {
                    height += comments.eq(j).get(0).offsetHeight;
                }
                if (height > this.COMMENT_MAX_HEIGHT) {
                    if ($('#comment-show').length === 0) $('div.comment-wrapper').append('<a id="comment-show" class="btn"><span class="fa fa-chevron-down"></span></a>');
                    if ($('div.comment-layer').length === 0) $('div.comment-content').append('<div class="comment-layer"></div>');
                }
            }
        },
    };

    $(function () {
        PostContent.initialize();
    });
}).apply(this, [jQuery]);
