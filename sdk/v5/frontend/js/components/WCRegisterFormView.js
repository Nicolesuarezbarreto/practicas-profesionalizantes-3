import { RPCWebAPIFetch, calcularHashSHA256, establecerCredenciales, limpiarCredenciales } from '../api-client.js';
import { mostrarVista } from '../vistas.js';

export class WCRegisterFormView extends HTMLElement {
    constructor() {
        super();

        this.card = document.createElement('div');
        this.card.className = 'w3-white w3-round w3-border w3-margin-bottom tarjeta-auth tarjeta-ancha';
        this.appendChild(this.card);

        this.encabezado = document.createElement('header');
        this.encabezado.className = 'w3-padding-large w3-large w3-border-bottom';
        this.encabezado.style.fontWeight = '500';
        this.encabezado.textContent = 'HORIZONTAL FORM';
        this.card.appendChild(this.encabezado);

        this.cuerpo = document.createElement('div');
        this.cuerpo.className = 'w3-padding-large';
        this.card.appendChild(this.cuerpo);

        this.formulario = document.createElement('form');
        this.cuerpo.appendChild(this.formulario);

        this.inputUsuario   = this.agregarFila('Usuario',     'text',     'Ingrese su nombre de usuario');
        this.inputEmail     = this.agregarFila('Email',       'text',     'Ingrese su correo electrónico');
        this.inputMovil     = this.agregarFila('Nº Móvil',    'text',     'Ingrese su número de móvil');
        this.inputClave     = this.agregarFila('Contraseña',  'password', 'Ingrese una contraseña');
        this.inputConfirmar = this.agregarFila('Confirmar',   'password', 'Repita la contraseña');

        this.filaCheck = document.createElement('div');
        this.filaCheck.className = 'w3-row w3-margin-bottom';
        this.celdaVacia = document.createElement('div');
        this.celdaVacia.className = 'w3-col l2';
        this.celdaCheck = document.createElement('div');
        this.celdaCheck.className = 'w3-col l10';
        this.checkTerminos = document.createElement('input');
        this.checkTerminos.type = 'checkbox';
        this.checkTerminos.className = 'w3-check';
        this.labelCheck = document.createElement('label');
        this.labelCheck.textContent = ' Acepto términos y condiciones';
        this.celdaCheck.appendChild(this.checkTerminos);
        this.celdaCheck.appendChild(this.labelCheck);
        this.filaCheck.appendChild(this.celdaVacia);
        this.filaCheck.appendChild(this.celdaCheck);
        this.formulario.appendChild(this.filaCheck);

        this.filaBoton = document.createElement('div');
        this.filaBoton.className = 'w3-row w3-margin-bottom';
        this.celdaBotonVacia = document.createElement('div');
        this.celdaBotonVacia.className = 'w3-col l2';
        this.celdaBoton = document.createElement('div');
        this.celdaBoton.className = 'w3-col l10';
        this.botonRegistrar = document.createElement('button');
        this.botonRegistrar.type = 'button';
        this.botonRegistrar.className = 'w3-button w3-primary w3-round';
        this.botonRegistrar.textContent = 'Registrarse';
        this.celdaBoton.appendChild(this.botonRegistrar);
        this.filaBoton.appendChild(this.celdaBotonVacia);
        this.filaBoton.appendChild(this.celdaBoton);
        this.formulario.appendChild(this.filaBoton);

        this.feedback = document.createElement('p');
        this.feedback.className = 'feedback';
        this.cuerpo.appendChild(this.feedback);

        this.pie = document.createElement('div');
        this.pie.className = 'w3-center w3-border-top';
        this.mensajePie = document.createElement('p');
        this.mensajePie.className = 'w3-margin';
        this.enlaceLogin = document.createElement('a');
        this.enlaceLogin.href = '#';
        this.enlaceLogin.textContent = '¿Ya tenés cuenta? Iniciá sesión';
        this.mensajePie.appendChild(this.enlaceLogin);
        this.pie.appendChild(this.mensajePie);
        this.card.appendChild(this.pie);
    }

    agregarFila(etiqueta, tipo, placeholder) {
        const fila = document.createElement('div');
        fila.className = 'w3-row w3-margin-bottom';
        const label = document.createElement('label');
        label.className = 'w3-col l2';
        label.textContent = etiqueta;
        const caja = document.createElement('div');
        caja.className = 'w3-col l10';
        const input = document.createElement('input');
        input.type = tipo;
        input.className = 'w3-input w3-border w3-round';
        input.placeholder = placeholder;
        caja.appendChild(input);
        fila.appendChild(label);
        fila.appendChild(caja);
        this.formulario.appendChild(fila);
        return input;
    }

    connectedCallback() {
        this.botonRegistrar.onclick = this.ejecutarRegistro.bind(this);
        this.enlaceLogin.onclick = this.irALogin.bind(this);
    }

    disconnectedCallback() {
        this.botonRegistrar.onclick = null;
        this.enlaceLogin.onclick = null;
    }

    irALogin(evento) {
        evento.preventDefault();
        mostrarVista('vista-login');
    }

    mostrarFeedback(texto) {
        this.feedback.textContent = texto;
        this.feedback.className = 'feedback feedback-error';
    }

    limpiarCampos() {
        this.inputUsuario.value = '';
        this.inputEmail.value = '';
        this.inputMovil.value = '';
        this.inputClave.value = '';
        this.inputConfirmar.value = '';
    }

    async ejecutarRegistro() {
        const usuario = this.inputUsuario.value;
        const clave = this.inputClave.value;
        const confirmar = this.inputConfirmar.value;

        if (!usuario || !clave) { this.mostrarFeedback('Completá al menos usuario y contraseña.'); return; }
        if (clave !== confirmar) { this.mostrarFeedback('Las contraseñas no coinciden.'); return; }

        const hash = await calcularHashSHA256(clave);
        establecerCredenciales(usuario, hash);

        try {
            await RPCWebAPIFetch('/register', {});
            limpiarCredenciales();
            this.limpiarCampos();
            mostrarVista('vista-login');
            document.getElementById('vista-login').mostrarExito('¡Usuario creado! Ya podés iniciar sesión.');
        } catch (error) {
            limpiarCredenciales();
            this.mostrarFeedback('No se pudo registrar: ' + error.detail);
        }
    }
}

customElements.define('wc-register-form-view', WCRegisterFormView);