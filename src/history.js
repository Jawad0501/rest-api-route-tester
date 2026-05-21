/**
 * Request history sidebar tab.
 */

import { createNewTab } from './tabs.js';
import { renderParams } from './params.js';

const $ = window.jQuery;
const strings = () => window.wprrt_vars?.strings || {};

export function initHistory() {
  loadHistory();
  bindHistoryEvents();
}

function loadHistory() {
  $.post(window.wprrt_vars.ajax_url, {
    action: 'wprrt_get_history',
    nonce:  window.wprrt_vars.nonce,
  }, res => {
    renderHistoryList(res.success ? res.data : []);
  }).fail(() => renderHistoryList([]));
}

function renderHistoryList(items) {
  const list = $('#wprrt-history-list');
  list.empty();

  if (!items.length) {
    list.html(
      `<div class="wprrt-saved-empty"><p>${strings().history_empty || 'No requests logged yet.'}</p></div>`
    );
    return;
  }

  items.forEach(item => {
    const el = $('<div class="wprrt-history-item wprrt-saved-item" tabindex="0"></div>');
    el.attr('data-id', item.id);

    const badge = $('<span class="wprrt-saved-method"></span>').text(item.method || 'GET');
    const meta  = $('<span class="wprrt-history-meta"></span>').text(
      `${item.status || '—'} · ${item.elapsed_ms || 0}ms`
    );
    const routeEl = $('<span class="wprrt-saved-route"></span>').text(item.route || '');
    const timeEl  = $('<span class="wprrt-history-time"></span>').text(formatTime(item.logged_at));

    const info = $('<div class="wprrt-saved-info"></div>').append(badge, meta, routeEl, timeEl);
    el.append(info);
    list.append(el);
  });
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  return d.toLocaleString();
}

function bindHistoryEvents() {
  $(document).on('click', '.wprrt-sidebar-tab', function () {
    const tab = $(this).data('sidebar-tab');
    $('.wprrt-sidebar-tab').removeClass('active');
    $(this).addClass('active');
    $('.wprrt-sidebar-panel').hide();
    $(`.wprrt-sidebar-panel[data-panel="${tab}"]`).show();
    if (tab === 'history') {
      loadHistory();
    }
  });

  $(document).on('click', '.wprrt-history-item', function () {
    const id = $(this).data('id');
    restoreFromHistory(id);
  });

  $(document).on('click', '.wprrt-clear-history', function (e) {
    e.preventDefault();
    $.post(window.wprrt_vars.ajax_url, {
      action: 'wprrt_clear_history',
      nonce:  window.wprrt_vars.nonce,
    }, () => loadHistory());
  });
}

function restoreFromHistory(id) {
  $.post(window.wprrt_vars.ajax_url, {
    action: 'wprrt_get_history',
    nonce:  window.wprrt_vars.nonce,
  }, res => {
    if (!res.success) return;
    const item = res.data.find(i => i.id === id);
    if (!item) return;

    createNewTab({
      title:   `${item.method} ${item.route}`.slice(0, 40),
      route:   item.route,
      method:  item.method,
      headers: item.headers || '',
      body:    item.body || '',
      role:    item.role || '',
    });

    const tabContent = $('.wprrt-tab-content:visible');
    if (item.route) {
      renderParams(tabContent, item.route);
    }
    tabContent.find('.wprrt-role-selector').val(item.role || '');
  });
}

export { loadHistory };
