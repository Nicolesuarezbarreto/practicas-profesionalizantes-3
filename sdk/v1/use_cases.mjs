// use_cases.mjs ACTUALIZADO
export async function login(db, username, password) {
    const sql = `
        SELECT * FROM user 
        WHERE username = ? AND password = ?
    `;

    const user = await new Promise((resolve, reject) => {
        db.get(sql, [username, password], (err, row) => {
            if (err) return reject(err);
            resolve(row); // Si no encuentra nada, devuelve 'undefined'
        });
    });

    if (user) {
        return {
            status: true,
            result: user.username,
            description: null
        };
    } else {
        return {
            status: false,
            result: null,
            description: 'INVALID_USER_PASS'
        };
    }
}

export async function register(db, username, password)
{
    const sql = `
        INSERT INTO user (username, password)
        VALUES (?, ?)
    `;

    const result = await new Promise((resolve, reject) => {
        db.run(sql, [username, password], function (err) {
            if (err) return reject(err);

            resolve({
                id: this.lastID,
                username
            });
        });
    });

    return {
        status: true,
        user: result
    };
}