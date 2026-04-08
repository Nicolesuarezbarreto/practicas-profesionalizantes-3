function mostrarMensaje(texto) {
    let div = document.getElementById("mensaje");
    div.innerHTML = texto;
}

// 🔵 Traer stock desde backend
async function mostrarStock() {
    let res = await fetch("http://localhost:3000/materiales");
    let materiales = await res.json();

    let contenedor = document.getElementById("stock");
    contenedor.innerHTML = "";

    materiales.forEach(m => {
        contenedor.innerHTML += m.nombre + ": " + m.cantidad + " " + m.unidad + "<br>";
    });
}

// 🟡 Agregar material
async function agregar() {
    let nombre = document.getElementById("nombre").value;
    let cantidad = Number(document.getElementById("cantidad").value);
    let unidad = document.getElementById("unidad").value;

    if (nombre.trim() === "" || isNaN(cantidad) || cantidad <= 0) {
        mostrarMensaje("Datos inválidos");
        return;
    }

    let res = await fetch("http://localhost:3000/materiales", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ nombre, cantidad, unidad })
    });

    let data = await res.json();
    mostrarMensaje(data.mensaje || data.error);

    mostrarStock();
}

// 🟢 Comprar
async function comprar() {
    let nombre = document.getElementById("nombre").value;
    let cantidad = Number(document.getElementById("cantidad").value);

    if (nombre.trim() === "" || isNaN(cantidad) || cantidad <= 0) {
        mostrarMensaje("Datos inválidos");
        return;
    }

    let res = await fetch("http://localhost:3000/comprar", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ nombre, cantidad })
    });

    let data = await res.json();
    mostrarMensaje(data.mensaje || data.error);

    mostrarStock();
}

// 🔴 Vender
async function vender() {
    let nombre = document.getElementById("nombre").value;
    let cantidad = Number(document.getElementById("cantidad").value);

    if (nombre.trim() === "" || isNaN(cantidad) || cantidad <= 0) {
        mostrarMensaje("Datos inválidos");
        return;
    }

    let res = await fetch("http://localhost:3000/vender", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ nombre, cantidad })
    });

    let data = await res.json();
    mostrarMensaje(data.mensaje || data.error);

    mostrarStock();
}

// cargar stock al iniciar
mostrarStock();