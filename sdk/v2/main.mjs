import { createServer } from 'node:http';
import { URL } from 'node:url';
import { readFileSync } from 'node:fs';
import { 
    default_handler, 
    login_handler, 
    register_handler, 
    get_users_handler, 
    create_user_handler, 
    update_user_handler, 
    delete_user_handler 
} from './handlers.mjs';

function load_config() {
    const data = readFileSync('./config.json', 'utf-8');
    return JSON.parse(data);
}

export const config = load_config();

let router = new Map();
router.set('/', default_handler);
router.set('/login', login_handler);
router.set('/register', register_handler);
router.set('/users', get_users_handler);
router.set('/create_user', create_user_handler);
router.set('/update_user', update_user_handler);
router.set('/delete_user', delete_user_handler);

async function request_dispatcher(request, response) {
    const url = new URL(request.url, 'http://' + config.server.ip);
    const handler = router.get(url.pathname);
    if (handler) return await handler(request, response);
    response.writeHead(404);
    response.end('Not found');
}

let server = createServer(request_dispatcher);
server.listen(config.server.port, config.server.ip, function() {
    console.log('Servidor ejecutándose...');
});