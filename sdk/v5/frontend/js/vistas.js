export function mostrarVista(idVista) {
    const ids = ['vista-login', 'vista-registro', 'vista-dashboard'];
    ids.forEach(function ocultar(id) {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(idVista).classList.remove('hidden');
}