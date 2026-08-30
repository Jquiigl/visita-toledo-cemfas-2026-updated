# Toledo Updated · V2 · Prototipo funcional

V2 continúa como **Toledo Updated** en la rama `main` del repositorio independiente `Jquiigl/visita-toledo-cemfas-2026-updated`, trasladada desde el commit V2 `f91f0fe0b26cae430d17c03cedff98d11b8f8173`. El repositorio original `Jquiigl/visita-toledo-cemfas-2026`, su rama principal, la copia `app/` y GitHub Pages V1 no se modifican. La copia anterior de V2 se conserva como respaldo.

## Alcance realizado

- Zona pública heredada: siete idiomas, árabe RTL, programa provisional, guía, mapa, meteorología mediante enlace, recomendaciones, gastronomía, inscripción y audios. Formularios de V2 según el PRD: inscripción `https://forms.gle/J88j2NxP6GnCfRT16` y valoración `https://forms.gle/NKp7nyVtAEZfZz2T8`. No se enviaron respuestas ni se modificaron formularios.
- Administración: login y todas las rutas protegidos por el servidor. Bcrypt coste 12, sesiones opacas con hash almacenado, cookies `__Host-`, `HttpOnly`, `Secure`, `SameSite=Strict`; 30 minutos de inactividad, 8 horas máximas; cierre de sesión y límites persistentes de intentos. Sin registro público ni recuperación de contraseña.
- Seis inscripciones ficticias, doce personas. Búsqueda/filtros/orden en asistentes, autobús, restauración y necesidades; vehículos conservan texto original; incidencias enlazadas al origen.
- Exportación CSV con neutralización de fórmulas. Dossier seleccionable y plantillas de impresión/PDF propias (se guarda como PDF desde el diálogo del navegador; no es un generador PDF de servidor). Información sensible excluida por defecto.
- Valoración independiente: N, suma, media, mediana y distribuciones mediante código, comentarios originales y exportación. No se inventa participación porcentual sin censo de encuestables validado.
- Valoración visible desde la primera carga, sin depender de la base de datos ni de un ajuste del administrador. Aviso en siete idiomas: responder después de la actividad; fecha límite 28 de octubre de 2026 inclusive. El aviso no programa el cierre del formulario Google.
- Configuración persistente de herencia provisional del transporte.

## Ejecutar

Node 24 recomendado, pnpm y dependencias del repositorio. `pnpm install --frozen-lockfile`; `pnpm exec wrangler d1 migrations apply DB --local`; configurar `.dev.vars`; `pnpm dev --host 127.0.0.1`.

`pnpm hash-password` pide una contraseña sin mostrarla y devuelve solo el hash. Configurar `ADMIN_USERS` como JSON usuario → hash. Ejemplo conceptual (no válido): `ADMIN_USERS='{"organizador":"HASH_GENERADO"}'`. Nunca guardar contraseñas en texto plano. `.dev.vars` está ignorado por Git. En alojamiento, usar secretos del servidor. Cambiar el hash e iniciar nuevamente el servidor invalida las sesiones anteriores. No hay clave API para este paso.

El prototipo alojado usa HTTPS. HTTP solo se admite en loopback local de desarrollo, manteniendo la cookie Secure. No desplegar bajo la URL de V1: evita interferencias con su service worker. En V2 únicamente se cachean imágenes y audios públicos; nunca HTML, API o panel privado.

## Credenciales exactas por integración

| Integración | Secretos | Configuración no secreta | Estado |
|---|---|---|---|
| Administrador | `ADMIN_USERS` con hashes bcrypt | nombres elegidos por el organizador | Implementado |
| Google Sheets, lectura | `GOOGLE_PRIVATE_KEY` de cuenta de servicio | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `REGISTRATION_SHEET_ID`, `EVALUATION_SHEET_ID`, ambos rangos y mapeo de columnas | Adaptador preparado, no conectado |
| IA · OpenAI | `OPENAI_API_KEY` como secreto del servidor | `OPENAI_MODEL`, modelo habilitado para el proyecto de API | Transporte Responses y circuito de revisión implementados; falta configurar y probar una llamada real |
| Google Forms | Ninguno | enlaces de ambos formularios | Accesos públicos |
| Mapas y meteorología | Ninguno | enlaces actuales | Heredado de V1 |
| GitHub | Autenticación ya disponible del usuario | repositorio/rama | No se necesita una nueva API key |

