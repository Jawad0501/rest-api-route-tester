(function() {
  "use strict";
  const WPRRT = {
    activeTabId: null,
    tabCounter: 0,
    pluginRoutes: {},
    formattedRoutes: {},
    routeMethods: {}
  };
  function saveState() {
    const $2 = window.jQuery;
    const state = { tabs: [], activeTabId: WPRRT.activeTabId };
    $2(".wprrt-tab-content").each(function() {
      const tc = $2(this);
      const tabId = tc.attr("id");
      const tabTitle = $2(`.wprrt-tab-header[data-tab-id="${tabId}"] .wprrt-tab-title`).text();
      const params = {};
      tc.find(".wprrt-param-input").each(function() {
        params[$2(this).attr("data-param")] = $2(this).val();
      });
      state.tabs.push({
        id: tabId,
        title: tabTitle,
        route: tc.find(".wprrt-route").val(),
        method: tc.find(".wprrt-method").val(),
        headers: tc.find(".wprrt-headers").val(),
        body: tc.find(".wprrt-body").val(),
        role: tc.find(".wprrt-role-selector").val(),
        plugin: tc.find(".wprrt-plugin").val(),
        authType: tc.find(".wprrt-auth-type").val(),
        response: tc.find(".wprrt-response").text(),
        params
      });
    });
    localStorage.setItem("wprrt_state", JSON.stringify(state));
  }
  function loadState() {
    const saved = localStorage.getItem("wprrt_state");
    return saved ? JSON.parse(saved) : null;
  }
  function clearState() {
    localStorage.removeItem("wprrt_state");
  }
  const AUTH_PRESETS = {
    bearer: { Authorization: "Bearer YOUR_TOKEN" },
    apikey: { "X-API-Key": "YOUR_KEY" },
    basic: { Authorization: "Basic YOUR_BASE64" }
  };
  const AUTH_KEYS = ["Authorization", "X-API-Key"];
  function applyPreset(tabContent, type) {
    const headersEl = tabContent.find(".wprrt-headers");
    let current = {};
    try {
      const val = headersEl.val().trim();
      if (val) current = JSON.parse(val);
    } catch (e) {
      current = {};
    }
    AUTH_KEYS.forEach((k) => delete current[k]);
    if (type !== "none" && AUTH_PRESETS[type]) {
      Object.assign(current, AUTH_PRESETS[type]);
    }
    headersEl.val(
      Object.keys(current).length ? JSON.stringify(current, null, 2) : ""
    );
  }
  function initAuthDropdown(tabContent, savedType) {
    const $2 = window.jQuery;
    const wrapper = $2(
      '<label class="wprrt-auth-label">Auth preset:<select class="wprrt-auth-type"><option value="none">No Auth</option><option value="bearer">Bearer Token</option><option value="apikey">API Key</option><option value="basic">Basic Auth</option></select></label>'
    );
    tabContent.find(".wprrt-headers").closest("label").before(wrapper);
    if (savedType && savedType !== "none") {
      wrapper.find(".wprrt-auth-type").val(savedType);
    }
    wrapper.find(".wprrt-auth-type").on("change", function() {
      applyPreset(tabContent, $2(this).val());
      tabContent.find(".wprrt-headers").trigger("change");
    });
  }
  const $$4 = window.jQuery;
  function parseParams(route) {
    const tokens = [];
    const re = /\{([^}]+)\}/g;
    let m;
    while ((m = re.exec(route)) !== null) {
      tokens.push(m[1]);
    }
    return tokens;
  }
  function renderParams(tabContent, route) {
    const container = tabContent.find(".wprrt-params-container");
    const params = parseParams(route || "");
    const existing = {};
    container.find(".wprrt-param-input").each(function() {
      existing[$$4(this).attr("data-param")] = $$4(this).val();
    });
    container.empty();
    if (!params.length) return;
    const grid = $$4('<div class="wprrt-params-grid"></div>');
    params.forEach((param) => {
      const label = $$4('<label class="wprrt-param-label"></label>');
      const name = $$4('<span class="wprrt-param-name"></span>').text(param);
      const input = $$4('<input type="text" class="wprrt-param-input">');
      input.attr("data-param", param);
      input.attr("placeholder", param);
      if (existing[param] !== void 0) input.val(existing[param]);
      label.append(name, input);
      grid.append(label);
    });
    container.append(grid);
  }
  function resolveRoute(tabContent) {
    let route = tabContent.find(".wprrt-route").val();
    tabContent.find(".wprrt-param-input").each(function() {
      const param = $$4(this).attr("data-param");
      const value = $$4(this).val().trim();
      if (value) {
        route = route.replace(`{${param}}`, encodeURIComponent(value));
      }
    });
    return route;
  }
  function restoreParamValues(tabContent, params) {
    if (!params || !Object.keys(params).length) return;
    Object.entries(params).forEach(([k, v]) => {
      tabContent.find(`.wprrt-param-input[data-param="${k}"]`).val(v);
    });
  }
  const $$3 = window.jQuery;
  function populateRoleSelector(roleSelector, selectedRole) {
    roleSelector.empty();
    $$3.post(window.wprrt_vars.ajax_url, {
      action: "wprrt_get_user_roles",
      nonce: window.wprrt_vars.nonce
    }, (res) => {
      if (!res.success) return;
      Object.entries(res.data).forEach(([role, name]) => {
        const opt = document.createElement("option");
        opt.value = role;
        opt.textContent = name;
        roleSelector.append(opt);
      });
      if (selectedRole !== void 0) roleSelector.val(selectedRole);
    });
  }
  function populatePluginDropdown(pluginSelect) {
    pluginSelect.empty();
    const allOpt = document.createElement("option");
    allOpt.value = "all";
    allOpt.textContent = "All Plugins";
    pluginSelect.append(allOpt);
    Object.keys(WPRRT.pluginRoutes).sort().forEach((plugin) => {
      const opt = document.createElement("option");
      opt.value = plugin;
      opt.textContent = plugin;
      pluginSelect.append(opt);
    });
  }
  function buildRouteDropdown(dropdown, routes) {
    dropdown.empty();
    routes.forEach((route) => {
      const div = document.createElement("div");
      div.className = "wprrt-route-option";
      div.textContent = route;
      dropdown.append(div);
    });
  }
  function switchTab(tabId) {
    $$3(".wprrt-tab-content").hide();
    $$3(".wprrt-tab-header").removeClass("active");
    $$3(`#${tabId}`).show();
    $$3(`.wprrt-tab-header[data-tab-id="${tabId}"]`).addClass("active");
    WPRRT.activeTabId = tabId;
  }
  function createNewTab(tabData) {
    const tabId = tabData ? tabData.id : `tab-${++WPRRT.tabCounter}`;
    const tabTitle = tabData ? tabData.title : `Request ${WPRRT.tabCounter}`;
    const tabHeader = $$3(
      `<div class="wprrt-tab-header" data-tab-id="${tabId}"><span class="wprrt-tab-title"></span><button class="wprrt-close-tab">&times;</button></div>`
    );
    tabHeader.find(".wprrt-tab-title").text(tabTitle);
    const tabContent = $$3(
      `<div class="wprrt-tab-content" id="${tabId}"><div class="wprrt-container"><div class="wprrt-form"><label>Role:<select class="wprrt-role-selector"></select></label><label>Plugin:<select class="wprrt-plugin"></select></label><label>Route:<div class="wprrt-route-container"><input type="text" class="wprrt-route" placeholder="Enter or select a route"><div class="wprrt-route-dropdown"></div></div></label><div class="wprrt-params-container"></div><label>Method:<select class="wprrt-method"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>OPTIONS</option><option>HEAD</option></select></label><label>Headers (JSON):<div class="wprrt-field-container"><textarea class="wprrt-headers" rows="4" placeholder='{
  "Authorization": "Bearer your-token"
}'></textarea><div class="wprrt-field-help"><small>Authentication headers, content type, etc.</small></div></div></label><label>Body (JSON):<div class="wprrt-field-container"><textarea class="wprrt-body" rows="6" placeholder='{
  "title": "Your Title",
  "status": "publish"
}'></textarea><div class="wprrt-field-help"><small>For POST / PUT / PATCH requests.</small></div></div></label><div class="wprrt-form-actions"><button class="wprrt-test">Send</button><button class="wprrt-curl-btn" type="button">Copy as cURL</button><button class="wprrt-save-btn" type="button">Save</button></div><div class="wprrt-save-form"><input type="text" class="wprrt-save-name" placeholder="Request name…" maxlength="80"><div class="wprrt-save-actions"><button class="wprrt-save-confirm" type="button">Save</button><button class="wprrt-save-cancel" type="button">Cancel</button></div></div></div><div class="wprrt-response-block"><h3>Response</h3><div class="wprrt-response-meta"><span class="wprrt-status-badge"></span><span class="wprrt-response-time"></span></div><details class="wprrt-response-headers"><summary>Response Headers (<span class="wprrt-header-count">0</span>)</summary><pre class="wprrt-headers-body"></pre></details><pre class="wprrt-response">Waiting for request...</pre></div></div></div>`
    );
    $$3(".wprrt-tabs").append(tabHeader);
    $$3(".wprrt-tab-content-wrapper .wprrt-empty").remove();
    $$3(".wprrt-tab-content-wrapper").append(tabContent);
    populateRoleSelector(tabContent.find(".wprrt-role-selector"), tabData ? tabData.role : void 0);
    populatePluginDropdown(tabContent.find(".wprrt-plugin"));
    initAuthDropdown(tabContent, tabData ? tabData.authType : void 0);
    if (tabData) {
      tabContent.find(".wprrt-route").val(tabData.route || "");
      tabContent.find(".wprrt-method").val(tabData.method || "GET");
      tabContent.find(".wprrt-headers").val(tabData.headers && tabData.headers !== "{}" ? tabData.headers : "");
      tabContent.find(".wprrt-body").val(tabData.body && tabData.body !== "{}" ? tabData.body : "");
      tabContent.find(".wprrt-plugin").val(tabData.plugin || "all");
      if (tabData.response && tabData.response !== "Waiting for request...") {
        tabContent.find(".wprrt-response").text(tabData.response);
      }
      if (tabData.route) {
        renderParams(tabContent, tabData.route);
        restoreParamValues(tabContent, tabData.params);
      }
    }
    switchTab(tabId);
  }
  function closeTab(tabId) {
    $$3(`.wprrt-tab-header[data-tab-id="${tabId}"]`).remove();
    $$3(`#${tabId}`).remove();
    if (tabId === WPRRT.activeTabId) {
      const remaining = $$3(".wprrt-tab-header").last();
      if (remaining.length) switchTab(remaining.data("tab-id"));
    }
    if ($$3(".wprrt-tab-header").length === 0) {
      WPRRT.tabCounter = 0;
      WPRRT.activeTabId = null;
      clearState();
      $$3(".wprrt-tab-content-wrapper").html(
        '<div class="wprrt-empty"><div class="wprrt-empty-inner"><div class="wprrt-empty-icon">🗂️</div><h3>No requests yet</h3><p>Create a new request to get started.</p><button class="wprrt-add-tab">+ New Request</button></div></div>'
      );
    }
    saveState();
  }
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  var prism = { exports: {} };
  (function(module) {
    var _self = typeof window !== "undefined" ? window : typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope ? self : {};
    /**
     * Prism: Lightweight, robust, elegant syntax highlighting
     *
     * @license MIT <https://opensource.org/licenses/MIT>
     * @author Lea Verou <https://lea.verou.me>
     * @namespace
     * @public
     */
    var Prism2 = function(_self2) {
      var lang = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i;
      var uniqueId = 0;
      var plainTextGrammar = {};
      var _ = {
        /**
         * By default, Prism will attempt to highlight all code elements (by calling {@link Prism.highlightAll}) on the
         * current page after the page finished loading. This might be a problem if e.g. you wanted to asynchronously load
         * additional languages or plugins yourself.
         *
         * By setting this value to `true`, Prism will not automatically highlight all code elements on the page.
         *
         * You obviously have to change this value before the automatic highlighting started. To do this, you can add an
         * empty Prism object into the global scope before loading the Prism script like this:
         *
         * ```js
         * window.Prism = window.Prism || {};
         * Prism.manual = true;
         * // add a new <script> to load Prism's script
         * ```
         *
         * @default false
         * @type {boolean}
         * @memberof Prism
         * @public
         */
        manual: _self2.Prism && _self2.Prism.manual,
        /**
         * By default, if Prism is in a web worker, it assumes that it is in a worker it created itself, so it uses
         * `addEventListener` to communicate with its parent instance. However, if you're using Prism manually in your
         * own worker, you don't want it to do this.
         *
         * By setting this value to `true`, Prism will not add its own listeners to the worker.
         *
         * You obviously have to change this value before Prism executes. To do this, you can add an
         * empty Prism object into the global scope before loading the Prism script like this:
         *
         * ```js
         * window.Prism = window.Prism || {};
         * Prism.disableWorkerMessageHandler = true;
         * // Load Prism's script
         * ```
         *
         * @default false
         * @type {boolean}
         * @memberof Prism
         * @public
         */
        disableWorkerMessageHandler: _self2.Prism && _self2.Prism.disableWorkerMessageHandler,
        /**
         * A namespace for utility methods.
         *
         * All function in this namespace that are not explicitly marked as _public_ are for __internal use only__ and may
         * change or disappear at any time.
         *
         * @namespace
         * @memberof Prism
         */
        util: {
          encode: function encode(tokens) {
            if (tokens instanceof Token) {
              return new Token(tokens.type, encode(tokens.content), tokens.alias);
            } else if (Array.isArray(tokens)) {
              return tokens.map(encode);
            } else {
              return tokens.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\u00a0/g, " ");
            }
          },
          /**
           * Returns the name of the type of the given value.
           *
           * @param {any} o
           * @returns {string}
           * @example
           * type(null)      === 'Null'
           * type(undefined) === 'Undefined'
           * type(123)       === 'Number'
           * type('foo')     === 'String'
           * type(true)      === 'Boolean'
           * type([1, 2])    === 'Array'
           * type({})        === 'Object'
           * type(String)    === 'Function'
           * type(/abc+/)    === 'RegExp'
           */
          type: function(o) {
            return Object.prototype.toString.call(o).slice(8, -1);
          },
          /**
           * Returns a unique number for the given object. Later calls will still return the same number.
           *
           * @param {Object} obj
           * @returns {number}
           */
          objId: function(obj) {
            if (!obj["__id"]) {
              Object.defineProperty(obj, "__id", { value: ++uniqueId });
            }
            return obj["__id"];
          },
          /**
           * Creates a deep clone of the given object.
           *
           * The main intended use of this function is to clone language definitions.
           *
           * @param {T} o
           * @param {Record<number, any>} [visited]
           * @returns {T}
           * @template T
           */
          clone: function deepClone(o, visited) {
            visited = visited || {};
            var clone;
            var id;
            switch (_.util.type(o)) {
              case "Object":
                id = _.util.objId(o);
                if (visited[id]) {
                  return visited[id];
                }
                clone = /** @type {Record<string, any>} */
                {};
                visited[id] = clone;
                for (var key in o) {
                  if (o.hasOwnProperty(key)) {
                    clone[key] = deepClone(o[key], visited);
                  }
                }
                return (
                  /** @type {any} */
                  clone
                );
              case "Array":
                id = _.util.objId(o);
                if (visited[id]) {
                  return visited[id];
                }
                clone = [];
                visited[id] = clone;
                /** @type {Array} */
                /** @type {any} */
                o.forEach(function(v, i) {
                  clone[i] = deepClone(v, visited);
                });
                return (
                  /** @type {any} */
                  clone
                );
              default:
                return o;
            }
          },
          /**
           * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
           *
           * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
           *
           * @param {Element} element
           * @returns {string}
           */
          getLanguage: function(element) {
            while (element) {
              var m = lang.exec(element.className);
              if (m) {
                return m[1].toLowerCase();
              }
              element = element.parentElement;
            }
            return "none";
          },
          /**
           * Sets the Prism `language-xxxx` class of the given element.
           *
           * @param {Element} element
           * @param {string} language
           * @returns {void}
           */
          setLanguage: function(element, language) {
            element.className = element.className.replace(RegExp(lang, "gi"), "");
            element.classList.add("language-" + language);
          },
          /**
           * Returns the script element that is currently executing.
           *
           * This does __not__ work for line script element.
           *
           * @returns {HTMLScriptElement | null}
           */
          currentScript: function() {
            if (typeof document === "undefined") {
              return null;
            }
            if (document.currentScript && document.currentScript.tagName === "SCRIPT" && 1 < 2) {
              return (
                /** @type {any} */
                document.currentScript
              );
            }
            try {
              throw new Error();
            } catch (err) {
              var src = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(err.stack) || [])[1];
              if (src) {
                var scripts = document.getElementsByTagName("script");
                for (var i in scripts) {
                  if (scripts[i].src == src) {
                    return scripts[i];
                  }
                }
              }
              return null;
            }
          },
          /**
           * Returns whether a given class is active for `element`.
           *
           * The class can be activated if `element` or one of its ancestors has the given class and it can be deactivated
           * if `element` or one of its ancestors has the negated version of the given class. The _negated version_ of the
           * given class is just the given class with a `no-` prefix.
           *
           * Whether the class is active is determined by the closest ancestor of `element` (where `element` itself is
           * closest ancestor) that has the given class or the negated version of it. If neither `element` nor any of its
           * ancestors have the given class or the negated version of it, then the default activation will be returned.
           *
           * In the paradoxical situation where the closest ancestor contains __both__ the given class and the negated
           * version of it, the class is considered active.
           *
           * @param {Element} element
           * @param {string} className
           * @param {boolean} [defaultActivation=false]
           * @returns {boolean}
           */
          isActive: function(element, className, defaultActivation) {
            var no = "no-" + className;
            while (element) {
              var classList = element.classList;
              if (classList.contains(className)) {
                return true;
              }
              if (classList.contains(no)) {
                return false;
              }
              element = element.parentElement;
            }
            return !!defaultActivation;
          }
        },
        /**
         * This namespace contains all currently loaded languages and the some helper functions to create and modify languages.
         *
         * @namespace
         * @memberof Prism
         * @public
         */
        languages: {
          /**
           * The grammar for plain, unformatted text.
           */
          plain: plainTextGrammar,
          plaintext: plainTextGrammar,
          text: plainTextGrammar,
          txt: plainTextGrammar,
          /**
           * Creates a deep copy of the language with the given id and appends the given tokens.
           *
           * If a token in `redef` also appears in the copied language, then the existing token in the copied language
           * will be overwritten at its original position.
           *
           * ## Best practices
           *
           * Since the position of overwriting tokens (token in `redef` that overwrite tokens in the copied language)
           * doesn't matter, they can technically be in any order. However, this can be confusing to others that trying to
           * understand the language definition because, normally, the order of tokens matters in Prism grammars.
           *
           * Therefore, it is encouraged to order overwriting tokens according to the positions of the overwritten tokens.
           * Furthermore, all non-overwriting tokens should be placed after the overwriting ones.
           *
           * @param {string} id The id of the language to extend. This has to be a key in `Prism.languages`.
           * @param {Grammar} redef The new tokens to append.
           * @returns {Grammar} The new language created.
           * @public
           * @example
           * Prism.languages['css-with-colors'] = Prism.languages.extend('css', {
           *     // Prism.languages.css already has a 'comment' token, so this token will overwrite CSS' 'comment' token
           *     // at its original position
           *     'comment': { ... },
           *     // CSS doesn't have a 'color' token, so this token will be appended
           *     'color': /\b(?:red|green|blue)\b/
           * });
           */
          extend: function(id, redef) {
            var lang2 = _.util.clone(_.languages[id]);
            for (var key in redef) {
              lang2[key] = redef[key];
            }
            return lang2;
          },
          /**
           * Inserts tokens _before_ another token in a language definition or any other grammar.
           *
           * ## Usage
           *
           * This helper method makes it easy to modify existing languages. For example, the CSS language definition
           * not only defines CSS highlighting for CSS documents, but also needs to define highlighting for CSS embedded
           * in HTML through `<style>` elements. To do this, it needs to modify `Prism.languages.markup` and add the
           * appropriate tokens. However, `Prism.languages.markup` is a regular JavaScript object literal, so if you do
           * this:
           *
           * ```js
           * Prism.languages.markup.style = {
           *     // token
           * };
           * ```
           *
           * then the `style` token will be added (and processed) at the end. `insertBefore` allows you to insert tokens
           * before existing tokens. For the CSS example above, you would use it like this:
           *
           * ```js
           * Prism.languages.insertBefore('markup', 'cdata', {
           *     'style': {
           *         // token
           *     }
           * });
           * ```
           *
           * ## Special cases
           *
           * If the grammars of `inside` and `insert` have tokens with the same name, the tokens in `inside`'s grammar
           * will be ignored.
           *
           * This behavior can be used to insert tokens after `before`:
           *
           * ```js
           * Prism.languages.insertBefore('markup', 'comment', {
           *     'comment': Prism.languages.markup.comment,
           *     // tokens after 'comment'
           * });
           * ```
           *
           * ## Limitations
           *
           * The main problem `insertBefore` has to solve is iteration order. Since ES2015, the iteration order for object
           * properties is guaranteed to be the insertion order (except for integer keys) but some browsers behave
           * differently when keys are deleted and re-inserted. So `insertBefore` can't be implemented by temporarily
           * deleting properties which is necessary to insert at arbitrary positions.
           *
           * To solve this problem, `insertBefore` doesn't actually insert the given tokens into the target object.
           * Instead, it will create a new object and replace all references to the target object with the new one. This
           * can be done without temporarily deleting properties, so the iteration order is well-defined.
           *
           * However, only references that can be reached from `Prism.languages` or `insert` will be replaced. I.e. if
           * you hold the target object in a variable, then the value of the variable will not change.
           *
           * ```js
           * var oldMarkup = Prism.languages.markup;
           * var newMarkup = Prism.languages.insertBefore('markup', 'comment', { ... });
           *
           * assert(oldMarkup !== Prism.languages.markup);
           * assert(newMarkup === Prism.languages.markup);
           * ```
           *
           * @param {string} inside The property of `root` (e.g. a language id in `Prism.languages`) that contains the
           * object to be modified.
           * @param {string} before The key to insert before.
           * @param {Grammar} insert An object containing the key-value pairs to be inserted.
           * @param {Object<string, any>} [root] The object containing `inside`, i.e. the object that contains the
           * object to be modified.
           *
           * Defaults to `Prism.languages`.
           * @returns {Grammar} The new grammar object.
           * @public
           */
          insertBefore: function(inside, before, insert, root) {
            root = root || /** @type {any} */
            _.languages;
            var grammar = root[inside];
            var ret = {};
            for (var token in grammar) {
              if (grammar.hasOwnProperty(token)) {
                if (token == before) {
                  for (var newToken in insert) {
                    if (insert.hasOwnProperty(newToken)) {
                      ret[newToken] = insert[newToken];
                    }
                  }
                }
                if (!insert.hasOwnProperty(token)) {
                  ret[token] = grammar[token];
                }
              }
            }
            var old = root[inside];
            root[inside] = ret;
            _.languages.DFS(_.languages, function(key, value) {
              if (value === old && key != inside) {
                this[key] = ret;
              }
            });
            return ret;
          },
          // Traverse a language definition with Depth First Search
          DFS: function DFS(o, callback, type, visited) {
            visited = visited || {};
            var objId = _.util.objId;
            for (var i in o) {
              if (o.hasOwnProperty(i)) {
                callback.call(o, i, o[i], type || i);
                var property = o[i];
                var propertyType = _.util.type(property);
                if (propertyType === "Object" && !visited[objId(property)]) {
                  visited[objId(property)] = true;
                  DFS(property, callback, null, visited);
                } else if (propertyType === "Array" && !visited[objId(property)]) {
                  visited[objId(property)] = true;
                  DFS(property, callback, i, visited);
                }
              }
            }
          }
        },
        plugins: {},
        /**
         * This is the most high-level function in Prism’s API.
         * It fetches all the elements that have a `.language-xxxx` class and then calls {@link Prism.highlightElement} on
         * each one of them.
         *
         * This is equivalent to `Prism.highlightAllUnder(document, async, callback)`.
         *
         * @param {boolean} [async=false] Same as in {@link Prism.highlightAllUnder}.
         * @param {HighlightCallback} [callback] Same as in {@link Prism.highlightAllUnder}.
         * @memberof Prism
         * @public
         */
        highlightAll: function(async, callback) {
          _.highlightAllUnder(document, async, callback);
        },
        /**
         * Fetches all the descendants of `container` that have a `.language-xxxx` class and then calls
         * {@link Prism.highlightElement} on each one of them.
         *
         * The following hooks will be run:
         * 1. `before-highlightall`
         * 2. `before-all-elements-highlight`
         * 3. All hooks of {@link Prism.highlightElement} for each element.
         *
         * @param {ParentNode} container The root element, whose descendants that have a `.language-xxxx` class will be highlighted.
         * @param {boolean} [async=false] Whether each element is to be highlighted asynchronously using Web Workers.
         * @param {HighlightCallback} [callback] An optional callback to be invoked on each element after its highlighting is done.
         * @memberof Prism
         * @public
         */
        highlightAllUnder: function(container, async, callback) {
          var env = {
            callback,
            container,
            selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
          };
          _.hooks.run("before-highlightall", env);
          env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));
          _.hooks.run("before-all-elements-highlight", env);
          for (var i = 0, element; element = env.elements[i++]; ) {
            _.highlightElement(element, async === true, env.callback);
          }
        },
        /**
         * Highlights the code inside a single element.
         *
         * The following hooks will be run:
         * 1. `before-sanity-check`
         * 2. `before-highlight`
         * 3. All hooks of {@link Prism.highlight}. These hooks will be run by an asynchronous worker if `async` is `true`.
         * 4. `before-insert`
         * 5. `after-highlight`
         * 6. `complete`
         *
         * Some the above hooks will be skipped if the element doesn't contain any text or there is no grammar loaded for
         * the element's language.
         *
         * @param {Element} element The element containing the code.
         * It must have a class of `language-xxxx` to be processed, where `xxxx` is a valid language identifier.
         * @param {boolean} [async=false] Whether the element is to be highlighted asynchronously using Web Workers
         * to improve performance and avoid blocking the UI when highlighting very large chunks of code. This option is
         * [disabled by default](https://prismjs.com/faq.html#why-is-asynchronous-highlighting-disabled-by-default).
         *
         * Note: All language definitions required to highlight the code must be included in the main `prism.js` file for
         * asynchronous highlighting to work. You can build your own bundle on the
         * [Download page](https://prismjs.com/download.html).
         * @param {HighlightCallback} [callback] An optional callback to be invoked after the highlighting is done.
         * Mostly useful when `async` is `true`, since in that case, the highlighting is done asynchronously.
         * @memberof Prism
         * @public
         */
        highlightElement: function(element, async, callback) {
          var language = _.util.getLanguage(element);
          var grammar = _.languages[language];
          _.util.setLanguage(element, language);
          var parent = element.parentElement;
          if (parent && parent.nodeName.toLowerCase() === "pre") {
            _.util.setLanguage(parent, language);
          }
          var code = element.textContent;
          var env = {
            element,
            language,
            grammar,
            code
          };
          function insertHighlightedCode(highlightedCode) {
            env.highlightedCode = highlightedCode;
            _.hooks.run("before-insert", env);
            env.element.innerHTML = env.highlightedCode;
            _.hooks.run("after-highlight", env);
            _.hooks.run("complete", env);
            callback && callback.call(env.element);
          }
          _.hooks.run("before-sanity-check", env);
          parent = env.element.parentElement;
          if (parent && parent.nodeName.toLowerCase() === "pre" && !parent.hasAttribute("tabindex")) {
            parent.setAttribute("tabindex", "0");
          }
          if (!env.code) {
            _.hooks.run("complete", env);
            callback && callback.call(env.element);
            return;
          }
          _.hooks.run("before-highlight", env);
          if (!env.grammar) {
            insertHighlightedCode(_.util.encode(env.code));
            return;
          }
          if (async && _self2.Worker) {
            var worker = new Worker(_.filename);
            worker.onmessage = function(evt) {
              insertHighlightedCode(evt.data);
            };
            worker.postMessage(JSON.stringify({
              language: env.language,
              code: env.code,
              immediateClose: true
            }));
          } else {
            insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
          }
        },
        /**
         * Low-level function, only use if you know what you’re doing. It accepts a string of text as input
         * and the language definitions to use, and returns a string with the HTML produced.
         *
         * The following hooks will be run:
         * 1. `before-tokenize`
         * 2. `after-tokenize`
         * 3. `wrap`: On each {@link Token}.
         *
         * @param {string} text A string with the code to be highlighted.
         * @param {Grammar} grammar An object containing the tokens to use.
         *
         * Usually a language definition like `Prism.languages.markup`.
         * @param {string} language The name of the language definition passed to `grammar`.
         * @returns {string} The highlighted HTML.
         * @memberof Prism
         * @public
         * @example
         * Prism.highlight('var foo = true;', Prism.languages.javascript, 'javascript');
         */
        highlight: function(text, grammar, language) {
          var env = {
            code: text,
            grammar,
            language
          };
          _.hooks.run("before-tokenize", env);
          if (!env.grammar) {
            throw new Error('The language "' + env.language + '" has no grammar.');
          }
          env.tokens = _.tokenize(env.code, env.grammar);
          _.hooks.run("after-tokenize", env);
          return Token.stringify(_.util.encode(env.tokens), env.language);
        },
        /**
         * This is the heart of Prism, and the most low-level function you can use. It accepts a string of text as input
         * and the language definitions to use, and returns an array with the tokenized code.
         *
         * When the language definition includes nested tokens, the function is called recursively on each of these tokens.
         *
         * This method could be useful in other contexts as well, as a very crude parser.
         *
         * @param {string} text A string with the code to be highlighted.
         * @param {Grammar} grammar An object containing the tokens to use.
         *
         * Usually a language definition like `Prism.languages.markup`.
         * @returns {TokenStream} An array of strings and tokens, a token stream.
         * @memberof Prism
         * @public
         * @example
         * let code = `var foo = 0;`;
         * let tokens = Prism.tokenize(code, Prism.languages.javascript);
         * tokens.forEach(token => {
         *     if (token instanceof Prism.Token && token.type === 'number') {
         *         console.log(`Found numeric literal: ${token.content}`);
         *     }
         * });
         */
        tokenize: function(text, grammar) {
          var rest = grammar.rest;
          if (rest) {
            for (var token in rest) {
              grammar[token] = rest[token];
            }
            delete grammar.rest;
          }
          var tokenList = new LinkedList();
          addAfter(tokenList, tokenList.head, text);
          matchGrammar(text, tokenList, grammar, tokenList.head, 0);
          return toArray(tokenList);
        },
        /**
         * @namespace
         * @memberof Prism
         * @public
         */
        hooks: {
          all: {},
          /**
           * Adds the given callback to the list of callbacks for the given hook.
           *
           * The callback will be invoked when the hook it is registered for is run.
           * Hooks are usually directly run by a highlight function but you can also run hooks yourself.
           *
           * One callback function can be registered to multiple hooks and the same hook multiple times.
           *
           * @param {string} name The name of the hook.
           * @param {HookCallback} callback The callback function which is given environment variables.
           * @public
           */
          add: function(name, callback) {
            var hooks = _.hooks.all;
            hooks[name] = hooks[name] || [];
            hooks[name].push(callback);
          },
          /**
           * Runs a hook invoking all registered callbacks with the given environment variables.
           *
           * Callbacks will be invoked synchronously and in the order in which they were registered.
           *
           * @param {string} name The name of the hook.
           * @param {Object<string, any>} env The environment variables of the hook passed to all callbacks registered.
           * @public
           */
          run: function(name, env) {
            var callbacks = _.hooks.all[name];
            if (!callbacks || !callbacks.length) {
              return;
            }
            for (var i = 0, callback; callback = callbacks[i++]; ) {
              callback(env);
            }
          }
        },
        Token
      };
      _self2.Prism = _;
      function Token(type, content, alias, matchedStr) {
        this.type = type;
        this.content = content;
        this.alias = alias;
        this.length = (matchedStr || "").length | 0;
      }
      Token.stringify = function stringify(o, language) {
        if (typeof o == "string") {
          return o;
        }
        if (Array.isArray(o)) {
          var s = "";
          o.forEach(function(e) {
            s += stringify(e, language);
          });
          return s;
        }
        var env = {
          type: o.type,
          content: stringify(o.content, language),
          tag: "span",
          classes: ["token", o.type],
          attributes: {},
          language
        };
        var aliases = o.alias;
        if (aliases) {
          if (Array.isArray(aliases)) {
            Array.prototype.push.apply(env.classes, aliases);
          } else {
            env.classes.push(aliases);
          }
        }
        _.hooks.run("wrap", env);
        var attributes = "";
        for (var name in env.attributes) {
          attributes += " " + name + '="' + (env.attributes[name] || "").replace(/"/g, "&quot;") + '"';
        }
        return "<" + env.tag + ' class="' + env.classes.join(" ") + '"' + attributes + ">" + env.content + "</" + env.tag + ">";
      };
      function matchPattern(pattern, pos, text, lookbehind) {
        pattern.lastIndex = pos;
        var match = pattern.exec(text);
        if (match && lookbehind && match[1]) {
          var lookbehindLength = match[1].length;
          match.index += lookbehindLength;
          match[0] = match[0].slice(lookbehindLength);
        }
        return match;
      }
      function matchGrammar(text, tokenList, grammar, startNode, startPos, rematch) {
        for (var token in grammar) {
          if (!grammar.hasOwnProperty(token) || !grammar[token]) {
            continue;
          }
          var patterns = grammar[token];
          patterns = Array.isArray(patterns) ? patterns : [patterns];
          for (var j = 0; j < patterns.length; ++j) {
            if (rematch && rematch.cause == token + "," + j) {
              return;
            }
            var patternObj = patterns[j];
            var inside = patternObj.inside;
            var lookbehind = !!patternObj.lookbehind;
            var greedy = !!patternObj.greedy;
            var alias = patternObj.alias;
            if (greedy && !patternObj.pattern.global) {
              var flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
              patternObj.pattern = RegExp(patternObj.pattern.source, flags + "g");
            }
            var pattern = patternObj.pattern || patternObj;
            for (var currentNode = startNode.next, pos = startPos; currentNode !== tokenList.tail; pos += currentNode.value.length, currentNode = currentNode.next) {
              if (rematch && pos >= rematch.reach) {
                break;
              }
              var str = currentNode.value;
              if (tokenList.length > text.length) {
                return;
              }
              if (str instanceof Token) {
                continue;
              }
              var removeCount = 1;
              var match;
              if (greedy) {
                match = matchPattern(pattern, pos, text, lookbehind);
                if (!match || match.index >= text.length) {
                  break;
                }
                var from = match.index;
                var to = match.index + match[0].length;
                var p = pos;
                p += currentNode.value.length;
                while (from >= p) {
                  currentNode = currentNode.next;
                  p += currentNode.value.length;
                }
                p -= currentNode.value.length;
                pos = p;
                if (currentNode.value instanceof Token) {
                  continue;
                }
                for (var k = currentNode; k !== tokenList.tail && (p < to || typeof k.value === "string"); k = k.next) {
                  removeCount++;
                  p += k.value.length;
                }
                removeCount--;
                str = text.slice(pos, p);
                match.index -= pos;
              } else {
                match = matchPattern(pattern, 0, str, lookbehind);
                if (!match) {
                  continue;
                }
              }
              var from = match.index;
              var matchStr = match[0];
              var before = str.slice(0, from);
              var after = str.slice(from + matchStr.length);
              var reach = pos + str.length;
              if (rematch && reach > rematch.reach) {
                rematch.reach = reach;
              }
              var removeFrom = currentNode.prev;
              if (before) {
                removeFrom = addAfter(tokenList, removeFrom, before);
                pos += before.length;
              }
              removeRange(tokenList, removeFrom, removeCount);
              var wrapped = new Token(token, inside ? _.tokenize(matchStr, inside) : matchStr, alias, matchStr);
              currentNode = addAfter(tokenList, removeFrom, wrapped);
              if (after) {
                addAfter(tokenList, currentNode, after);
              }
              if (removeCount > 1) {
                var nestedRematch = {
                  cause: token + "," + j,
                  reach
                };
                matchGrammar(text, tokenList, grammar, currentNode.prev, pos, nestedRematch);
                if (rematch && nestedRematch.reach > rematch.reach) {
                  rematch.reach = nestedRematch.reach;
                }
              }
            }
          }
        }
      }
      function LinkedList() {
        var head = { value: null, prev: null, next: null };
        var tail = { value: null, prev: head, next: null };
        head.next = tail;
        this.head = head;
        this.tail = tail;
        this.length = 0;
      }
      function addAfter(list, node, value) {
        var next = node.next;
        var newNode = { value, prev: node, next };
        node.next = newNode;
        next.prev = newNode;
        list.length++;
        return newNode;
      }
      function removeRange(list, node, count) {
        var next = node.next;
        for (var i = 0; i < count && next !== list.tail; i++) {
          next = next.next;
        }
        node.next = next;
        next.prev = node;
        list.length -= i;
      }
      function toArray(list) {
        var array = [];
        var node = list.head.next;
        while (node !== list.tail) {
          array.push(node.value);
          node = node.next;
        }
        return array;
      }
      if (!_self2.document) {
        if (!_self2.addEventListener) {
          return _;
        }
        if (!_.disableWorkerMessageHandler) {
          _self2.addEventListener("message", function(evt) {
            var message = JSON.parse(evt.data);
            var lang2 = message.language;
            var code = message.code;
            var immediateClose = message.immediateClose;
            _self2.postMessage(_.highlight(code, _.languages[lang2], lang2));
            if (immediateClose) {
              _self2.close();
            }
          }, false);
        }
        return _;
      }
      var script = _.util.currentScript();
      if (script) {
        _.filename = script.src;
        if (script.hasAttribute("data-manual")) {
          _.manual = true;
        }
      }
      function highlightAutomaticallyCallback() {
        if (!_.manual) {
          _.highlightAll();
        }
      }
      if (!_.manual) {
        var readyState = document.readyState;
        if (readyState === "loading" || readyState === "interactive" && script && script.defer) {
          document.addEventListener("DOMContentLoaded", highlightAutomaticallyCallback);
        } else {
          if (window.requestAnimationFrame) {
            window.requestAnimationFrame(highlightAutomaticallyCallback);
          } else {
            window.setTimeout(highlightAutomaticallyCallback, 16);
          }
        }
      }
      return _;
    }(_self);
    if (module.exports) {
      module.exports = Prism2;
    }
    if (typeof commonjsGlobal !== "undefined") {
      commonjsGlobal.Prism = Prism2;
    }
    Prism2.languages.markup = {
      "comment": {
        pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
        greedy: true
      },
      "prolog": {
        pattern: /<\?[\s\S]+?\?>/,
        greedy: true
      },
      "doctype": {
        // https://www.w3.org/TR/xml/#NT-doctypedecl
        pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
        greedy: true,
        inside: {
          "internal-subset": {
            pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
            lookbehind: true,
            greedy: true,
            inside: null
            // see below
          },
          "string": {
            pattern: /"[^"]*"|'[^']*'/,
            greedy: true
          },
          "punctuation": /^<!|>$|[[\]]/,
          "doctype-tag": /^DOCTYPE/i,
          "name": /[^\s<>'"]+/
        }
      },
      "cdata": {
        pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
        greedy: true
      },
      "tag": {
        pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
        greedy: true,
        inside: {
          "tag": {
            pattern: /^<\/?[^\s>\/]+/,
            inside: {
              "punctuation": /^<\/?/,
              "namespace": /^[^\s>\/:]+:/
            }
          },
          "special-attr": [],
          "attr-value": {
            pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
            inside: {
              "punctuation": [
                {
                  pattern: /^=/,
                  alias: "attr-equals"
                },
                {
                  pattern: /^(\s*)["']|["']$/,
                  lookbehind: true
                }
              ]
            }
          },
          "punctuation": /\/?>/,
          "attr-name": {
            pattern: /[^\s>\/]+/,
            inside: {
              "namespace": /^[^\s>\/:]+:/
            }
          }
        }
      },
      "entity": [
        {
          pattern: /&[\da-z]{1,8};/i,
          alias: "named-entity"
        },
        /&#x?[\da-f]{1,8};/i
      ]
    };
    Prism2.languages.markup["tag"].inside["attr-value"].inside["entity"] = Prism2.languages.markup["entity"];
    Prism2.languages.markup["doctype"].inside["internal-subset"].inside = Prism2.languages.markup;
    Prism2.hooks.add("wrap", function(env) {
      if (env.type === "entity") {
        env.attributes["title"] = env.content.replace(/&amp;/, "&");
      }
    });
    Object.defineProperty(Prism2.languages.markup.tag, "addInlined", {
      /**
       * Adds an inlined language to markup.
       *
       * An example of an inlined language is CSS with `<style>` tags.
       *
       * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
       * case insensitive.
       * @param {string} lang The language key.
       * @example
       * addInlined('style', 'css');
       */
      value: function addInlined(tagName, lang) {
        var includedCdataInside = {};
        includedCdataInside["language-" + lang] = {
          pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
          lookbehind: true,
          inside: Prism2.languages[lang]
        };
        includedCdataInside["cdata"] = /^<!\[CDATA\[|\]\]>$/i;
        var inside = {
          "included-cdata": {
            pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
            inside: includedCdataInside
          }
        };
        inside["language-" + lang] = {
          pattern: /[\s\S]+/,
          inside: Prism2.languages[lang]
        };
        var def = {};
        def[tagName] = {
          pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function() {
            return tagName;
          }), "i"),
          lookbehind: true,
          greedy: true,
          inside
        };
        Prism2.languages.insertBefore("markup", "cdata", def);
      }
    });
    Object.defineProperty(Prism2.languages.markup.tag, "addAttribute", {
      /**
       * Adds an pattern to highlight languages embedded in HTML attributes.
       *
       * An example of an inlined language is CSS with `style` attributes.
       *
       * @param {string} attrName The name of the tag that contains the inlined language. This name will be treated as
       * case insensitive.
       * @param {string} lang The language key.
       * @example
       * addAttribute('style', 'css');
       */
      value: function(attrName, lang) {
        Prism2.languages.markup.tag.inside["special-attr"].push({
          pattern: RegExp(
            /(^|["'\s])/.source + "(?:" + attrName + ")" + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
            "i"
          ),
          lookbehind: true,
          inside: {
            "attr-name": /^[^\s=]+/,
            "attr-value": {
              pattern: /=[\s\S]+/,
              inside: {
                "value": {
                  pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
                  lookbehind: true,
                  alias: [lang, "language-" + lang],
                  inside: Prism2.languages[lang]
                },
                "punctuation": [
                  {
                    pattern: /^=/,
                    alias: "attr-equals"
                  },
                  /"|'/
                ]
              }
            }
          }
        });
      }
    });
    Prism2.languages.html = Prism2.languages.markup;
    Prism2.languages.mathml = Prism2.languages.markup;
    Prism2.languages.svg = Prism2.languages.markup;
    Prism2.languages.xml = Prism2.languages.extend("markup", {});
    Prism2.languages.ssml = Prism2.languages.xml;
    Prism2.languages.atom = Prism2.languages.xml;
    Prism2.languages.rss = Prism2.languages.xml;
    (function(Prism3) {
      var string = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;
      Prism3.languages.css = {
        "comment": /\/\*[\s\S]*?\*\//,
        "atrule": {
          pattern: RegExp("@[\\w-](?:" + /[^;{\s"']|\s+(?!\s)/.source + "|" + string.source + ")*?" + /(?:;|(?=\s*\{))/.source),
          inside: {
            "rule": /^@[\w-]+/,
            "selector-function-argument": {
              pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
              lookbehind: true,
              alias: "selector"
            },
            "keyword": {
              pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
              lookbehind: true
            }
            // See rest below
          }
        },
        "url": {
          // https://drafts.csswg.org/css-values-3/#urls
          pattern: RegExp("\\burl\\((?:" + string.source + "|" + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ")\\)", "i"),
          greedy: true,
          inside: {
            "function": /^url/i,
            "punctuation": /^\(|\)$/,
            "string": {
              pattern: RegExp("^" + string.source + "$"),
              alias: "url"
            }
          }
        },
        "selector": {
          pattern: RegExp(`(^|[{}\\s])[^{}\\s](?:[^{};"'\\s]|\\s+(?![\\s{])|` + string.source + ")*(?=\\s*\\{)"),
          lookbehind: true
        },
        "string": {
          pattern: string,
          greedy: true
        },
        "property": {
          pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
          lookbehind: true
        },
        "important": /!important\b/i,
        "function": {
          pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
          lookbehind: true
        },
        "punctuation": /[(){};:,]/
      };
      Prism3.languages.css["atrule"].inside.rest = Prism3.languages.css;
      var markup = Prism3.languages.markup;
      if (markup) {
        markup.tag.addInlined("style", "css");
        markup.tag.addAttribute("style", "css");
      }
    })(Prism2);
    Prism2.languages.clike = {
      "comment": [
        {
          pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
          lookbehind: true,
          greedy: true
        },
        {
          pattern: /(^|[^\\:])\/\/.*/,
          lookbehind: true,
          greedy: true
        }
      ],
      "string": {
        pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
        greedy: true
      },
      "class-name": {
        pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
        lookbehind: true,
        inside: {
          "punctuation": /[.\\]/
        }
      },
      "keyword": /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
      "boolean": /\b(?:false|true)\b/,
      "function": /\b\w+(?=\()/,
      "number": /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
      "operator": /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
      "punctuation": /[{}[\];(),.:]/
    };
    Prism2.languages.javascript = Prism2.languages.extend("clike", {
      "class-name": [
        Prism2.languages.clike["class-name"],
        {
          pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
          lookbehind: true
        }
      ],
      "keyword": [
        {
          pattern: /((?:^|\})\s*)catch\b/,
          lookbehind: true
        },
        {
          pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
          lookbehind: true
        }
      ],
      // Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
      "function": /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
      "number": {
        pattern: RegExp(
          /(^|[^\w$])/.source + "(?:" + // constant
          (/NaN|Infinity/.source + "|" + // binary integer
          /0[bB][01]+(?:_[01]+)*n?/.source + "|" + // octal integer
          /0[oO][0-7]+(?:_[0-7]+)*n?/.source + "|" + // hexadecimal integer
          /0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source + "|" + // decimal bigint
          /\d+(?:_\d+)*n/.source + "|" + // decimal number (integer or float) but no bigint
          /(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source) + ")" + /(?![\w$])/.source
        ),
        lookbehind: true
      },
      "operator": /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
    });
    Prism2.languages.javascript["class-name"][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/;
    Prism2.languages.insertBefore("javascript", "keyword", {
      "regex": {
        pattern: RegExp(
          // lookbehind
          // eslint-disable-next-line regexp/no-dupe-characters-character-class
          /((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source + // Regex pattern:
          // There are 2 regex patterns here. The RegExp set notation proposal added support for nested character
          // classes if the `v` flag is present. Unfortunately, nested CCs are both context-free and incompatible
          // with the only syntax, so we have to define 2 different regex patterns.
          /\//.source + "(?:" + /(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source + "|" + // `v` flag syntax. This supports 3 levels of nested character classes.
          /(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source + ")" + // lookahead
          /(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source
        ),
        lookbehind: true,
        greedy: true,
        inside: {
          "regex-source": {
            pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
            lookbehind: true,
            alias: "language-regex",
            inside: Prism2.languages.regex
          },
          "regex-delimiter": /^\/|\/$/,
          "regex-flags": /^[a-z]+$/
        }
      },
      // This must be declared before keyword because we use "function" inside the look-forward
      "function-variable": {
        pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
        alias: "function"
      },
      "parameter": [
        {
          pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
          lookbehind: true,
          inside: Prism2.languages.javascript
        },
        {
          pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
          lookbehind: true,
          inside: Prism2.languages.javascript
        },
        {
          pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
          lookbehind: true,
          inside: Prism2.languages.javascript
        },
        {
          pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
          lookbehind: true,
          inside: Prism2.languages.javascript
        }
      ],
      "constant": /\b[A-Z](?:[A-Z_]|\dx?)*\b/
    });
    Prism2.languages.insertBefore("javascript", "string", {
      "hashbang": {
        pattern: /^#!.*/,
        greedy: true,
        alias: "comment"
      },
      "template-string": {
        pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
        greedy: true,
        inside: {
          "template-punctuation": {
            pattern: /^`|`$/,
            alias: "string"
          },
          "interpolation": {
            pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
            lookbehind: true,
            inside: {
              "interpolation-punctuation": {
                pattern: /^\$\{|\}$/,
                alias: "punctuation"
              },
              rest: Prism2.languages.javascript
            }
          },
          "string": /[\s\S]+/
        }
      },
      "string-property": {
        pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
        lookbehind: true,
        greedy: true,
        alias: "property"
      }
    });
    Prism2.languages.insertBefore("javascript", "operator", {
      "literal-property": {
        pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
        lookbehind: true,
        alias: "property"
      }
    });
    if (Prism2.languages.markup) {
      Prism2.languages.markup.tag.addInlined("script", "javascript");
      Prism2.languages.markup.tag.addAttribute(
        /on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,
        "javascript"
      );
    }
    Prism2.languages.js = Prism2.languages.javascript;
    (function() {
      if (typeof Prism2 === "undefined" || typeof document === "undefined") {
        return;
      }
      if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
      }
      var LOADING_MESSAGE = "Loading…";
      var FAILURE_MESSAGE = function(status, message) {
        return "✖ Error " + status + " while fetching file: " + message;
      };
      var FAILURE_EMPTY_MESSAGE = "✖ Error: File does not exist or is empty";
      var EXTENSIONS = {
        "js": "javascript",
        "py": "python",
        "rb": "ruby",
        "ps1": "powershell",
        "psm1": "powershell",
        "sh": "bash",
        "bat": "batch",
        "h": "c",
        "tex": "latex"
      };
      var STATUS_ATTR = "data-src-status";
      var STATUS_LOADING = "loading";
      var STATUS_LOADED = "loaded";
      var STATUS_FAILED = "failed";
      var SELECTOR = "pre[data-src]:not([" + STATUS_ATTR + '="' + STATUS_LOADED + '"]):not([' + STATUS_ATTR + '="' + STATUS_LOADING + '"])';
      function loadFile(src, success, error) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", src, true);
        xhr.onreadystatechange = function() {
          if (xhr.readyState == 4) {
            if (xhr.status < 400 && xhr.responseText) {
              success(xhr.responseText);
            } else {
              if (xhr.status >= 400) {
                error(FAILURE_MESSAGE(xhr.status, xhr.statusText));
              } else {
                error(FAILURE_EMPTY_MESSAGE);
              }
            }
          }
        };
        xhr.send(null);
      }
      function parseRange(range) {
        var m = /^\s*(\d+)\s*(?:(,)\s*(?:(\d+)\s*)?)?$/.exec(range || "");
        if (m) {
          var start = Number(m[1]);
          var comma = m[2];
          var end = m[3];
          if (!comma) {
            return [start, start];
          }
          if (!end) {
            return [start, void 0];
          }
          return [start, Number(end)];
        }
        return void 0;
      }
      Prism2.hooks.add("before-highlightall", function(env) {
        env.selector += ", " + SELECTOR;
      });
      Prism2.hooks.add("before-sanity-check", function(env) {
        var pre = (
          /** @type {HTMLPreElement} */
          env.element
        );
        if (pre.matches(SELECTOR)) {
          env.code = "";
          pre.setAttribute(STATUS_ATTR, STATUS_LOADING);
          var code = pre.appendChild(document.createElement("CODE"));
          code.textContent = LOADING_MESSAGE;
          var src = pre.getAttribute("data-src");
          var language = env.language;
          if (language === "none") {
            var extension = (/\.(\w+)$/.exec(src) || [, "none"])[1];
            language = EXTENSIONS[extension] || extension;
          }
          Prism2.util.setLanguage(code, language);
          Prism2.util.setLanguage(pre, language);
          var autoloader = Prism2.plugins.autoloader;
          if (autoloader) {
            autoloader.loadLanguages(language);
          }
          loadFile(
            src,
            function(text) {
              pre.setAttribute(STATUS_ATTR, STATUS_LOADED);
              var range = parseRange(pre.getAttribute("data-range"));
              if (range) {
                var lines = text.split(/\r\n?|\n/g);
                var start = range[0];
                var end = range[1] == null ? lines.length : range[1];
                if (start < 0) {
                  start += lines.length;
                }
                start = Math.max(0, Math.min(start - 1, lines.length));
                if (end < 0) {
                  end += lines.length;
                }
                end = Math.max(0, Math.min(end, lines.length));
                text = lines.slice(start, end).join("\n");
                if (!pre.hasAttribute("data-start")) {
                  pre.setAttribute("data-start", String(start + 1));
                }
              }
              code.textContent = text;
              Prism2.highlightElement(code);
            },
            function(error) {
              pre.setAttribute(STATUS_ATTR, STATUS_FAILED);
              code.textContent = error;
            }
          );
        }
      });
      Prism2.plugins.fileHighlight = {
        /**
         * Executes the File Highlight plugin for all matching `pre` elements under the given container.
         *
         * Note: Elements which are already loaded or currently loading will not be touched by this method.
         *
         * @param {ParentNode} [container=document]
         */
        highlight: function highlight(container) {
          var elements = (container || document).querySelectorAll(SELECTOR);
          for (var i = 0, element; element = elements[i++]; ) {
            Prism2.highlightElement(element);
          }
        }
      };
      var logged = false;
      Prism2.fileHighlight = function() {
        if (!logged) {
          console.warn("Prism.fileHighlight is deprecated. Use `Prism.plugins.fileHighlight.highlight` instead.");
          logged = true;
        }
        Prism2.plugins.fileHighlight.highlight.apply(this, arguments);
      };
    })();
  })(prism);
  var prismExports = prism.exports;
  const Prism$1 = /* @__PURE__ */ getDefaultExportFromCjs(prismExports);
  Prism.languages.json = {
    "property": {
      pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,
      lookbehind: true,
      greedy: true
    },
    "string": {
      pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,
      lookbehind: true,
      greedy: true
    },
    "comment": {
      pattern: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
      greedy: true
    },
    "number": /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
    "punctuation": /[{}[\],]/,
    "operator": /:/,
    "boolean": /\b(?:false|true)\b/,
    "null": {
      pattern: /\bnull\b/,
      alias: "keyword"
    }
  };
  Prism.languages.webmanifest = Prism.languages.json;
  const STATUS_LABELS = {
    200: "OK",
    201: "Created",
    204: "No Content",
    301: "Moved Permanently",
    302: "Found",
    304: "Not Modified",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
    503: "Service Unavailable"
  };
  function statusClass(code) {
    if (code >= 200 && code < 300) return "wprrt-status-2xx";
    if (code >= 300 && code < 400) return "wprrt-status-3xx";
    if (code >= 400 && code < 500) return "wprrt-status-4xx";
    return "wprrt-status-5xx";
  }
  function highlightResponse(el) {
    el.classList.add("language-json");
    Prism$1.highlightElement(el);
  }
  function renderResponse(tabContent, res, elapsed) {
    const metaEl = tabContent.find(".wprrt-response-meta");
    const badgeEl = tabContent.find(".wprrt-status-badge");
    const timeEl = tabContent.find(".wprrt-response-time");
    const headersEl = tabContent.find(".wprrt-response-headers");
    const headersPre = tabContent.find(".wprrt-headers-body");
    const responseEl = tabContent.find(".wprrt-response");
    if (res.success) {
      const status = res.data.status;
      const label = STATUS_LABELS[status] || "";
      const cls = statusClass(status);
      badgeEl.attr("class", "wprrt-status-badge " + cls).text(label ? `${status} ${label}` : status);
      timeEl.text(`${elapsed}ms`);
      metaEl.show().css("display", "flex");
      const hdrs = res.data.headers || {};
      const hdrKeys = Object.keys(hdrs);
      if (hdrKeys.length) {
        const hdrText = hdrKeys.map((k) => {
          const val = Array.isArray(hdrs[k]) ? hdrs[k].join(", ") : hdrs[k];
          return `${k}: ${val}`;
        }).join("\n");
        headersPre.text(hdrText);
        headersEl.find(".wprrt-header-count").text(hdrKeys.length);
        headersEl.show();
      } else {
        headersEl.hide();
      }
      const body = res.data.data;
      const json = body !== void 0 ? JSON.stringify(body, null, 2) : "(empty)";
      responseEl.removeClass("language-json").text(json);
      if (body !== void 0) highlightResponse(responseEl[0]);
    } else {
      badgeEl.attr("class", "wprrt-status-badge wprrt-status-error").text("Error");
      timeEl.text(`${elapsed}ms`);
      metaEl.show().css("display", "flex");
      headersEl.hide();
      responseEl.removeClass("language-json").text(res.data || "An error occurred.");
    }
  }
  function renderRequestError(tabContent, elapsed) {
    tabContent.find(".wprrt-status-badge").attr("class", "wprrt-status-badge wprrt-status-error").text("Request Failed");
    tabContent.find(".wprrt-response-time").text(elapsed ? `${elapsed}ms` : "");
    tabContent.find(".wprrt-response-meta").show().css("display", "flex");
    tabContent.find(".wprrt-response-headers").hide();
    tabContent.find(".wprrt-response").removeClass("language-json").text("Could not connect to the server. Please try again.");
  }
  const $$2 = window.jQuery;
  function sendRequest(tabContent) {
    const route = resolveRoute(tabContent);
    const method = tabContent.find(".wprrt-method").val();
    const headers = tabContent.find(".wprrt-headers").val();
    const body = tabContent.find(".wprrt-body").val();
    const role = tabContent.find(".wprrt-role-selector").val();
    const responseEl = tabContent.find(".wprrt-response");
    const testButton = tabContent.find(".wprrt-test");
    tabContent.find(".wprrt-response-meta").hide();
    tabContent.find(".wprrt-response-headers").hide();
    responseEl.removeClass("language-json").html(
      '<div class="wprrt-loading"><div class="wprrt-loading-spinner"></div><p>Sending request...</p></div>'
    );
    testButton.prop("disabled", true);
    const startTime = performance.now();
    $$2.post(window.wprrt_vars.ajax_url, {
      action: "wprrt_test_route",
      nonce: window.wprrt_vars.nonce,
      route,
      method,
      headers,
      body,
      role
    }, (res) => {
      const elapsed = (performance.now() - startTime).toFixed(2);
      testButton.prop("disabled", false);
      renderResponse(tabContent, res, elapsed);
      saveState();
    }).fail(() => {
      const elapsed = (performance.now() - startTime).toFixed(2);
      testButton.prop("disabled", false);
      renderRequestError(tabContent, elapsed);
    });
  }
  const $$1 = window.jQuery;
  function initSidebar() {
    loadSaved();
    bindEvents();
  }
  function loadSaved() {
    $$1.post(window.wprrt_vars.ajax_url, {
      action: "wprrt_get_saved_requests",
      nonce: window.wprrt_vars.nonce
    }, (res) => {
      renderSavedList(res.success ? res.data : []);
    }).fail(() => {
      renderSavedList([]);
    });
  }
  function saveCurrentTab(tabContent, name) {
    const route = tabContent.find(".wprrt-route").val();
    const method = tabContent.find(".wprrt-method").val();
    const headers = tabContent.find(".wprrt-headers").val();
    const body = tabContent.find(".wprrt-body").val();
    $$1.post(window.wprrt_vars.ajax_url, {
      action: "wprrt_save_request",
      nonce: window.wprrt_vars.nonce,
      name,
      route,
      method,
      headers,
      body
    }, (res) => {
      if (res.success) loadSaved();
    });
  }
  const METHOD_COLOURS = {
    GET: "#1a7f37",
    POST: "#0550ae",
    PUT: "#7a4400",
    PATCH: "#6e40c9",
    DELETE: "#cf222e",
    OPTIONS: "#666",
    HEAD: "#666"
  };
  function renderSavedList(items) {
    const list = $$1("#wprrt-saved-list");
    list.empty();
    if (!items.length) {
      list.html(
        '<div class="wprrt-saved-empty"><p>No saved requests yet.</p><p><small>Fill in a request and click <strong>Save</strong>.</small></p></div>'
      );
      return;
    }
    items.forEach((item) => {
      const colour = METHOD_COLOURS[item.method] || "#666";
      const el = $$1('<div class="wprrt-saved-item" tabindex="0"></div>');
      el.attr("data-id", item.id);
      const badge = $$1('<span class="wprrt-saved-method"></span>');
      badge.text(item.method);
      badge.css("color", colour);
      const nameEl = $$1('<span class="wprrt-saved-name"></span>').text(item.name);
      const routeEl = $$1('<span class="wprrt-saved-route"></span>').text(item.route);
      const del = $$1('<button class="wprrt-saved-delete" title="Delete">&times;</button>');
      del.attr("data-id", item.id);
      const info = $$1('<div class="wprrt-saved-info"></div>').append(badge, nameEl, routeEl);
      el.append(info, del);
      list.append(el);
    });
  }
  function bindEvents() {
    $$1(document).on("click", ".wprrt-saved-item", function(e) {
      if ($$1(e.target).hasClass("wprrt-saved-delete")) return;
      const id = $$1(this).data("id");
      populateTabFromId(id);
    });
    $$1(document).on("click", ".wprrt-saved-delete", function(e) {
      e.stopPropagation();
      const id = $$1(this).data("id");
      $$1.post(window.wprrt_vars.ajax_url, {
        action: "wprrt_delete_request",
        nonce: window.wprrt_vars.nonce,
        id
      }, () => loadSaved());
    });
    $$1(document).on("click", ".wprrt-save-btn", function() {
      const form = $$1(this).closest(".wprrt-tab-content").find(".wprrt-save-form");
      if (form.is(":visible")) {
        form.hide();
      } else {
        form.show().css("display", "flex");
        form.find(".wprrt-save-name").val("").trigger("focus");
      }
    });
    $$1(document).on("click", ".wprrt-save-confirm", function() {
      const tabContent = $$1(this).closest(".wprrt-tab-content");
      const name = tabContent.find(".wprrt-save-name").val().trim();
      if (!name) {
        tabContent.find(".wprrt-save-name").trigger("focus");
        return;
      }
      saveCurrentTab(tabContent, name);
      tabContent.find(".wprrt-save-form").hide();
    });
    $$1(document).on("click", ".wprrt-save-cancel", function() {
      $$1(this).closest(".wprrt-save-form").hide();
    });
    $$1(document).on("keydown", ".wprrt-save-name", function(e) {
      if (e.key === "Enter") {
        $$1(this).closest(".wprrt-tab-content").find(".wprrt-save-confirm").trigger("click");
      }
      if (e.key === "Escape") {
        $$1(this).closest(".wprrt-save-form").hide();
      }
    });
  }
  function populateTabFromId(id) {
    $$1.post(window.wprrt_vars.ajax_url, {
      action: "wprrt_get_saved_requests",
      nonce: window.wprrt_vars.nonce
    }, (res) => {
      if (!res.success) return;
      const item = res.data.find((i) => i.id === id);
      if (!item) return;
      const tabContent = $$1(".wprrt-tab-content:visible");
      if (!tabContent.length) return;
      tabContent.find(".wprrt-route").val(item.route);
      tabContent.find(".wprrt-method").val(item.method);
      tabContent.find(".wprrt-headers").val(item.headers || "");
      tabContent.find(".wprrt-body").val(item.body || "");
      saveState();
    });
  }
  function copyCurl(tabContent) {
    const route = resolveRoute(tabContent);
    const method = tabContent.find(".wprrt-method").val();
    const headers = tabContent.find(".wprrt-headers").val().trim();
    const body = tabContent.find(".wprrt-body").val().trim();
    const base = (window.wprrt_vars.rest_url || "").replace(/\/$/, "");
    const url = base + route;
    const parts = [`curl -X ${method}`, `  "${url}"`];
    let parsedHeaders = {};
    if (headers) {
      try {
        parsedHeaders = JSON.parse(headers);
      } catch (e) {
      }
    }
    Object.entries(parsedHeaders).forEach(([k, v]) => {
      parts.push(`  -H "${k}: ${v}"`);
    });
    if (["POST", "PUT", "PATCH"].includes(method) && body && body !== "{}") {
      if (!parsedHeaders["Content-Type"]) {
        parts.push(`  -H "Content-Type: application/json"`);
      }
      parts.push(`  -d '${body}'`);
    }
    const curlCmd = parts.join(" \\\n");
    const btn = tabContent.find(".wprrt-curl-btn");
    const flash = () => {
      const orig = btn.text();
      btn.text("Copied!");
      setTimeout(() => btn.text(orig), 2e3);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(curlCmd).then(flash).catch(() => legacyCopy(curlCmd, flash));
    } else {
      legacyCopy(curlCmd, flash);
    }
  }
  function legacyCopy(text, cb) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    cb();
  }
  const $ = window.jQuery;
  function formatRoute(route) {
    const source = String(route || "");
    function findClosingParen(text, startIdx) {
      let depth = 0;
      for (let i = startIdx; i < text.length; i += 1) {
        const ch = text[i];
        if (ch === "\\") {
          i += 1;
          continue;
        }
        if (ch === "(") depth += 1;
        if (ch === ")") {
          depth -= 1;
          if (depth === 0) return i;
        }
      }
      return -1;
    }
    let formatted = "";
    for (let i = 0; i < source.length; i += 1) {
      if (source.startsWith("(?P<", i) || source.startsWith("(?<", i)) {
        const nameStart = source.startsWith("(?P<", i) ? i + 4 : i + 3;
        const nameEnd = source.indexOf(">", nameStart);
        const closeIdx = findClosingParen(source, i);
        if (nameEnd !== -1 && closeIdx !== -1 && nameEnd < closeIdx) {
          const paramName = source.slice(nameStart, nameEnd).trim();
          formatted += paramName ? `{${paramName}}` : "{param}";
          i = closeIdx;
          continue;
        }
      }
      formatted += source[i];
    }
    formatted = formatted.replace(/\((?!\?)[^)]*\)\??/g, "{param}");
    formatted = formatted.replace(/\(\?:/g, "").replace(/\(\?=/g, "").replace(/\(\?!/g, "").replace(/\(\?<=/g, "").replace(/\(\?<!/g, "");
    formatted = formatted.replace(/[()[\]^$|+*\\]/g, "").replace(/\?/g, "").replace(/\/{2,}/g, "/").replace(/!\//g, "/").replace(/!+/g, "").trim();
    return formatted;
  }
  function initializeApp(routes) {
    WPRRT.formattedRoutes = {};
    WPRRT.pluginRoutes = {};
    WPRRT.routeMethods = {};
    for (const route in routes) {
      const routeData = routes[route];
      const formattedRoute = formatRoute(route);
      WPRRT.formattedRoutes[formattedRoute] = route;
      WPRRT.routeMethods[formattedRoute] = {
        methods: routeData.methods || ["GET"],
        primary_method: routeData.primary_method || "GET"
      };
      const pluginMatch = route.match(/^\/([^/]+)/);
      const pluginName = pluginMatch ? pluginMatch[1] : "other";
      if (!WPRRT.pluginRoutes[pluginName]) WPRRT.pluginRoutes[pluginName] = [];
      WPRRT.pluginRoutes[pluginName].push(formattedRoute);
    }
    $("#wprrt-app").html(
      '<div class="wprrt-layout"><aside class="wprrt-sidebar"><div class="wprrt-sidebar-header">Saved Requests</div><div id="wprrt-saved-list"></div></aside><div class="wprrt-main"><div class="wprrt-tabs-container"><div class="wprrt-tabs-header"><div class="wprrt-tabs"></div><button class="wprrt-add-tab">+ New Request</button></div><div class="wprrt-tab-content-wrapper"></div></div></div></div>'
    );
    initSidebar();
    const savedState = loadState();
    if (savedState && savedState.tabs.length > 0) {
      savedState.tabs.forEach((tabData) => {
        if (tabData.id && tabData.id.startsWith("tab-")) {
          const n = parseInt(tabData.id.replace("tab-", ""), 10);
          if (n > WPRRT.tabCounter) WPRRT.tabCounter = n;
        }
      });
      savedState.tabs.forEach((tabData) => createNewTab(tabData));
      if (savedState.activeTabId) switchTab(savedState.activeTabId);
    } else {
      createNewTab();
    }
    $(document).on(
      "change",
      ".wprrt-route, .wprrt-method, .wprrt-headers, .wprrt-body, .wprrt-role-selector, .wprrt-plugin, .wprrt-auth-type",
      saveState
    );
    $(document).on("input", ".wprrt-param-input", saveState);
    $(document).on("click", ".wprrt-test", function() {
      sendRequest($(this).closest(".wprrt-tab-content"));
    });
    $(document).on("click", ".wprrt-tab-header", function(e) {
      if (!$(e.target).hasClass("wprrt-close-tab")) {
        switchTab($(this).data("tab-id"));
        saveState();
      }
    });
    $(document).on("click", ".wprrt-close-tab", function(e) {
      e.stopPropagation();
      closeTab($(this).closest(".wprrt-tab-header").data("tab-id"));
    });
    $(document).on("focus", ".wprrt-route", function() {
      const tabContent = $(this).closest(".wprrt-tab-content");
      const dropdown = tabContent.find(".wprrt-route-dropdown");
      const selectedPlugin = tabContent.find(".wprrt-plugin").val();
      const routes2 = selectedPlugin === "all" ? Object.keys(WPRRT.formattedRoutes) : WPRRT.pluginRoutes[selectedPlugin] || [];
      buildRouteDropdown(dropdown, routes2);
      dropdown.show();
    });
    $(document).on("input", ".wprrt-route", function() {
      const value = $(this).val().toLowerCase();
      const tabContent = $(this).closest(".wprrt-tab-content");
      const dropdown = tabContent.find(".wprrt-route-dropdown");
      const selectedPlugin = tabContent.find(".wprrt-plugin").val();
      const routes2 = (selectedPlugin === "all" ? Object.keys(WPRRT.formattedRoutes) : WPRRT.pluginRoutes[selectedPlugin] || []).filter((r) => r.toLowerCase().includes(value));
      buildRouteDropdown(dropdown, routes2);
      dropdown.show();
    });
    $(document).on("click", function(e) {
      if (!$(e.target).closest(".wprrt-route-container").length) {
        $(".wprrt-route-dropdown").hide();
      }
    });
    $(document).on("click", ".wprrt-route-option", function() {
      const tabContent = $(this).closest(".wprrt-tab-content");
      const selectedRoute = $(this).text();
      tabContent.find(".wprrt-route").val(selectedRoute);
      $(this).closest(".wprrt-route-dropdown").hide();
      if (WPRRT.routeMethods[selectedRoute]) {
        tabContent.find(".wprrt-method").val(WPRRT.routeMethods[selectedRoute].primary_method);
      }
      renderParams(tabContent, selectedRoute);
      saveState();
    });
    $(document).on("change", ".wprrt-route", function() {
      const tabContent = $(this).closest(".wprrt-tab-content");
      renderParams(tabContent, $(this).val());
      saveState();
    });
    $(document).on("click", ".wprrt-curl-btn", function() {
      copyCurl($(this).closest(".wprrt-tab-content"));
    });
    $(document).on("change", ".wprrt-plugin", function() {
      $(this).closest(".wprrt-tab-content").find(".wprrt-route").val("");
    });
    $(document).on("click", ".wprrt-add-tab", function() {
      createNewTab();
    });
  }
  $(document).ready(function() {
    const app = $("#wprrt-app");
    app.html(
      '<div class="wprrt-loading"><div class="wprrt-loading-spinner"></div><p>Loading routes...</p></div>'
    );
    $.post(window.wprrt_vars.ajax_url, {
      action: "wprrt_get_routes",
      nonce: window.wprrt_vars.nonce
    }, (res) => {
      if (res.success) {
        initializeApp(res.data);
      } else {
        const wrapper = $('<div class="wprrt-error"></div>');
        wrapper.append($("<p></p>").text("Failed to load routes. Please refresh the page."));
        app.html("").append(wrapper);
      }
    }).fail(() => {
      const wrapper = $('<div class="wprrt-error"></div>');
      wrapper.append($("<p></p>").text("Failed to connect to the server. Please check your connection and refresh."));
      app.html("").append(wrapper);
    });
  });
})();
