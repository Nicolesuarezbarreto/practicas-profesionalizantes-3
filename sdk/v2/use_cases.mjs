import { db } from './database.mjs';

export async function register(username, password) {
    return new Promise(function(resolve) {
        db.serialize(function() {
            const sqlUser = "INSERT INTO user (username, password) VALUES (?, ?)";
            db.run(sqlUser, [username, password], function(err) {
                if (err) return resolve({ status: false, description: 'USER_ALREADY_EXISTS' });
                const newUserId = this.lastID;
                const sqlMember = "INSERT INTO members (id_user, id_group) VALUES (?, ?)";
                db.run(sqlMember, [newUserId, 2], function(err) {
                    if (err) return resolve({ status: false, description: 'ERROR_ASSIGNING_GROUP' });
                    resolve({ status: true, result: { id: newUserId, username }, description: 'USER_REGISTERED_WITH_GROUP' });
                });
            });
        });
    });
}

export async function login(username, password) {
    return new Promise(function(resolve) {
        const sql = "SELECT u.id, u.username, m.id_group FROM user u LEFT JOIN members m ON u.id = m.id_user WHERE u.username = ? AND u.password = ?";
        db.get(sql, [username, password], function(err, row) {
            if (err) return resolve({ status: false, description: 'DATABASE_ERROR' });
            if (row) resolve({ status: true, result: { id: row.id, username: row.username, id_group: row.id_group } });
            else resolve({ status: false, description: 'INVALID_CREDENTIALS' });
        });
    });
}

export async function get_users() {
    return new Promise(function(resolve) {
        db.all("SELECT id, username FROM user", [], function(err, rows) {
            if (err) return resolve({ status: false, description: 'DATABASE_ERROR' });
            resolve({ status: true, result: rows });
        });
    });
}

export async function create_user(username, password) {
    return new Promise(function(resolve) {
        db.run("INSERT INTO user (username, password) VALUES (?, ?)", [username, password], function(err) {
            if (err) return resolve({ status: false, description: 'USER_EXISTS_OR_ERROR' });
            resolve({ status: true, result: { id: this.lastID } });
        });
    });
}

export async function update_user(id, username, password) {
    return new Promise(function(resolve) {
        db.run("UPDATE user SET username = ?, password = ? WHERE id = ?", [username, password, id], function(err) {
            if (err || this.changes === 0) return resolve({ status: false, description: 'ERROR_UPDATING' });
            resolve({ status: true, description: 'USER_UPDATED' });
        });
    });
}

export async function delete_user(id) {
    return new Promise(function(resolve) {
        db.run("DELETE FROM user WHERE id = ?", [id], function(err) {
            if (err || this.changes === 0) return resolve({ status: false, description: 'ERROR_DELETING' });
            resolve({ status: true, description: 'USER_DELETED' });
        });
    });
}