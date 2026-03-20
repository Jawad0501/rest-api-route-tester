/**
 * Entry point — route processing, app initialisation, event delegation, boot.
 */

import { WPRRT, saveState, loadState } from './state.js';
import { createNewTab, switchTab, closeTab, buildRouteDropdown } from './tabs.js';
import { sendRequest } from './request.js';
import { initSidebar } from './saved.js';
import { renderParams } from './params.js';
import { copyCurl } from './export.js';

const $ = window.jQuery;

// -----------------------------------------------------------------------
// Route formatting
// -----------------------------------------------------------------------

function formatRoute(route) {
  const source = String(route || '');

  function findClosingParen(text, startIdx) {
    let depth = 0;
    for (let i = startIdx; i < text.length; i += 1) {
      const ch = text[i];
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (ch === '(') depth += 1;
      if (ch === ')') {
        depth -= 1;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  // Replace named capture groups like (?P<id>...) and (?<id>...) with {id}
  let formatted = '';
  for (let i = 0; i < source.length; i += 1) {
    if (
      source.startsWith('(?P<', i) ||
      source.startsWith('(?<', i)
    ) {
      const nameStart = source.startsWith('(?P<', i) ? i + 4 : i + 3;
      const nameEnd = source.indexOf('>', nameStart);
      const closeIdx = findClosingParen(source, i);

      if (nameEnd !== -1 && closeIdx !== -1 && nameEnd < closeIdx) {
        const paramName = source.slice(nameStart, nameEnd).trim();
        formatted += paramName ? `{${paramName}}` : '{param}';
        i = closeIdx;
        continue;
      }
    }
    formatted += source[i];
  }

  // Replace unnamed captures with a generic token.
  formatted = formatted.replace(/\((?!\?)[^)]*\)\??/g, '{param}');

  // Remove common non-capturing and lookaround wrappers.
  formatted = formatted
    .replace(/\(\?:/g, '')
    .replace(/\(\?=/g, '')
    .replace(/\(\?!/g, '')
    .replace(/\(\?<=/g, '')
    .replace(/\(\?<!/g, '');

  // Strip regex syntax noise while preserving route path and {param} tokens.
  formatted = formatted
    .replace(/[()[\]^$|+*\\]/g, '')
    .replace(/\?/g, '')
    .replace(/\/{2,}/g, '/')
    .replace(/!\//g, '/')
    .replace(/!+/g, '')
    .trim();

  return formatted;
}

// -----------------------------------------------------------------------
// App initialisation
// -----------------------------------------------------------------------

function initializeApp(routes) {
  WPRRT.formattedRoutes = {};
  WPRRT.pluginRoutes    = {};
  WPRRT.routeMethods    = {};

  for (const route in routes) {
    const routeData      = routes[route];
    const formattedRoute = formatRoute(route);

    WPRRT.formattedRoutes[formattedRoute] = route;
    WPRRT.routeMethods[formattedRoute] = {
      methods:        routeData.methods || ['GET'],
      primary_method: routeData.primary_method || 'GET',
    };

    const pluginMatch = route.match(/^\/([^/]+)/);
    const pluginName  = pluginMatch ? pluginMatch[1] : 'other';

    if (!WPRRT.pluginRoutes[pluginName]) WPRRT.pluginRoutes[pluginName] = [];
    WPRRT.pluginRoutes[pluginName].push(formattedRoute);
  }

  $('#wprrt-app').html(
    '<div class="wprrt-layout">' +
      '<aside class="wprrt-sidebar">' +
        '<div class="wprrt-sidebar-header">Saved Requests</div>' +
        '<div id="wprrt-saved-list"></div>' +
      '</aside>' +
      '<div class="wprrt-main">' +
        '<div class="wprrt-tabs-container">' +
          '<div class="wprrt-tabs-header">' +
            '<div class="wprrt-tabs"></div>' +
            '<button class="wprrt-add-tab">+ New Request</button>' +
          '</div>' +
          '<div class="wprrt-tab-content-wrapper"></div>' +
        '</div>' +
      '</div>' +
    '</div>'
  );

  initSidebar();

  const savedState = loadState();
  if (savedState && savedState.tabs.length > 0) {
    savedState.tabs.forEach(tabData => {
      if (tabData.id && tabData.id.startsWith('tab-')) {
        const n = parseInt(tabData.id.replace('tab-', ''), 10);
        if (n > WPRRT.tabCounter) WPRRT.tabCounter = n;
      }
    });
    savedState.tabs.forEach(tabData => createNewTab(tabData));
    if (savedState.activeTabId) switchTab(savedState.activeTabId);
  } else {
    createNewTab();
  }

  // -----------------------------------------------------------------------
  // Event delegation
  // -----------------------------------------------------------------------

  $(document).on(
    'change',
    '.wprrt-route, .wprrt-method, .wprrt-headers, .wprrt-body, .wprrt-role-selector, .wprrt-plugin, .wprrt-auth-type',
    saveState
  );

  $(document).on('input', '.wprrt-param-input', saveState);

  $(document).on('click', '.wprrt-test', function () {
    sendRequest($(this).closest('.wprrt-tab-content'));
  });

  $(document).on('click', '.wprrt-tab-header', function (e) {
    if (!$(e.target).hasClass('wprrt-close-tab')) {
      switchTab($(this).data('tab-id'));
      saveState();
    }
  });

  $(document).on('click', '.wprrt-close-tab', function (e) {
    e.stopPropagation();
    closeTab($(this).closest('.wprrt-tab-header').data('tab-id'));
  });

  $(document).on('focus', '.wprrt-route', function () {
    const tabContent     = $(this).closest('.wprrt-tab-content');
    const dropdown       = tabContent.find('.wprrt-route-dropdown');
    const selectedPlugin = tabContent.find('.wprrt-plugin').val();

    const routes = selectedPlugin === 'all'
      ? Object.keys(WPRRT.formattedRoutes)
      : (WPRRT.pluginRoutes[selectedPlugin] || []);

    buildRouteDropdown(dropdown, routes);
    dropdown.show();
  });

  $(document).on('input', '.wprrt-route', function () {
    const value          = $(this).val().toLowerCase();
    const tabContent     = $(this).closest('.wprrt-tab-content');
    const dropdown       = tabContent.find('.wprrt-route-dropdown');
    const selectedPlugin = tabContent.find('.wprrt-plugin').val();

    const routes = (selectedPlugin === 'all'
      ? Object.keys(WPRRT.formattedRoutes)
      : (WPRRT.pluginRoutes[selectedPlugin] || [])
    ).filter(r => r.toLowerCase().includes(value));

    buildRouteDropdown(dropdown, routes);
    dropdown.show();
  });

  $(document).on('click', function (e) {
    if (!$(e.target).closest('.wprrt-route-container').length) {
      $('.wprrt-route-dropdown').hide();
    }
  });

  $(document).on('click', '.wprrt-route-option', function () {
    const tabContent    = $(this).closest('.wprrt-tab-content');
    const selectedRoute = $(this).text();

    tabContent.find('.wprrt-route').val(selectedRoute);
    $(this).closest('.wprrt-route-dropdown').hide();

    if (WPRRT.routeMethods[selectedRoute]) {
      tabContent.find('.wprrt-method').val(WPRRT.routeMethods[selectedRoute].primary_method);
    }

    renderParams(tabContent, selectedRoute);
    saveState();
  });

  $(document).on('change', '.wprrt-route', function () {
    const tabContent = $(this).closest('.wprrt-tab-content');
    renderParams(tabContent, $(this).val());
    saveState();
  });

  $(document).on('click', '.wprrt-curl-btn', function () {
    copyCurl($(this).closest('.wprrt-tab-content'));
  });

  $(document).on('change', '.wprrt-plugin', function () {
    $(this).closest('.wprrt-tab-content').find('.wprrt-route').val('');
  });

  $(document).on('click', '.wprrt-add-tab', function () {
    createNewTab();
  });
}

// -----------------------------------------------------------------------
// Boot
// -----------------------------------------------------------------------

$(document).ready(function () {
  const app = $('#wprrt-app');

  app.html(
    '<div class="wprrt-loading">' +
      '<div class="wprrt-loading-spinner"></div>' +
      '<p>Loading routes...</p>' +
    '</div>'
  );

  $.post(window.wprrt_vars.ajax_url, {
    action: 'wprrt_get_routes',
    nonce:  window.wprrt_vars.nonce,
  }, res => {
    if (res.success) {
      initializeApp(res.data);
    } else {
      const wrapper = $('<div class="wprrt-error"></div>');
      wrapper.append($('<p></p>').text('Failed to load routes. Please refresh the page.'));
      app.html('').append(wrapper);
    }
  }).fail(() => {
    const wrapper = $('<div class="wprrt-error"></div>');
    wrapper.append($('<p></p>').text('Failed to connect to the server. Please check your connection and refresh.'));
    app.html('').append(wrapper);
  });
});
