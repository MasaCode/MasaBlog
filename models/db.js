'use strict';

let mysql = require("mysql");
let config = require(__dirname + '/../docs/environments.js');

module.exports = {
    conn: null,

    connect () {
        this.conn = mysql.createConnection({
            host: 'localhost',
            user: config.MYSQL_USER,
            password: config.MYSQL_PASSWORD,
            database: config.MYSQL_DATABASE
        });
    },

    query (query, params, callback) {
        this.conn.query(query, params, callback);
    },

    getRow (query, params) {
        let _self = this;
        return new Promise(function (resolve, reject) {
            _self.conn.query(query, params, function (err, rows) {
                if (err) reject(err);
                else resolve(rows.length < 1 ? null : rows[0]);
            });
        });
    },

    getResult (query, params) {
        let _self = this;
        return new Promise(function (resolve, reject) {
            _self.conn.query(query, params, function (err, rows) {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    insertSync (table, data) {
        let _self = this;
        return new Promise(function (resolve, reject) {
            _self.conn.query("insert into " + table + " set ?", data, function (err, result, fields) {
                if (err) reject(err);
                else resolve(result.insertId);
            });
        });
    },

    insert (table, data, callback) {
        this.conn.query("insert into " + table + " set ?", data, callback);
    },

    updateSync (table, id, data) {
        let _self = this;
        return new Promise(function (resolve, reject) {
            _self.conn.query("update " + table + " set ? where id = ?", [data, id], function (err, result) {
                if (err) reject(err);
                else resolve(result.changedRows);
            });
        });
    },

    update (table, id, data, callback) {
        this.conn.query("update " + table + " set ? where id = ?", [data, id], callback);
    },

    deleteSync (table, id) {
        let _self = this;
        return new Promise(function (resolve, reject) {
            _self.conn.query("delete from " + table + " where id = ?", [id], function (err, result) {
                if (err) reject(err);
                else resolve(result.affectedRows);
            })
        });
    },

    delete (table, id, callback) {
        this.conn.query("delete from " + table + " where id = ?", [id], callback);
    }
};