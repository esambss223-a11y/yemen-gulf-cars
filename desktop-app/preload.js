const { contextBridge, ipcRenderer } = require('electron');

// 1. Override standard window.print to invoke native Windows system print dialog directly
// This completely fixes the "No print preview available" (لا يوجد معاينة) error in Electron!
window.print = () => {
  ipcRenderer.send('electron-print');
};

contextBridge.exposeInMainWorld('electronAPI', {
  print: () => ipcRenderer.send('electron-print'),
  saveAsPdf: () => ipcRenderer.send('electron-save-pdf'),
  logout: () => ipcRenderer.send('electron-logout'),
  notifyAuthStatus: (loggedIn) => ipcRenderer.send('auth-status', { loggedIn }),
  toggleMode: () => ipcRenderer.send('toggle-mode'),
  reload: () => ipcRenderer.send('reload-window'),
  getAppVersion: () => ipcRenderer.invoke('get-version'),
});

// 2. Automated Screen Detector:
// Dynamically detects whether the user is on the Login Screen or the Main Dashboard
let currentViewMode = null;

function checkAuthScreen() {
  const hasDashboard = document.querySelector('.admin-shell') || 
                       document.querySelector('#admin-navigation') || 
                       document.querySelector('.admin-main');
  const hasLogin = document.querySelector('.admin-login') || 
                   document.querySelector('form input[type="password"]');

  if (hasDashboard && currentViewMode !== 'dashboard') {
    currentViewMode = 'dashboard';
    ipcRenderer.send('auth-status', { loggedIn: true });
  } else if (hasLogin && !hasDashboard && currentViewMode !== 'login') {
    currentViewMode = 'login';
    ipcRenderer.send('auth-status', { loggedIn: false });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  checkAuthScreen();

  // Watch for page structure changes (e.g. client-side login or logout)
  const observer = new MutationObserver(() => {
    checkAuthScreen();
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
