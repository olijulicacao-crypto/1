# Club OliJuli

App web de regalo (PWA) para quienes compran la mochila MichiGo en la tienda OliJuli.
Funciona completa en el celular del cliente: sin servidor, sin base de datos y sin cuentas.
Los datos se guardan solo en el teléfono (localStorage) y se pueden respaldar en un archivo `.json`.

## Estado

- [x] **Etapa 1:** perfil del gato (varios gatos), carnet de salud con recordatorios (.ics y Google Calendar), carnet para la consulta (imprimible), afiche "SE BUSCA", respaldo y restauración.
- [x] **Etapa 2:** Crea tu Michi (editor SVG: pelaje, diseño, ojos, orejas y accesorios, incluida la mochila OliJuli en los colores de la tienda) y pack de 8 stickers PNG 512x512 transparentes.
- [ ] **Etapa 3:** minijuego, diario de aventuras, pasaporte de explorador, fondos de pantalla y música.

## Archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | Página única de la app |
| `manifest.webmanifest`, `icons/` | Nombre, ícono y colores para instalarla como app |
| `sw.js` | Guarda la app en el teléfono para que abra sin internet |
| `css/app.css` | Estilos con los colores de la tienda OliJuli |
| `js/datos.js` | Guardado local, respaldo y restauración |
| `js/gato.js` | Perfil del gato |
| `js/salud.js` | Carnet de salud, recordatorios y carnet para la consulta |
| `js/perdido.js` | Afiche "SE BUSCA" (canvas) |
| `js/michi.js` | Dibujo del michi (SVG) y editor "Crea tu Michi" |
| `js/stickers.js` | Pack de stickers con frases |
| `js/inicio.js`, `js/ajustes.js`, `js/app.js` | Inicio, ajustes y navegación |

## Probarla en el computador

Desde esta carpeta: `python3 -m http.server 8765` y abrir `http://127.0.0.1:8765`.

## Publicarla gratis (Netlify Drop)

1. Entra a <https://app.netlify.com/drop> desde un computador y crea una cuenta gratis.
2. Arrastra la carpeta `club-olijuli` completa a la página.
3. Netlify te entrega un link `https://algo.netlify.app`. En **Site configuration → Change site name** cámbialo a `club-olijuli` (queda `https://club-olijuli.netlify.app`).
4. Para actualizarla: **Deploys → arrastra la carpeta de nuevo**. El link no cambia.

## Link en el correo de confirmación de Shopify

En Shopify: **Configuración → Notificaciones → Notificaciones a clientes → Confirmación de pedido → Editar código**.
Pega este bloque justo antes de la línea que contiene `{% if line_items_subtotal_price` (o donde quieras que aparezca), cambia el link por el tuyo y guarda:

```liquid
<table class="row" style="width:100%;margin:24px 0;border-collapse:separate;">
  <tr>
    <td style="background:#FFF0DC;border:1px solid #FFE6D1;border-radius:16px;padding:20px;text-align:center;font-family:Arial,sans-serif;color:#3B2314;">
      <p style="margin:0 0 6px;font-size:18px;font-weight:bold;">🎁 Tu regalo: el Club OliJuli</p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.5;">Crea el perfil de tu gato, guarda su carnet de salud con recordatorios y ten listo un afiche "SE BUSCA" por si algún día se pierde.</p>
      <a href="https://club-olijuli.netlify.app" style="display:inline-block;background:#E85500;color:#FFFFFF;text-decoration:none;font-weight:bold;padding:14px 26px;border-radius:999px;font-size:15px;">Entrar al Club OliJuli</a>
    </td>
  </tr>
</table>
```

Usa **Enviar correo de prueba** para revisarlo antes de guardar.
