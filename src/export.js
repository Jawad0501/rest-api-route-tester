/**
 * cURL export — builds a cURL command from the current tab state and copies it to clipboard.
 */

import { resolveRoute } from './params.js';

const $ = window.jQuery;

export function copyCurl(tabContent) {
  const route  = resolveRoute(tabContent);
  const method = tabContent.find('.wprrt-method').val();
  const headers = tabContent.find('.wprrt-headers').val().trim();
  const body    = tabContent.find('.wprrt-body').val().trim();

  const base = (window.wprrt_vars.rest_url || '').replace(/\/$/, '');
  const url  = base + route;

  const parts = [`curl -X ${method}`, `  "${url}"`];

  let parsedHeaders = {};
  if (headers) {
    try { parsedHeaders = JSON.parse(headers); } catch (e) {}
  }
  Object.entries(parsedHeaders).forEach(([k, v]) => {
    parts.push(`  -H "${k}: ${v}"`);
  });

  if (['POST', 'PUT', 'PATCH'].includes(method) && body && body !== '{}') {
    if (!parsedHeaders['Content-Type']) {
      parts.push(`  -H "Content-Type: application/json"`);
    }
    parts.push(`  -d '${body}'`);
  }

  const curlCmd = parts.join(' \\\n');
  const btn     = tabContent.find('.wprrt-curl-btn');

  const flash = () => {
    const orig = btn.text();
    btn.text('Copied!');
    setTimeout(() => btn.text(orig), 2000);
  };

  if (navigator.clipboard) {
    navigator.clipboard.writeText(curlCmd).then(flash).catch(() => legacyCopy(curlCmd, flash));
  } else {
    legacyCopy(curlCmd, flash);
  }
}

function legacyCopy(text, cb) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity  = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  cb();
}
