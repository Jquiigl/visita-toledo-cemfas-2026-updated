# Toledo · visita cultural e institucional

Primera aplicación móvil funcional de apoyo a la visita del CEMFAS a Toledo del 24 de octubre de 2026.

## Qué incluye

- navegación por pantallas mediante pestañas, historial y botón de regreso;
- programa ampliado, con cada fase de la jornada y los cuatro hitos del recorrido cultural;
- mapa local del casco histórico con puntos numerados y acceso al itinerario externo;
- fichas culturales con fotografía, datos esenciales, desarrollo, fuentes y créditos;
- resúmenes y audio en español, inglés, francés, italiano, alemán, árabe y coreano;
- 49 narraciones de audio, cargadas solo cuando el usuario las reproduce;
- enlaces externos a mapas y fuentes oficiales;
- comprobación puntual y local de cercanía a cinco lugares públicos;
- meteorología, acceso, aparcamiento, ropa, calzado, contacto e inscripción;
- diseño instalable como PWA y consulta posterior sin conexión de las páginas ya visitadas;
- datos personales exclusivamente en Google Forms.

## Actualización sencilla

- Textos generales, programa y avisos: `data/ui.ts`.
- Fichas traducidas: `data/audio-scripts.json`.
- Contenido ampliado en español, fuentes y créditos: `data/details.ts`.
- Audios: `public/audio/<idioma>/<ficha>.wav`.
- Imágenes, iconos y mapa: `public/images/`.
- Relación completa de licencias: `IMAGE_CREDITS.md`.
- Enlace del formulario y enlaces operativos: inicio de `app/page.tsx`.

Antes de publicar, deben revisarse los textos de los idiomas distintos del español con hablantes competentes y confirmarse horarios, accesos, aparcamientos y contacto.

## Comprobación local

```bash
pnpm install
pnpm dev
```

La versión lista para alojamiento se genera con `pnpm build` dentro de `dist/`.

## GitHub Pages

El flujo `.github/workflows/deploy-pages.yml` compila y publica automáticamente la carpeta `app/dist` cuando se envían cambios a la rama `main`. En el repositorio debe seleccionarse **Settings → Pages → Source: GitHub Actions**.
