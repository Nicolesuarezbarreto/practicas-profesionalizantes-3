import { RPCWebAPIFetch } from '../api-client.js';

export class WCLoginFormView extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <style>
                h2 { margin-top: 0; color: #333; font-size: 22px; text-align: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                .form-group { margin-bottom: 15px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                label { display: block; margin-bottom: 5px; color: #555; font-size: 14px; font-weight: bold; }
                input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; font-size: 14px; }
                button { width: 100%; padding: 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin-top: 10px; font-weight: bold; background-color: #007bff; color: white; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                button:hover { background-color: #0056b3; }
                .link { color: #007bff; text-decoration: none; font-size: 14px; display: block; text-align: center; margin-top: 20px; cursor: pointer; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                .link:hover { text-decoration: underline; }
            </style>
            <h2>Iniciar Sesión</h2>
            <form id="authForm">
                <div class="form-group">
                    <label>Usuario</label>
                    <input type="text" id="login-user" required autocomplete="off">
                </div>
                <div class="form-group">
                    <label>Contraseña</label>
                    <input type="password" id="login-pass" required>
                </div>
                <button type="button" id="btn-login">Ingresar</button>
            </form>
            <span class="link" id="go-register">¿No tenés cuenta? Registrate acá</span>
        `;
        this.btnLogin = this.querySelector('#btn-login');
        this.btnGoRegister = this.querySelector('#go-register');
        this.inputUser = this.querySelector('#login-user');
        this.inputPass = this.querySelector('#login-pass');
        
        this.manejadorLogin = this.ejecutarLogin.bind(this);
        this.manejadorIrRegistro = this.mostrarRegistro.bind(this);
    }

    connectedCallback() {
        this.btnLogin.addEventListener('click', this.manejadorLogin);
        this.btnGoRegister.addEventListener('click', this.manejadorIrRegistro);
    }

    disconnectedCallback() {
        this.btnLogin.removeEventListener('click', this.manejadorLogin);
        this.btnGoRegister.removeEventListener('click', this.manejadorIrRegistro);
    }

    limpiarCampos() {
        this.inputUser.value = '';
        this.inputPass.value = '';
    }

    mostrarRegistro() {
        document.getElementById('vista-login').classList.add('hidden');
        document.getElementById('vista-registro').classList.remove('hidden');
    }

    async ejecutarLogin() {
        var usuario = this.inputUser.value;
        var clave = this.inputPass.value;
        try {
            var respuesta = await RPCWebAPIFetch('/login', { user: usuario, pass: clave });
            
            this.limpiarCampos();

            window.usuarioLogueado = usuario;
            window.claveHashLogueado = respuesta.token || 'fake-token';
            
            document.getElementById('vista-login').classList.add('hidden');
            var dashboard = document.getElementById('vista-dashboard');
            dashboard.classList.remove('hidden');
            dashboard.setUsuario(usuario);
        } catch (error) {
            alert('Error en login: ' + (error.detail || 'Desconocido'));
        }
    }
}
customElements.define('wc-login-form-view', WCLoginFormView);