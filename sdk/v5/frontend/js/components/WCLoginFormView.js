import { RPCWebAPIFetch, calcularHashSHA256, establecerCredenciales, limpiarCredenciales } from '../api-client.js';
import { mostrarVista } from '../vistas.js';

export class WCLoginFormView extends HTMLElement {
    constructor() {
        super();

        this.card = document.createElement('div');
        this.card.className = 'w3-white w3-round w3-border w3-margin-bottom tarjeta-auth';
        this.appendChild(this.card);

        this.caja = document.createElement('div');
        this.caja.className = 'w3-padding-large';
        this.card.appendChild(this.caja);

        this.encabezado = document.createElement('div');
        this.encabezado.className = 'w3-center w3-padding-16';
        this.logo = document.createElement('img');
        this.logo.className = 'w3-image';
        this.logo.src = './assets/logo-isft151.png';
        this.logo.alt = 'ISFT 151';
        this.logo.style.width = '90px';
        this.titulo = document.createElement('p');
        this.titulo.textContent = 'INICIAR SESIÓN';
        this.encabezado.appendChild(this.logo);
        this.encabezado.appendChild(this.titulo);
        this.caja.appendChild(this.encabezado);

        this.campoUsuario = document.createElement('div');
        this.campoUsuario.className = 'w3-margin-bottom';
        this.inputUsuario = document.createElement('input');
        this.inputUsuario.type = 'text';
        this.inputUsuario.className = 'w3-input w3-round w3-border';
        this.inputUsuario.placeholder = 'Ingrese su usuario';
        this.campoUsuario.appendChild(this.inputUsuario);
        this.caja.appendChild(this.campoUsuario);

        this.campoClave = document.createElement('div');
        this.campoClave.className = 'w3-margin-bottom';
        this.inputClave = document.createElement('input');
        this.inputClave.type = 'password';
        this.inputClave.className = 'w3-input w3-round w3-border';
        this.inputClave.placeholder = 'Ingrese su contraseña';
        this.campoClave.appendChild(this.inputClave);
        this.caja.appendChild(this.campoClave);

        this.campoCheck = document.createElement('div');
        this.campoCheck.className = 'w3-margin-bottom';
        this.checkTerminos = document.createElement('input');
        this.checkTerminos.type = 'checkbox';
        this.checkTerminos.className = 'w3-check';
        this.checkTerminos.checked = true;
        this.labelTerminos = document.createElement('label');
        this.labelTerminos.textContent = ' ACEPTO TÉRMINOS Y CONDICIONES';
        this.campoCheck.appendChild(this.checkTerminos);
        this.campoCheck.appendChild(this.labelTerminos);
        this.caja.appendChild(this.campoCheck);
        this.botonIngresar = document.createElement('button');
        this.botonIngresar.type = 'button';
        this.botonIngresar.className = 'w3-button w3-round w3-margin-bottom w3-primary w3-block';
        this.botonIngresar.textContent = 'Ingresar';
        this.caja.appendChild(this.botonIngresar);

        this.feedback = document.createElement('p');
        this.feedback.className = 'feedback';
        this.caja.appendChild(this.feedback);

        this.pie = document.createElement('div');
        this.pie.className = 'w3-center w3-border-top';
        this.mensajePie = document.createElement('p');
        this.mensajePie.className = 'w3-margin';
        this.avisoPie = document.createElement('span');
        this.avisoPie.className = 'w3-text-warning';
        this.avisoPie.textContent = '¿No tenés cuenta?';
        this.enlaceRegistro = document.createElement('a');
        this.enlaceRegistro.href = '#';
        this.enlaceRegistro.textContent = ' Registrate acá';
        this.mensajePie.appendChild(this.avisoPie);
        this.mensajePie.appendChild(this.enlaceRegistro);
        this.pie.appendChild(this.mensajePie);
        this.card.appendChild(this.pie);
    }

    connectedCallback() {
        this.botonIngresar.onclick = this.ejecutarLogin.bind(this);
        this.enlaceRegistro.onclick = this.irARegistro.bind(this);
    }

    disconnectedCallback() {
        this.botonIngresar.onclick = null;
        this.enlaceRegistro.onclick = null;
    }

    irARegistro(evento) {
        evento.preventDefault();
        this.ocultarFeedback();
        mostrarVista('vista-registro');
    }

    mostrarFeedback(texto) {
        this.feedback.textContent = texto;
        this.feedback.className = 'feedback feedback-error';
    }

    mostrarExito(texto) {
        this.feedback.textContent = texto;
        this.feedback.className = 'feedback feedback-exito';
    }

    ocultarFeedback() { this.feedback.textContent = ''; }

    limpiarCampos() {
        this.inputUsuario.value = '';
        this.inputClave.value = '';
    }

    async ejecutarLogin() {
        const usuario = this.inputUsuario.value;
        const clave = this.inputClave.value;
        if (!usuario || !clave) { this.mostrarFeedback('Completá usuario y contraseña.'); return; }

        const hash = await calcularHashSHA256(clave);
        establecerCredenciales(usuario, hash);

        try {
            await RPCWebAPIFetch('/login', {});
            this.limpiarCampos();
            this.ocultarFeedback();
            document.getElementById('vista-dashboard').setUsuario(usuario);
            mostrarVista('vista-dashboard');
        } catch (error) {
            limpiarCredenciales();
            this.mostrarFeedback('Credenciales incorrectas o usuario no encontrado. (' + error.type + ')');
        }
    }
}

customElements.define('wc-login-form-view', WCLoginFormView);