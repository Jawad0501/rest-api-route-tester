jQuery(document).ready(function($) {
    const app = $('#wprrt-app');

    // Single namespace object — no bare globals
    const WPRRT = {
        activeTabId: null,
        tabCounter: 0,
        pluginRoutes: {},
        formattedRoutes: {},
        routeMethods: {}
    };

    // -------------------------------------------------------------------------
    // State management
    // -------------------------------------------------------------------------

    function saveState() {
        const state = {
            tabs: [],
            activeTabId: WPRRT.activeTabId
        };

        $('.wprrt-tab-content').each(function() {
            const tabContent = $(this);
            const tabId = tabContent.attr('id');
            const tabTitle = $(`.wprrt-tab-header[data-tab-id="${tabId}"] .wprrt-tab-title`).text();

            state.tabs.push({
                id: tabId,
                title: tabTitle,
                route: tabContent.find('.wprrt-route').val(),
                method: tabContent.find('.wprrt-method').val(),
                headers: tabContent.find('.wprrt-headers').val(),
                body: tabContent.find('.wprrt-body').val(),
                role: tabContent.find('.wprrt-role-selector').val(),
                plugin: tabContent.find('.wprrt-plugin').val(),
                response: tabContent.find('.wprrt-response').text()
            });
        });

        localStorage.setItem('wprrt_state', JSON.stringify(state));
    }

    function loadState() {
        const saved = localStorage.getItem('wprrt_state');
        if (!saved) return null;
        return JSON.parse(saved);
    }

    function clearState() {
        localStorage.removeItem('wprrt_state');
    }

    // -------------------------------------------------------------------------
    // Loading / error states
    // -------------------------------------------------------------------------

    function showLoadingState() {
        app.html(
            '<div class="wprrt-loading">' +
                '<div class="wprrt-loading-spinner"></div>' +
                '<p>Loading routes...</p>' +
            '</div>'
        );
    }

    function showErrorState(message) {
        const wrapper = $('<div class="wprrt-error"></div>');
        wrapper.append($('<p></p>').text(message));
        app.html('').append(wrapper);
    }

    // -------------------------------------------------------------------------
    // Route formatting — safely converts WP regex patterns to {param} form
    // -------------------------------------------------------------------------

    function formatRoute(route) {
        // Named capture groups: (?P<id>[0-9]+) → {id}
        let formatted = route.replace(/\(\?P<([^>]+)>[^)]+\)/g, '{$1}');
        // Unnamed groups → {}
        formatted = formatted.replace(/\([^)]+\)/g, '{}');
        // Clean up orphaned regex syntax
        formatted = formatted.replace(/[)\[\]+]+/g, '');
        return formatted;
    }

    // -------------------------------------------------------------------------
    // Plugin dropdown
    // -------------------------------------------------------------------------

    function populatePluginDropdown(pluginSelect) {
        pluginSelect.empty();

        const allOpt = document.createElement('option');
        allOpt.value = 'all';
        allOpt.textContent = 'All Plugins';
        pluginSelect.append(allOpt);

        Object.keys(WPRRT.pluginRoutes).sort().forEach(plugin => {
            const opt = document.createElement('option');
            opt.value = plugin;
            opt.textContent = plugin;
            pluginSelect.append(opt);
        });
    }

    // -------------------------------------------------------------------------
    // Role selector — safe DOM insertion
    // -------------------------------------------------------------------------

    function populateRoleSelector(roleSelector, selectedRole) {
        roleSelector.empty();
        $.post(wprrt_vars.ajax_url, {
            action: 'wprrt_get_user_roles',
            nonce: wprrt_vars.nonce
        }, res => {
            if (!res.success) return;
            Object.entries(res.data).forEach(([role, name]) => {
                const opt = document.createElement('option');
                opt.value = role;
                opt.textContent = name;
                roleSelector.append(opt);
            });
            if (selectedRole !== undefined) {
                roleSelector.val(selectedRole);
            }
        });
    }

    // -------------------------------------------------------------------------
    // Route dropdown — safe DOM insertion (XSS fix)
    // -------------------------------------------------------------------------

    function buildRouteDropdown(dropdown, routes) {
        dropdown.empty();
        routes.forEach(route => {
            const div = document.createElement('div');
            div.className = 'wprrt-route-option';
            div.style.cssText = 'padding: 5px; cursor: pointer;';
            div.textContent = route; // textContent — never innerHTML
            dropdown.append(div);
        });
    }

    // -------------------------------------------------------------------------
    // Tab system
    // -------------------------------------------------------------------------

    function createNewTab(tabData) {
        const tabId    = tabData ? tabData.id : `tab-${++WPRRT.tabCounter}`;
        const tabTitle = tabData ? tabData.title : `Request ${WPRRT.tabCounter}`;

        // Tab header
        const tabHeader = $(
            `<div class="wprrt-tab-header" data-tab-id="${tabId}">` +
                `<span class="wprrt-tab-title"></span>` +
                `<button class="wprrt-close-tab">&times;</button>` +
            `</div>`
        );
        tabHeader.find('.wprrt-tab-title').text(tabTitle);

        // Tab content — built with static HTML, dynamic values injected safely below
        const tabContent = $(
            `<div class="wprrt-tab-content" id="${tabId}">` +
                `<div class="wprrt-container">` +
                    `<div class="wprrt-form">` +
                        `<label>Role:<select class="wprrt-role-selector"></select></label>` +
                        `<label>Plugin:` +
                            `<select class="wprrt-plugin" style="width:100%;margin-bottom:10px;"></select>` +
                        `</label>` +
                        `<label>Route:` +
                            `<div class="wprrt-route-container" style="position:relative;">` +
                                `<input type="text" class="wprrt-route" placeholder="Enter or select a route" style="width:100%;">` +
                                `<div class="wprrt-route-dropdown" style="display:none;position:absolute;width:100%;"></div>` +
                            `</div>` +
                        `</label>` +
                        `<label>Method:` +
                            `<select class="wprrt-method">` +
                                `<option>GET</option>` +
                                `<option>POST</option>` +
                                `<option>PUT</option>` +
                                `<option>PATCH</option>` +
                                `<option>DELETE</option>` +
                                `<option>OPTIONS</option>` +
                                `<option>HEAD</option>` +
                            `</select>` +
                        `</label>` +
                        `<label>Headers (JSON):` +
                            `<div class="wprrt-field-container">` +
                                `<textarea class="wprrt-headers" rows="4" placeholder='{\n  "Authorization": "Bearer your-token"\n}'></textarea>` +
                                `<div class="wprrt-field-help"><small>Add authentication headers, content type, etc.</small></div>` +
                            `</div>` +
                        `</label>` +
                        `<label>Body (JSON):` +
                            `<div class="wprrt-field-container">` +
                                `<textarea class="wprrt-body" rows="6" placeholder='{\n  "title": "Your Title",\n  "status": "publish"\n}'></textarea>` +
                                `<div class="wprrt-field-help"><small>For POST/PUT/PATCH requests.</small></div>` +
                            `</div>` +
                        `</label>` +
                        `<button class="wprrt-test">Send</button>` +
                    `</div>` +
                    `<div class="wprrt-response-block">` +
                        `<h3>Response:</h3>` +
                        `<pre class="wprrt-response" style="max-height:600px;overflow-y:auto;white-space:pre-wrap;word-wrap:break-word;">Waiting for request...</pre>` +
                    `</div>` +
                `</div>` +
            `</div>`
        );

        $('.wprrt-tabs').append(tabHeader);
        $('.wprrt-tab-content-wrapper .wprrt-empty').remove();
        $('.wprrt-tab-content-wrapper').append(tabContent);

        // Populate dynamic fields safely
        populateRoleSelector(tabContent.find('.wprrt-role-selector'), tabData ? tabData.role : undefined);
        populatePluginDropdown(tabContent.find('.wprrt-plugin'));

        // Restore saved values if present
        if (tabData) {
            tabContent.find('.wprrt-route').val(tabData.route || '');
            tabContent.find('.wprrt-method').val(tabData.method || 'GET');
            tabContent.find('.wprrt-headers').val(tabData.headers && tabData.headers !== '{}' ? tabData.headers : '');
            tabContent.find('.wprrt-body').val(tabData.body && tabData.body !== '{}' ? tabData.body : '');
            tabContent.find('.wprrt-plugin').val(tabData.plugin || 'all');
            tabContent.find('.wprrt-response').text(tabData.response || 'Waiting for request...');
        }

        switchTab(tabId);
    }

    function switchTab(tabId) {
        $('.wprrt-tab-content').hide();
        $('.wprrt-tab-header').removeClass('active');
        $(`#${tabId}`).show();
        $(`.wprrt-tab-header[data-tab-id="${tabId}"]`).addClass('active');
        WPRRT.activeTabId = tabId;
    }

    // -------------------------------------------------------------------------
    // App init — called once routes load
    // -------------------------------------------------------------------------

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
                primary_method: routeData.primary_method || 'GET'
            };

            const pluginMatch = route.match(/^\/([^\/]+)/);
            const pluginName  = pluginMatch ? pluginMatch[1] : 'other';

            if (!WPRRT.pluginRoutes[pluginName]) {
                WPRRT.pluginRoutes[pluginName] = [];
            }
            WPRRT.pluginRoutes[pluginName].push(formattedRoute);
        }

        app.html(
            '<div class="wprrt-tabs-container">' +
                '<div class="wprrt-tabs-header">' +
                    '<div class="wprrt-tabs"></div>' +
                    '<button class="wprrt-add-tab">+ New Request</button>' +
                '</div>' +
                '<div class="wprrt-tab-content-wrapper"></div>' +
            '</div>'
        );

        // Restore saved state or create a fresh tab
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

        // -------------------------------------------------------------------------
        // Event delegation
        // -------------------------------------------------------------------------

        // Persist form changes
        $(document).on(
            'change',
            '.wprrt-route, .wprrt-method, .wprrt-headers, .wprrt-body, .wprrt-role-selector, .wprrt-plugin',
            saveState
        );

        // Send request
        $(document).on('click', '.wprrt-test', function() {
            const tabContent     = $(this).closest('.wprrt-tab-content');
            const route          = tabContent.find('.wprrt-route').val();
            const method         = tabContent.find('.wprrt-method').val();
            const headers        = tabContent.find('.wprrt-headers').val();
            const body           = tabContent.find('.wprrt-body').val();
            const role           = tabContent.find('.wprrt-role-selector').val();
            const responseEl     = tabContent.find('.wprrt-response');
            const testButton     = tabContent.find('.wprrt-test');

            responseEl.html(
                '<div class="wprrt-loading">' +
                    '<div class="wprrt-loading-spinner"></div>' +
                    '<p>Sending request...</p>' +
                '</div>'
            );
            testButton.prop('disabled', true);

            const startTime = performance.now();

            $.post(wprrt_vars.ajax_url, {
                action: 'wprrt_test_route',
                nonce: wprrt_vars.nonce,
                route,
                method,
                headers,
                body,
                role
            }, res => {
                const elapsed = (performance.now() - startTime).toFixed(2);
                testButton.prop('disabled', false);

                if (res.success) {
                    const display = {
                        status:       res.data.status,
                        responseTime: `${elapsed}ms`,
                        headers:      res.data.headers,
                        data:         res.data.data
                    };
                    responseEl.text(JSON.stringify(display, null, 2));
                    saveState();
                } else {
                    responseEl.text(JSON.stringify({
                        error:        res.data || 'Error testing route.',
                        responseTime: `${elapsed}ms`
                    }, null, 2));
                }
            }).fail(() => {
                testButton.prop('disabled', false);
                responseEl.text(JSON.stringify({
                    error:        'Failed to send request. Please try again.',
                    responseTime: 'N/A'
                }, null, 2));
            });
        });

        // Tab switching
        $(document).on('click', '.wprrt-tab-header', function(e) {
            if (!$(e.target).hasClass('wprrt-close-tab')) {
                switchTab($(this).data('tab-id'));
                saveState();
            }
        });

        // Tab closing
        $(document).on('click', '.wprrt-close-tab', function(e) {
            e.stopPropagation();
            const tabId = $(this).closest('.wprrt-tab-header').data('tab-id');
            $(this).closest('.wprrt-tab-header').remove();
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
        });

        // Route dropdown — focus
        $(document).on('focus', '.wprrt-route', function() {
            const tabContent     = $(this).closest('.wprrt-tab-content');
            const dropdown       = tabContent.find('.wprrt-route-dropdown');
            const selectedPlugin = tabContent.find('.wprrt-plugin').val();

            const routes = selectedPlugin === 'all'
                ? Object.keys(WPRRT.formattedRoutes)
                : (WPRRT.pluginRoutes[selectedPlugin] || []);

            buildRouteDropdown(dropdown, routes);
            dropdown.show();
        });

        // Route dropdown — filter on input
        $(document).on('input', '.wprrt-route', function() {
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

        // Close dropdown on outside click
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.wprrt-route-container').length) {
                $('.wprrt-route-dropdown').hide();
            }
        });

        // Select route from dropdown
        $(document).on('click', '.wprrt-route-option', function() {
            const tabContent  = $(this).closest('.wprrt-tab-content');
            const routeInput  = tabContent.find('.wprrt-route');
            const methodSelect = tabContent.find('.wprrt-method');
            const selectedRoute = $(this).text(); // .text() — safe read

            routeInput.val(selectedRoute);
            $(this).closest('.wprrt-route-dropdown').hide();

            if (WPRRT.routeMethods[selectedRoute]) {
                methodSelect.val(WPRRT.routeMethods[selectedRoute].primary_method);
            }
        });

        // Clear route input when plugin filter changes
        $(document).on('change', '.wprrt-plugin', function() {
            $(this).closest('.wprrt-tab-content').find('.wprrt-route').val('');
        });

        // New tab button
        $(document).on('click', '.wprrt-add-tab', function() {
            createNewTab();
        });
    }

    // -------------------------------------------------------------------------
    // Boot — load routes
    // -------------------------------------------------------------------------

    showLoadingState();

    $.post(wprrt_vars.ajax_url, {
        action: 'wprrt_get_routes',
        nonce: wprrt_vars.nonce
    }, res => {
        if (res.success) initializeApp(res.data);
        else showErrorState('Failed to load routes. Please refresh the page.');
    }).fail(() => {
        showErrorState('Failed to connect to the server. Please check your connection and refresh.');
    });
});
