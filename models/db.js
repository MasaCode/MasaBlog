'use strict';

var mysql = require("mysql");
var config = require(__dirname + '/../docs/environments.js');

module.exports = {
    conn: null,

    connect: function () {
        this.conn = mysql.createConnection({
            host: 'localhost',
            user: config.MYSQL_USER,
            password: config.MYSQL_PASSWORD,
            database: config.MYSQL_DATABASE
        });
    },

    query: function (query, params, callback) {
        this.conn.query(query, params, callback);
    },

    getRow: function (query, params) {
        var _self = this;
        return new Promise(function (resolve, reject) {
            _self.conn.query(query, params, function (err, rows) {
                if (err) reject(err);
                else resolve(rows.length < 1 ? null : rows[0]);
            });
        });
    },

    getResult: function (query, params) {
        var _self = this;
        return new Promise(function (resolve, reject) {
            _self.conn.query(query, params, function (err, rows) {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    insertSync: function (table, data) {
        var _self = this;
        return new Promise(function (resolve, reject) {
            _self.conn.query("insert into " + table + " set ?", data, function (err, result, fields) {
                if (err) reject(err);
                else resolve(result.insertId);
            });
        });
    },

    insert: function (table, data, callback) {
        this.conn.query("insert into " + table + " set ?", data, callback);
    },

    updateSync: function (table, id, data) {
        var _self = this;
        return new Promise(function (resolve, reject) {
            _self.conn.query("update " + table + " set ? where id = ?", [data, id], function (err, result) {
                if (err) reject(err);
                else resolve(result.changedRows);
            });
        });
    },

    update: function (table, id, data, callback) {
        this.conn.query("update " + table + " set ? where id = ?", [data, id], callback);
    },

    deleteSync: function (table, id) {
        var _self = this;
        return new Promise(function (resolve, reject) {
            _self.conn.query("delete from " + table + " where id = ?", [id], function (err, result) {
                if (err) reject(err);
                else resolve(result.affectedRows);
            })
        });
    },

    delete: function (table, id, callback) {
        this.conn.query("delete from " + table + " where id = ?", [id], callback);
    }
};