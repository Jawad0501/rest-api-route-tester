jQuery(document).ready(function($) {
    const app = $('#wprrt-app');

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

    // Call loadUserRoles when the page loads
    loadUserRoles();

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

    function renderRoutes(routes) {
        let html = `
        <div class="wprrt-container">
            <div class="wprrt-form">
                <label>Role:
                    <select id="wprrt-role-selector" class="wprrt-role-selector">
                    </select>
                </label>
                <label>Plugin:
                    <select id="wprrt-plugin" style="width: 100%; margin-bottom: 10px;">
                        <option value="all">All Plugins</option>
                    </select>
                </label>
                <label>Route:
                    <div class="wprrt-route-container" style="position: relative;">
                        <input type="text" id="wprrt-route" placeholder="Enter or select a route" style="width: 100%;">
                        <div id="wprrt-route-dropdown" style="display: none; position: absolute; width: 100%; max-height: 200px; overflow-y: auto; background: white; border: 1px solid #ccc; z-index: 1000;">
                        </div>
                    </div>
                </label>
                <label>Method:
                    <select id="wprrt-method">
                        <option>GET</option>
                        <option>POST</option>
                        <option>PUT</option>
                        <option>DELETE</option>
                    </select>
                </label>

                <label>Headers (JSON):
                    <textarea id="wprrt-headers" rows="4">{}</textarea>
                </label>

                <label style="display: none">Form Params (JSON):
                    <textarea id="wprrt-form" rows="4">{}</textarea>
                </label>

                <label>Body (JSON):
                    <textarea id="wprrt-body" rows="6">{}</textarea>
                </label>

                <button id="wprrt-test">Send</button>
            </div>
            <div class="wprrt-response-block">
                <h3>Response:</h3>
                <pre id="wprrt-response" style="max-height: 600px; overflow-y: auto; white-space: pre-wrap; word-wrap: break-word;">Waiting for request...</pre>
            </div>
        </div>`;
        app.html(html);

        // Load roles after the form is rendered
        loadUserRoles();

        const formattedRoutes = {};
        const pluginRoutes = {};
        
        for (const route in routes) {
            const formattedRoute = formatRoute(route);
            formattedRoutes[formattedRoute] = route;
            
            const pluginMatch = route.match(/^\/([^\/]+)/);
            const pluginName = pluginMatch ? pluginMatch[1] : 'other';
            
            if (!pluginRoutes[pluginName]) {
                pluginRoutes[pluginName] = [];
            }
            pluginRoutes[pluginName].push(formattedRoute);
        }

        // Populate plugin dropdown
        const pluginSelect = $('#wprrt-plugin');
        Object.keys(pluginRoutes).sort().forEach(plugin => {
            pluginSelect.append(`<option value="${plugin}">${plugin}</option>`);
        });

        // Handle route input and dropdown
        const routeInput = $('#wprrt-route');
        const dropdown = $('#wprrt-route-dropdown');

        function showRoutes() {
            const selectedPlugin = $('#wprrt-plugin').val();
            dropdown.empty();
            
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
        }

        routeInput.on('focus', showRoutes);
        
        routeInput.on('input', function() {
            const value = $(this).val().toLowerCase();
            const selectedPlugin = $('#wprrt-plugin').val();
            
            dropdown.empty();
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

        dropdown.on('click', '.wprrt-route-option', function() {
            routeInput.val($(this).text());
            dropdown.hide();
        });

        $('#wprrt-plugin').on('change', function() {
            routeInput.val(''); // Clear the route input
            showRoutes();
        });

        $(document).on('click', function(e) {
            if (!$(e.target).closest('.wprrt-route-container').length) {
                dropdown.hide();
            }
        });
    }

    $.post(wprrt_vars.ajax_url, {
        action: 'wprrt_get_routes',
        nonce: wprrt_vars.nonce
    }, res => {
        if (res.success) renderRoutes(res.data);
        else app.html('<p>Failed to load routes.</p>');
    });

    app.on('click', '#wprrt-test', function() {
        const route = $('#wprrt-route').val();
        const method = $('#wprrt-method').val();
        const headers = $('#wprrt-headers').val();
        const form = $('#wprrt-form').val();
        const body = $('#wprrt-body').val();
        const role = $('#wprrt-role-selector').val();

        $('#wprrt-response').text('Sending...');
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
            
            if (res.success) {
                const responseData = {
                    ...res.data,
                    responseTime: `${responseTime}ms`
                };
                $('#wprrt-response').text(JSON.stringify(responseData, null, 2));
            } else {
                const errorData = {
                    error: res.data || 'Error testing route.',
                    responseTime: `${responseTime}ms`
                };
                $('#wprrt-response').text(JSON.stringify(errorData, null, 2));
            }
        });
    });
});
