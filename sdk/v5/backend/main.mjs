import http from 'http';
import fs from 'fs';

var configData = fs.readFileSync('./config.json', 'utf8');
var config = JSON.parse(configData);

var userSessions = new Map();

function authorize(username, endpointPath) { 
    if (endpointPath === '/log') {
        return username === 'admin';
    }
    var rutasPermitidas = ['/print', '/help'];
    return rutasPermitidas.indexOf(endpointPath) !== -1;
}

async function secure_interceptor(request, response, endpointPath, originalHandler) {
    var username = request.headers['x-user-id'];
    var authHeader = request.headers['authorization'];

    if (!username || !authHeader || authHeader.indexOf('Bearer ') !== 0) {
        response.writeHead(401, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ exception: 'UnauthorizedException', detail: 'Faltan credenciales' }));
        return;
    }

    var currentSession = userSessions.get(username);
    if (!currentSession || currentSession.status !== 'enabled') {
        response.writeHead(401, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ exception: 'InvalidSessionException', detail: 'Sesión inválida' }));
        return;
    }

    if (authorize(username, endpointPath)) {
        await originalHandler(request, response);
    } else {
        response.writeHead(403, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ exception: 'ForbiddenAccessException', detail: 'Acceso denegado' }));
    }
}

async function handleLogin(request, response) {
    var body = '';
    request.on('data', function(chunk) {
        body += chunk;
    });
    request.on('end', function() {
        var credenciales = JSON.parse(body || '{}');
        var user = credenciales.user || credenciales.username || '';
        var pass = credenciales.password || credenciales.pass || '';

        if (user.trim() === '' || pass.trim() === '') {
            response.writeHead(401, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ exception: 'UnauthorizedException', detail: 'Debe ingresar usuario' }));
            return;
        }

        userSessions.set(user, { status: 'enabled' });
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ message: 'Login exitoso', token: 'token-valido-123' }));
    });
}

async function handleRegister(request, response) {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: 'Usuario registrado correctamente' }));
}

async function handleLogout(request, response) {
    var username = request.headers['x-user-id'];
    if (username) {
        userSessions.delete(username);
    }
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: 'Sesión cerrada' }));
}

async function handleLog(request, response) {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: 'Log ejecutado con éxito por ' + request.headers['x-user-id'] }));
}

async function handleSayHello(request, response) {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: 'Hola ' + request.headers['x-user-id'] + ', acceso autorizado.' }));
}

var server = http.createServer(async function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/login') {
        await handleLogin(req, res);
    } else if (req.url === '/register') {
        await handleRegister(req, res);
    } else if (req.url === '/logout') {
        await handleLogout(req, res);
    } else if (req.url === '/log') {
        await secure_interceptor(req, res, req.url, handleLog);
    } else if (req.url === '/sayHello') {
        await secure_interceptor(req, res, req.url, handleSayHello);
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(config.server.port, config.server.ip, function() {
    console.log('Servidor corriendo en http://' + config.server.ip + ':' + config.server.port);
});