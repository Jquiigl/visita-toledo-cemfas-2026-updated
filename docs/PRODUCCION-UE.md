# Toledo Updated: migración progresiva a Pages + Supabase UE

## Estado y alcance

Código de migración preparado en el repositorio Updated. El 31/08/2026 se creó la
organización gratuita Toledo Updated y el proyecto en Frankfurt (`eu-central-1`),
verificados en el panel. Las tablas iniciales se aplicaron en la base nueva vacía.
Las cuentas de administrador y la publicación todavía necesitan verificación real;
no se deducen de que una compilación o una prueba simulada pase.

Se conservan la interfaz, los siete idiomas (árabe RTL), los 49 audios, los dos formularios,
los cálculos y las vistas de impresión. V1 y su publicación no se modifican.
`pnpm dev` y `pnpm build` conservan el sistema anterior Vinext/D1 como respaldo local.
La nueva publicación utiliza exclusivamente `pnpm check:pages`, `dist-pages` y `functions/`.
No eliminar el respaldo hasta verificar la aplicación alojada.

## Arquitectura y decisión de servidor

GitHub → Cloudflare Pages (interfaz estática) → Pages Functions (acceso seguro) → Supabase UE.

- PostgreSQL, Auth, API, administradores y registro de sesiones se mantienen en Supabase.
- RLS deniega datos a visitantes y a usuarios autenticados que no sean administradores.
- Pages Functions verifica cada acceso a `/admin` y `/api/admin/*`, usa el JWT del usuario
  y una clave publishable. No utiliza service_role ni ignora RLS.
- La cookie de sesión está cifrada con AES-GCM, es HttpOnly/Secure/SameSite=Strict. Los
  tokens de Supabase nunca se entregan en JSON, JavaScript, HTML o almacenamiento local.
  Solo el servidor puede leer el contenido de la cookie. Las sesiones se revocan en la
  base UE; caducan tras 30 minutos sin peticiones autorizadas, con máximo de 8 horas.
- Supabase valida la contraseña y proporciona límites de autenticación. No se publica
  un registro abierto. La pertenencia administrativa no depende de user_metadata.
- No hay caché de respuestas administrativas, cuerpos en logs, analítica ni copias en KV/D1.
- Storage no se configura todavía: no hay una necesidad de subir documentos privados.
  Los PDF se generan en el navegador y se guardan donde el administrador decida.

Pages Functions usa el runtime Workers, sin añadir un proyecto Worker independiente.
Es necesario aquí para las rutas y cookies HttpOnly del mismo dominio. Un frontend puramente
estático con Supabase JS expondría los tokens de sesión al JavaScript; Edge Functions en un
dominio ajeno exigiría otro diseño de cookies/orígenes. No se añade esa complejidad.

**Residencia, no promesa de exclusividad geográfica:** la base se creará en Frankfurt
`eu-central-1` (o región UE confirmada). Cloudflare sirve recursos estáticos globalmente y
procesa transitoriamente las peticiones administrativas; no es un sistema de procesamiento
exclusivamente UE. Sus registros operativos/IP y los de proveedores deben revisarse según
la política aplicable. No incluir datos personales en URLs. Los formularios originales de
Google siguen almacenando sus respuestas en Google; elegir Frankfurt no los traslada.

## Variables: cuáles y dónde

| Dato | Frontend | Dónde configurarlo |
| --- | --- | --- |
| SUPABASE_URL | Podría ser público; no hace falta aquí | Pages, variable de ejecución |
| SUPABASE_PUBLISHABLE_KEY | Es publicable; se usa solo en servidor | Pages, variable de ejecución |
| SESSION_ENCRYPTION_KEY | Nunca | Secreto Pages; 32 bytes aleatorios en hexadecimal |
| ADMIN_LOGIN_ALIASES | Nunca | Secreto Pages; objeto usuario→correo real de Auth |
| Contraseña del administrador | Nunca en código/repositorio | Crear/cambiar directamente en Supabase Auth |
| service_role / sb_secret / contraseña PostgreSQL | Nunca | No requeridas por la aplicación; solo administración del proyecto |
| Token Cloudflare/GitHub | Nunca | No requerido por la integración nativa GitHub→Pages |

