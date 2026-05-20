const { Services } = ChromeUtils.importESModule("resource://gre/modules/Services.sys.mjs");

export class WebExtBridgeParent extends JSWindowActorParent {
  async receiveMessage(message) {
    console.log("Web Ext: Parent received message " + message.name);
    if (message.name === "callApi") {
      const { method, args } = message.data;
      console.log("Web Ext: Handling method " + method, args);
      try {
        const result = await this.handleApiCall(method, args);
        console.log("Web Ext: Method " + method + " success");
        return result;
      } catch (e) {
        console.error("Web Ext: Method " + method + " failed", e);
        return { error: e.message };
      }
    }
  }

  async handleApiCall(method, args) {
    const win = Services.wm.getMostRecentBrowserWindow("navigator:browser");
    if (!win) throw new Error("No browser window found");

    const { UC_API } = win;

    switch (method) {
      case "getBrowserInfo":
        return {
          brandName: win.AppConstants?.MOZ_APP_DISPLAYNAME,
          version: win.AppConstants?.MOZ_APP_VERSION,
          os: win.AppConstants?.OS
        };

      case "toggleSidebar":
        if (win.ZenController && typeof win.ZenController.toggleSidebar === 'function') {
          win.ZenController.toggleSidebar();
          return { success: true };
        }
        const sidebar = win.document.getElementById("zen-sidebar") || win.document.getElementById("sidebar-box");
        if (sidebar) {
          sidebar.hidden = !sidebar.hidden;
          return { success: true, hidden: sidebar.hidden };
        }
        throw new Error("Sidebar controller not found");

      case "notify":
        if (UC_API && UC_API.Notifications) {
          UC_API.Notifications.show({
            label: args.message || "Message from WebExtension",
            priority: args.priority || "info"
          });
          return { success: true };
        }
        throw new Error("UC_API.Notifications not available");

      case "getThemeInfo":
        const theme = win.document.documentElement.getAttribute("zen-theme") || "default";
        return { theme };

      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }
}
