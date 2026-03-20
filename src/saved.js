/**
 * Saved Requests sidebar — load, render, save, delete, populate tab.
 */

import { saveState } from './state.js';

const $ = window.jQuery;

// -----------------------------------------------------------------------
// Sidebar shell
// -----------------------------------------------------------------------

export function initSidebar() {
  loadSaved();
  bindEvents();
}

// -----------------------------------------------------------------------
// Server communication
// -----------------------------------------------------------------------

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
  const route   = tabContent.find('.wprrt-route').val();
  const method  = tabContent.find('.wprrt-method').val();
  const headers = tabContent.find('.wprrt-headers').val();
  const body    = tabContent.find('.wprrt-body').val();

  $.post(window.wprrt_vars.ajax_url, {
    action: 'wprrt_save_request',
    nonce:  window.wprrt_vars.nonce,
    name, route, method, headers, body,
  }, res => {
    if (res.success) loadSaved();
  });
}

// -----------------------------------------------------------------------
// Rendering
// -----------------------------------------------------------------------

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

// -----------------------------------------------------------------------
// Event delegation (bound once in initSidebar)
// -----------------------------------------------------------------------

function bindEvents() {
  // Click saved item → populate active tab
  $(document).on('click', '.wprrt-saved-item', function (e) {
    if ($(e.target).hasClass('wprrt-saved-delete')) return;
    const id = $(this).data('id');
    populateTabFromId(id);
  });

  // Delete saved item
  $(document).on('click', '.wprrt-saved-delete', function (e) {
    e.stopPropagation();
    const id = $(this).data('id');
    $.post(window.wprrt_vars.ajax_url, {
      action: 'wprrt_delete_request',
      nonce:  window.wprrt_vars.nonce,
      id,
    }, () => loadSaved());
  });

  // Show inline save form
  $(document).on('click', '.wprrt-save-btn', function () {
    const form = $(this).closest('.wprrt-tab-content').find('.wprrt-save-form');
    if (form.is(':visible')) {
      form.hide();
    } else {
      form.show().css('display', 'flex');
      form.find('.wprrt-save-name').val('').trigger('focus');
    }
  });

  // Confirm save
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

  // Cancel save
  $(document).on('click', '.wprrt-save-cancel', function () {
    $(this).closest('.wprrt-save-form').hide();
  });

  // Allow Enter key in name input to confirm
  $(document).on('keydown', '.wprrt-save-name', function (e) {
    if (e.key === 'Enter') {
      $(this).closest('.wprrt-tab-content').find('.wprrt-save-confirm').trigger('click');
    }
    if (e.key === 'Escape') {
      $(this).closest('.wprrt-save-form').hide();
    }
  });
}

// -----------------------------------------------------------------------
// Populate active tab from a saved item id
// -----------------------------------------------------------------------

function populateTabFromId(id) {
  // Re-fetch to get current data (avoids stale closures)
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
    saveState();
  });
}
