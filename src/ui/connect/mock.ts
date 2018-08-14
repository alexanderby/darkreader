import {ExtensionData, TabInfo} from '../../definitions';

export function getMockData(override = {}): ExtensionData {
    return Object.assign({
        isEnabled: true,
        isReady: true,
        settings: {
            enabled: true,
            appearance: {
                mode: 1,
                brightness: 110,
                contrast: 90,
                grayscale: 20,
                sepia: 10,
                useFont: false,
                fontFamily: 'Segoe UI',
                textStroke: 0,
                engine: 'cssFilter',
                stylesheet: '',
            },
            customAppearance: [],
            siteList: [],
            applyToListedOnly: true,
            changeBrowserTheme: false,
            activationTime: '18:00',
            deactivationTime: '9:00',
            syncSettings: true,
        },
        fonts: [
            'serif',
            'sans-serif',
            'monospace',
            'cursive',
            'fantasy',
            'system-ui'
        ],
        news: [],
        shortcuts: {
            'addSite': 'Alt+Shift+A',
            'toggle': 'Alt+Shift+D'
        },
        devDynamicThemeFixesText: '',
        devInversionFixesText: '',
        devStaticThemesText: '',
    }, override);
}

export function getMockActiveTabInfo(): TabInfo {
    return {
        url: 'https://darkreader.org/',
        isProtected: false,
        isInDarkList: false,
    };
}

export function createConnectorMock() {
    let listener: (data) => void = null;
    const data = getMockData();
    const tab = getMockActiveTabInfo();
    const connector = {
        getData() {
            return Promise.resolve(data);
        },
        getActiveTabInfo() {
            return Promise.resolve(tab);
        },
        subscribeToChanges(callback) {
            listener = callback;
        },
        changeSettings(settings) {
            Object.assign(data.settings, settings);
            listener(data);
        },
        setAppearance(appearance) {
            Object.assign(data.settings.appearance, appearance);
            listener(data);
        },
        setShortcut(command, shortcut) {
            Object.assign(data.shortcuts, {[command]: shortcut});
            listener(data);
        },
        toggleSitePattern(pattern) {
            const index = data.settings.siteList.indexOf(pattern);
            if (index >= 0) {
                data.settings.siteList.splice(pattern, 1);
            } else {
                data.settings.siteList.push(pattern);
            }
            listener(data);
        },
        markNewsAsRead(ids) {
            //
        },
        disconnect() {
            //
        },
    };
    return connector;
}
