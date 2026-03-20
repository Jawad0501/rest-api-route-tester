/**
 * Sends a REST API test request and hands off the result to the response renderer.
 */

import { saveState } from './state.js';
import { renderResponse, renderRequestError } from './response.js';
import { resolveRoute } from './params.js';

const $ = window.jQuery;

export function sendRequest(tabContent) {
  const route      = resolveRoute(tabContent);
  const method     = tabContent.find('.wprrt-method').val();
  const headers    = tabContent.find('.wprrt-headers').val();
  const body       = tabContent.find('.wprrt-body').val();
  const role       = tabContent.find('.wprrt-role-selector').val();
  const responseEl = tabContent.find('.wprrt-response');
  const testButton = tabContent.find('.wprrt-test');

  // Reset response area to loading state
  tabContent.find('.wprrt-response-meta').hide();
  tabContent.find('.wprrt-response-headers').hide();
  responseEl.removeClass('language-json').html(
    '<div class="wprrt-loading">' +
      '<div class="wprrt-loading-spinner"></div>' +
      '<p>Sending request...</p>' +
    '</div>'
  );
  testButton.prop('disabled', true);

  const startTime = performance.now();

  $.post(window.wprrt_vars.ajax_url, {
    action: 'wprrt_test_route',
    nonce:  window.wprrt_vars.nonce,
    route, method, headers, body, role,
  }, res => {
    const elapsed = (performance.now() - startTime).toFixed(2);
    testButton.prop('disabled', false);
    renderResponse(tabContent, res, elapsed);
    saveState();
  }).fail(() => {
    const elapsed = (performance.now() - startTime).toFixed(2);
    testButton.prop('disabled', false);
    renderRequestError(tabContent, elapsed);
  });
}
