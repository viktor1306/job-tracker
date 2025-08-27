
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/job-tracker/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/job-tracker"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 734, hash: 'f6ad328aa4e9a714b4dbc97313bd8727eb6a8ba649b89c9d6c74360d36c29c2e', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1070, hash: 'c709f4dcb66146646ec93b015bc69dfe9d5d9967126e932cfa86cd723849591a', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 9012, hash: '7fbd462bfe9b9d78123d5045d557f40494ff1700ae7fa5526826bc12c8c7d762', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-KVTQK2MI.css': {size: 69, hash: 'LkgD+g2EMu0', text: () => import('./assets-chunks/styles-KVTQK2MI_css.mjs').then(m => m.default)}
  },
};
