import { RPCWebAPIFetch, limpiarCredenciales } from '../api-client.js';
import { mostrarVista } from '../vistas.js';

export class WCDashboardView extends HTMLElement {
    constructor() {
        super();

        this.card = document.createElement('div');
        this.card.className = 'card';
        this.appendChild(this.card);

        this.titulo = document.createElement('h2');
        this.titulo.appendChild(document.createTextNode('Bienvenido, '));
        this.spanUsuario = document.createElement('span');
        this.spanUsuario.style.color = '#007bff';
        this.titulo.appendChild(this.spanUsuario);
        this.card.appendChild(this.titulo);

        this.subtitulo = document.createElement('p');
        this.subtitulo.className = 'subtitle';
        this.subtitulo.textContent = 'Panel de control y pruebas de Autorización.';
        this.card.appendChild(this.subtitulo);

        this.botonLog = document.createElement('button');
        this.botonLog.className = 'btn-ok';
        this.botonLog.textContent = 'Ejecutar /log';
        this.card.appendChild(this.botonLog);

        this.botonSayHello = document.createElement('button');
        this.botonSayHello.className = 'btn-fail';
        this.botonSayHello.textContent = 'Ejecutar /sayHello';
        this.card.appendChild(this.botonSayHello);

        this.consola = document.createElement('div');
        this.consola.className = 'consola';
        this.consola.textContent = '> Esperando interacción...';
        this.card.appendChild(this.consola);

        this.enlaceLogout = document.createElement('span');
        this.enlaceLogout.className = 'link';
        this.enlaceLogout.style.color = '#dc3545';
        this.enlaceLogout.textContent = 'Cerrar Sesión';
        this.card.appendChild(this.enlaceLogout);
    }

    connectedCallback() {
        this.botonLog.onclick = this.probarLog.bind(this);
        this.botonSayHello.onclick = this.probarSayHello.bind(this);
        this.enlaceLogout.onclick = this.cerrarSesion.bind(this);
    }

    disconnectedCallback() {
        this.botonLog.onclick = null;
        this.botonSayHello.onclick = null;
        this.enlaceLogout.onclick = null;
    }

    setUsuario(nombre) {
        this.spanUsuario.textContent = nombre;
        this.consola.textContent = '> Sesión iniciada correctamente. Interceptores listos.';
    }

    probarLog() { this.probarEndpoint('/log'); }
    probarSayHello() { this.probarEndpoint('/sayHello'); }

    async probarEndpoint(ruta) {
        this.consola.textContent = '> Solicitando ' + ruta + '...';
        try {
            const datos = await RPCWebAPIFetch(ruta, {});
            this.consola.textContent = '> [HTTP 200] ' + JSON.stringify(datos);
            } catch (error) {
                this.consola.textContent = '> [Error ' + error.type + '] ' + error.detail;
                if (error.type === 'InvalidSessionException' || error.type === 'UnauthorizedException') {
                    limpiarCredenciales();
                    mostrarVista('vista-login');
                }
            }
    }

    async cerrarSesion() {
        try { await RPCWebAPIFetch('/logout', {}); } catch (error) { /* igual salimos */ }
        limpiarCredenciales();
        mostrarVista('vista-login');
    }
}

customElements.define('wc-dashboard-view', WCDashboardView);