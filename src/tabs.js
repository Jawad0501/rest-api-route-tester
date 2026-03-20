/**
 * Tab system — create, switch, close, and DOM population helpers.
 */

import { WPRRT, saveState, clearState } from './state.js';
import { initAuthDropdown } from './auth.js';
import { renderParams, restoreParamValues } from './params.js';

const $ = window.jQuery;

// -----------------------------------------------------------------------
// DOM helpers
// -----------------------------------------------------------------------

export function populateRoleSelector(roleSelector, selectedRole) {
  roleSelector.empty();
  $.post(window.wprrt_vars.ajax_url, {
    action: 'wprrt_get_user_roles',
    nonce:  window.wprrt_vars.nonce,
  }, res => {
    if (!res.success) return;
    Object.entries(res.data).forEach(([role, name]) => {
      const opt = document.createElement('option');
      opt.value       = role;
      opt.textContent = name;
      roleSelector.append(opt);
    });
    if (selectedRole !== undefined) roleSelector.val(selectedRole);
  });
}

export function populatePluginDropdown(pluginSelect) {
  pluginSelect.empty();

  const allOpt = document.createElement('option');
  allOpt.value       = 'all';
  allOpt.textContent = 'All Plugins';
  pluginSelect.append(allOpt);

  Object.keys(WPRRT.pluginRoutes).sort().forEach(plugin => {
    const opt = document.createElement('option');
    opt.value       = plugin;
    opt.textContent = plugin;
    pluginSelect.append(opt);
  });
}

export function buildRouteDropdown(dropdown, routes) {
  dropdown.empty();
  routes.forEach(route => {
    const div = document.createElement('div');
    div.className   = 'wprrt-route-option';
    div.textContent = route; // textContent only — no innerHTML
    dropdown.append(div);
  });
}

// -----------------------------------------------------------------------
// Tab lifecycle
// -----------------------------------------------------------------------

export function switchTab(tabId) {
  $('.wprrt-tab-content').hide();
  $('.wprrt-tab-header').removeClass('active');
  $(`#${tabId}`).show();
  $(`.wprrt-tab-header[data-tab-id="${tabId}"]`).addClass('active');
  WPRRT.activeTabId = tabId;
}

