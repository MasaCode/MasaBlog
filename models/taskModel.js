'use strict';

let db = require('./db.js');

module.exports = {
    table: 'masa_tasks',

    findById (id) {
        return db.getRow("select * from " + this.table + " where id=?", [id]);
    },

    findByAdmin (id) {
        return db.getResult("select * from " + this.table + " where admin_id=? order by created_at asc", [id]);
    },

    findAll () {
        return db.getResult("select * from " + this.table, null);
    },

    insert (data) {
        return db.insertSync(this.table, data);
    },

    delete (id) {
        return db.deleteSync(this.table, id);
    }
};