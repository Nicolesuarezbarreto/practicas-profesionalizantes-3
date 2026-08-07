export class RPCWebAPIException extends Error {
    constructor(tipo, detalle) {
        super(detalle);
        this.name = 'RPCWebAPIException';
        this.type = tipo;
        this.detail = detalle;
    }
}

const HOST = 'http://localhost:3000';
const VERSION_API = '1.0';

let usuarioActual = null;
let claveHashActual = null;

export function establecerCredenciales(usuario, hash) { usuarioActual = usuario; claveHashActual = hash; }
export function limpiarCredenciales() { usuarioActual = null; claveHashActual = null; }

export async function calcularHashSHA256(cadena) {
    const encoder = new TextEncoder();
    const data = encoder.encode(cadena);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(function aHex(byte) { return byte.toString(16).padStart(2, '0'); }).join('');
    return hashHex;
}

function cabecerasGlobales() {
    return {
        'Content-Type': 'application/json',
        'x-user-id': usuarioActual || '',
        'x-api-key': claveHashActual || '',
        'Authorization': 'Bearer ' + (claveHashActual || ''),
        'x-api-version': VERSION_API
    };
}

function detalleDe(cuerpo) {
    if (cuerpo && cuerpo.detail) {
        if (Array.isArray(cuerpo.detail)) return cuerpo.detail.join(', ');
        return cuerpo.detail;
    }
    if (cuerpo && cuerpo.exception) return cuerpo.exception;
    return 'Error inesperado del servidor.';
}

// Siempre POST, siempre JSON, y todo código que no sea 200 lanza excepción
export async function RPCWebAPIFetch(name, content) {
    let response;
    try {
        response = await fetch(HOST + name, {
            method: 'POST',
            headers: cabecerasGlobales(),
            body: JSON.stringify(content)
        });
    } catch (errorRed) {
        throw new RPCWebAPIException('NetworkError', 'Sin conexión con el servidor.');
    }

    if (response.status === 200) return response.json();

    let cuerpo = null;
    try { cuerpo = await response.json(); } catch (errorParse) { cuerpo = null; }

    if (response.status === 400) throw new RPCWebAPIException('SpecificationError', detalleDe(cuerpo));
    if (response.status === 401) {
    const tipo = (cuerpo !== null && cuerpo.exception) ? cuerpo.exception : 'UnauthorizedError';
    throw new RPCWebAPIException(tipo, detalleDe(cuerpo));
    }
    if (response.status === 422) throw new RPCWebAPIException('DomainError', detalleDe(cuerpo));
    if (response.status === 500) throw new RPCWebAPIException('ProgramError', detalleDe(cuerpo));
    throw new RPCWebAPIException('UnknownError', 'HTTP ' + response.status);
}