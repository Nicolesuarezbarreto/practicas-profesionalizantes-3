import { RPCWebAPIFetch } from '../api-client.js';

export class WCDashboardView extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <style>
                h2 { margin-top: 0; color: #333; font-size: 22px; text-align: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                .subtitle { color: #666; font-size: 14px; text-align: center; margin-bottom: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                button { width: 100%; padding: 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin-top: 10px; font-weight: bold; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                .btn-ok { background-color: #28a745; color: white; margin-bottom: 10px; }
                .btn-ok:hover { background-color: #218838; }
                .btn-fail { background-color: #dc3545; color: white; }
                .btn-fail:hover { background-color: #c82333; }
                #consola { background: #212529; color: #00ff00; padding: 15px; border-radius: 4px; margin-top: 15px; font-family: monospace; font-size: 13px; min-height: 40px; word-wrap: break-word; white-space: pre-line; }
                .link { color: #dc3545; text-decoration: none; font-size: 14px; display: block; text-align: center; margin-top: 20px; cursor: pointer; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                .link:hover { text-decoration: underline; }
            </style>
            <h2>Bienvenido, <span id="lblUsuario" style="color: #007bff;"></span></h2>
            <p class="subtitle">Panel de control y pruebas de Autorización.</p>
            
            <button id="btnLog" class="btn-ok">Ejecutar /log</button>
            <button id="btnSayHello" class="btn-fail">Ejecutar /sayHello</button>
            
            <div id="consola">> Esperando interacción...</div>
            
            <span class="link" id="btnLogout">Cerrar Sesión</span>
        `;
        this.btnLog = this.querySelector('#btnLog');
        this.btnHello = this.querySelector('#btnSayHello');
        this.btnLogout = this.querySelector('#btnLogout');
        this.consola = this.querySelector('#consola');
        this.lblUsuario = this.querySelector('#lblUsuario');

        this.manejadorLog = this.ejecutarLog.bind(this);
        this.manejadorHello = this.ejecutarHello.bind(this);
        this.manejadorLogout = this.cerrarSesion.bind(this);
    }

    connectedCallback() {
        this.btnLog.addEventListener('click', this.manejadorLog);
        this.btnHello.addEventListener('click', this.manejadorHello);
        this.btnLogout.addEventListener('click', this.manejadorLogout);
    }

    disconnectedCallback() {
        this.btnLog.removeEventListener('click', this.manejadorLog);
        this.btnHello.removeEventListener('click', this.manejadorHello);
        this.btnLogout.removeEventListener('click', this.manejadorLogout);
    }

    setUsuario(nombre) {
        this.lblUsuario.innerText = nombre;
        this.consola.innerText = "> Sesión iniciada correctamente. Interceptores listos.";
    }

    async ejecutarLog() {
        this.consola.innerText = "> Solicitando /log...";
        try {
            var res = await RPCWebAPIFetch('/log', { accion: 'test' });
            this.consola.innerText = "> [HTTP 200]\n" + JSON.stringify(res);
        } catch (error) {
            this.consola.innerText = "> [HTTP ERROR]\n" + JSON.stringify(error);
        }
    }

    async ejecutarHello() {
        this.consola.innerText = "> Solicitando /sayHello...";
        try {
            var res = await RPCWebAPIFetch('/sayHello', { accion: 'test' });
            this.consola.innerText = "> [HTTP 200]\n" + JSON.stringify(res);
        } catch (error) {
            this.consola.innerText = "> [HTTP ERROR]\n" + JSON.stringify(error);
        }
    }

    async cerrarSesion() {
        
        try {
            await RPCWebAPIFetch('/logout', { accion: 'logout' });
        } catch (error) {
            console.error("Error al cerrar sesión en servidor:", error);
        }

        window.usuarioLogueado = null;
        window.claveHashLogueado = null;
        document.getElementById('vista-dashboard').classList.add('hidden');
        document.getElementById('vista-login').classList.remove('hidden');
    }
}
customElements.define('wc-dashboard-view', WCDashboardView);