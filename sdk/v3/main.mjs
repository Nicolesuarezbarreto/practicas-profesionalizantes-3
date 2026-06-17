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
        // CORREGIDO: Cambiamos 'path' (que no existía) por 'endpointPath' que viene por parámetro
        const row = stmt.get(username, endpointPath); 

        return row.total > 0;
    } catch (err) {
        console.error("Error consultando permisos:", err);
        throw err;
    }
}

// --- ITEM 2: LOGIN (CORREGIDO EL BUG DEL CONDICIONAL INVERTIDO) ---
function login( username, password )
{
    let isAuthenticated = authenticate(username, password);

    if ( isAuthenticated )
    {
        let previousSession = userSessions.get(username);

        // CORREGIDO: Cambiamos '!=' por '==' porque si entra por primera vez, previousSession es NULL
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

function logout(username, password)
{
    let isAuthenticated = authenticate(username, password);

    if ( isAuthenticated )
    {
        let currentSession = userSessions.get(username);
        if (currentSession) 
        {
            currentSession.status = 'disabled';
        }
    }
}

async function createUser(db, username, password) 
{
    // Verificar si ya existe
    const checkSql = "SELECT count(*) as total FROM user WHERE username = ?";
    const checkStmt = db.prepare(checkSql);
    const checkRow = checkStmt.get(username);

    if (checkRow.total > 0) {
        throw new Error("El usuario ya existe en el sistema.");
    }

    // Si no existe, se inserta
    const sql = "INSERT INTO user (username, password) VALUES (?, ?) RETURNING id";
    
    try 
    {
        const stmt = db.prepare(sql);
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

const db = connect_db(config.database.path);

// --- ITEM 1 y 2 INTEGRADOS: FILTRO / MIDDLEWARE DE ARQUITECTURA ---
function secure_interceptor(endpointPath, originalHandler)
{
    return async function(request, response)
    {
        // 1. Extraemos el usuario que hace la petición (estilo del profe usando URL)
        const url = new URL(request.url, 'http://' + config.server.ip);
        const username = url.searchParams.get('username'); 

        if (!username)
        {
            response.writeHead(401, { 'Content-Type': 'application/json' });
            return response.end(JSON.stringify({ error: "Falta identificar usuario." }));
        }

        // 2. ITEM 2: Verificamos el Contexto de Ejecución (Sesión activa en memoria)
        let currentSession = userSessions.get(username);
        
        if (currentSession == null || currentSession.status !== 'enabled')
        {
            response.writeHead(401, { 'Content-Type': 'application/json' });
            return response.end(JSON.stringify({ error: "Debes iniciar sesión primero." }));
        }

        // 3. ITEM 1: El Autorizador cruza los datos en la DB
        const isAllowed = authorize(username, endpointPath);

        if (isAllowed)
        {
            // Pasa la validación de Sesión y Permisos: Ejecuta el código
            return await originalHandler(request, response);
        }
        else
        {
            // Bloqueado por Autorizador
            response.writeHead(403, { 'Content-Type': 'application/json' });
            return response.end(JSON.stringify({ error: `Acceso Denegado a ${endpointPath}.` }));
        }
    };
}

// --- HANDLERS DE LOS ENDPOINTS EXIGIDOS PARA LA PRUEBA (ITEM 1) ---
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

// Manejadores base del docente
async function login_handler(request, response)
{
    const url = new URL(request.url, 'http://' + config.server.ip);
    
    if ( request.method == "POST" )
    {
       let body = '';
    
       request.on('data', function recibirDatosLogin(chunk) {
           body += chunk.toString();
       });


       request.on('end', async function procesarDatosLogin() 
       {
           try 
           {
               const input = JSON.parse(body);
               const output = login(input.username, input.password); 

               response.writeHead(200, { 'Content-Type': 'application/json' });
               response.end(JSON.stringify(output));
           } 
           catch (err) 
           {
               response.writeHead(400, { 'Content-Type': 'application/json' });
               response.end(JSON.stringify({ error: 'Formato JSON inválido' }));
           }
       });
    }
    else
    {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Método no permitido. Usa POST.' }));
        return;
    }
}

function default_handler(request, response)
{
    try 
    {
        const html = readFileSync(config.server.default_path, 'utf-8');
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(html);
    } 
    catch (error) 
    {
        response.writeHead(500);
        response.end('Error interno: No se pudo cargar la vista principal.');
    }
}

async function register_handler(request, response)
{
    const url = new URL(request.url, 'http://' + config.server.ip);
    const input = Object.fromEntries(url.searchParams);

    try 
    {
        const output = await createUser(db, input.username || 'test', input.password || '123456');

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(output));
    }
    catch (err)
    {
        response.writeHead(500);
        response.end(JSON.stringify({ error: err.message }));
    }
}

function show_message_handler(request, response)
{
    console.log("Petición recibida: Mostrando mensaje en el servidor!");
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: "Mensaje procesado" }));
}

// Ruteo
let router = new Map();
router.set('/', default_handler);
router.set('/login', login_handler);
router.set('/register', register_handler);
router.set('/showMessage', show_message_handler);

// --- SE REGISTRAN LOS ENDPOINTS DEL ÍTEM 1 PROTEGIDOS POR EL INTERCEPTOR ---
router.set('/log', secure_interceptor('/log', log_handler));
router.set('/sayHello', secure_interceptor('/sayHello', sayHello_handler));

async function request_dispatcher(request, response)
{
    const url = new URL(request.url, 'http://' + config.server.ip);
    const path = url.pathname;
    const handler = router.get(path);

    if (handler)
    {
        return await handler(request, response);
    }
    else
    {
        response.writeHead(404);
        response.end('Método no encontrado');
    }
}

function start()
{
    console.log('Servidor ejecutándose en http://' + config.server.ip + ':' + config.server.port);
}

let server = createServer(request_dispatcher);
server.listen(config.server.port, config.server.ip, start);