/**
 * Shared state namespace and localStorage helpers.
 * All modules import WPRRT from here — single source of truth.
 */

export const WPRRT = {
  activeTabId: null,
  tabCounter: 0,
  pluginRoutes: {},
  formattedRoutes: {},
  routeMethods: {},
};

export function saveState() {
  const $ = window.jQuery;
  const state = { tabs: [], activeTabId: WPRRT.activeTabId };

  $('.wprrt-tab-content').each(function () {
    const tc    = $(this);
    const tabId = tc.attr('id');
    const tabTitle = $(`.wprrt-tab-header[data-tab-id="${tabId}"] .wprrt-tab-title`).text();

    const params = {};
    tc.find('.wprrt-param-input').each(function () {
      params[$(this).attr('data-param')] = $(this).val();
    });

    state.tabs.push({
      id:       tabId,
      title:    tabTitle,
      route:    tc.find('.wprrt-route').val(),
      method:   tc.find('.wprrt-method').val(),
      headers:  tc.find('.wprrt-headers').val(),
      body:     tc.find('.wprrt-body').val(),
      role:     tc.find('.wprrt-role-selector').val(),
      plugin:   tc.find('.wprrt-plugin').val(),
      authType: tc.find('.wprrt-auth-type').val(),
      response: tc.find('.wprrt-response').text(),
      params,
    });
  });

  localStorage.setItem('wprrt_state', JSON.stringify(state));
}

export function loadState() {
  const saved = localStorage.getItem('wprrt_state');
  return saved ? JSON.parse(saved) : null;
}

export function clearState() {
  localStorage.removeItem('wprrt_state');
}
