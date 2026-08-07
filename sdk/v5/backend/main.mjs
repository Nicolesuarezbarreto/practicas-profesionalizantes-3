import { createServer } from 'node:http';
import { URL } from 'node:url';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';

function default_config() 
{
    const config = 
    {
        server: 
        {
            ip: '127.0.0.1',
            port: 3000,
            default_path: './index.html'
        },
        database: 
        {
            path: './database.db'
        }
    };
    return config;
}

function load_config() 
{
    let config = null;
    try 
    {
        const data = readFileSync('./config.json', 'utf-8');
        config = JSON.parse(data);
        console.log("Configuración cargada correctamente.");
    } 
    catch (error) 
    {
        console.error("Error cargando config.json. Usando valores por defecto.");
        config = default_config();
    }
    return config;
}

const config = load_config();

function connect_db(path) 
{
    const dbPath = resolve(path);
    try 
    {
        const db = new DatabaseSync(dbPath);
        return db;
    } 
    catch (err) 
    {
        throw new Error("Error al conectar a la base de datos: " + err.message);
    }
}

const db = connect_db(config.database.path);

let userSessions = new Map();  // clave: username, valor: instancia de UserSession

class UserSession
{
    constructor(username)
    {
       this.username = username;
       this.status = 'disabled';
    }
}

function authenticate( username, password )
{
    const sql = "SELECT count(*) as total FROM `user` WHERE username=? AND password=?";
    try 
    {
        const stmt = db.prepare(sql);
        const row = stmt.get(username, password);
            
        return (row.total === 1);
    } 
    catch (err) 
    {
        throw err;
    }
}

function authorize( username, endpointPath )
{
    const sql = `
        SELECT count(*) as total
        FROM access a
        JOIN members m ON a.id_group = m.id_group
        JOIN user u ON m.id_user = u.id
        JOIN endpoint e ON a.id_endpoint = e.id
        WHERE u.username = ? 
          AND e.path = ?
    `;
    try {
        const stmt = db.prepare(sql);
        const row = stmt.get(username, endpointPath); 
        return row.total > 0;
    } catch (err) {
        console.error("Error consultando permisos:", err);
        throw err;
    }
}

async function createUser(dbInstance, username, password) 
{
    const checkSql = "SELECT count(*) as total FROM user WHERE username = ?";
    const checkStmt = dbInstance.prepare(checkSql);
    const checkRow = checkStmt.get(username);

    if (checkRow.total > 0) {
        // Lanzamos un error específico para identificar la excepción de dominio
        const error = new Error("El usuario ya existe en el sistema.");
        error.code = "USER_EXISTS";
        throw error;
    }

    const sql = "INSERT INTO user (username, password) VALUES (?, ?) RETURNING id";
    
    try 
    {
        const stmt = dbInstance.prepare(sql);
        const row = stmt.get(username, password);

        const result = 
        {
            id: row.id,
            username: username,
            password: password
        };
        
        return result;
    } 
    catch (err) 
    {
        throw err;
    }
}

function login( username, password )
{
    let isAuthenticated = authenticate(username, password);

    if ( isAuthenticated )
    {
        let previousSession = userSessions.get(username);

        if ( previousSession == null )
        {
            let newSession = new UserSession(username);
            newSession.status = 'enabled';
            userSessions.set(username, newSession );
            return newSession;
        }
        else
        {
            if ( previousSession.status == 'disabled')
            {
                previousSession.status = 'enabled';
            }
    
            return previousSession;
        }
    }
    else
    {
        return null;
    }
}


function log_handler(request, response)
{
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ status: "OK", message: "Endpoint /log ejecutado correctamente." }));
}

function sayHello_handler(request, response)
{
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ status: "OK", message: "¡Hola de /sayHello!" }));
}

// --- REFACTORIZACIÓN RPC: MANEJADOR DE LOGIN ---
async function login_handler(request, response)
{
    if ( request.method == "POST" )
    {
        const username = request.headers['x-user-id'];
        const password = request.headers['x-api-key'];

        if (!username || !password) {
            // RPC Estándar: Código 400 (Error de especificación de parámetros)
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ 
                exception: 'BadRequestException', 
                detail: 'Faltan cabeceras x-user-id o x-api-key en la petición RPC.' 
            }));
            return;
        }

        const output = login(username, password); 

        if (output) {
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(output));
        } else {
            // RPC Estándar: Credenciales incorrectas es un error de permisos (401)
            response.writeHead(401, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ 
                exception: 'BadCredentialsException', 
                detail: 'El usuario o la contraseña son incorrectos.' 
            }));
        }
    }
    else
    {
        response.writeHead(400, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ 
            exception: 'InvalidMethodException', 
            detail: 'Las WebAPI RPC estables requieren método POST.' 
        }));
    }
}

