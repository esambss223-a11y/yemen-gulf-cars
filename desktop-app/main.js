const { app, BrowserWindow, Menu, shell, ipcMain, dialog, Tray, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray = null;
let isDashboardMode = false;
app.isQuitting = false;

const configPath = path.join(__dirname, 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load config, using default', err);
  }
  return {
    liveUrl: 'https://ygcarss.com/admin',
    localUrl: 'http://localhost:3000/admin',
    mode: 'live',
  };
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save config', err);
  }
}

function getTargetUrl() {
  const config = loadConfig();
  return config.mode === 'local' ? config.localUrl : config.liveUrl;
}

function createWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');

  // Start with compact luxury login size (480x720)
  mainWindow = new BrowserWindow({
    width: 480,
    height: 720,
    minWidth: 440,
    minHeight: 650,
    title: 'تطبيق شركة اليمن والخليج - تسجيل الدخول v1.1.0',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#060911',
    autoHideMenuBar: false,
    resizable: true,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // needed for custom print overrides
    },
  });

  const targetUrl = getTargetUrl();
  mainWindow.loadURL(targetUrl);

  // If network connection fails (offline / server down), show custom offline screen
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (errorCode === -3) return; // ignore aborts

    const offlinePath = path.join(__dirname, 'assets', 'offline.html');
    mainWindow.loadFile(offlinePath, {
      query: { url: validatedURL || targetUrl },
    });
  });

  // Handle external links (WhatsApp, external maps, etc.)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://ygcarss.com') || url.startsWith('http://localhost:3000')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Minimize to tray on close if user clicks X, unless exiting completely
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (tray && process.platform === 'win32') {
        tray.displayBalloon?.({
          title: 'يمن جلف للسيارات',
          content: 'البرنامج يعمل في الخلفية لتلقي الإشعارات الفورية.',
        });
      }
    }
  });

  buildMenu();
  createTray();
}

// ----------------------------------------------------
// Smooth Window Resizing: Login (Compact) <-> Dashboard (Full)
// ----------------------------------------------------
function expandToDashboard() {
  if (!mainWindow || isDashboardMode) return;
  isDashboardMode = true;

  mainWindow.setTitle('تطبيق شركة اليمن والخليج - لوحة التحكم v1.1.0');
  mainWindow.setMinimumSize(1024, 700);
  mainWindow.setSize(1366, 868, true);
  mainWindow.setResizable(true);
  mainWindow.center();
  buildMenu();
}

function shrinkToLogin() {
  if (!mainWindow || !isDashboardMode) return;
  isDashboardMode = false;

  mainWindow.setTitle('تطبيق شركة اليمن والخليج - تسجيل الدخول v1.1.0');
  mainWindow.setMinimumSize(440, 650);
  mainWindow.setSize(480, 720, true);
  mainWindow.center();
  buildMenu();
}

