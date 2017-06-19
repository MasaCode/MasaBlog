'use strict';

let db = require('./db.js');

module.exports = {
    table: 'masa_thumbnails',

    findById (id) {
        return db.getRow("select * from " + this.table + " where id=?", [id]);
    },

    findAll () {
        return db.getResult("select * from " + this.table, null);
    },

    count () {
        let _self = this;
        return new Promise((resolve, reject) => {
            db.query("select COUNT(*) as count from " + _self.table, null, function (error, result) {
                if (error) reject(error);
                else resolve(result[0]);
            });
        });
    },

    insert (data) {
        return db.insertSync(this.table, data);
    },

    update (id, data) {
        return db.updateSync(this.table, id, data);
    },

    delete (id) {
        return db.deleteSync(this.table, id);
    }
};
