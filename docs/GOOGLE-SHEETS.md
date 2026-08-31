# Lectura de Google Sheets — solo V2

## Funcionamiento y activación

Lectura privada desde Cloudflare al abrir un área del administrador o pulsar
«Actualizar datos». Sin tarea programada, escritura en Google ni copia persistente
de respuestas en Supabase. Supabase conserva autenticación, sesiones y configuración.
Las fuentes nunca se mezclan. Sin caché persistente, localStorage ni datos públicos.

`GOOGLE_SHEETS_ENABLED=true` en `wrangler.jsonc` activa esta fuente. Ponerlo en
false y publicar vuelve a la fuente Supabase (no importa respuestas).
Secretos de producción: `GOOGLE_SERVICE_ACCOUNT_EMAIL` y `GOOGLE_PRIVATE_KEY`.
No hace falta API key de Google ni clave service_role. El botón privado «Comprobar
acceso a Google» valida las dos hojas y devuelve recuentos, no contenido personal.
Todas las llamadas requieren sesión y los POST comprueban mismo origen.

## Mapeo verificado el 31 de agosto de 2026

- Inscripciones: `15J__XQ8jXRFS8IjLxroA4gXjhoqe3MarfjVDOA8oRpQ`, pestaña
  `Respuestas de formulario 1`, sheetId `1532620971`, A:BC (55 columnas).
- Encuesta: `1bGUu3Xb51lnC5vyZC6dsCN-7A-lDh6GZ2n4Lo7dS-WI`, misma denominación
  de pestaña, sheetId `151133299`, A:P (16 columnas).
- Inspección inicial: solo cabeceras, sin respuestas. Opciones verificadas en los
  formularios, sin enviar respuestas ni modificar preguntas.

Configuración en `server/google-schema.ts`. Cabeceras exactas y lectura por
posición para distinguir seis acompañantes con preguntas repetidas. Cambiar
columnas detiene la lectura. Referencias G-fila y E-fila son localizadores, NO
identificadores inmutables ni identidades; cambian al reordenar/insertar filas.
No se deduplican nombres ni fechas: las coincidencias requieren revisión humana.

Se leen todas las filas asignadas en bloques de 500, incluidos huecos. Límites:
10.000 filas de cuadrícula por hoja, 2 millones de caracteres por hoja, 10.000
por celda y 4 MB por respuesta HTTP. Excederlos produce error explícito, no totales
parciales. Sin reintentos automáticos. La lectura no es una transacción entre hojas:
cambios simultáneos se recogerán en la siguiente actualización.

## Reglas de inscripción y límites

- Titular adulto por el ámbito del formulario (alumnos/profesores). Acompañantes:
  ADULTO / MENOR DE EDAD y edad declarada; clasificación desconocida detiene lectura.
- Nombres vacíos y edades mal formadas generan incidencias; no se inventan valores.
- Autobús sí/no del titular. Acompañantes aplican herencia provisional configurable.
- Menú por persona: «No solicita menú» no es comensal. Un menú elegido sí lo es;
  una contradicción con el sí/no general queda señalada. Si se declaró comida y
  falta la selección de una persona, se detiene lectura sin estimar comensales.
- Un menú en una plaza de acompañante vacía genera incidencia, no una persona.
- Vehículo: se conserva texto original; modelo/color/matrícula se revisan manualmente.
- Datos críticos ambiguos detienen vista completa indicando fila/campo sin contenido.
  Si había datos en pantalla, se conserva esa vista anterior con aviso y fecha;
  una recarga no conserva esa copia. No se muestran datos ficticios como reales.
- Correo, empleo y nombre del padrino no se incluyen en el modelo del panel.
- Necesidades de movilidad/alimentación: notas restringidas por inscripción, solo
  con descripción y consentimiento reconocido. No se atribuyen automáticamente a
  nadie. Incidencias señalan falta de consentimiento sin reproducir texto sensible.
  Se consultan en «Necesidades especiales», fuera de exportaciones generales y
  listados individuales. Los recuentos individuales NO son un censo de afectados
  mientras falte atribución. Revisar las notas antes de preparar la operativa.

## Encuesta

Ocho preguntas 1–5 en B:I (global exclusivamente B). Duración/ritmo en J:K son
categorías; tres comentarios L:N conservan sus etiquetas. Relación alumnos/padrinos
en O usa 0–10 (cero válido), nunca mezclada con medias 1–5. Recomendación P admite
selección múltiple, porcentajes por respuesta válida que pueden sumar más de 100 %;
NO es NPS. Respuestas desconocidas se cuentan como inválidas; blancos por separado.
CSV/PDF adicionales incluyen todas las escalas. El texto de resumen principal es
solo de las ocho preguntas 1–5; no sustituye el informe adicional.

IA sigue requiriendo configuración y autorización explícita. Recibe cifras y
categorías permitidas, nunca notas personales de necesidades, nombres ni etiquetas
desconocidas. Los comentarios solo salen después de revisión y confirmación.

## Verificación

`pnpm check:pages` ejecuta pruebas, tipos, lint y construcción.
`tests/google.test.ts` usa RSA efímera y respuestas simuladas: no red ni claves
reales. Cubre alcance lector, redirecciones, errores, límites, huecos, posiciones,
menús, consentimiento, escalas, privacidad y ausencia de escrituras en Supabase.
`tests/pages-auth.test.ts` comprueba sesión/CSRF para el endpoint nuevo.

Tras publicar: comprobar la fuente Google y ambos recuentos desde una sesión real.
Una lectura vacía correcta confirma conexión, no existencia de participantes.

Referencias técnicas:
- https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get
- https://developers.google.com/identity/protocols/oauth2/service-account
- https://developers.openai.com/api/docs/guides/agent-builder-safety#combine-techniques
