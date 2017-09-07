'use strict';

let db = require('./db.js');

module.exports = {
    table: 'masa_comments',

    findById (id) {
        return db.getRow("select * from " + this.table + " where id=?", [id]);
    },

    findByPost (id) {
        return db.getResult("select * from " + this.table + " where is_active=true and post_id=?", [id]);
    },

    findUserCommentsByPost (id) {
        return db.getResult("select * from " + this.table + " where is_active=true and reply_to is NULL and post_id=?", [id]);
    },

    findReplyByPost (id) {
        return db.getResult("select * from " + this.table + " where is_active=true and reply_to is not NULL and post_id=? order by reply_to", [id]);
    },

    findAll () {
        return db.getResult("select * from " + this.table + " where is_active=true", null);
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

    countByPost (id) {
        let _self = this;
        return new Promise((resolve, reject) => {
            db.query("select COUNT(is_active=true) as count from " + _self.table + " where post_id=?", [id], function (error, result) {
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
        return db.updateSync(this.table, id, {is_active: true});
    }
};