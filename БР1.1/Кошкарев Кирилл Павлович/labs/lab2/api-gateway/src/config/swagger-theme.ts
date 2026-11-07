/**
 * Тёмная «вечерняя» тема Swagger UI в фирменной палитре Lecter's Recipes:
 * графит, бордо и приглушённое золото, антиква в заголовках.
 */
export const swaggerTheme = `
  :root {
    --lr-bg: #12100f;
    --lr-panel: #1b1817;
    --lr-panel-2: #221e1c;
    --lr-line: #2f2926;
    --lr-text: #e8e2d9;
    --lr-muted: #a89e92;
    --lr-wine: #7b1e2b;
    --lr-wine-soft: #9d2b3a;
    --lr-gold: #c8a86b;
  }
  body { background: var(--lr-bg); }
  .swagger-ui { color: var(--lr-text); font-family: "Helvetica Neue", Arial, sans-serif; }
  .swagger-ui .topbar { display: none; }
  .swagger-ui .info { margin: 36px 0 24px; }
  .swagger-ui .info .title,
  .swagger-ui .info .title small.version-stamp { color: var(--lr-text); }
  .swagger-ui .info .title {
    font-family: "Didot", "Playfair Display", Georgia, serif;
    font-weight: 400; letter-spacing: .02em;
  }
  .swagger-ui .info .title small { background: var(--lr-wine); }
  .swagger-ui .info .title small.version-stamp { background: var(--lr-wine); }
  .swagger-ui .info li, .swagger-ui .info p, .swagger-ui .info table,
  .swagger-ui .info a, .swagger-ui .markdown p, .swagger-ui .markdown li { color: var(--lr-muted); }
  .swagger-ui .info a { color: var(--lr-gold); }
  .swagger-ui .scheme-container {
    background: var(--lr-panel); box-shadow: none;
    border-bottom: 1px solid var(--lr-line);
  }
  .swagger-ui .opblock-tag {
    color: var(--lr-gold); border-bottom: 1px solid var(--lr-line);
    font-family: "Didot", Georgia, serif; font-weight: 400; letter-spacing: .04em;
  }
  .swagger-ui .opblock-tag small { color: var(--lr-muted); }
  .swagger-ui .opblock {
    background: var(--lr-panel); border: 1px solid var(--lr-line);
    border-radius: 3px; box-shadow: none; margin: 0 0 12px;
  }
  .swagger-ui .opblock .opblock-summary { border-color: var(--lr-line); }
  .swagger-ui .opblock .opblock-summary-path,
  .swagger-ui .opblock .opblock-summary-path__deprecated,
  .swagger-ui .opblock .opblock-summary-description { color: var(--lr-text); }
  .swagger-ui .opblock .opblock-summary-method {
    background: var(--lr-wine); border-radius: 2px; font-weight: 600;
  }
  .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #3f5a5a; }
  .swagger-ui .opblock.opblock-post .opblock-summary-method { background: var(--lr-wine); }
  .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #7a5a24; }
  .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #5c5230; }
  .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #4a2020; }
  .swagger-ui .opblock-description-wrapper p,
  .swagger-ui .opblock-external-docs-wrapper p,
  .swagger-ui .opblock-title_normal p,
  .swagger-ui table thead tr td, .swagger-ui table thead tr th,
  .swagger-ui .parameter__name, .swagger-ui .parameter__type,
  .swagger-ui .response-col_status, .swagger-ui .response-col_description,
  .swagger-ui .tab li, .swagger-ui label { color: var(--lr-text); }
  .swagger-ui .parameter__in, .swagger-ui .parameter__extension { color: var(--lr-muted); }
  .swagger-ui .opblock-section-header {
    background: var(--lr-panel-2); box-shadow: none; border-bottom: 1px solid var(--lr-line);
  }
  .swagger-ui .opblock-section-header h4, .swagger-ui .opblock-section-header label {
    color: var(--lr-gold);
  }
  .swagger-ui section.models { border-color: var(--lr-line); background: var(--lr-panel); }
  .swagger-ui section.models .model-container { background: var(--lr-panel-2); }
  .swagger-ui section.models h4 { color: var(--lr-gold); }
  .swagger-ui .model-title, .swagger-ui .model { color: var(--lr-text); }
  .swagger-ui .prop-type { color: var(--lr-gold); }
  .swagger-ui input[type=text], .swagger-ui input[type=email], .swagger-ui input[type=password],
  .swagger-ui textarea, .swagger-ui select {
    background: #0e0c0b; color: var(--lr-text); border: 1px solid var(--lr-line);
  }
  .swagger-ui .btn {
    color: var(--lr-text); border-color: var(--lr-line); background: var(--lr-panel-2);
  }
  .swagger-ui .btn.execute {
    background: var(--lr-wine); border-color: var(--lr-wine-soft); color: #fff;
  }
  .swagger-ui .btn.authorize { color: var(--lr-gold); border-color: var(--lr-gold); }
  .swagger-ui .btn.authorize svg { fill: var(--lr-gold); }
  .swagger-ui .highlight-code, .swagger-ui .microlight { background: #0e0c0b !important; }
  .swagger-ui .responses-inner { background: var(--lr-panel); }
  .swagger-ui .dialog-ux .modal-ux { background: var(--lr-panel); border-color: var(--lr-line); }
  .swagger-ui .dialog-ux .modal-ux-header h3, .swagger-ui .dialog-ux .modal-ux-content h4,
  .swagger-ui .dialog-ux .modal-ux-content p { color: var(--lr-text); }
  .swagger-ui .filter .operation-filter-input { border-color: var(--lr-line); }
  .swagger-ui svg.arrow { fill: var(--lr-muted); }
  .swagger-ui .opblock-summary-control:focus { outline-color: var(--lr-gold); }
`;
