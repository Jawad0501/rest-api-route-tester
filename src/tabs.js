/**
 * Tab system — create, switch, close, and DOM population helpers.
 */

import { WPRRT, saveState, clearState } from './state.js';
import { initAuthDropdown } from './auth.js';
import {
  buildAiDisconnectedNoticeHtml,
  buildBodySuggestButtonHtml,
  buildResponseAiToolbarHtml,
} from './ai.js';
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
  allOpt.textContent = 'All namespaces';
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
  const s = window.wprrt_vars?.strings || {};
  const tabId    = tabData ? tabData.id : `tab-${++WPRRT.tabCounter}`;
  const tabTitle = tabData ? tabData.title : `Request ${WPRRT.tabCounter}`;

  const tabHeader = $(
    `<div class="wprrt-tab-header" data-tab-id="${tabId}">` +
      `<span class="wprrt-tab-title"></span>` +
      `<button type="button" class="wprrt-close-tab" aria-label="Close tab">&times;</button>` +
    `</div>`
  );
  tabHeader.find('.wprrt-tab-title').text(tabTitle);

  const tabContent = $(
    `<div class="wprrt-tab-content" id="${tabId}">` +
      `<div class="wprrt-workspace">` +
        `<div class="wprrt-form">` +
          `<section class="wprrt-section">` +
            `<h3 class="wprrt-section-title">Request</h3>` +
            `<div class="wprrt-field-row wprrt-field-row--2">` +
              `<label class="wprrt-field">Role` +
                `<select class="wprrt-role-selector"></select>` +
              `</label>` +
              `<label class="wprrt-field">Namespace` +
                `<select class="wprrt-plugin"></select>` +
              `</label>` +
            `</div>` +
            `<label class="wprrt-field">Route` +
              `<div class="wprrt-route-container">` +
                `<input type="text" class="wprrt-route" placeholder="Enter or select a route" autocomplete="off">` +
                `<div class="wprrt-route-dropdown"></div>` +
              `</div>` +
            `</label>` +
            `<div class="wprrt-params-container"></div>` +
            `<label class="wprrt-field wprrt-field--inline">Method` +
              `<select class="wprrt-method">` +
                `<option>GET</option><option>POST</option><option>PUT</option>` +
                `<option>PATCH</option><option>DELETE</option><option>OPTIONS</option><option>HEAD</option>` +
              `</select>` +
            `</label>` +
          `</section>` +
          `<section class="wprrt-section">` +
            `<h3 class="wprrt-section-title">Payload</h3>` +
            `<div class="wprrt-label-row">` +
              `<label class="wprrt-field wprrt-field--grow">Body (JSON)` +
                `<textarea class="wprrt-body" rows="7" placeholder='{\n  "title": "Your Title",\n  "status": "publish"\n}'></textarea>` +
              `</label>` +
              `<div class="wprrt-label-row-actions">` +
                buildBodySuggestButtonHtml() +
              `</div>` +
            `</div>` +
            `<span class="wprrt-field-hint">POST/PUT/PATCH body, or query parameters for GET.</span>` +
            `<div class="wprrt-body-suggestion" hidden>` +
              `<div class="wprrt-body-suggestion-head">` +
                `<span class="wprrt-body-suggestion-title">${s.ai_suggestion_title || 'Suggested request body'}</span>` +
                `<div class="wprrt-body-suggestion-actions">` +
                  `<button type="button" class="wprrt-btn wprrt-btn--primary wprrt-body-suggestion-apply">${s.ai_apply_body || 'Apply to body'}</button>` +
                  `<button type="button" class="wprrt-btn wprrt-btn--ghost wprrt-body-suggestion-dismiss">${s.ai_dismiss || 'Dismiss'}</button>` +
                `</div>` +
              `</div>` +
              `<pre class="wprrt-body-suggestion-preview"></pre>` +
              `<p class="wprrt-body-suggestion-error"></p>` +
            `</div>` +
          `</section>` +
          `<section class="wprrt-section wprrt-section--headers">` +
            `<h3 class="wprrt-section-title">Headers</h3>` +
            `<label class="wprrt-field">Headers (JSON)` +
              `<textarea class="wprrt-headers" rows="4" placeholder='{\n  "Authorization": "Bearer your-token"\n}'></textarea>` +
              `<span class="wprrt-field-hint">Use auth presets above this field when needed.</span>` +
            `</label>` +
          `</section>` +
          `<div class="wprrt-form-actions">` +
            `<button type="button" class="wprrt-btn wprrt-btn--primary wprrt-test">Send request</button>` +
            `<button type="button" class="wprrt-btn wprrt-btn--secondary wprrt-curl-btn">Copy cURL</button>` +
            `<button type="button" class="wprrt-btn wprrt-btn--secondary wprrt-save-btn">Save</button>` +
          `</div>` +
          buildAiDisconnectedNoticeHtml() +
          `<div class="wprrt-save-form">` +
            `<input type="text" class="wprrt-save-name" placeholder="Request name…" maxlength="80">` +
            `<div class="wprrt-save-actions">` +
              `<button type="button" class="wprrt-save-confirm">Save</button>` +
              `<button type="button" class="wprrt-save-cancel">Cancel</button>` +
            `</div>` +
          `</div>` +
        `</div>` +
        `<div class="wprrt-response-block">` +
          `<div class="wprrt-response-toolbar">` +
            `<div class="wprrt-response-toolbar-start">` +
              `<span class="wprrt-response-toolbar-label">Response</span>` +
              `<div class="wprrt-response-meta">` +
                `<span class="wprrt-status-badge wprrt-status-idle">—</span>` +
                `<span class="wprrt-response-time"></span>` +
              `</div>` +
            `</div>` +
            `<div class="wprrt-response-toolbar-end">` +
              buildResponseAiToolbarHtml() +
            `</div>` +
          `</div>` +
          `<div class="wprrt-response-views">` +
            `<div class="wprrt-response-view is-active" data-view="json">` +
              `<details class="wprrt-response-headers">` +
                `<summary>Response headers (<span class="wprrt-header-count">0</span>)</summary>` +
                `<pre class="wprrt-headers-body"></pre>` +
              `</details>` +
              `<pre class="wprrt-response wprrt-response-json">Waiting for request…</pre>` +
            `</div>` +
            `<div class="wprrt-response-view" data-view="ai">` +
              `<div class="wprrt-ai-panel">` +
                `<p class="wprrt-ai-empty">Run a request, then use <strong>Explain</strong> to get an AI summary of the response here.</p>` +
              `</div>` +
            `</div>` +
          `</div>` +
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