No usar prefijos `VITE_`, `NEXT_PUBLIC_` ni `PUBLIC_` para secretos. `.env.example` y
`.dev.vars.example` contienen solo nombres/valores vacíos. La vista local lee `.dev.vars`,
ignorada por Git. La contraseña del acceso local antiguo **no crea** una cuenta Supabase.
Para conservar `jquiigl`, asociarlo a un correo real mediante ADMIN_LOGIN_ALIASES.
No enviar claves privadas en el chat. Generar la clave de sesión localmente, por ejemplo
con `openssl rand -hex 32`, e introducirla directamente en el campo secreto de Pages.

## Alta de Supabase (una vez)

1. Crear proyecto en organización Free. Seleccionar expresamente Frankfurt, no limitarse
   a una región genérica. Si no existe, confirmar París, Irlanda o Estocolmo en el selector.
   Comprobar el plan antes de aceptar; no activar complementos de pago.
2. Guardar la contraseña de la base en el gestor de contraseñas del propietario. No es
   la contraseña del panel de la aplicación y esta aplicación no la necesita.
3. Ejecutar los archivos de `supabase/migrations/` por orden numérico en un proyecto nuevo vacío.
   No ejecutarlo a ciegas en una base que ya tenga tablas con esos nombres.
4. Auth: desactivar nuevas altas públicas; crear el usuario administrador con su correo
   real y contraseña. Confirmar el correo mediante el procedimiento del propietario.
   No habilitar proveedor Google, magic links ni SMTP adicional para este primer acceso.
5. Copiar el UUID real de Auth. En SQL Editor, insertar ese UUID en `public.admin_users`.
   Es la única concesión de administrador. La aplicación no puede añadir administradores.
6. Configurar la URL pública real en Auth y revisar límites de intentos. Usar el valor
   publishable del mismo proyecto; nunca sustituirlo por service_role para solucionar RLS.
7. Verificar que tablas y políticas aparecen, que los anónimos no leen y que la cuenta
   autorizada sí accede. No cargar participantes reales antes de estas comprobaciones.

## Publicar en Cloudflare Pages (una vez)

1. Workers & Pages → crear **Pages**, conectar GitHub y seleccionar solo
   `Jquiigl/visita-toledo-cemfas-2026-updated`. No elegir el repositorio V1.
2. Nombre propuesto `toledo-updated`, rama de producción `main`, raíz del repositorio,
   Node 24, pnpm 11; instalar desde el lockfile. Comando `pnpm check:pages`;
   salida `dist-pages`. Pages debe incluir la carpeta `functions/` de la raíz.
3. Establecer las cuatro variables de ejecución anteriores. Para la primera publicación,
   no copiar secretos de producción a despliegues preview. Los previews sin credenciales
   mostrarán la guía, pero su administrador permanecerá cerrado.
4. Comprobar que los Functions están activos para `/admin`, `/admin/*` y `/api/*`.
   El archivo `_routes.json` se genera al construir. **No publicar solo dist-pages como
   una web estática sin Functions.** No configurar una regla «Cache Everything» en admin/API.
5. HTTPS obligatorio; habilitar redirección HTTP→HTTPS para un dominio personalizado.
   El servicio administrativo rechaza HTTP fuera de localhost. No comprar un dominio:
   puede utilizarse el subdominio que Pages asigne.
6. Validar la URL que muestre Cloudflare. La integración nativa reconstruirá cada push
   a main; `check:pages` aborta ante errores de pruebas, tipos, revisión o compilación.
   GitHub prueba además la migración y RLS en PostgreSQL 17 desechable. Recomendado:
   proteger main y exigir ambos jobs antes de integrar cambios.
7. Las migraciones SQL no se ejecutan automáticamente con cada despliegue. Aplicarlas
   explícitamente, con copia de seguridad y revisión; no dar la contraseña de la base a CI.

