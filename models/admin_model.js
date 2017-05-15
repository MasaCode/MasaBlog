'use strict';

var db = require('./db.js');
var bcrypt = require('bcryptjs');

module.exports = {
    table: 'masa_admins',

    findById: function (id) {
        return db.getRow("select * from " + this.table + " where id=?", [id]);
    },

    findByUsername: function (username) {
        return db.getResult("select * from " + this.table + " where username=? and is_active=true", [username]);
    },

    findAll: function () {
        return db.getResult("select * from " + this.table + " where is_active=true", null);
    },

    insert: function (data) {
        return db.insertSync(this.table, data);
    },

    update: function (id, data) {
        return db.updateSync(this.table, id, data);
    },

    delete: function (id) {
        return db.updateSync(this.table, id, {is_active: false});
    },

    verifyPassword: function (inputPassword, hashedPassword) {
        return bcrypt.compareSync(inputPassword, hashedPassword);
    },

    hashPassword: function (password) {
        var salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(password, salt);
    }
};