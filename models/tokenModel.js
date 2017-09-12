'use strict';

let db = require('./db.js');

module.exports = {
    table: 'masa_tokens',
    _salt: 'abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    _size: 16,

    findByToken (token) {
        return db.getRow("select * from " + this.table + " where token=?", [token]);
    },

    insert (data) {
        data.expired_at = new Date(new Date().getTime() + (30 * 60 * 1000));
        console.log(new Date().getTime());
        console.log(data.expired_at.getTime());
        return db.insertSync(this.table, data);
    },

    delete (id) {
        return db.deleteSync(this.table, id);
    },

    isValidToken (token) {
        let _self = this;
        return new Promise((resolve, reject) => {
            db.query("select * from " + _self.table + " where token=?", [token], (error, row) => {
                if (error) reject(row);
                else {
                    let response = {};
                    if (row.length < 1) {
                        response.token = null;
                        response.error = "No Token was found...";
                    } else if (new Date().getTime() > new Date(row[0].expired_at).getTime()) {
                        response.token = row[0];
                        response.error = "Token was expired...";
                        _self.delete(row[0].id);
                    } else {
                        response.token = row[0];
                        response.error = null;
                    }
                    resolve(response);
                }
            });
        });
    },

    generateToken (size, salt) {
        if (salt === undefined || salt === null || salt === '' || typeof salt !== 'string') salt = this._salt;
        if (size === undefined || isNaN(parseInt(size))) size = this._size;
        let key = '';
        let saltLength = salt.length;
        while(size--) {
            let rnd = this.randomIndex(saltLength);
            key += salt[rnd];
        }

        return key;
    },

    randomIndex (max) {
        return Math.floor(Math.random() * max);
    },
};
