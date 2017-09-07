(function ($) {
    'use strict';

    let Comments = {

        initialize() {
            this.$replyForm = $('#reply-form');
            this.$error = $('span.error-text');
            this._replies = REPLIES;

            this.build().events();
        },

        build() {
            let length = this._replies.length;
            if (length === 0) return this;

            this._replies.sort(function (a, b) {
                let comparison = 0;
                let aReply = parseInt(a.reply_to);
                let bReply = parseInt(b.reply_to);

                if (aReply > bReply) {
                    comparison = 1;
                } else if (aReply < bReply) {
                    comparison = -1;
                }

                return comparison;
            });

            let comments = $('div.comment');
            let commentLength = comments.length;
            let j = 0;
            for (let i = 0; i < length; i++) {
                let replyTo = parseInt(this._replies[i].reply_to);
                while (j < commentLength) {
                    let comment = comments.eq(j);
                    if (replyTo === parseInt(comment.find('input.comment-id').val())) {
                        this.addReplyComment(comment, this._replies[i]);
                        break;
                    }
                    j++;
                }
            }

            return this;
        },

        events () {
            let _self = this;
            
            $('.btn-reply').on('click', function (event) {
                let $this = $(this);
                let comment = $this.closest('div.comment');
                let id = comment.find('input.comment-id').val();
                if (_self.$replyForm.is(':visible')) {
                    let comment = _self.$replyForm.closest('div.comment');
                    comment.find('.btn-reply').show();
                    _self.resetForm();
                    _self.$replyForm.hide();
                }
                comment.append(_self.$replyForm);
                _self.$replyForm.find('input#reply-to').val(id);
                _self.$replyForm.toggle('Slow');
                $(this).hide();
            });

            $('#reply-cancel').on('click', function (event) {
                let $this = $(this);
                let comment = $this.closest('div.comment');
                comment.find('.btn-reply').show();
                _self.$replyForm.toggle('Slow');
                _self.resetForm();
            });

            $('#reply-submit').on('click', function (event) {
                let replyComment = {};
                replyComment.post_id = _self.$replyForm.find('input#reply-post-id').val();
                replyComment.reply_to = _self.$replyForm.find('input#reply-to').val();
                replyComment.email = _self.$replyForm.find('input#reply-email').val();
                replyComment.username = _self.$replyForm.find('input#reply-username').val();
                replyComment.comments = _self.$replyForm.find('textarea#reply-body').val();
                for (let key in replyComment) {
                    if (!replyComment.hasOwnProperty(key)) continue;
                    if (replyComment[key] === '') {
                        _self.$error.text('Invalid ' + key.replace('_', ' '));
                        return;
                    }
                }
                _self.$error.text('');

                let comment = $(this).closest('div.comment');
                replyComment.commenterUsername = comment.find('.commenter-username').text();
                replyComment.commenterEmail = comment.find('.comment-email').val();

                let submit = $(this);
                $.ajax({
                    url: '/api/v1/comments/reply',
                    type: 'POST',
                    dataType: 'json',
                    data: replyComment,
                    timeout: 10000,

                    beforeSend (xhr, settings) {
                        submit.prop('disabled', true);
                    },
                    complete (xhr, settings) {
                        submit.prop('disabled', false);
                    },
                    success (data, status, errorThrown) {
                        _self.$replyForm.toggle('slow');
                        _self.resetForm();
                        replyComment.date = new Date();
                        _self.addReplyComment(comment, replyComment);
                        comment.find('.btn-reply').show();
                        let success = $('#success-dialog');
                        success.text('Comments successfully have been replied');
                        success.fadeIn(1000).delay(3000).fadeOut(1000);
                    },
                    error (data, status, errorThrown) {
                        _self.resetForm();
                        comment.find('.btn-reply').show();
                        let error = $('#error-dialog');
                        error.text('Error occurred : ' + errorThrown);
                        error.fadeIn(1000).delay(3000).fadeOut(1000);
                    }
                });
            });
        },

        addReplyComment (comment, data) {
            if (comment.find('div.reply').length === 0) {
                comment.append('<div class="reply"><hr class="reply-line"></div>');
            }

            let date = moment(new Date(data.date)).format('MMM Do, YYYY');
            let replyComment = [
                '<div class="reply-comment">',
                '<h4 class="commenter"><span class="commenter-info"><span class="commenter-username">' + data.username + '</span> <small>on ' + date + '</small></span></h4>',
                '<p class="comment-body">' + data.comments + '</p></div>'
            ].join(' ');

            comment.find('div.reply').append(replyComment);
        },

        resetForm () {
            this.$replyForm.find('input#reply-to').val('');
            this.$replyForm.find('textarea#reply-body').val('');
            this.$error.text('');
        }
    };

    $(function () {
        Comments.initialize();
    });
}).apply(this, [jQuery]);
