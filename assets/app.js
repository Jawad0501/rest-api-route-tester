jQuery(document).ready(function($) {
    const app = $('#wprrt-app');
    let activeTabId = null;
    let tabCounter = 0;
    let pluginRoutes = {}; // Store plugin routes globally
    let formattedRoutes = {}; // Store formatted routes globally
    let routeMethods = {}; // Store route methods globally

    // State management functions
    function saveState() {
        const state = {
            tabs: [],
            activeTabId: activeTabId
        };

        // Save each tab's state
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
                form: tabContent.find('.wprrt-form').val(),
                body: tabContent.find('.wprrt-body').val(),
                role: tabContent.find('.wprrt-role-selector').val(),
                plugin: tabContent.find('.wprrt-plugin').val(),
                response: tabContent.find('.wprrt-response').text()
            });
        });

        localStorage.setItem('wprrt_state', JSON.stringify(state));
    }

    function loadState() {
        const savedState = localStorage.getItem('wprrt_state');
        if (!savedState) return null;
        return JSON.parse(savedState);
    }

    function clearState() {
        localStorage.removeItem('wprrt_state');
    }

    function showLoadingState() {
        app.html(`
            <div class="wprrt-loading">
                <div class="wprrt-loading-spinner"></div>
                <p>Loading routes...</p>
            </div>
        `);
    }

    function showErrorState(message) {
        app.html(`
            <div class="wprrt-error">
                <p>${message}</p>
            </div>
        `);
    }

    // Load user roles
    function loadUserRoles() {
        $.post(wprrt_vars.ajax_url, {
            action: 'wprrt_get_user_roles',
            nonce: wprrt_vars.nonce
        }, res => {
            if (res.success) {
                const roleSelector = $('#wprrt-role-selector');
                Object.entries(res.data).forEach(([role, name]) => {
                    roleSelector.append(`<option value="${role}">${name}</option>`);
                });
            }
        });
    }

    function populatePluginDropdown(pluginSelect) {
        pluginSelect.empty().append('<option value="all">All Plugins</option>');
        Object.keys(pluginRoutes).sort().forEach(plugin => {
            pluginSelect.append(`<option value="${plugin}">${plugin}</option>`);
        });
    }

    function createNewTab(tabData = null) {
        const tabId = tabData ? tabData.id : `tab-${++tabCounter}`;
        const tabTitle = tabData ? tabData.title : `Request ${tabCounter}`;
        
        // Create tab header
        const tabHeader = $(`
            <div class="wprrt-tab-header" data-tab-id="${tabId}">
                <span class="wprrt-tab-title">${tabTitle}</span>
                <button class="wprrt-close-tab">&times;</button>
            </div>
        `);
        
        // Create tab content
        const tabContent = $(`
            <div class="wprrt-tab-content" id="${tabId}">
                <div class="wprrt-container">
                    <div class="wprrt-form">
                        <label>Role:
                            <select class="wprrt-role-selector">
                            </select>
                        </label>
                        <label>Plugin:
                            <select class="wprrt-plugin" style="width: 100%; margin-bottom: 10px;">
                                <option value="all">All Plugins</option>
                            </select>
                        </label>
                        <label>Route:
                            <div class="wprrt-route-container" style="position: relative;">
                                <input type="text" class="wprrt-route" placeholder="Enter or select a route" style="width: 100%;">
                                <div class="wprrt-route-dropdown" style="display: none; position: absolute; width: 100%; max-height: 200px; overflow-y: auto; background: white; border: 1px solid #ccc; z-index: 1000;">
                                </div>
                            </div>
                        </label>
                        <label>Method:
                            <select class="wprrt-method">
                                <option>GET</option>
                                <option>POST</option>
                                <option>PUT</option>
                                <option>DELETE</option>
                            </select>
                        </label>

                        <label>Headers (JSON):
                            <div class="wprrt-field-container">
                                <textarea class="wprrt-headers" rows="4" placeholder='{
  "Content-Type": "application/json",
  "Authorization": "Bearer your-token",
  "X-Custom-Header": "value"
}'></textarea>
                                <div class="wprrt-field-help">
                                    <small>Example: Add authentication headers, content type, etc.</small>
                                </div>
                            </div>
                        </label>

                        <label style="display: none">Form Params (JSON):
                            <textarea class="wprrt-form" rows="4"></textarea>
                        </label>

                        <label>Body (JSON):
                            <div class="wprrt-field-container">
                                <textarea class="wprrt-body" rows="6" placeholder='{
  "title": "Your Title",
  "content": "Your Content",
  "status": "publish",
  "author": 1
}'></textarea>
                                <div class="wprrt-field-help">
                                    <small>Example: For POST/PUT requests, include the data you want to send.</small>
                                </div>
                            </div>
                        </label>

                        <button class="wprrt-test">Send</button>
                    </div>
                    <div class="wprrt-response-block">
                        <h3>Response:</h3>
                        <pre class="wprrt-response" style="max-height: 600px; overflow-y: auto; white-space: pre-wrap; word-wrap: break-word;">Waiting for request...</pre>
                    </div>
                </div>
            </div>
        `);

        // Add tab to the interface
        $('.wprrt-tabs').append(tabHeader);
        // Remove empty placeholder if present
        $('.wprrt-tab-content-wrapper .wprrt-empty').remove();
        $('.wprrt-tab-content-wrapper').append(tabContent);

        // Populate roles in the new tab
        $.post(wprrt_vars.ajax_url, {
            action: 'wprrt_get_user_roles',
            nonce: wprrt_vars.nonce
        }, res => {
            if (res.success) {
                const roleSelector = tabContent.find('.wprrt-role-selector');
                Object.entries(res.data).forEach(([role, name]) => {
                    roleSelector.append(`<option value="${role}">${name}</option>`);
                });

                // Restore saved data if available
                if (tabData) {
                    tabContent.find('.wprrt-route').val(tabData.route);
                    tabContent.find('.wprrt-method').val(tabData.method);
                    tabContent.find('.wprrt-headers').val(tabData.headers && tabData.headers !== '{}' ? tabData.headers : '');
                    tabContent.find('.wprrt-form').val(tabData.form && tabData.form !== '{}' ? tabData.form : '');
                    tabContent.find('.wprrt-body').val(tabData.body && tabData.body !== '{}' ? tabData.body : '');
                    tabContent.find('.wprrt-role-selector').val(tabData.role);
                    tabContent.find('.wprrt-plugin').val(tabData.plugin);
                    tabContent.find('.wprrt-response').text(tabData.response);
                }
            }
        });

        // Populate plugins in the new tab
        populatePluginDropdown(tabContent.find('.wprrt-plugin'));

        // Switch to the new tab
        switchTab(tabId);
    }

    function switchTab(tabId) {
        // Hide all tabs and remove active class
        $('.wprrt-tab-content').hide();
        $('.wprrt-tab-header').removeClass('active');
        
        // Show selected tab and add active class
        $(`#${tabId}`).show();
        $(`.wprrt-tab-header[data-tab-id="${tabId}"]`).addClass('active');
        
        activeTabId = tabId;
    }

    function formatRoute(route) {
        console.log('Original route:', route);
        let formatted = route.replace(/\(\?P<([^>]+)>[^)]+\)/g, '{$1}');
        console.log('After named params:', formatted);
        formatted = formatted.replace(/\([^)]+\)/g, '{}');
        console.log('After unnamed params:', formatted);
        formatted = formatted.replace(/\}\s*\)\+?\]?/g, '}');
        console.log('After cleanup:', formatted);
        formatted = formatted.replace(/[)\[\]\+]+/g, '');
        console.log('Final result:', formatted);
        return formatted;
    }

    function initializeApp(routes) {
        // Reset global variables
        formattedRoutes = {};
        pluginRoutes = {};
        routeMethods = {};
        
        // Process routes
        for (const route in routes) {
            const routeData = routes[route];
            const formattedRoute = formatRoute(route);
            formattedRoutes[formattedRoute] = route;
            
            // Store method information
            routeMethods[formattedRoute] = {
                methods: routeData.methods || ['GET'],
                primary_method: routeData.primary_method || 'GET'
            };
            
            const pluginMatch = route.match(/^\/([^\/]+)/);
            const pluginName = pluginMatch ? pluginMatch[1] : 'other';
            
            if (!pluginRoutes[pluginName]) {
                pluginRoutes[pluginName] = [];
            }
            pluginRoutes[pluginName].push(formattedRoute);
        }

        // Create the tab interface
        let html = `
        <div class="wprrt-tabs-container">
            <div class="wprrt-tabs-header">
                <div class="wprrt-tabs"></div>
                <button class="wprrt-add-tab">+ New Request</button>
            </div>
            <div class="wprrt-tab-content-wrapper"></div>
        </div>`;
        
        app.html(html);

        // Load saved state or create new tab
        const savedState = loadState();
        if (savedState && savedState.tabs.length > 0) {
            // Initialize tabCounter based on existing tabs to avoid conflicts
            savedState.tabs.forEach(tabData => {
                if (tabData.id && tabData.id.startsWith('tab-')) {
                    const tabNumber = parseInt(tabData.id.replace('tab-', ''));
                    if (tabNumber > tabCounter) {
                        tabCounter = tabNumber;
                    }
                }
            });
            
            savedState.tabs.forEach(tabData => createNewTab(tabData));
            if (savedState.activeTabId) {
                switchTab(savedState.activeTabId);
            }
        } else {
            createNewTab();
        }

        // Add state saving to various events
        $(document).on('change', '.wprrt-route, .wprrt-method, .wprrt-headers, .wprrt-form, .wprrt-body, .wprrt-role-selector, .wprrt-plugin', saveState);
        $(document).on('click', '.wprrt-test', function() {
            const tabContent = $(this).closest('.wprrt-tab-content');
            const route = tabContent.find('.wprrt-route').val();
            const method = tabContent.find('.wprrt-method').val();
            const headers = tabContent.find('.wprrt-headers').val();
            const form = tabContent.find('.wprrt-form').val();
            const body = tabContent.find('.wprrt-body').val();
            const role = tabContent.find('.wprrt-role-selector').val();
            const responseElement = tabContent.find('.wprrt-response');
            const testButton = tabContent.find('.wprrt-test');

            // Show loading state
            responseElement.html(`
                <div class="wprrt-loading">
                    <div class="wprrt-loading-spinner"></div>
                    <p>Sending request...</p>
                </div>
            `);
            testButton.prop('disabled', true);

            const startTime = performance.now();

            $.post(wprrt_vars.ajax_url, {
                action: 'wprrt_test_route',
                nonce: wprrt_vars.nonce,
                route,
                method,
                headers,
                form,
                body,
                role
            }, res => {
                const endTime = performance.now();
                const responseTime = (endTime - startTime).toFixed(2);
                
                // Re-enable the test button
                testButton.prop('disabled', false);
                
                if (res.success) {
                    const responseData = {
                        ...res.data,
                        responseTime: `${responseTime}ms`
                    };
                    responseElement.text(JSON.stringify(responseData, null, 2));
                    saveState(); // Save state after response
                } else {
                    const errorData = {
                        error: res.data || 'Error testing route.',
                        responseTime: `${responseTime}ms`
                    };
                    responseElement.text(JSON.stringify(errorData, null, 2));
                }
            }).fail(() => {
                // Handle AJAX failure
                testButton.prop('disabled', false);
                responseElement.text(JSON.stringify({
                    error: 'Failed to send request. Please try again.',
                    responseTime: 'N/A'
                }, null, 2));
            });
        });

        // Save state when switching tabs
        $(document).on('click', '.wprrt-tab-header', function(e) {
            if (!$(e.target).hasClass('wprrt-close-tab')) {
                switchTab($(this).data('tab-id'));
                saveState();
            }
        });

        // Save state when closing tabs
        $(document).on('click', '.wprrt-close-tab', function(e) {
            e.stopPropagation();
            const tabId = $(this).closest('.wprrt-tab-header').data('tab-id');
            $(this).closest('.wprrt-tab-header').remove();
            $(`#${tabId}`).remove();
            
            if (tabId === activeTabId) {
                const remainingTab = $('.wprrt-tab-header').last();
                if (remainingTab.length) {
                    switchTab(remainingTab.data('tab-id'));
                }
            }
            // If there are no tabs left, show placeholder container
            if ($('.wprrt-tab-header').length === 0) {
                // Reset counters and state when no tabs remain
                tabCounter = 0;
                activeTabId = null;
                clearState();
                $('.wprrt-tab-content-wrapper').html(`
                    <div class="wprrt-empty">
                        <div class="wprrt-empty-inner">
                            <div class="wprrt-empty-icon">🗂️</div>
                            <h3>No requests yet</h3>
                            <p>Create a new request to get started.</p>
                            <button class="wprrt-add-tab">+ New Request</button>
                        </div>
                    </div>
                `);
            }
            saveState();
        });

        // Handle route input and dropdown for each tab
        $(document).on('focus', '.wprrt-route', function() {
            const tabContent = $(this).closest('.wprrt-tab-content');
            const dropdown = tabContent.find('.wprrt-route-dropdown');
            const pluginSelect = tabContent.find('.wprrt-plugin');
            
            dropdown.empty();
            const selectedPlugin = pluginSelect.val();
            
            let routesToShow = [];
            if (selectedPlugin === 'all') {
                routesToShow = Object.keys(formattedRoutes);
            } else {
                routesToShow = pluginRoutes[selectedPlugin] || [];
            }

            routesToShow.forEach(route => {
                dropdown.append(`<div class="wprrt-route-option" style="padding: 5px; cursor: pointer;">${route}</div>`);
            });
            dropdown.show();
        });

        // Close dropdown when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.wprrt-route-container').length) {
                $('.wprrt-route-dropdown').hide();
            }
        });

        $(document).on('input', '.wprrt-route', function() {
            const value = $(this).val().toLowerCase();
            const tabContent = $(this).closest('.wprrt-tab-content');
            const dropdown = tabContent.find('.wprrt-route-dropdown');
            const pluginSelect = tabContent.find('.wprrt-plugin');
            
            dropdown.empty();
            const selectedPlugin = pluginSelect.val();
            
            let routesToShow = [];
            if (selectedPlugin === 'all') {
                routesToShow = Object.keys(formattedRoutes);
            } else {
                routesToShow = pluginRoutes[selectedPlugin] || [];
            }

            routesToShow.forEach(route => {
                if (route.toLowerCase().includes(value)) {
                    dropdown.append(`<div class="wprrt-route-option" style="padding: 5px; cursor: pointer;">${route}</div>`);
                }
            });
            dropdown.show();
        });

        $(document).on('click', '.wprrt-route-option', function() {
            const tabContent = $(this).closest('.wprrt-tab-content');
            const routeInput = tabContent.find('.wprrt-route');
            const methodSelect = tabContent.find('.wprrt-method');
            const selectedRoute = $(this).text();
            
            routeInput.val(selectedRoute);
            $(this).closest('.wprrt-route-dropdown').hide();
            
            // Auto-select the primary method for the selected route
            if (routeMethods[selectedRoute]) {
                const primaryMethod = routeMethods[selectedRoute].primary_method;
                methodSelect.val(primaryMethod);
            }
        });

        $(document).on('change', '.wprrt-plugin', function() {
            const tabContent = $(this).closest('.wprrt-tab-content');
            const routeInput = tabContent.find('.wprrt-route');
            routeInput.val('');
        });

        // Handle new tab creation
        $(document).on('click', '.wprrt-add-tab', function() {
            createNewTab();
        });
    }

    // Show initial loading state
    showLoadingState();

    // Initial load of routes
    $.post(wprrt_vars.ajax_url, {
        action: 'wprrt_get_routes',
        nonce: wprrt_vars.nonce
    }, res => {
        if (res.success) initializeApp(res.data);
        else showErrorState('Failed to load routes. Please refresh the page.');
    }).fail(() => {
        showErrorState('Failed to connect to the server. Please check your connection and refresh the page.');
    });
});
