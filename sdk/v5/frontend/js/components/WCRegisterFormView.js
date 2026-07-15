import { RPCWebAPIFetch } from '../api-client.js';

export class WCRegisterFormView extends HTMLElement {
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
            <h2>Registrar Usuario</h2>
            <form id="regForm">
                <div class="form-group">
                    <label>Usuario</label>
                    <input type="text" id="reg-user" required autocomplete="off">
                </div>
                <div class="form-group">
                    <label>Contraseña</label>
                    <input type="password" id="reg-pass" required>
                </div>
                <button type="button" id="btn-register">Crear cuenta</button>
            </form>
            <span class="link" id="go-login">¿Ya tenés cuenta? Iniciá sesión</span>
        `;
        this.btnRegister = this.querySelector('#btn-register');
        this.btnGoLogin = this.querySelector('#go-login');
        this.inputUser = this.querySelector('#reg-user');
        this.inputPass = this.querySelector('#reg-pass');
        
        this.manejadorRegistro = this.ejecutarRegistro.bind(this);
        this.manejadorIrLogin = this.mostrarLogin.bind(this);
    }

    connectedCallback() {
        this.btnRegister.addEventListener('click', this.manejadorRegistro);
        this.btnGoLogin.addEventListener('click', this.manejadorIrLogin);
    }

    disconnectedCallback() {
        this.btnRegister.removeEventListener('click', this.manejadorRegistro);
        this.btnGoLogin.removeEventListener('click', this.manejadorIrLogin);
    }

    mostrarLogin() {
        document.getElementById('vista-registro').classList.add('hidden');
        document.getElementById('vista-login').classList.remove('hidden');
    }

    async ejecutarRegistro() {
        var usuario = this.inputUser.value;
        var clave = this.inputPass.value;
        try {
            var respuesta = await RPCWebAPIFetch('/register', { user: usuario, pass: clave });
            alert('¡Usuario creado! Ahora podés iniciar sesión.');
            this.mostrarLogin();
        } catch (error) {
            alert('Error en registro: ' + (error.detail || 'Desconocido'));
        }
    }
}
customElements.define('wc-register-form-view', WCRegisterFormView);