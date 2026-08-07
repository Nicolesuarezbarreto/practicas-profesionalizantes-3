# SDK v5

Sigo escalando lo que venía haciendo en v4, ahora con los puntos 1 y 2 de la consigna.

## Punto 1: RPCWebAPIFetch

En `frontend/js/api-client.js` quedó la función `RPCWebAPIFetch(name, content)`, que ahora centraliza todas las peticiones a la API. Manda siempre POST con JSON, y si la respuesta no es 200 tira una excepción, así cada componente decide qué hacer visualmente (mostrar el error, volver al login, etc.).

## Punto 2: WebComponents con la plantilla

Usando la plantilla w3admin del repositorio:

- `WCLoginFormView`: encapsula el formulario LOGIN de `login.html`.
- `WCRegisterFormView`: encapsula el HORIZONTAL FORM de `forms.html`.
- `WCDashboardView`: el panel de después del login, con los botones `/log` y `/sayHello` que vengo usando desde v3 para probar el autorizador.

Los componentes están hechos con `createElement` (sin HTML incrustado), sin funciones flecha, y el `connectedCallback`/`disconnectedCallback` solo para enganchar y soltar eventos.

## Cambios en el backend

- Saqué el interceptor que era una función que devolvía otra función (devolución de v4). Ahora son funciones separadas (`validarAutenticacion`, `validarSesion`, `validarAutorizacion`) que se llaman en orden desde el `request_dispatcher`.
- Agregué un `/logout` que cierra la sesión del lado del servidor.

## Para probarlo

- Backend: `node main.mjs` en `sdk/v5/backend` (puerto 3000).
- Frontend: abrir con Live Server o servir con Apache.
- Usuario con permiso sobre `/log`: `admin`.