/**
 * WordPress 7.0 AI — contextual UX: Suggest near body, Explain in response panel.
 */

import { resolveRoute } from './params.js';
import { setResponseView, focusResponsePanel } from './ui-response.js';

const $ = window.jQuery;
const strings = () => window.wprrt_vars?.strings || {};

/** @returns {'hidden'|'disconnected'|'ready'} */
export function getAiUiState() {
  const v = window.wprrt_vars;
  if (v?.ai_ui) return v.ai_ui;
  if (!v?.ai_show_ui) return 'hidden';
  return v.ai_ready ? 'ready' : 'disconnected';
}

export function bindAiActions() {
  if (getAiUiState() === 'hidden') return;

  $(document).on('click', '.wprrt-ai-explain', function () {
    explainResponse($(this).closest('.wprrt-tab-content'));
  });

  $(document).on('click', '.wprrt-ai-suggest-body', function () {
    suggestBody($(this).closest('.wprrt-tab-content'));
  });

  $(document).on('click', '.wprrt-body-suggestion-apply', function () {
    const tabContent = $(this).closest('.wprrt-tab-content');
    const raw = tabContent.find('.wprrt-body-suggestion-preview').text();
    try {
      const pretty = JSON.stringify(JSON.parse(raw), null, 2);
      tabContent.find('.wprrt-body').val(pretty);
    } catch (e) {
      tabContent.find('.wprrt-body').val(raw);
    }
    tabContent.find('.wprrt-body').trigger('change');
    tabContent.find('.wprrt-body-suggestion').attr('hidden', true);
    tabContent.find('.wprrt-body').focus();
  });

  $(document).on('click', '.wprrt-body-suggestion-dismiss', function () {
    $(this).closest('.wprrt-body-suggestion').attr('hidden', true);
  });
}

/** Connect notice below form actions when WP 7+ but no connector. */
export function buildAiDisconnectedNoticeHtml() {
  if (getAiUiState() !== 'disconnected') return '';

  const s = strings();
  const url = window.wprrt_vars?.connectors_url || '';

  return (
    '<div class="wprrt-ai-connect-notice" role="status">' +
      `<p>${escapeHtml(s.ai_connect_required || 'Connect an AI provider under Settings → Connectors to use AI features.')}</p>` +
      (url
        ? `<p><a class="wprrt-ai-connect-link" href="${escapeAttr(url)}">${escapeHtml(s.ai_connect_link || 'Open Connectors settings')}</a></p>`
        : '') +
    '</div>'
  );
}

/** Toolbar: AI insight tab + Explain (only when AI UI shown). */
export function buildResponseAiToolbarHtml() {
  if (getAiUiState() === 'hidden') return '';

  const s = strings();
  const disabled = getAiUiState() === 'disconnected';

  return (
    '<div class="wprrt-response-tabs" role="tablist" aria-label="Response views">' +
      '<button type="button" class="wprrt-response-tab is-active" data-view="json" role="tab" aria-selected="true">JSON</button>' +
      `<button type="button" class="wprrt-response-tab" data-view="ai" role="tab" aria-selected="false" ${disabled ? 'disabled' : ''}>${s.ai_insight_tab || 'AI insight'}</button>` +
    '</div>' +
    `<button type="button" class="wprrt-btn wprrt-btn--ghost wprrt-ai-explain" ${disabled ? 'disabled' : ''} title="${escapeAttr(s.ai_explain || 'Explain response')}">` +
      '<span class="wprrt-btn-icon" aria-hidden="true">✦</span>' +
      `<span>${s.ai_explain_short || 'Explain'}</span>` +
    '</button>'
  );
}

/** Suggest button beside Body label. */
export function buildBodySuggestButtonHtml() {
  if (getAiUiState() === 'hidden') return '';
  const s = strings();
  const disabled = getAiUiState() === 'disconnected';
  return (
    `<button type="button" class="wprrt-btn wprrt-btn--soft wprrt-ai-suggest-body" ${disabled ? 'disabled' : ''}>` +
      '<span class="wprrt-btn-icon" aria-hidden="true">✦</span>' +
      `<span>${s.ai_suggest_body || 'Suggest body'}</span>` +
    '</button>'
  );
}

function explainResponse(tabContent) {
  if (getAiUiState() === 'disconnected') {
    tabContent.find('.wprrt-ai-connect-notice').show();
    focusResponsePanel(tabContent);
    return;
  }

  const route  = resolveRoute(tabContent);
  const method = tabContent.find('.wprrt-method').val();
  const status = tabContent.data('last-status') || 0;
  const body   = tabContent.find('.wprrt-response').text();

  const panel = tabContent.find('.wprrt-ai-panel');
  const btn   = tabContent.find('.wprrt-ai-explain');

  setResponseView(tabContent, 'ai');
  focusResponsePanel(tabContent);

  panel.html(`<p class="wprrt-ai-loading">${strings().ai_thinking || 'Asking AI…'}</p>`);
  btn.prop('disabled', true);

  $.post(window.wprrt_vars.ajax_url, {
    action: 'wprrt_ai_explain',
    nonce:  window.wprrt_vars.nonce,
    route, method, status, body,
  }, res => {
    btn.prop('disabled', false);
    if (res.success) {
      panel.empty().append($('<div class="wprrt-ai-text"></div>').text(res.data.text));
    } else {
      panel.html(`<p class="wprrt-ai-error">${escapeHtml(res.data || 'AI request failed')}</p>`);
    }
  }).fail(() => {
    btn.prop('disabled', false);
    panel.html('<p class="wprrt-ai-error">Could not reach AI service.</p>');
  });
}

function suggestBody(tabContent) {
  if (getAiUiState() === 'disconnected') {
    tabContent.find('.wprrt-ai-connect-notice').show();
    return;
  }

  const route  = resolveRoute(tabContent);
  const method = tabContent.find('.wprrt-method').val();
  const btn    = tabContent.find('.wprrt-ai-suggest-body');
  const card   = tabContent.find('.wprrt-body-suggestion');
  const orig   = btn.html();

  btn.prop('disabled', true).html(
    `<span class="wprrt-btn-icon" aria-hidden="true">⋯</span><span>${strings().ai_thinking || 'Asking AI…'}</span>`
  );
  card.attr('hidden', true);

  $.post(window.wprrt_vars.ajax_url, {
    action: 'wprrt_ai_suggest_body',
    nonce:  window.wprrt_vars.nonce,
    route, method,
  }, res => {
    btn.prop('disabled', false).html(orig);
    if (res.success && res.data.body) {
      let pretty = res.data.body;
      try {
        pretty = JSON.stringify(JSON.parse(res.data.body), null, 2);
      } catch (e) { /* use raw */ }
      card.find('.wprrt-body-suggestion-preview').text(pretty);
      card.removeAttr('hidden');
      card[0]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      showBodySuggestionError(card, res.data || 'AI request failed');
    }
  }).fail(() => {
    btn.prop('disabled', false).html(orig);
    showBodySuggestionError(card, 'Could not reach AI service.');
  });
}

function showBodySuggestionError(card, msg) {
  card.find('.wprrt-body-suggestion-preview').text('');
  card.find('.wprrt-body-suggestion-error').text(msg);
  card.removeAttr('hidden');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}
