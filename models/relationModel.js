'use strict';

let db = require('./db.js');

module.exports = {

    findPostsByTag (tag_id) {
        return db.getResult("select * from masa_posts where id in (select post_id from masa_post_tag where tag_id=?)", [tag_id]);
    },

    findPostsByCategory (category_id) {
        return db.getResult("select * from masa_posts where id in (select post_id from masa_post_category where category_id=?)", [category_id]);
    },

    findTagsByPost (post_id) {
        return db.getResult("select * from masa_tags where id in (select tag_id from masa_post_tag where post_id=?)", [post_id]);
    },

    findCategoryByPost (post_id) {
        return db.getRow("select * from masa_categories where id = (select category_id from masa_post_category where post_id=?)", [post_id]);
    },

    insertPostTag (data) {
        return db.insertSync('masa_post_tag', data);
    },

    insertPostTags (post_id, tag_ids) {
        return new Promise((resolve, reject) => {
            let tagLength = tag_ids.length;
            if (tagLength === 0) return reject('Tag is required...');
            let data = [];
            for (let i = 0; i < tagLength; i++) {
                data.push([post_id, tag_ids[i]]);
            }
            db.query("insert into masa_post_tag(post_id, tag_id) values ?", [data], (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    },

    deletePostTagById (id) {
        return db.deleteSync('masa_post_tag', id);
    },

    deletePostTagByIds (post_id, tag_id) {
        return new Promise((resolve, reject) => {
            db.query("delete from masa_post_tag where post_id=? and tag_id=?", [post_id, tag_id], (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    },
};