// ----------------------------------------------------
// System Tray Setup
// ----------------------------------------------------
function createTray() {
  if (tray) return;

  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  if (!fs.existsSync(iconPath)) return;

  tray = new Tray(iconPath);
  tray.setToolTip('تطبيق شركة اليمن والخليج لتأجير السيارات v1.1.0');

  const updateTrayMenu = () => {
    const isAutoStart = app.getLoginItemSettings().openAtLogin;
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'فتح لوحة التحكم',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      { type: 'separator' },
      {
        label: 'التشغيل التلقائي مع الويندوز',
        type: 'checkbox',
        checked: isAutoStart,
        click: (item) => {
          app.setLoginItemSettings({
            openAtLogin: item.checked,
            openAsHidden: false,
          });
          updateTrayMenu();
        },
      },
      { type: 'separator' },
      {
        label: 'إغلاق البرنامج نهائياً',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);
    tray.setContextMenu(contextMenu);
  };

  updateTrayMenu();

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ----------------------------------------------------
// Native Menu Bar
// ----------------------------------------------------
function buildMenu() {
  const config = loadConfig();
  const isLocal = config.mode === 'local';
  const isAutoStart = app.getLoginItemSettings().openAtLogin;

  const template = [
    {
      label: 'ملف',
      submenu: [
        {
          label: 'إعادة التحميل (تحديث)',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow && mainWindow.reload(),
        },
        {
          label: 'إعادة التحميل مع تفريغ الكاش',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => mainWindow && mainWindow.webContents.reloadIgnoringCache(),
        },
        { type: 'separator' },
        {
          label: 'طباعة المستند / العقد (طابعة ويندوز)',
          accelerator: 'CmdOrCtrl+P',
          click: () => triggerNativePrint(),
        },
        {
          label: 'حفظ المستند الحالي كملف PDF...',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => triggerSavePdf(),
        },
        { type: 'separator' },
        {
          label: 'تسجيل الخروج من الحساب',
          accelerator: 'CmdOrCtrl+L',
          click: () => triggerLogout(),
        },
        { type: 'separator' },
        {
          label: 'إغلاق البرنامج نهائياً',
          accelerator: 'Alt+F4',
          click: () => {
            app.isQuitting = true;
            app.quit();
          },
        },
      ],
    },
    {
      label: 'السيرفر والإعدادات',
      submenu: [
        {
          label: 'السيرفر المباشر السحابي (ygcarss.com)',
          type: 'radio',
          checked: !isLocal,
          click: () => switchServer('live'),
        },
        {
          label: 'السيرفر المحلي (Localhost:3000)',
          type: 'radio',
          checked: isLocal,
          click: () => switchServer('local'),
        },
        { type: 'separator' },
        {
          label: 'تشغيل البرنامج تلقائياً مع بدء تشغيل الويندوز',
          type: 'checkbox',
          checked: isAutoStart,
          click: (item) => {
            app.setLoginItemSettings({
              openAtLogin: item.checked,
              openAsHidden: false,
            });
            buildMenu();
          },
        },
      ],
    },
    {
      label: 'عرض',
      submenu: [
        { label: 'تكبير (+)', role: 'zoomIn' },
        { label: 'تصغير (-)', role: 'zoomOut' },
        { label: 'الحجم الطبيعي (100%)', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'ملء الشاشة', role: 'togglefullscreen' },
        {
          label: 'أدوات المطور (DevTools)',
          accelerator: 'F12',
          click: () => mainWindow && mainWindow.webContents.toggleDevTools(),
        },
      ],
    },
    {
      label: 'مساعدة',
      submenu: [
        {
          label: 'فتح الموقع العام في المتصفح',
          click: () => shell.openExternal('https://ygcarss.com'),
        },
        { type: 'separator' },
        {
          label: 'حول تطبيق شركة اليمن والخليج',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'حول التطبيق',
              message: 'تطبيق شركة اليمن والخليج لتأجير السيارات',
              detail: 'الإصدار: 1.1.0 (v1.1.0)\nالنظام المكتبي لإدارة الأسطول والعقود والمحاسبة.\nكافة الحقوق محفوظة © 2026',
              buttons: ['حسناً'],
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ----------------------------------------------------
// Printing & PDF Logic (Fixed: Uses Windows System Dialog)
// ----------------------------------------------------
function triggerNativePrint() {
  if (!mainWindow) return;

  // By using silent: false with printBackground: true,
  // Windows opens its native system print dialogue where users can pick ANY printer or PDF!
  mainWindow.webContents.print(
    {
      silent: false,
      printBackground: true,
      color: true,
      margins: { marginType: 'printableArea' },
    },
    (success, failureReason) => {
      if (!success && failureReason !== 'cancelled') {
        console.warn('Native print dialogue result:', failureReason);
      }
    }
  );
}

async function triggerSavePdf() {
  if (!mainWindow) return;

  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'حفظ المستند بصيغة PDF',
    defaultPath: `مستند-يمن-جلف-${Date.now()}.pdf`,
    filters: [{ name: 'ملفات PDF (*.pdf)', extensions: ['pdf'] }],
  });

  if (filePath) {
    try {
      const pdfData = await mainWindow.webContents.printToPDF({
        printBackground: true,
        landscape: false,
        pageSize: 'A4',
      });
      fs.writeFileSync(filePath, pdfData);
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'تم الحفظ بنجاح',
        message: 'تم حفظ المستند كملف PDF عالي الجودة بنجاح!',
        buttons: ['حسناً'],
      });
    } catch (err) {
      dialog.showErrorBox('خطأ في توليد PDF', 'حدث خطأ: ' + err.message);
    }
  }
}

function triggerLogout() {
  if (!mainWindow) return;
  // Trigger logout in web app and clear local state
  mainWindow.webContents.executeJavaScript(`
    try {
      localStorage.removeItem('yg_staff_auth');
      localStorage.removeItem('yg_staff_token');
      localStorage.removeItem('fleet_current_staff');
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  `);
  shrinkToLogin();
}

function switchServer(mode) {
  const config = loadConfig();
  config.mode = mode;
  saveConfig(config);
  buildMenu();
  if (mainWindow) {
    const url = getTargetUrl();
    mainWindow.loadURL(url);
  }
}

// ----------------------------------------------------
// IPC Listeners
// ----------------------------------------------------
ipcMain.on('electron-print', () => triggerNativePrint());
ipcMain.on('electron-save-pdf', () => triggerSavePdf());
ipcMain.on('electron-logout', () => triggerLogout());

ipcMain.on('auth-status', (event, { loggedIn }) => {
  if (loggedIn) {
    expandToDashboard();
  } else {
    shrinkToLogin();
  }
});

ipcMain.on('toggle-mode', () => {
  const config = loadConfig();
  const newMode = config.mode === 'live' ? 'local' : 'live';
  switchServer(newMode);
});

ipcMain.on('reload-window', () => {
  if (mainWindow) mainWindow.reload();
});

ipcMain.handle('get-version', () => app.getVersion());

// ----------------------------------------------------
// App Lifecycle
// ----------------------------------------------------
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});
