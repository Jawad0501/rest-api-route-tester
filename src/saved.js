/**
 * Saved Requests sidebar — load, render, save, delete, populate tab.
 */

import { saveState } from './state.js';
import { getParamValues } from './params.js';
import { renderParams, restoreParamValues } from './params.js';

const $ = window.jQuery;

export function initSidebar() {
  loadSaved();
  bindEvents();
}

function loadSaved() {
  $.post(window.wprrt_vars.ajax_url, {
    action: 'wprrt_get_saved_requests',
    nonce:  window.wprrt_vars.nonce,
  }, res => {
    renderSavedList(res.success ? res.data : []);
  }).fail(() => {
    renderSavedList([]);
  });
}

export function saveCurrentTab(tabContent, name) {
  const route     = tabContent.find('.wprrt-route').val();
  const method    = tabContent.find('.wprrt-method').val();
  const headers   = tabContent.find('.wprrt-headers').val();
  const body      = tabContent.find('.wprrt-body').val();
  const role      = tabContent.find('.wprrt-role-selector').val();
  const auth_type = tabContent.find('.wprrt-auth-type').val() || 'none';
  const params    = getParamValues(tabContent);

  $.post(window.wprrt_vars.ajax_url, {
    action: 'wprrt_save_request',
    nonce:  window.wprrt_vars.nonce,
    name, route, method, headers, body, role, auth_type,
    params: JSON.stringify(params),
  }, res => {
    if (res.success) {
      loadSaved();
      return;
    }
    const msg = (typeof res.data === 'string' && res.data) || 'Could not save request.';
    window.alert(msg);
  }).fail(() => {
    window.alert('Could not save request. Check your connection and try again.');
  });
}

const METHOD_COLOURS = {
  GET:     '#1a7f37',
  POST:    '#0550ae',
  PUT:     '#7a4400',
  PATCH:   '#6e40c9',
  DELETE:  '#cf222e',
  OPTIONS: '#666',
  HEAD:    '#666',
};

function renderSavedList(items) {
  const list = $('#wprrt-saved-list');
  list.empty();

  if (!items.length) {
    list.html(
      '<div class="wprrt-saved-empty">' +
        '<p>No saved requests yet.</p>' +
        '<p><small>Fill in a request and click <strong>Save</strong>.</small></p>' +
      '</div>'
    );
    return;
  }

  items.forEach(item => {
    const colour = METHOD_COLOURS[item.method] || '#666';

    const el = $('<div class="wprrt-saved-item" tabindex="0"></div>');
    el.attr('data-id', item.id);

    const badge = $('<span class="wprrt-saved-method"></span>');
    badge.text(item.method);
    badge.css('color', colour);

    const nameEl = $('<span class="wprrt-saved-name"></span>').text(item.name);
    const routeEl = $('<span class="wprrt-saved-route"></span>').text(item.route);

    const del = $('<button class="wprrt-saved-delete" title="Delete">&times;</button>');
    del.attr('data-id', item.id);

    const info = $('<div class="wprrt-saved-info"></div>').append(badge, nameEl, routeEl);
    el.append(info, del);
    list.append(el);
  });
}

function bindEvents() {
  $(document).on('click', '.wprrt-saved-item', function (e) {
    if ($(e.target).hasClass('wprrt-saved-delete')) return;
    const id = $(this).data('id');
    populateTabFromId(id);
  });

  $(document).on('click', '.wprrt-saved-delete', function (e) {
    e.stopPropagation();
    const id = $(this).data('id');
    $.post(window.wprrt_vars.ajax_url, {
      action: 'wprrt_delete_request',
      nonce:  window.wprrt_vars.nonce,
      id,
    }, () => loadSaved());
  });

  $(document).on('click', '.wprrt-save-btn', function () {
    const form = $(this).closest('.wprrt-tab-content').find('.wprrt-save-form');
    if (form.is(':visible')) {
      form.hide();
    } else {
      form.show().css('display', 'flex');
      form.find('.wprrt-save-name').val('').trigger('focus');
    }
  });

  $(document).on('click', '.wprrt-save-confirm', function () {
    const tabContent = $(this).closest('.wprrt-tab-content');
    const name = tabContent.find('.wprrt-save-name').val().trim();
    if (!name) {
      tabContent.find('.wprrt-save-name').trigger('focus');
      return;
    }
    saveCurrentTab(tabContent, name);
    tabContent.find('.wprrt-save-form').hide();
  });

  $(document).on('click', '.wprrt-save-cancel', function () {
    $(this).closest('.wprrt-save-form').hide();
  });

  $(document).on('keydown', '.wprrt-save-name', function (e) {
    if (e.key === 'Enter') {
      $(this).closest('.wprrt-tab-content').find('.wprrt-save-confirm').trigger('click');
    }
    if (e.key === 'Escape') {
      $(this).closest('.wprrt-save-form').hide();
    }
  });
}

function populateTabFromId(id) {
  $.post(window.wprrt_vars.ajax_url, {
    action: 'wprrt_get_saved_requests',
    nonce:  window.wprrt_vars.nonce,
  }, res => {
    if (!res.success) return;
    const item = res.data.find(i => i.id === id);
    if (!item) return;

    const tabContent = $('.wprrt-tab-content:visible');
    if (!tabContent.length) return;

    tabContent.find('.wprrt-route').val(item.route);
    tabContent.find('.wprrt-method').val(item.method);
    tabContent.find('.wprrt-headers').val(item.headers || '');
    tabContent.find('.wprrt-body').val(item.body || '');

    if (item.role !== undefined) {
      tabContent.find('.wprrt-role-selector').val(item.role);
    }
    if (item.auth_type) {
      tabContent.find('.wprrt-auth-type').val(item.auth_type);
    }

    if (item.route) {
      renderParams(tabContent, item.route);
      restoreParamValues(tabContent, item.params || {});
    }

    saveState();
  });
}

export { loadSaved };