export function createNewTab(tabData) {
  const tabId    = tabData ? tabData.id : `tab-${++WPRRT.tabCounter}`;
  const tabTitle = tabData ? tabData.title : `Request ${WPRRT.tabCounter}`;

  // Tab header — title set via .text() to avoid XSS
  const tabHeader = $(
    `<div class="wprrt-tab-header" data-tab-id="${tabId}">` +
      `<span class="wprrt-tab-title"></span>` +
      `<button class="wprrt-close-tab">&times;</button>` +
    `</div>`
  );
  tabHeader.find('.wprrt-tab-title').text(tabTitle);

  // Tab content
  const tabContent = $(
    `<div class="wprrt-tab-content" id="${tabId}">` +
      `<div class="wprrt-container">` +
        `<div class="wprrt-form">` +
          `<label>Role:<select class="wprrt-role-selector"></select></label>` +
          `<label>Plugin:` +
            `<select class="wprrt-plugin"></select>` +
          `</label>` +
          `<label>Route:` +
            `<div class="wprrt-route-container">` +
              `<input type="text" class="wprrt-route" placeholder="Enter or select a route">` +
              `<div class="wprrt-route-dropdown"></div>` +
            `</div>` +
          `</label>` +
          `<div class="wprrt-params-container"></div>` +
          `<label>Method:` +
            `<select class="wprrt-method">` +
              `<option>GET</option><option>POST</option><option>PUT</option>` +
              `<option>PATCH</option><option>DELETE</option><option>OPTIONS</option><option>HEAD</option>` +
            `</select>` +
          `</label>` +
          `<label>Headers (JSON):` +
            `<div class="wprrt-field-container">` +
              `<textarea class="wprrt-headers" rows="4" placeholder='{\n  "Authorization": "Bearer your-token"\n}'></textarea>` +
              `<div class="wprrt-field-help"><small>Authentication headers, content type, etc.</small></div>` +
            `</div>` +
          `</label>` +
          `<label>Body (JSON):` +
            `<div class="wprrt-field-container">` +
              `<textarea class="wprrt-body" rows="6" placeholder='{\n  "title": "Your Title",\n  "status": "publish"\n}'></textarea>` +
              `<div class="wprrt-field-help"><small>For POST / PUT / PATCH requests.</small></div>` +
            `</div>` +
          `</label>` +
          `<div class="wprrt-form-actions">` +
            `<button class="wprrt-test">Send</button>` +
            `<button class="wprrt-curl-btn" type="button">Copy as cURL</button>` +
            `<button class="wprrt-save-btn" type="button">Save</button>` +
          `</div>` +
          `<div class="wprrt-save-form">` +
            `<input type="text" class="wprrt-save-name" placeholder="Request name…" maxlength="80">` +
            `<div class="wprrt-save-actions">` +
              `<button class="wprrt-save-confirm" type="button">Save</button>` +
              `<button class="wprrt-save-cancel" type="button">Cancel</button>` +
            `</div>` +
          `</div>` +
        `</div>` +
        `<div class="wprrt-response-block">` +
          `<h3>Response</h3>` +
          `<div class="wprrt-response-meta">` +
            `<span class="wprrt-status-badge"></span>` +
            `<span class="wprrt-response-time"></span>` +
          `</div>` +
          `<details class="wprrt-response-headers">` +
            `<summary>Response Headers (<span class="wprrt-header-count">0</span>)</summary>` +
            `<pre class="wprrt-headers-body"></pre>` +
          `</details>` +
          `<pre class="wprrt-response">Waiting for request...</pre>` +
        `</div>` +
      `</div>` +
    `</div>`
  );

  $('.wprrt-tabs').append(tabHeader);
  $('.wprrt-tab-content-wrapper .wprrt-empty').remove();
  $('.wprrt-tab-content-wrapper').append(tabContent);

  populateRoleSelector(tabContent.find('.wprrt-role-selector'), tabData ? tabData.role : undefined);
  populatePluginDropdown(tabContent.find('.wprrt-plugin'));
  initAuthDropdown(tabContent, tabData ? tabData.authType : undefined);

  if (tabData) {
    tabContent.find('.wprrt-route').val(tabData.route || '');
    tabContent.find('.wprrt-method').val(tabData.method || 'GET');
    tabContent.find('.wprrt-headers').val(tabData.headers && tabData.headers !== '{}' ? tabData.headers : '');
    tabContent.find('.wprrt-body').val(tabData.body && tabData.body !== '{}' ? tabData.body : '');
    tabContent.find('.wprrt-plugin').val(tabData.plugin || 'all');
    if (tabData.response && tabData.response !== 'Waiting for request...') {
      tabContent.find('.wprrt-response').text(tabData.response);
    }
    if (tabData.route) {
      renderParams(tabContent, tabData.route);
      restoreParamValues(tabContent, tabData.params);
    }
  }

  switchTab(tabId);
}

export function closeTab(tabId) {
  $(`.wprrt-tab-header[data-tab-id="${tabId}"]`).remove();
  $(`#${tabId}`).remove();

  if (tabId === WPRRT.activeTabId) {
    const remaining = $('.wprrt-tab-header').last();
    if (remaining.length) switchTab(remaining.data('tab-id'));
  }

  if ($('.wprrt-tab-header').length === 0) {
    WPRRT.tabCounter  = 0;
    WPRRT.activeTabId = null;
    clearState();
    $('.wprrt-tab-content-wrapper').html(
      '<div class="wprrt-empty">' +
        '<div class="wprrt-empty-inner">' +
          '<div class="wprrt-empty-icon">🗂️</div>' +
          '<h3>No requests yet</h3>' +
          '<p>Create a new request to get started.</p>' +
          '<button class="wprrt-add-tab">+ New Request</button>' +
        '</div>' +
      '</div>'
    );
  }

  saveState();
}
