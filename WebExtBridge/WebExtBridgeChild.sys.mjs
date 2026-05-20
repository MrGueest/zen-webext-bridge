const { Services } = ChromeUtils.importESModule("resource://gre/modules/Services.sys.mjs");
const Cu = Components.utils;

export class WebExtBridgeChild extends JSWindowActorChild {
  constructor() {
    super();
  }

  actorCreated() {
    console.log("Web Ext: Actor created for " + this.contentWindow?.location?.href);
    this.injectApi();
  }

  handleEvent(event) {
    if (event.type === 'DOMContentLoaded') {
      console.log("Web Ext: DOMContentLoaded, re-injecting...");
      this.injectApi();
    }
  }

  injectApi() {
    const win = this.contentWindow;
    if (!win) return;

    // Log the attempt
    const url = win.location.href;
    if (!url.startsWith("moz-extension://")) {
      return;
    }

    console.log("Web Ext: Attempting injection into " + url);

    // Define the custom API
    const zenApi = {
      callParentApi: (method, args = {}) => {
        console.log("Web Ext: Calling parent method:", method, args);
        return this.sendQuery("callApi", { method, args }).then(result => {
          if (result && result.error) {
            throw new Error(result.error);
          }
          return result;
        }).catch(e => {
          console.error("Web Ext: API call failed", e);
          throw e;
        });
      }
    };

    // Inject into multiple possible namespaces
    try {
      // Helper to ensure property exists
      const injectInto = (obj, name, api) => {
        if (!obj) return false;
        try {
          if (!obj[name]) {
            obj[name] = Cu.cloneInto(api, obj, { cloneFunctions: true });
            return true;
          }
        } catch (e) {
          console.error(`Web Ext: Failed to inject into ${name}`, e);
        }
        return false;
      };

      // 1. window.zen
      if (injectInto(win, "zen", zenApi)) {
        console.log("Web Ext: Injected window.zen");
      }

      // 2. browser.zen
      if (!win.browser) {
        // Create browser object if it doesn't exist (e.g. in some contexts)
        try {
          win.browser = Cu.cloneInto({}, win);
        } catch (e) {}
      }
      
      if (injectInto(win.browser, "zen", zenApi)) {
        console.log("Web Ext: Injected browser.zen");
      }

      // 3. chrome.zen
      if (!win.chrome) {
        try {
          win.chrome = Cu.cloneInto({}, win);
        } catch (e) {}
      }
      if (injectInto(win.chrome, "zen", zenApi)) {
        console.log("Web Ext: Injected chrome.zen");
      }
    } catch (e) {
      console.error("Web Ext: Injection failed", e);
    }
  }
}
