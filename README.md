# Toledo Updated · Visita cultural e institucional

Versión V2 completa, trasladada a un repositorio independiente:
[visita-toledo-cemfas-2026-updated](https://github.com/Jquiigl/visita-toledo-cemfas-2026-updated).

## Qué contiene

- Portada en `/` con fotografía de Toledo y dos accesos: Usuario abre `/guia` sin contraseña y Administrador abre `/admin/login`, con validación en el servidor. Los siete idiomas, incluido árabe RTL, se conservan al entrar en la guía. El QR existente sigue siendo válido.
- Zona pública con siete idiomas, árabe RTL persistente, programa provisional, mapa, fichas, imágenes y 49 audios.
- Inscripción y valoración mediante Google Forms. El botón dorado de valoración aparece debajo de Inscripción, con aviso de responder después de la actividad y plazo del 28 de octubre de 2026 inclusive.
- Administrador protegido por el servidor: sesión segura, listados, recuentos, revisión, documentos y valoración.
- Google Sheets en modo de solo lectura para inscripciones y encuestas, con credenciales exclusivamente en el servidor. OpenAI sigue siendo opcional y permanece desactivado sin configuración explícita.

Los enlaces públicos antiguos `/#program`, `/#registration` y las fichas `/#card-…`
se trasladan a `/guia` conservando el idioma y la pantalla. La portada es una
elección de recorrido, no una barrera de autenticación para la información pública.
No modifica las sesiones, permisos ni integraciones del administrador.

## Ejecutar y comprobar

### Nueva publicación: Cloudflare Pages + Supabase UE

La migración conserva la interfaz y añade Supabase Auth, PostgreSQL y RLS.
Instrucciones, variables, modelo de datos, coste y comprobaciones en
[PRODUCCION-UE.md](docs/PRODUCCION-UE.md).

`pnpm check:pages` valida y construye `dist-pages`; `pnpm dev:pages` abre el entorno
Pages local. Configurar las variables Supabase en `.dev.vars` (local) o en Pages
(producción). El administrador no acepta las credenciales antiguas en este modo:
requiere una cuenta real de Supabase y autorización en `admin_users`.

### Respaldo local: Vinext + D1

Node 24 y pnpm 11. Instalar con `pnpm install --frozen-lockfile`.
Configurar `.dev.vars` a partir del ejemplo, sin subir secretos.
Inicializar la base local con `pnpm exec wrangler d1 migrations apply DB --local --config wrangler.legacy.jsonc`.
Iniciar con `pnpm dev --host 127.0.0.1`.

`pnpm test`, `pnpm exec tsc --noEmit --incremental false`, `pnpm lint` y `pnpm build` validan la aplicación.
Consultar [README-V2.md](README-V2.md) para crear el administrador y conocer límites, privacidad e integraciones.

## GitHub no equivale a alojamiento web

La rama principal de **este nuevo repositorio** ejecuta las pruebas y la construcción.
No despliega en GitHub Pages ni sustituye la web V1.

La nueva publicación utiliza Cloudflare Pages con pequeñas Pages Functions para
proteger las rutas y las cookies, y Supabase para datos y autenticación. Una validación
verde en GitHub confirma las pruebas, no una URL pública operativa. No utiliza GitHub
Pages ni sustituye V1. El modo anterior se conserva exclusivamente como respaldo.

## Separación de V1

La copia procede de V2 en el commit `f91f0fe0b26cae430d17c03cedff98d11b8f8173`.
Se conserva el historial de desarrollo. El repositorio original y su rama `main` (V1) permanecen intactos, incluyendo su configuración de publicación.
La rama V2 anterior se conserva como respaldo y no se borra: el desarrollo de Updated continúa aquí.
El repositorio no contiene contraseñas, claves privadas, sesiones ni respuestas reales de participantes.

El material gráfico y sonoro se conserva; las cabeceras, la aplicación instalable y los metadatos usan el nombre Toledo Updated.
