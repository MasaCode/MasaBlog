'use strict';

let db = require('./db.js');

module.exports = {
    table: 'masa_events',

    findById (id) {
        return db.getRow("select * from " + this.table + " where id=?", [id]);
    },

    findByAdmin (id) {
        return db.getResult("select id, title, start, end, all_day as allDay from " + this.table + " where admin_id=? and is_active=true", [id]);
    },

    findAll () {
        return db.getResult("select id, title, start, end, all_day as allDay from " + this.table + " where is_active=true", null);
    },

    insert (data) {
        return db.insertSync(this.table, data);
    },

    update (id, data) {
        return db.updateSync(this.table, id, data);
    },

    delete (id) {
        return db.updateSync(this.table, id, {is_active: false});
    }
};