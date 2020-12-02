// Requiring necessary stuff

const { app, BrowserWindow } = require('electron');
var ipc = require('electron').ipcMain;

// Electron stuff

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 1000,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Quit upon receiving quit message

ipc.on("close", () => {
    app.quit();
});