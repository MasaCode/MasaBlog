'use strict';

let db = require('./db.js');

module.exports = {
    table: 'masa_tags',

    findById (id) {
        return db.getRow("select * from " + this.table + " where id=?", [id]);
    },

    findAll () {
        return db.getResult("select * from " + this.table + " where is_active=true", null);
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