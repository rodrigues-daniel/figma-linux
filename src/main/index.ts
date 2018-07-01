import {
    app,
    net,
    session,
    BrowserWindow,
} from 'electron';
import * as url from "url";

import shorcuts from './shortcuts';
import menu from './menu';
import getArgv from './Args';

const argv = getArgv();
const HOME = 'https://www.figma.com';
const winOptions: Electron.BrowserWindowConstructorOptions = {
    width: 1200,
    height: 900,
    frame: argv.withoutFrame,
    webPreferences: {
        nodeIntegration: false,
        webSecurity: false,
        webgl: true,
        experimentalFeatures: true,
        experimentalCanvasFeatures: true,
        zoomFactor: 0.7
    }
};

app.on('browser-window-created', (event, window) => {
    window.setMenu(null);
});

app.on('ready', () => {
    let window = new BrowserWindow(winOptions);

    window.loadURL(`${HOME}/login`);
    // console.log(`load url: ${HOME}/login`);
    

    // window.webContents.on('will-navigate', (event, url) => {
    //     const parts = url.split("/");

    //     if (parts[0] + "//" + parts[2] != HOME) {
    //         event.preventDefault();
    //         shell.openExternal(url);
    //     };
    // });

    shorcuts(window);
    menu(window);

    window.webContents.on('will-navigate', (event, newUrl) => {
        const currentUrl = event.sender.getURL();

        if (newUrl === currentUrl) {
            window.reload();

            event.preventDefault();
            return;
        }

        const from = url.parse(currentUrl);
        const to = url.parse(newUrl);

        if (from.pathname === '/login') {
            window.reload();
            return;
        }

        console.log('will-navigate event, to: ', to);

        if (to.pathname === '/logout') {
            net.request(`${HOME}/logout`).on('response', response => {
                response.on('data', chunk => {});
                response.on('error', (err: Error) => {
                    console.log('Request error: ', err);
                });
                response.on('end', () => {
                    console.log('response.statusCode: ', response.statusCode);
                    if (response.statusCode >= 200 && response.statusCode <= 299) {

                        session.defaultSession!.cookies.flushStore(() => {
                            const reload = () => app.relaunch({
                                args: process.argv.slice(1).concat(['--reset'])
                            });

                            app.on('will-quit', reload);
                            app.quit();
                        });
                    }

                    if (response.statusCode >= 400) {
                        session.defaultSession!.clearStorageData();
                        window.webContents.loadURL(`${HOME}/login`);
                    }
                });
            }).end();

            event.preventDefault();
            return;
        }
    });

    // window.webContents.on('did-navigate', (event) => {
    //     console.log('did-navigate event args:', event.sender.getURL());
    // });

    // window.webContents.on('new-window', (...args) => {
    //     console.log('new-window event args:', args);
    // });

    // window.on('closed', () => {
    //     window = null;
    // });
});

app.on('window-all-closed', () => {

    if(process.platform !== 'darwin') {
        app.quit();
    }
});