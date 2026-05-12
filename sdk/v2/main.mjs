import { createServer } from 'node:http';
import { URL } from 'node:url';
import { readFileSync } from 'node:fs';
import sqlite3 from 'sqlite3';
import { resolve } from 'node:path';

import { login, register } from './use_cases.mjs';

// CONFIG
function load_config()
{
    const data = readFileSync('./config.json', 'utf-8');
    return JSON.parse(data);
}

const config = load_config();

// DB
function connect_db(path)
{
    const dbPath = resolve(path);
    return new sqlite3.Database(dbPath);
}

const db = connect_db(config.database.path);

// DB - Creación de tablas para la v2 (Permisos)
db.serialize(() => {
    // 1. Tabla de usuarios
    db.run(`CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL
    )`);

    // 2. Tabla de grupos (Admin, Invitado, etc.)
    db.run(`CREATE TABLE IF NOT EXISTS "group" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    )`);

    // 3. Tabla de membresía (¡CON CLAVE COMPUESTA!)
    db.run(`CREATE TABLE IF NOT EXISTS members (
        id_user INTEGER,
        id_group INTEGER,
        PRIMARY KEY (id_user, id_group), -- Evita que un usuario este 2 veces en el mismo grupo
        FOREIGN KEY(id_user) REFERENCES user(id),
        FOREIGN KEY(id_group) REFERENCES "group"(id)
    )`);

    // 4. Tabla de accesos/permisos (¡CON CLAVE COMPUESTA!)
    db.run(`CREATE TABLE IF NOT EXISTS access (
        id_group INTEGER,
        id_endpoint INTEGER,
        PRIMARY KEY (id_group, id_endpoint),
        FOREIGN KEY(id_group) REFERENCES "group"(id),
        FOREIGN KEY(id_endpoint) REFERENCES endpoint(id)
    )`);
});

// HANDLERS

async function login_handler(request, response) {
    if (request.method !== 'POST') {
        response.writeHead(405);
        response.end('Usar POST para login');
        return;
    }

    let body = '';
    request.on('data', chunk => { body += chunk.toString(); });
    request.on('end', async () => {
        try {
            const input = JSON.parse(body); // Recibe JSON del frontend
            const output = await login(db, input.username, input.password);

            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(output));
        } catch (error) {
            response.writeHead(400);
            response.end(JSON.stringify({ status: false, description: 'BAD_JSON' }));
        }
    });
}

function register_handler(request, response)
{
    if (request.method !== 'POST')
    {
        response.writeHead(405);
        response.end('Método no permitido');
        return;
    }

    let body = '';

    request.on('data', chunk => {
        body += chunk.toString();
    });

    request.on('end', async () => {
        try {
            const input = JSON.parse(body);

            const result = await register(db, input.username, input.password);

            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(result));

        } catch (error) {
            response.writeHead(500);
            response.end(JSON.stringify({ error: error.message }));
        }
    });
}

function default_handler(request, response)
{
    const html = readFileSync(config.server.default_path, 'utf-8');
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(html);
}

// ROUTER
let router = new Map();
router.set('/', default_handler);
router.set('/login', login_handler);
router.set('/register', register_handler);

// DISPATCH
async function request_dispatcher(request, response)
{
    const url = new URL(request.url, 'http://' + config.server.ip);
    const path = url.pathname;

    const handler = router.get(path);

    if (handler)
        return await handler(request, response);

    response.writeHead(404);
    response.end('Not found');
}

// SERVER
let server = createServer(request_dispatcher);

server.listen(config.server.port, config.server.ip, () => {
    console.log('Servidor ejecutándose...');
});