`wrangler.jsonc` es la configuración Pages, para que Cloudflare la detecte automáticamente.
El archivo anterior se conserva íntegro como `wrangler.legacy.jsonc` y Vite lo utiliza
explícitamente en el modo de respaldo. `.openai/hosting.json` no participa en Pages.

## Datos e importación gradual

Tablas: activities, registrations, participants, buses, vehicles, menus, evaluations,
survey_questions, evaluation_answers, admin_users y admin_sessions. UUID para registros;
la actividad tiene una referencia estable. Se incluyen claves externas, límites de texto,
fechas y unicidad. Las valoraciones no se vinculan innecesariamente a personas.

Las claves source/source_id permiten reconocer una respuesta externa sin usar el nombre
como identidad. Mantener una única inscripción por respuesta. No importar la hoja completa
como JSON indiscriminado: omitir correo/teléfono/documentos y diagnósticos si no son
necesarios; revisar los comentarios libres antes de conservarlos.

Registro: https://forms.gle/J88j2NxP6GnCfRT16

Valoración: https://forms.gle/NKp7nyVtAEZfZz2T8

No hay sincronización automática ni envío a IA. El adaptador Google existente queda como
referencia para una fase posterior: exige mapa de columnas validado y autorización de
lectura. Las escrituras públicas Supabase están denegadas porque los envíos se realizan
en Google Forms. Un futuro formulario propio necesita validación, antispam/límite y una
operación de envío específica; no basta con permitir INSERT indiscriminado.

El panel conserva las operaciones existentes: consulta, filtros, CSV, configuración,
estadísticas e impresión. La carga inicial de inscripciones se realiza mediante una
importación administrativa revisada; todavía no se implementa un editor/importador nuevo.

Definir antes de cargar datos reales la fecha de eliminación y quién puede exportar.
No solicitar diagnósticos: solo la necesidad organizativa imprescindible. Las exportaciones
locales pasan a ser responsabilidad del destinatario y no se borran al eliminar la base.

## Coste y mantenimiento

Referencia consultada el 31/08/2026: Supabase Free incluye 500 MB de base, 1 GB de Storage,
5 GB de transferencia y hasta dos proyectos activos; puede pausarse después de una semana
de inactividad. No incluye copias automáticas. Pages Free: 500 builds/mes; Functions comparte
el límite Workers Free de 100.000 peticiones/día. No se contrata ningún plan ni IA de pago.
Revisar cuotas en los paneles y comprobar/reanudar Supabase antes de la actividad. No
programar peticiones ficticias para evitar la pausa. Planificar exportaciones protegidas
de la base y una prueba de restauración; el CSV del panel no es una copia completa.

Fuentes oficiales:
- https://supabase.com/docs/guides/platform/regions
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/auth/rate-limits
- https://supabase.com/pricing
- https://developers.cloudflare.com/pages/functions/
- https://developers.cloudflare.com/pages/functions/pricing/
- https://developers.cloudflare.com/pages/platform/limits/

## Comprobación: no confundir niveles

- Unitarias: proveedores simulados para aislamiento, cookies, autorización, CSRF y paginado.
- SQL: PostgreSQL real efímero en CI prueba anónimo/no admin/admin, CRUD, no autoascenso,
  revocación y caducidad. El pequeño bootstrap Auth es solo para CI, no reproduce todo Auth.
- Construcción: verifica que no se incluyen secretos ni datos ficticios en el cliente.
- Producción pendiente hasta comprobar: región, login real, usuario sin permisos, lectura
  y guardado, cierre y revocación, petición directa a REST anónima, HTTPS, no caché,
  móvil/escritorio y un dossier PDF con datos de prueba. Probar también Supabase pausado.

Nunca ejecutar `bootstrap-ci.sql` en Supabase. `rls.sql` contiene fixtures/ROLLBACK y debe
usarse en un proyecto de pruebas, no sobre datos personales de producción.
