# Toledo Updated · Visita cultural e institucional

Versión V2 completa, trasladada a un repositorio independiente:
[visita-toledo-cemfas-2026-updated](https://github.com/Jquiigl/visita-toledo-cemfas-2026-updated).

## Qué contiene

- Zona pública con siete idiomas, árabe RTL persistente, programa provisional, mapa, fichas, imágenes y 49 audios.
- Inscripción y valoración mediante Google Forms. El botón dorado de valoración aparece debajo de Inscripción, con aviso de responder después de la actividad y plazo del 28 de octubre de 2026 inclusive.
- Administrador protegido por el servidor: sesión segura, listados, recuentos, revisión, documentos y valoración.
- Adaptadores de Google Sheets y OpenAI. Siguen pendientes las credenciales y la validación de la integración real; el panel trabaja con datos ficticios.

## Ejecutar y comprobar

Node 24 y pnpm 11. Instalar con `pnpm install --frozen-lockfile`.
Configurar `.dev.vars` a partir del ejemplo, sin subir secretos.
Inicializar la base local con `pnpm exec wrangler d1 migrations apply DB --local`.
Iniciar con `pnpm dev --host 127.0.0.1`.

`pnpm test`, `pnpm exec tsc --noEmit --incremental false`, `pnpm lint` y `pnpm build` validan la aplicación.
Consultar [README-V2.md](README-V2.md) para crear el administrador y conocer límites, privacidad e integraciones.

## GitHub no equivale a alojamiento web

La rama principal de **este nuevo repositorio** ejecuta las pruebas y la construcción.
No despliega en GitHub Pages ni sustituye la web V1.

V2 incluye servidor y base de datos: necesita un alojamiento compatible (Workers/Sites) para que funcionen el inicio de sesión y las rutas privadas. Una validación verde en GitHub confirma la construcción, no una URL pública operativa. El fallo previo de conexión con Sites no se soluciona solo al cambiar de repositorio.

## Separación de V1

La copia procede de V2 en el commit `f91f0fe0b26cae430d17c03cedff98d11b8f8173`.
Se conserva el historial de desarrollo. El repositorio original y su rama `main` (V1) permanecen intactos, incluyendo su configuración de publicación.
La rama V2 anterior se conserva como respaldo y no se borra: el desarrollo de Updated continúa aquí.
El repositorio no contiene contraseñas, claves privadas, sesiones ni respuestas reales de participantes.

El material gráfico y sonoro se conserva; las cabeceras, la aplicación instalable y los metadatos usan el nombre Toledo Updated.
