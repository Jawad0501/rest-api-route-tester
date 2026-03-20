/**
 * Auth preset dropdown — injects header templates into the Headers textarea.
 */

const AUTH_PRESETS = {
  bearer: { Authorization: 'Bearer YOUR_TOKEN' },
  apikey: { 'X-API-Key': 'YOUR_KEY' },
  basic:  { Authorization: 'Basic YOUR_BASE64' },
};

// Keys that any auth preset might set — removed before applying a new one
const AUTH_KEYS = ['Authorization', 'X-API-Key'];

function applyPreset(tabContent, type) {
  const headersEl = tabContent.find('.wprrt-headers');
  let current = {};

  try {
    const val = headersEl.val().trim();
    if (val) current = JSON.parse(val);
  } catch (e) {
    current = {};
  }

  // Strip previous auth keys before applying the new preset
  AUTH_KEYS.forEach(k => delete current[k]);

  if (type !== 'none' && AUTH_PRESETS[type]) {
    Object.assign(current, AUTH_PRESETS[type]);
  }

  headersEl.val(
    Object.keys(current).length ? JSON.stringify(current, null, 2) : ''
  );
}

export function initAuthDropdown(tabContent, savedType) {
  const $ = window.jQuery;

  const wrapper = $(
    '<label class="wprrt-auth-label">Auth preset:' +
      '<select class="wprrt-auth-type">' +
        '<option value="none">No Auth</option>' +
        '<option value="bearer">Bearer Token</option>' +
        '<option value="apikey">API Key</option>' +
        '<option value="basic">Basic Auth</option>' +
      '</select>' +
    '</label>'
  );

  // Insert immediately before the Headers label
  tabContent.find('.wprrt-headers').closest('label').before(wrapper);

  if (savedType && savedType !== 'none') {
    wrapper.find('.wprrt-auth-type').val(savedType);
  }

  wrapper.find('.wprrt-auth-type').on('change', function () {
    applyPreset(tabContent, $(this).val());
    // Trigger change so saveState picks it up
    tabContent.find('.wprrt-headers').trigger('change');
  });
}
