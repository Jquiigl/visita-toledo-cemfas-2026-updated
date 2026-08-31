# Administrador responsive — comprobación 31/08/2026

Alcance: exclusivamente Toledo Updated V2. Sin cambios de autenticación,
integraciones, datos de producción, exportación ni contenido de la V1.

## Cambios

- Hasta 900 px: cabecera accesible durante el desplazamiento, menú plegable con
  estado `aria-expanded`, enlaces completos y cierre con Escape. El menú admite
  desplazamiento propio cuando el teléfono está en horizontal.
- Los listados se presentan como fichas con todos sus campos en móvil/tableta;
  las tablas completas se conservan en escritorio. Solo una representación es
  visible y accesible en cada tamaño.
- Filtros en dos columnas, búsqueda a ancho completo y acciones apiladas en
  teléfonos estrechos. Controles táctiles de al menos 44 px (48 px en el panel
  móvil), campos de texto de 16 px y casillas que no se encogen.
- Configuración, documentos, valoraciones, comentarios y editor de IA ajustan
  textos largos al ancho disponible. No se activa ni se modifica la IA.

## Prueba en Chrome con datos ficticios exclusivamente locales

Se reutilizaron los componentes reales y los datos de `server/mock.ts`, con un
nombre largo y un texto de vehículo sin espacios como casos límite. La vista
local de prueba rechazaba escrituras y no conectaba a Supabase ni a Google.

| Ancho | Secciones comprobadas | Resultado |
| --- | --- | --- |
| 320 px | Las 11 secciones | Ancho del documento = 320; ningún botón visible menor de 44 px |
| 390 px | Las 11 secciones | Sin desbordamiento del documento; fichas y menú móvil |
| 768 px | Las 11 secciones | Sin desbordamiento del documento; fichas y menú móvil |
| 901 px | Las 11 secciones | Sin desbordamiento del documento; navegación lateral y tablas |
| 1280 px | Las 11 secciones | Sin desbordamiento del documento; navegación lateral y tablas |

Comprobaciones adicionales:

- Revisión visual del resumen y las fichas a 375 px, configuración a 320 px y
  escritorio a 1280 px.
- Abrir/cerrar menú, Escape, navegación desde el menú y cierre al cambiar de
  sección, incluido desde la parte inferior de un listado largo.
- Orientación horizontal a 812 × 375: navegación operativa y sin desbordamiento.
- Filtro de menores: 3 fichas. Búsqueda sin coincidencias: aviso accesible sin
  tabla vacía. Búsqueda por titular mantiene también a sus acompañantes.
- Login a 320 px: sin desbordamiento; inputs de 16 px y 50 px de altura.
- Las tablas extensas de escritorio desplazan únicamente su región, accesible
  con teclado; las fichas móviles muestran todos los campos sin recortes.

## Verificación y límites

`pnpm check:pages`: pruebas de dominio/integraciones/autenticación, TypeScript,
lint y construcción de Pages. Los 25 tests existentes pasan. El código de
servidor y las plantillas de impresión no se han modificado.

Esta revisión usa tamaños de Chrome, no certifica todos los teléfonos físicos
ni Safari. No se ha realizado una nueva validación visual de PDF ni se han
activado Google Sheets o IA. V1 permanece en `b0bdffa92d102148a4816ff4ee0358ec9ee7306b`.
