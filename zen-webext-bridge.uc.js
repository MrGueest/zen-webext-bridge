// ==UserScript==
// @name            Zen WebExt Bridge
// @description     Exposes custom Zen APIs to WebExtensions
// @author          Dahmane
// @version         1.0.0
// @onlyonce
// @WindowActor     WebExtBridge
// @WindowActorMatches ["moz-extension://*/*"]
// ==/UserScript==

console.error("ZEN_WEBEXT_BRIDGE: Script file detected and executing.");

(function() {
  // Use global Services and ChromeUtils if available, otherwise import them
  const services = globalThis.Services || ChromeUtils.importESModule("resource://gre/modules/Services.sys.mjs").Services;

  const ACTOR_NAME = "WebExtBridge";
  const CHROME_URI = "chrome://zen-webext-bridge/content/";

  function getModDir() {
    try {
      // Get the URL of the current script
      let scriptUrl;
      try {
        scriptUrl = Components.stack.filename;
      } catch (e) {
        // Fallback for some environments
        scriptUrl = window.location.href;
      }

      if (scriptUrl && scriptUrl.startsWith("file://")) {
        let file = Services.io.newFileURI(scriptUrl).QueryInterface(Ci.nsIFileURL).file;
        return file.parent;
      }

      // Fallback to searching
      const chromeDir = services.dirsvc.get("UChrm", Ci.nsIFile);
      const paths = [
        ["sine-mods", "zen-webext-bridge"],
        ["sine-mods", "custom-mod"],
        ["custom-mod"]
      ];

      for (let p of paths) {
        let dir = chromeDir.clone();
        for (let part of p) dir.append(part);
        if (dir.exists()) {
          return dir;
        }
      }
    } catch (e) {
      console.error("ZEN_WEBEXT_BRIDGE: Error finding mod dir", e);
    }
    return null;
  }

  let initialized = false;
  function init() {
    if (initialized) return;
    initialized = true;
    console.error("Web Ext: loaded");
    console.error("ZEN_WEBEXT_BRIDGE: Starting manual registration...");

    try {
      const modDir = getModDir();
      if (!modDir) {
        console.error("ZEN_WEBEXT_BRIDGE: Could not locate mod directory!");
        return;
      }
      console.error("ZEN_WEBEXT_BRIDGE: Found mod directory: " + modDir.path);

      // 1. Register chrome.manifest
      const manifestFile = modDir.clone();
      manifestFile.append("chrome.manifest");

      if (manifestFile.exists()) {
        try {
          Components.manager.QueryInterface(Ci.nsIComponentRegistrar).autoRegister(manifestFile);
          console.error("ZEN_WEBEXT_BRIDGE: chrome.manifest registered.");
        } catch (e) {
          console.error("ZEN_WEBEXT_BRIDGE: Failed to autoRegister manifest", e);
        }
      } else {
        console.error("ZEN_WEBEXT_BRIDGE: chrome.manifest missing at " + manifestFile.path);
      }

      // 2. Register WindowActor - NOW HANDLED BY LOADER VIA HEADERS
      console.error("ZEN_WEBEXT_BRIDGE: WindowActor registration delegated to loader headers.");
    } catch (e) {
      console.error("ZEN_WEBEXT_BRIDGE: Registration failed", e);
    }
  }

  // Execute
  try {
    init();
  } catch (e) {
    console.error("Web Ext: Error during immediate init", e);
  }

  if (document.readyState !== "complete") {
    window.addEventListener("load", () => {
      try {
        init();
      } catch (e) {
        // Might already be initialized, that's fine
      }
    }, { once: true });
  }
})();
