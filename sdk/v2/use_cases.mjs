export async function register(db, username, password) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // 1. Insertamos al usuario
            const sqlUser = `INSERT INTO user (username, password) VALUES (?, ?)`;
            
            db.run(sqlUser, [username, password], function(err) {
                if (err) {
                    return resolve({ status: false, description: 'USER_ALREADY_EXISTS' });
                }

                // 2. 'this.lastID' contiene el ID que SQLite le dio al usuario (ej: el 10 u 11)
                const newUserId = this.lastID;
                const defaultGroup = 2; // Grupo 'invitado' por defecto

                const sqlMember = `INSERT INTO members (id_user, id_group) VALUES (?, ?)`;

                db.run(sqlMember, [newUserId, defaultGroup], (err) => {
                    if (err) {
                        return resolve({ status: false, description: 'ERROR_ASSIGNING_GROUP' });
                    }

                    resolve({
                        status: true,
                        result: { id: newUserId, username: username },
                        description: 'USER_REGISTERED_WITH_GROUP'
                    });
                });
            });
        });
    });
}


export async function login(db, username, password) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT u.id, u.username, m.id_group 
            FROM user u
            LEFT JOIN members m ON u.id = m.id_user
            WHERE u.username = ? AND u.password = ?
        `;

        db.get(sql, [username, password], (err, row) => {
            if (err) {
                return resolve({ status: false, description: 'DATABASE_ERROR' });
            }
            if (row) {
                resolve({
                    status: true,
                    result: {
                        id: row.id,
                        username: row.username,
                        id_group: row.id_group // <--- "Gestión de Permisos"!
                    }
                });
            } else {
                resolve({ status: false, description: 'INVALID_CREDENTIALS' });
            }
        });
    });
}