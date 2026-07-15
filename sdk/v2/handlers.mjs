import { login, register, get_users, create_user, update_user, delete_user } from './use_cases.mjs';
import { readFileSync } from 'node:fs';

export async function default_handler(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(readFileSync('./index.html'));
}

export async function login_handler(req, res) {
    let body = '';
    req.on('data', function(c) { body += c; });
    req.on('end', async function() {
        const { username, password } = JSON.parse(body);
        const result = await login(username, password);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
    });
}

export async function register_handler(req, res) {
    let body = '';
    req.on('data', function(c) { body += c; });
    req.on('end', async function() {
        const { username, password } = JSON.parse(body);
        const result = await register(username, password);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
    });
}

export async function get_users_handler(req, res) {
    const result = await get_users();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
}

export async function create_user_handler(req, res) {
    let body = '';
    req.on('data', function(c) { body += c; });
    req.on('end', async function() {
        const { username, password } = JSON.parse(body);
        const result = await create_user(username, password);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
    });
}

export async function update_user_handler(req, res) {
    let body = '';
    req.on('data', function(c) { body += c; });
    req.on('end', async function() {
        const { id, username, password } = JSON.parse(body);
        const result = await update_user(id, username, password);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
    });
}

export async function delete_user_handler(req, res) {
    let body = '';
    req.on('data', function(c) { body += c; });
    req.on('end', async function() {
        const { id } = JSON.parse(body);
        const result = await delete_user(id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
    });
}