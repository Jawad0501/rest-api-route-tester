/**
 * Response panel rendering — status badge, headers, body, Prism highlighting.
 */

import Prism from 'prismjs';
import 'prismjs/components/prism-json';

const STATUS_LABELS = {
  200: 'OK', 201: 'Created', 204: 'No Content',
  301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified',
  400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
  404: 'Not Found', 405: 'Method Not Allowed', 422: 'Unprocessable Entity',
  429: 'Too Many Requests', 500: 'Internal Server Error', 503: 'Service Unavailable',
};

function statusClass(code) {
  if (code >= 200 && code < 300) return 'wprrt-status-2xx';
  if (code >= 300 && code < 400) return 'wprrt-status-3xx';
  if (code >= 400 && code < 500) return 'wprrt-status-4xx';
  return 'wprrt-status-5xx';
}

function highlightResponse(el) {
  el.classList.add('language-json');
  Prism.highlightElement(el);
}

export function renderResponse(tabContent, res, elapsed) {
  const $ = window.jQuery;
  const metaEl     = tabContent.find('.wprrt-response-meta');
  const badgeEl    = tabContent.find('.wprrt-status-badge');
  const timeEl     = tabContent.find('.wprrt-response-time');
  const headersEl  = tabContent.find('.wprrt-response-headers');
  const headersPre = tabContent.find('.wprrt-headers-body');
  const responseEl = tabContent.find('.wprrt-response');

  if (res.success) {
    const status = res.data.status;
    const label  = STATUS_LABELS[status] || '';
    const cls    = statusClass(status);

    badgeEl.attr('class', 'wprrt-status-badge ' + cls).text(label ? `${status} ${label}` : status);
    timeEl.text(`${elapsed}ms`);
    metaEl.show();

    // Response headers — collapsible
    const hdrs    = res.data.headers || {};
    const hdrKeys = Object.keys(hdrs);
    if (hdrKeys.length) {
      const hdrText = hdrKeys.map(k => {
        const val = Array.isArray(hdrs[k]) ? hdrs[k].join(', ') : hdrs[k];
        return `${k}: ${val}`;
      }).join('\n');
      headersPre.text(hdrText);
      headersEl.find('.wprrt-header-count').text(hdrKeys.length);
      headersEl.show();
    } else {
      headersEl.hide();
    }

    // Response body — data only, syntax highlighted
    const body = res.data.data;
    const json = body !== undefined ? JSON.stringify(body, null, 2) : '(empty)';
    responseEl.removeClass('language-json').text(json);
    if (body !== undefined) highlightResponse(responseEl[0]);
  } else {
    badgeEl.attr('class', 'wprrt-status-badge wprrt-status-error').text('Error');
    timeEl.text(`${elapsed}ms`);
    metaEl.show();
    headersEl.hide();
    responseEl.removeClass('language-json').text(res.data || 'An error occurred.');
  }
}

export function renderRequestError(tabContent, elapsed) {
  const $ = window.jQuery;
  tabContent.find('.wprrt-status-badge').attr('class', 'wprrt-status-badge wprrt-status-error').text('Request Failed');
  tabContent.find('.wprrt-response-time').text(elapsed ? `${elapsed}ms` : '');
  tabContent.find('.wprrt-response-meta').show();
  tabContent.find('.wprrt-response-headers').hide();
  tabContent.find('.wprrt-response').removeClass('language-json').text('Could not connect to the server. Please try again.');
}
