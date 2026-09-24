# Sistema de Indicadores de Bienestar Policial — Ecuador

Aplicación web estática para la **Fase 2 del diagnóstico integral del bienestar del personal de la Policía Nacional del Ecuador**.

La aplicación organiza la evidencia en las cinco dimensiones, quince categorías y treinta subcategorías del proyecto. Cada tarjeta identifica el indicador, el valor o estado disponible, la unidad, el periodo, la fuente, la localización documental y la nota metodológica. Las variables que todavía no pueden calcularse permanecen visibles como `Fuente pendiente` o `No documentado`, junto con la información necesaria para producirlas.

Los estados de evidencia **no son semáforos de desempeño**, no constituyen una priorización y no aplican umbrales no aprobados. El tablero es un instrumento del diagnóstico de Fase 2 y no representa el diseño definitivo del futuro sistema de bienestar.

## Archivos

`index.html`: interfaz principal.  
`styles.css`: diseño responsivo.  
`data.js`: catálogo trazable de indicadores.  
`app.js`: filtros, tarjetas y exportación CSV.

Para publicar con GitHub Pages, configure **Settings → Pages → Deploy from a branch → main / (root)**.
