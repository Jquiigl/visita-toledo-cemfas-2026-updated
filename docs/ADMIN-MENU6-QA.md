# Adaptación de administración al Menú 6 — 7 de octubre de 2026

Estado: implementada y validada en V2 local; publicación en main autorizada por el usuario.
V1, sources, hojas Google y datos históricos no modificados. Sin migraciones ni escrituras de respuestas.

## Referencia real

Hoja de inscripciones verificada mediante Google Drive/Sheets: 69 cabeceras,
102 filas de cuadrícula y 75 columnas asignadas. Una inscripción actual.
No se incluyen nombres ni datos personales en este informe ni en las pruebas.
Cuatro asistentes; dos adultos y dos menores; tres menús seleccionados y un menú
pendiente bajo la declaración de asistencia a la comida. Dos raviolis, dos
salmones, cero garbanzos, cero costillas y cero necesidades especiales declaradas.
La selección infantil no exige platos del Menú 6.

## Cambios

Lectura por nombre de cabecera, alias antiguos y actuales y ancho real de hoja.
Preguntas repetidas sin identificador: ocurrencia por cabecera; conservar su orden
relativo o asignar títulos únicos para permitir reordenarlas entre sí.
Restauración, listados nominales y exportaciones incorporan primeros y segundos.
Resumen y dossier incorporan recuentos. Excepciones alimentarias separadas por tipo,
con detalle y observaciones literales, en informe restringido seleccionable.
Necesidades por inscripción no se atribuyen automáticamente a una persona;
los contadores especiales no son cantidades de menús para encargar al restaurante.
Se preservan las necesidades individuales históricas.
Avisos por ausencia de menú/plato, elección desconocida/incompatible, falta de
respuesta especial, falta de detalle en alergia/intolerancia u Otro, y No con texto.
Compatibilidad de menú especial/platos generales requiere confirmación del proveedor.

## Validación

66 pruebas aprobadas; tipos, lint y construcción Pages aprobados.
Funciones de Cloudflare compiladas. Diff sin errores de espacios.
Datos actuales leídos por conector, normalizados y procesados sin errores.
Mover las columnas únicas de platos conserva las mismas asignaciones y recuentos.
Panel de restauración y centro de revisión comprobados en navegador local con una
copia temporal de la lectura real servida solo en loopback; sin avisos de consola.
La API de esta comprobación local es un sustituto de prueba: no valida sesión ni
secretos de producción. El servidor y su configuración temporal se retiraron.
El botón de informe abre el diálogo de impresión; no se ha exportado ni revisado
visualmente un PDF final. Las plantillas incorporan platos, recuentos y excepciones.

## Pendientes

El usuario autorizó expresamente guardar y enviar los cambios a main.
Verificar el despliegue y entrar en una sesión real del administrador para
comprobar la lectura y descargar el dossier.
Wrangler no tiene autenticación local de Cloudflare; la publicación debe usar el
flujo del repositorio o una sesión autorizada de Cloudflare.
