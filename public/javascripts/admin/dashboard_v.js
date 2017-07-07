(function ($) {
    'use strict';

    let Dashboard = {
        options: {
            taskBoard: 'div.tasks',
            taskInput: 'input#input-task',
            taskSubmit: 'button#add-task',
            taskCheckBox: 'input.task-checkbox',
            eventModal: '#event-edit-modal',
            eventForm: '#modal-form',
            startDate: 'div.event-date-start',
            endDate: 'div.event-date-end',
        },
        editingEvent: null,

        initialize () {
            this.$taskBoard = $(this.options.taskBoard);
            this.$taskInput = $(this.options.taskInput);
            this.$taskSubmit = $(this.options.taskSubmit);
            this.$eventModal = $(this.options.eventModal);
            this.$eventForm = $(this.options.eventForm);
            this.$startDate = $(this.options.startDate);
            this.$endDate = $(this.options.endDate);
            this.build().events();
        },

        build () {
            let _self = this;

            this.$calendar = $('#calendar').fullCalendar({
                header: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'month,agendaWeek,agendaDay'
                },

                eventClick (event, jsEvent, view ) {
                    _self.$eventModal.modal('show');
                    _self.editingEvent = event;
                    let id = parseInt(event.id);
                    $.ajax({
                        url: 'api/v1/events/' + id,
                        type: 'GET',
                        dataType: 'json',
                        timeout: 10000,

                        success (data, status, errorThrown) {
                            $('#modal-input-id').val(data.id);
                            $('#modal-input-title').val(data.title);
                            $('#modal-input-start').val(moment(data.start).format('MM/DD/YYYY hh:mm A'));
                            $('#modal-input-end').val(moment(data.end).format('MM/DD/YYYY hh:mm A'));
                            $('#modal-input-all-day').prop('checked', (parseInt(data.all_day) === 1));
                            _self.$eventModal.find('#modal-input-submit').after('<button class="btn btn-danger" id="modal-input-remove">Remove</button>');
                        },
                        error (data, status, errorThrown) {
                            let error = $('#error-dialog');
                            error.text('Error occurred while retrieving event data...');
                            error.fadeIn(1000).delay(3000).fadeOut(1000);
                            setTimeout(function () {
                                window.location.reload();
                            }, 5000);
                        }
                    });

                },

                dayClick (date, jsEvent, view) {
                    _self.$eventModal.modal('show');
                    _self.$eventModal.find('#AddModalLabel').text('Create Event');
                    let selectedDate = moment(date).format('MM/DD/YYYY hh:mm A');
                    $('#modal-input-start').val(selectedDate);
                    _self.$endDate.data("DateTimePicker").minDate(date);
                }
            });

            $.ajax({
                url: 'admin/data',
                type: 'GET',
                dataType: 'json',
                timeout: 30000,

                success (data, status, errorThrown) {
                    $('h3.post-count').text(data.post.count);
                    $('h3.category-count').text(data.category.count);
                    $('h3.tag-count').text(data.tag.count);
                    $('h3.thumbnail-count').text(data.thumbnail.count);
                    $('h3.comment-count').text(data.comment.count);
                    _self.setWeather(data.weather);
                    _self.setTasks(data.tasks);
                    _self.setRecentPosts(data.post.posts);
                    _self.setEvents(data.events);
                },
                error (data, status, errorThrown) {
                    let error = $('#error-dialog');
                    error.text('Error occurred : Please reload the page...');
                    error.fadeIn(1000).delay(3000).fadeOut(1000);
                }
            });

            this.$startDate.datetimepicker();
            this.$endDate.datetimepicker({
                useCurrent: false
            });

            return this;
        },

        refresh () {
            let _self = this;
            $.getJSON('api/v1/tasks', null, function (tasks) {
                _self.setTasks(tasks);
            });
        },

        refreshEvent () {
            let _self = this;
            $.getJSON('api/v1/events', null, function (events) {
                _self.$calendar.fullCalendar('removeEvents');
                _self.setEvents(events);
            });
        },

        events () {
            let _self = this;

            this.$taskSubmit.on('click', function (event) {
                let task = _self.$taskInput.val().trim();
                if (task === '') return false;

                $.ajax({
                    url: 'api/v1/tasks',
                    type: 'POST',
                    dataType: 'json',
                    data: {description: task},
                    timeout: 10000,

                    success (data, status, errorThrown) {
                        let success = $('#success-dialog');
                        success.text('The task successfully has been created');
                        success.fadeIn(1000).delay(3000).fadeOut(1000);
                        _self.$taskInput.val('');
                        _self.refresh();
                    },
                    error (data, status, errorThrown) {
                        let error = $('#error-dialog');
                        error.text('Error occurred : ' + errorThrown);
                        error.fadeIn(1000).delay(3000).fadeOut(1000);
                        _self.refresh();
                    }
                });
            });

            $(document).on('click', this.options.taskCheckBox, function (event) {
                let $box = $(this).parent();
                let id = $box.find('input.task-id').val();
                $.ajax({
                    url: 'api/v1/tasks/' + id,
                    type: 'DELETE',
                    dataType: 'json',
                    data: {id: id},
                    timeout: 10000,

                    success (data, status, errorThrown) {
                        let success = $('#success-dialog');
                        success.text('The task successfully has been deleted');
                        success.fadeIn(1000).delay(3000).fadeOut(1000);
                        _self.refresh();
                    },
                    error (data, status, errorThrown) {
                        let error = $('#error-dialog');
                        error.text('Error occurred : ' + errorThrown);
                        error.fadeIn(1000).delay(3000).fadeOut(1000);
                        _self.refresh();
                    }
                });
            });

            this.$eventModal.on({
                'hidden.bs.modal': function (event) {
                    _self.$eventForm.get(0).reset();
                    $('#modal-input-id').val('');
                    $('span.error-text').text('');
                    let removeButton = $('#modal-input-remove');
                    if (removeButton.length !== 0) removeButton.remove();
                    _self.editingEvent = null;
                    _self.$eventModal.find('#AddModalLabel').text('Edit Event');
                }
            });

            this.$eventForm.on('submit', function (event) {
                event.preventDefault();
                let data = {};
                let id = parseInt($('#modal-input-id').val());
                data.title = $('#modal-input-title').val().trim();
                data.start = moment(new Date($('#modal-input-start').val().trim())).format('YYYY-MM-DD HH:mm');
                data.end = moment(new Date($('#modal-input-end').val().trim())).format('YYYY-MM-DD HH:mm');
                data.all_day = $('#modal-input-all-day').prop('checked') === true ? 1 : 0;
                let error = _self.validateEventParams(data, ['title', 'start', 'end']);
                if (error !== true) {
                    $('span.error-text').text(error);
                    return;
                }
                let method = (!isNaN(id) && id !== '') ? 'PUT' : 'POST';
                let endPoint = 'api/v1/events' + ((method === 'PUT') ? '/' + id : '');
                $.ajax({
                    url: endPoint,
                    type: method,
                    dataType: 'json',
                    data: data,
                    timeout: 10000,

                    success (eventData, status, errorThrown){
                        _self.refreshEvent();
                        _self.$eventModal.find('button:last-child').click();
                        let success = $('#success-dialog');
                        success.text('The task successfully has been ' + (method === 'PUT' ? 'updated' : 'created'));
                        success.fadeIn(1000).delay(3000).fadeOut(1000);
                    },
                    error (data, status, errorThrown) {
                        _self.$eventModal.find('button:last-child').click();
                        let error = $('#error-dialog');
                        error.text('Error occurred : ' + errorThrown);
                        error.fadeIn(1000).delay(3000).fadeOut(1000);
                        _self.refreshEvent();
                    }
                });
            });

            $(document).on('click', '#modal-input-remove', function (event) {
                let id = $('#modal-input-id').val();
                $.ajax({
                    url: 'api/v1/events/' + id,
                    type: 'DELETE',
                    dataType: 'json',
                    data: {id: id},
                    timeout: 10000,

                    success (data, status, errorThrown) {
                        _self.$eventModal.find('button:last-child').click();
                        let success = $('#success-dialog');
                        success.text('The task successfully has been deleted');
                        success.fadeIn(1000).delay(3000).fadeOut(1000);
                        _self.refreshEvent();
                    },
                    error (data, status, errorThrown) {
                        _self.$eventModal.find('button:last-child').click();
                        let error = $('#error-dialog');
                        error.text('Error occurred : ' + errorThrown);
                        error.fadeIn(1000).delay(3000).fadeOut(1000);
                        _self.refreshEvent();
                    }
                });
            });

            this.$startDate.on("dp.change", function (e) {
                _self.$endDate.data("DateTimePicker").minDate(e.date);
            });
            this.$endDate.on("dp.change", function (e) {
                _self.$startDate.data("DateTimePicker").maxDate(e.date);
            });

            return this;
        },

        setWeather (weather) {
            $('h3.min-temp').html(weather.main.temp_min + ' <small>&deg;C</small>');
            $('h3.max-temp').html(weather.main.temp_max + ' <small>&deg;C</small>');
            let code = weather.weather[0].id;
            let icon = $('span.weather-icon i');
            let iconClass = '';
            if (code < 300) {
                // Thunderstorm 2xx
                iconClass = 'wi-day-thunderstorm';
            } else if (code < 400) {
                // Drizzle 3xx
                iconClass = 'wi-day-rain-wind';
            } else if (code >= 500 && code < 600) {
                // Rain 5xx
                iconClass = 'wi-day-rain';
            } else if (code >= 600 && code < 700) {
                // Snow 6xx
                iconClass = 'wi-day-snow';
            } else if (code >= 700 && code < 800) {
                // Atmosphere 7xx
                iconClass = 'wi-windy';
            } else if (code === 800) {
                // Clear Sky
                iconClass = 'wi-day-sunny';
            } else if (code > 800 && code < 900) {
                // Clouds 8xx
                iconClass = 'wi-day-cloudy-high';
            } else {
                // Other weather (Extreme, Additional)
                iconClass = 'wi-tornado';
            }
            icon.removeClass('wi-day-cloudy-high');
            icon.addClass(iconClass);
        },

        setTasks (tasks) {
            let length = tasks.length;
            let taskItems = $('div.task-item');
            let taskItemLength = taskItems.length;
            let difference = taskItemLength - length;
            if (length === 0 && taskItemLength === 0) return;
            if (difference > 0) {
                taskItems.slice((taskItemLength - difference), taskItemLength).remove();
            }
            for (let i = 0; i < length; i++) {
                if (i >= taskItemLength) {
                    let taskItem = [
                        '<div class="task-item"><input type="hidden" value="' + tasks[i].id + '" class="task-id" />',
                        '<input type="checkbox" class="checkbox task-checkbox" /><span class="task-description">' + tasks[i].description + '</span></div>',
                    ].join(' ');
                    this.$taskBoard.append(taskItem);
                } else {
                    let item = $(taskItems[i]);
                    item.find("input.task-id").val(tasks[i].id);
                    item.find('span.task-description').text(tasks[i].description);
                }
            }
        },

        setRecentPosts (posts) {
            let length = posts.length;
            let postBoard = $('ul.post-board');
            let postItem = $('li.post-item');
            let postItemLength = postItem.length;
            let difference = postItemLength - length;
            if (length === 0 && postItemLength === 0) {
                postBoard.append('<li class="list-group-item post-item">No Post is published yet...</li>');
                return;
            }
            if (difference > 0) {
                postItem.slice((postItemLength - difference), postItemLength).remove();
            }
            for (let i = 0; i < length; i++) {
                if (i >= postItemLength) {
                    let newPost = [
                        '<li class="list-group-item post-item"><a href="admin/posts/edit/' + posts[i].id + '">',
                        '<h4 class="text-left post-title">' + posts[i].title + '</h4></a></li>'
                    ].join(' ');
                    postBoard.append(newPost);
                } else {
                    let item = $(postItem[i]);
                    item.find('a').attr('href', 'admin/posts/' + posts[i].id);
                    item.find('.post-title').text(posts[i].title);
                }
            }
        },

        setEvents (events) {
            let length = events.length;
            for (let i = 0; i < length; i++) {
                events[i].start = new Date(events[i].start);
                events[i].end = new Date(events[i].end);
            }
            this.$calendar.fullCalendar('renderEvents', events);
        },

        validateEventParams(params, keys) {
            let length = keys.length;
            for (let i = 0; i < length; i++) {
                let value = params[keys[i]];
                if (value === undefined || value === null || value === '') return keys[i] + ' is required...';
            }
            return true;
        },
    };

    $(function () {
        Dashboard.initialize();
    });
}).apply(this, [jQuery]);