Para Sheets: activar Google Sheets API, compartir **solo las dos hojas** con la cuenta de servicio como lector y utilizar `spreadsheets.readonly`. No se necesita Google Forms API, API key pública, permisos de edición, acceso al correo ni delegación de dominio. Referencia: [Google — credenciales y cuentas de servicio](https://developers.google.com/workspace/guides/create-credentials).

## Adaptadores y límites deliberados

`server/adapters/sheets.ts` implementa JWT de cuenta de servicio, lectura de dos fuentes, límites de tiempo y mapeo explícito. No está conectado al panel: antes deben inspeccionarse las cabeceras reales y validarse el esquema, edades, acompañantes, transporte y consentimientos con ejemplos autorizados. `DATA_SOURCE=mock` es el único modo habilitado. Otro valor falla de forma explícita: no sustituye silenciosamente datos reales por simulados. No hay sincronización automática ni escritura a Google.

`server/adapters/openai.ts` implementa el transporte de la [API Responses de OpenAI](https://developers.openai.com/api/docs/guides/text). En Valoración, el administrador prepara un borrador, lo edita y confirma expresamente la eliminación de datos personales antes de enviarlo. Solo se transmite ese texto: nunca listados, nombres ni necesidades funcionales de forma automática. La ocultación previa es solo una ayuda, no una garantía de anonimato. Se bloquean indicios sensibles, entradas excesivas y resultados incompletos. Se pide `store:false`, pero esto no equivale a una garantía de retención cero del proveedor. Cada envío puede tener coste; no hay reintentos automáticos. El modelo se configura explícitamente, sin elegirlo por el usuario. Ninguna estadística depende de la IA.

En Configuración, «Comprobar acceso a Google» verifica exclusivamente metadatos de las hojas, con alcance de lectura, una vez instaladas las credenciales. No importa respuestas ni activa automáticamente el origen real. El estado diferencia credenciales configuradas de acceso comprobado.

### Pendiente de activación real (30 de agosto de 2026)

- Localizada mediante Google Drive la hoja «Visita a Toledo 2026 — Formulario de inscripción (respuestas)», pestaña «Respuestas de formulario 1». Solo se leyeron encabezados. Hay encabezados repetidos para acompañantes y campos colectivos de necesidades: no se debe aplicar un mapeo por nombre que mezcle personas. Antes de activar la importación, verificar que corresponde al formulario V2 y validar el mapeo por posición y las reglas de datos colectivos.
- No se localizó la hoja de respuestas de valoración. Hace falta su enlace y verificar sus encabezados.
- El entorno local y el alojamiento no tienen credenciales Google ni OpenAI. La autorización del conector Google Drive de esta conversación no es una credencial reutilizable del servidor.
- Configurar secretos mediante el mecanismo privado del alojamiento, nunca en el chat, GitHub o el frontend. Para OpenAI, activar el complemento OpenAI Developers si se desea gestionar la clave con su flujo seguro. Para Google, cuenta de servicio con acceso de lector solo a las hojas necesarias.
- No se han enviado respuestas reales a OpenAI ni modificado formularios u hojas. El panel conserva datos ficticios hasta resolver lo anterior.

No es todavía una implementación completa del PRD: quedan integración real y caché de última sincronización válida, asignación de capacidad/autobuses si se solicita, búsquedas y filtros avanzados de vehículos, informe cualitativo IA, revisión visual de todas las impresiones y validación con el formulario definitivo. No introducir datos personales reales hasta cerrar esos puntos y revisar permisos, retención, protección de menores y necesidades sensibles.

## Verificar

Corrección de árabe en V2 (31 de agosto de 2026): el idioma se conserva en el enlace (`?lang=ar`) al recargar, compartir y navegar. El servidor ya entrega la portada en el idioma elegido. Las flechas de avance se invierten en árabe; los fragmentos todavía en español se marcan como español y mantienen su dirección de lectura. Las imágenes y posiciones del mapa no se invierten. El administrador continúa en español. No se ha modificado ningún archivo ni la publicación de V1.

- `pnpm test`: normalización, plazas/menús, incidencias, estadística, CSV y barrera de IA.
- `pnpm exec tsc --noEmit` y `pnpm lint`.
- Con servidor y cuenta de prueba: `TEST_ADMIN_PASSWORD=... node scripts/check-api.mjs`. No guardar la contraseña en scripts ni historial compartido. Usar el entorno secreto de la herramienta de pruebas.
- `pnpm build`. El entorno local de Cloudflare puede copiar `.dev.vars` a `dist/server`; el empaquetado debe excluirlo. Nunca subir credenciales al repositorio o al paquete.

Para publicar V2 se necesita un servidor (Workers/Sites en este prototipo). GitHub Pages solo sirve contenido estático y no puede proteger por sí solo este administrador. La automatización de la rama V2 comprueba el código y **no despliega sobre Pages V1**.

Referencia de seguridad: [OWASP — contraseñas](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [OWASP — sesiones](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
