'use strict';

let db = require('./db.js');
let bcrypt = require('bcryptjs');

module.exports = {
    table: 'masa_admins',

    findById (id) {
        return db.getRow("select * from " + this.table + " where id=?", [id]);
    },

    findByUsername (username) {
        return db.getResult("select * from " + this.table + " where username=? and is_active=true", [username]);
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
    },

    verifyPassword (inputPassword, hashedPassword) {
        return bcrypt.compareSync(inputPassword, hashedPassword);
    },

    resetPassword (id, currentPassword, newPassword) {
        let _self = this;
        return new Promise((resolve, reject) => {
            db.query("select password from " + _self.table + " where id=?", [id], function (error, admin) {
                if (error) return reject(error);
                if (!_self.verifyPassword(currentPassword, admin[0].password)) return resolve({error: "Current Password did not match..."});
                let hashedPassword = bcrypt.hashSync(newPassword, 10);
                db.update(_self.table, id, {password: hashedPassword}, function (error, result) {
                    if (error) reject(error);
                    else resolve(result);
                });
            });
        });
    },

    hashPassword (password) {
        let salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(password, salt);
    }
};