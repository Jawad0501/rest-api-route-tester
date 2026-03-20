/**
 * URL parameter detection — parses {param} tokens from a formatted route,
 * renders labeled inputs, and resolves the final route string before sending.
 */

const $ = window.jQuery;

/**
 * Returns an array of param names found in a route string.
 * e.g. '/wp/v2/posts/{id}/revisions/{revision}' → ['id', 'revision']
 */
export function parseParams(route) {
  const tokens = [];
  const re = /\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(route)) !== null) {
    tokens.push(m[1]);
  }
  return tokens;
}

/**
 * Renders param inputs inside .wprrt-params-container for the given tab.
 * Preserves existing values when re-rendering the same params.
 */
export function renderParams(tabContent, route) {
  const container = tabContent.find('.wprrt-params-container');
  const params = parseParams(route || '');

  // Preserve current values before wiping
  const existing = {};
  container.find('.wprrt-param-input').each(function () {
    existing[$(this).attr('data-param')] = $(this).val();
  });

  container.empty();

  if (!params.length) return;

  const grid = $('<div class="wprrt-params-grid"></div>');

  params.forEach(param => {
    const label = $('<label class="wprrt-param-label"></label>');
    const name  = $('<span class="wprrt-param-name"></span>').text(param);
    const input = $('<input type="text" class="wprrt-param-input">');

    input.attr('data-param', param);
    input.attr('placeholder', param);

    // Restore previous value if same param name
    if (existing[param] !== undefined) input.val(existing[param]);

    label.append(name, input);
    grid.append(label);
  });

  container.append(grid);
}

/**
 * Replaces {param} tokens in the route with filled-in input values.
 * Returns the resolved route string ready to send.
 */
export function resolveRoute(tabContent) {
  let route = tabContent.find('.wprrt-route').val();

  tabContent.find('.wprrt-param-input').each(function () {
    const param = $(this).attr('data-param');
    const value = $(this).val().trim();
    if (value) {
      route = route.replace(`{${param}}`, encodeURIComponent(value));
    }
  });

  return route;
}

/**
 * Serialises current param input values to a plain object for state persistence.
 */
export function getParamValues(tabContent) {
  const values = {};
  tabContent.find('.wprrt-param-input').each(function () {
    values[$(this).attr('data-param')] = $(this).val();
  });
  return values;
}

/**
 * Restores param input values from a saved state object.
 */
export function restoreParamValues(tabContent, params) {
  if (!params || !Object.keys(params).length) return;
  Object.entries(params).forEach(([k, v]) => {
    tabContent.find(`.wprrt-param-input[data-param="${k}"]`).val(v);
  });
}
