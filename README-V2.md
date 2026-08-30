# Toledo V2 · Prototipo funcional

V2 se desarrolla sobre la rama `prototype/toledo-v2`, desde `b0bdffa92d102148a4816ff4ee0358ec9ee7306b` del repositorio `Jquiigl/visita-toledo-cemfas-2026`. La rama principal, la copia `app/` y GitHub Pages V1 no se modifican.

## Alcance realizado

- Zona pública heredada: siete idiomas, árabe RTL, programa provisional, guía, mapa, meteorología mediante enlace, recomendaciones, gastronomía, inscripción y audios. Formularios de V2 según el PRD: inscripción `https://forms.gle/J88j2NxP6GnCfRT16` y valoración `https://forms.gle/NKp7nyVtAEZfZz2T8`. No se enviaron respuestas ni se modificaron formularios.
- Administración: login y todas las rutas protegidos por el servidor. Bcrypt coste 12, sesiones opacas con hash almacenado, cookies `__Host-`, `HttpOnly`, `Secure`, `SameSite=Strict`; 30 minutos de inactividad, 8 horas máximas; cierre de sesión y límites persistentes de intentos. Sin registro público ni recuperación de contraseña.
- Seis inscripciones ficticias, doce personas. Búsqueda/filtros/orden en asistentes, autobús, restauración y necesidades; vehículos conservan texto original; incidencias enlazadas al origen.
- Exportación CSV con neutralización de fórmulas. Dossier seleccionable y plantillas de impresión/PDF propias (se guarda como PDF desde el diálogo del navegador; no es un generador PDF de servidor). Información sensible excluida por defecto.
- Valoración independiente: N, suma, media, mediana y distribuciones mediante código, comentarios originales y exportación. No se inventa participación porcentual sin censo de encuestables validado.
- Configuración persistente de encuesta pública y herencia provisional del transporte.

## Ejecutar

Node 24 recomendado, pnpm y dependencias del repositorio. `pnpm install --frozen-lockfile`; `pnpm exec wrangler d1 migrations apply DB --local`; configurar `.dev.vars`; `pnpm dev --host 127.0.0.1`.

`pnpm hash-password` pide una contraseña sin mostrarla y devuelve solo el hash. Configurar `ADMIN_USERS` como JSON usuario → hash. Ejemplo conceptual (no válido): `ADMIN_USERS='{"organizador":"HASH_GENERADO"}'`. Nunca guardar contraseñas en texto plano. `.dev.vars` está ignorado por Git. En alojamiento, usar secretos del servidor. Cambiar el hash e iniciar nuevamente el servidor invalida las sesiones anteriores. No hay clave API para este paso.

El prototipo alojado usa HTTPS. HTTP solo se admite en loopback local de desarrollo, manteniendo la cookie Secure. No desplegar bajo la URL de V1: evita interferencias con su service worker. En V2 únicamente se cachean imágenes y audios públicos; nunca HTML, API o panel privado.

## Credenciales exactas por integración

| Integración | Secretos | Configuración no secreta | Estado |
|---|---|---|---|
| Administrador | `ADMIN_USERS` con hashes bcrypt | nombres elegidos por el organizador | Implementado |
| Google Sheets, lectura | `GOOGLE_PRIVATE_KEY` de cuenta de servicio | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `REGISTRATION_SHEET_ID`, `EVALUATION_SHEET_ID`, ambos rangos y mapeo de columnas | Adaptador preparado, no conectado |
| IA | Clave del proveedor que se elija, **ninguna por ahora** | proveedor, modelo y adaptador HTTP por decidir | Interfaz y barrera de revisión preparadas; desactivada |
| Google Forms | Ninguno | enlaces de ambos formularios | Accesos públicos |
| Mapas y meteorología | Ninguno | enlaces actuales | Heredado de V1 |
| GitHub | Autenticación ya disponible del usuario | repositorio/rama | No se necesita una nueva API key |

Para Sheets: activar Google Sheets API, compartir **solo las dos hojas** con la cuenta de servicio como lector y utilizar `spreadsheets.readonly`. No se necesita Google Forms API, API key pública, permisos de edición, acceso al correo ni delegación de dominio. Referencia: [Google — credenciales y cuentas de servicio](https://developers.google.com/workspace/guides/create-credentials).

## Adaptadores y límites deliberados

`server/adapters/sheets.ts` implementa JWT de cuenta de servicio, lectura de dos fuentes, límites de tiempo y mapeo explícito. No está conectado al panel: antes deben inspeccionarse las cabeceras reales y validarse el esquema, edades, acompañantes, transporte y consentimientos con ejemplos autorizados. `DATA_SOURCE=mock` es el único modo habilitado. Otro valor falla de forma explícita: no sustituye silenciosamente datos reales por simulados. No hay sincronización automática ni escritura a Google.

`server/adapters/ai.ts` define `analyzeComments`, `generateRecommendations`, `generateSummary`, una implementación desactivada y otra que recibe un transporte del futuro proveedor. La preparación de anonimización es solo una ayuda: exige verificación humana y bloquea señales sensibles evidentes. No se considera garantía de anonimato y todavía no hay circuito de revisión/envío en la UI. No hay estadísticas calculadas por IA ni llamadas a proveedores.

No es todavía una implementación completa del PRD: quedan integración real y caché de última sincronización válida, asignación de capacidad/autobuses si se solicita, búsquedas y filtros avanzados de vehículos, informe cualitativo IA, revisión visual de todas las impresiones y validación con el formulario definitivo. No introducir datos personales reales hasta cerrar esos puntos y revisar permisos, retención, protección de menores y necesidades sensibles.

## Verificar

- `pnpm test`: normalización, plazas/menús, incidencias, estadística, CSV y barrera de IA.
- `pnpm exec tsc --noEmit` y `pnpm lint`.
- Con servidor y cuenta de prueba: `TEST_ADMIN_PASSWORD=... node scripts/check-api.mjs`. No guardar la contraseña en scripts ni historial compartido. Usar el entorno secreto de la herramienta de pruebas.
- `pnpm build`. El entorno local de Cloudflare puede copiar `.dev.vars` a `dist/server`; el empaquetado debe excluirlo. Nunca subir credenciales al repositorio o al paquete.

Para publicar V2 se necesita un servidor (Workers/Sites en este prototipo). GitHub Pages solo sirve contenido estático y no puede proteger por sí solo este administrador. La automatización de la rama V2 comprueba el código y **no despliega sobre Pages V1**.

Referencia de seguridad: [OWASP — contraseñas](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [OWASP — sesiones](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
