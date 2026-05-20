# Zen WebExt Bridge

Exposes custom Zen APIs to WebExtensions via the `browser.zen` namespace.

## Installation
1. Ensure you have `fx-autoconfig` or a compatible mod loader (like Sine) installed.
2. Enable experimental APIs by setting `userChromeJS.experimental.enabled` to `true` in `about:config`.
3. Copy this folder into your mods directory.

## Usage from WebExtension
```javascript
if (browser.zen) {
  // Get browser information
  const info = await browser.zen.callParentApi('getBrowserInfo');
  
  // Toggle Sidebar
  await browser.zen.callParentApi('toggleSidebar');
  
  // Show a browser notification
  await browser.zen.callParentApi('notify', { 
    message: 'Hello from Extension!', 
    priority: 'info' 
  });
}
```
