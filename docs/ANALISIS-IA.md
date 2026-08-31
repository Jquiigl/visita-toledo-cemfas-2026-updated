# Revisión de inscripciones y encuesta — Toledo Updated V2

## Alcance y separación

Solo se modifica el repositorio Updated. V1 permanece intacta.
Las comprobaciones y gráficos funcionan sin contratar ni activar una API.
La interpretación mediante OpenAI es adicional, manual y desactivada por defecto.
No existe borrado, fusión, corrección automática ni escritura en las respuestas.

### Requieren revisión

- Nombres coincidentes tras normalizar espacios, tildes, signos y orden de palabras.
- Nombres compuestos con una única palabra diferente en una letra o transposición.
- Coincidencias dentro de una inscripción o entre varias, con enlaces al origen.
- Indicios contradictorios de edad, transporte o comida, sin asumir que se trate
  de la misma persona.
- Nombre vacío/no alfabético, edad inválida, ausencia de edad de menor,
  transporte sin determinar, menú/comensal y datos de vehículo incoherentes.
- Búsqueda, filtro y CSV privado de los avisos visibles.

Un nombre coincidente puede ser un homónimo. No hay porcentaje de confianza ni
confirmación automática de identidad. La búsqueda aproximada se limita a 2000
nombres de hasta 160 caracteres y 10000 comparaciones entre nombres con palabras comunes; si se alcanza un límite,
la interfaz indica revisión parcial. Los grupos exactos se revisan aparte.
No se comparan documentos, correos o teléfonos que no existen en el modelo importado.

### Valoración

- Respuestas recibidas/analizadas/excluidas y comentarios.
- Media, mediana, distribución 1–5, N válido por pregunta, valores ausentes e inválidos.
- Valoración global y porcentaje de respuestas 4–5, sin confundirlo con participación.
- Comparativa gráfica por pregunta y resumen textual calculado sin IA.
- Exportación TXT/CSV e impresión de resultados; comentarios en exportación separada.
- Las respuestas con referencia repetida se excluyen todas del cálculo hasta revisar
  el origen. No se elige arbitrariamente una ni se borra ninguna.
- Solo puntuaciones enteras 1–5. No hay tasa de participación sin censo validado.

## IA: flujo y privacidad

1. El administrador prepara una vista previa. No se consulta OpenAI.
2. El servidor vuelve a calcular el paquete desde Supabase, no desde cifras enviadas
   por el navegador. Una huella enlaza la confirmación con el conjunto original.
3. Para inscripciones, se envían únicamente recuentos, motivos de aviso y hasta
   60 casos con códigos temporales y señales de coincidencia/contradicción. Se
   declara cualquier caso omitido. No se envían nombres, referencias personales,
   edades, matrículas, fichas ni necesidades de salud.
4. Para encuesta, se envían las cifras agregadas. Las preguntas se identifican por
   Q1/Q2/etc. y categorías genéricas permitidas, sin enviar etiquetas arbitrarias.
   Por defecto no se envía ningún comentario. El administrador puede preparar
   los primeros 40, editar, sustituir o excluir textos (máximo 6000 caracteres).
   Se avisa si son una selección parcial.
5. La casilla de autorización se reinicia al editar. El servidor exige revisión,
   rechaza indicios personales/sensibles y comprueba que los datos no hayan cambiado.
   La ocultación automática NO garantiza anonimato; requiere revisión humana.
6. Se solicita un informe estructurado: resumen, fortalezas, aspectos que revisar,
   recomendaciones y limitaciones. Se valida su forma y sus códigos de referencia.
   Se rechazan respuestas incompletas, negativas o no válidas. No se ejecutan
   herramientas, HTML, enlaces ni instrucciones del texto generado.
7. El resultado es un borrador. No sustituye la comprobación de datos y puede errar.
   Se puede descargar con fecha, modelo, fuente y huella; no se persiste en la app.

Los gráficos nunca utilizan cifras generadas por IA. La IA de inscripciones
interpreta las alertas calculadas, no vuelve a comparar un fichero nominal.
Cada envío requiere una acción y puede tener coste; no hay llamadas ni reintentos
automáticos. Límite de salida: 2400 tokens; espera máxima: 45 segundos.
Hay un límite local por usuario/instancia (2 solicitudes/minuto, 20/hora), que NO
es un límite global de gasto ni se conserva al reiniciar una instancia.

## Activación: una sola credencial nueva

En Cloudflare Pages, proyecto exclusivo `toledo-updated`, entorno Production:

| Variable | Tipo | Requisito |
| --- | --- | --- |
| OPENAI_API_KEY | Secreto cifrado | Clave del proyecto de OpenAI autorizado para Responses |
| OPENAI_MODEL | Configuración | Modelo disponible en ese proyecto compatible con Responses y Structured Outputs |
| OPENAI_ENABLED | Configuración | `true` solo tras revisar proveedor, costes y datos permitidos |

No pegar claves en el chat ni guardarlas en GitHub, frontend, archivos públicos
o variables con prefijo PUBLIC_. No hacen falta claves de Google, otra clave
Supabase, ni credenciales de administrador de OpenAI para generar el informe.
La conexión de Google es independiente de la IA. Las dos hojas y sus columnas
ya están identificadas; la lectura directa y sus límites se describen en
[GOOGLE-SHEETS.md](GOOGLE-SHEETS.md). Activar Google no activa OpenAI.

Antes de activar, revisar facturación, límites y controles del proyecto del
proveedor. Tras guardar las variables, volver a desplegar y hacer una primera
prueba expresamente autorizada con datos ficticios o únicamente cifras no personales.
No se han comprado créditos, creado credenciales ni realizado llamadas reales.

La integración usa Responses con `store:false`, no conversaciones, archivos ni
almacenes vectoriales. Esto no equivale a garantizar retención cero o residencia
exclusiva en la UE. Revisar los controles contratados del proveedor antes de
enviar datos: [controles de datos de OpenAI](https://developers.openai.com/api/docs/guides/your-data).
Esquema basado en la [documentación oficial de Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

## Pruebas

`pnpm check:pages`: 56 pruebas (dominio, Google, privacidad, proveedor simulado,
autenticación, CSRF, huella y permisos), TypeScript, lint y build de Pages.

Chrome local con datos ficticios y proveedor simulado, nunca con claves reales:

- Ambas páginas y sus vistas previas a 320, 375, 768 y 1280 px: sin desbordamiento
  del documento y botones visibles de al menos 44 px.
- Filtro de duplicados oculta los errores no seleccionados.
- La vista previa no contiene fichas nominales.
- Envío desactivado antes de marcar la autorización; editar reinicia la casilla.
- Generación simulada de los dos informes, indicada explícitamente como simulación.
- Pruebas de homónimos, diferencias de una letra, datos árabes/coreanos, edades,
  respuestas repetidas, escala inválida, N desigual y ausencia de datos.
- No se certifican Safari, todos los dispositivos físicos ni nuevos PDF renderizados.

La API real y los datos reales siguen pendientes de configuración y prueba.