// --- REFACTORIZACIÓN RPC: MANEJADOR DE REGISTRO ---
async function register_handler(request, response)
{
    if ( request.method == "POST" )
    {
        const username = request.headers['x-user-id'];
        const password = request.headers['x-api-key'];

        if (!username || !password) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ 
                exception: 'BadRequestException', 
                detail: 'Faltan cabeceras x-user-id o x-api-key para procesar el registro.' 
            }));
            return;
        }

        try 
        {
            const output = await createUser(db, username, password);
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(output));
        }
        catch (err)
        {
            if (err.code === "USER_EXISTS") {
                // RPC Estándar: Código 422 para excepciones del dominio de la aplicación
                response.writeHead(422, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ 
                    exception: 'DomainUserExistsException', 
                    detail: err.message 
                }));
            } else {
                // RPC Estándar: Código 500 para fallas de infraestructura o errores imprevistos
                response.writeHead(500, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ 
                    exception: 'InternalServerErrorException', 
                    detail: err.message 
                }));
            }
        }
    }
    else 
    {
        response.writeHead(400, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ 
            exception: 'InvalidMethodException', 
            detail: 'Las WebAPI RPC estables requieren método POST.' 
        }));
    }
}

function show_message_handler(request, response)
{
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: "Mensaje procesado" }));
}


function responderError(response, codigo, excepcion, detalle) {
    response.writeHead(codigo, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ exception: excepcion, detail: detalle }));
}

function leerClaveDeCabeceras(request) {
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.substring(7);
}
function logout(username) {
    const sesion = userSessions.get(username);
    if (!sesion || sesion.status !== 'enabled') return false;
    sesion.status = 'disabled';
    return true;
}

function logout_handler(request, response) {
    const username = request.headers['x-user-id'];
    if (!username) {
        responderError(response, 401, 'UnauthorizedException', 'Falta la cabecera x-user-id.');
        return;
    }
    if (logout(username)) {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ status: 'success', message: 'Sesión cerrada correctamente.' }));
    } else {
        responderError(response, 422, 'DomainError', 'No había una sesión activa para cerrar.');
    }
}

function validarAutenticacion(request, response) {
    const username = request.headers['x-user-id'];
    const clave = leerClaveDeCabeceras(request);
    if (!username || !clave) {
        responderError(response, 401, 'UnauthorizedException', 'Faltan cabeceras de autenticación o formato Bearer inválido.');
        return null;
    }
    return username;
}

function validarSesion(username, response) {
    const sesion = userSessions.get(username);
    if (!sesion || sesion.status !== 'enabled') {
        responderError(response, 401, 'InvalidSessionException', 'Debes iniciar sesión primero o tu sesión expiró.');
        return false;
    }
    return true;
}

function validarAutorizacion(username, ruta, response) {
    if (!authorize(username, ruta)) {
        responderError(response, 401, 'ForbiddenAccessException', 'Acceso Denegado a ' + ruta + '.');
        return false;
    }
    return true;
}

const rutasPublicas   = { 
    '/login': login_handler, 
    '/register': register_handler,
    '/showMessage': show_message_handler
};
const rutasDeSesion   = { '/logout': logout_handler };
const rutasProtegidas = { 
    '/log': log_handler, 
    '/sayHello': sayHello_handler
};

function request_dispatcher(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id, Authorization, x-api-version, x-api-key');
    if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return; }

    const ruta = request.url;

    if (rutasPublicas[ruta]) return rutasPublicas[ruta](request, response);

    if (rutasDeSesion[ruta]) {
        const usuario = validarAutenticacion(request, response);
        if (usuario === null) return;
        if (!validarSesion(usuario, response)) return;
        return rutasDeSesion[ruta](request, response);
    }

    const handler = rutasProtegidas[ruta];
    if (!handler) { responderError(response, 400, 'SpecificationError', 'Ruta inexistente: ' + ruta); return; }

    const usuario = validarAutenticacion(request, response);
    if (usuario === null) return;
    if (!validarSesion(usuario, response)) return;
    if (!validarAutorizacion(usuario, ruta, response)) return;
    return handler(request, response);
}

function start()
{
    console.log('Servidor ejecutándose en http://' + config.server.ip + ':' + config.server.port);
}

let server = createServer(request_dispatcher);
server.listen(config.server.port, config.server.ip, start);