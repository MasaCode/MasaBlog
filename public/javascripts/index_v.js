'use strict';

$(window).on('load', function () {
    var boxheight = $('#my-carousel .carousel-inner').innerHeight();
    var itemLength = $('#my-carousel .item').length;
    var triggerheight = Math.round(boxheight / itemLength + 1);
    $('#my-carousel .list-group-item').outerHeight(triggerheight);
});

(function ($) {
    var Index = {
        initialize: function () {
            this.events();
        },

        events: function () {
            $(document).ready(function () {
                var clickEvent = false;
                $('#my-carousel').carousel({
                    interval: 4000
                }).on('click', '.list-group li', function () {
                    clickEvent = true;
                    $('.list-group').find('li.active').removeClass('active');
                    $(this).addClass('active');
                }).on('slid.bs.carousel', function (event) {
                    if(!clickEvent) {
                        var count = parseInt($('.list-group').children().length - 1);
                        var current = $('.list-group li.active');
                        current.removeClass('active').next().addClass('active');
                        var id = parseInt(current.data('slide-to'));
                        if (count === id) {
                            $('.list-group li').first().addClass('active');
                        }
                    }

                    clickEvent = false;
                });
            });

            $(window).on('resize', function () {
                var boxheight = $('#my-carousel .carousel-inner').innerHeight();
                var itemLength = $('#my-carousel .item').length;
                var triggerheight = Math.round(boxheight / itemLength + 1);
                $('#my-carousel .list-group-item').outerHeight(triggerheight);
            });
        },
    };

    $(function () {
        Index.initialize();
    });
}).apply(this, [jQuery]);

