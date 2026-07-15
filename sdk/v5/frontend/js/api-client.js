export async function RPCWebAPIFetch(name, content) {
    var usuario = window.usuarioLogueado || '';
    var token = window.claveHashLogueado ? 'Bearer ' + window.claveHashLogueado : '';

    var response = await fetch('http://localhost:3000' + name, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': usuario,
            'Authorization': token
        },
        body: JSON.stringify(content)
    });

    var data = await response.json();
    if (response.status === 200) {
        return data;
    }
    throw data;
}