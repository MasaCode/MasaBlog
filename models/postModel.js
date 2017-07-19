'use strict';

let db = require('./db.js');

module.exports = {
    table: 'masa_posts',

    findById (id) {
        return db.getRow("select * from " + this.table + " where id=?", [id]);
    },

    findByText(text) {
        text = '%' + text + '%';
        return db.getResult("select * from " + this.table + " where is_active=true and (title like ? or description like ? or body like ?) order by sequence DESC", [text, text, text]);
    },

    findByCategory (id) {
        return db.getResult("select * from " + this.table + " where is_active=true and category_id=? order by sequence DESC", [id]);
    },

    findAll () {
        return db.getResult("select * from " + this.table + " where is_active=true order by sequence DESC", null);
    },

    findRecent (limit) {
        return db.getResult("select * from " + this.table + " where is_active=true order by created_at DESC limit ?", [limit]);
    },

    findInRange (offset, limit) {
        return db.getResult("select * from " + this.table + " where is_active=true order by sequence DESC limit ? offset ?", [limit, offset]);
    },

    findByCategoryInRange (id, offset, limit) {
        return db.getResult("select * from " + this.table + " where is_active=true and category_id = ? order by sequence DESC limit ? offset ?", [id, limit, offset]);
    },

    count () {
        let _self = this;
        return new Promise((resolve, reject) => {
            db.query("select COUNT(is_active=true) as count from " + _self.table, null, function (error, result) {
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

    updateSequence (id) {
        let _self = this;
        return new Promise((resolve, reject) => {
            db.query("update " + _self.table + " set sequence = sequence + 1 where id=?", [id], function (error, result) {
                if (error) reject(error);
                else resolve(result);
            });
        });
    },

    delete (id) {
        return db.updateSync(this.table, id, {is_active: false});
    }
};