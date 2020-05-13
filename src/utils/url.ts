import {UserSettings} from '../definitions';
import {compareIPV6} from './ipv6';

export function getURLHost(url: string) {
    return url.match(/^(.*?\/{2,3})?(.+?)(\/|$)/)[2];
}

export function compareURLPatterns(a: string, b: string) {
    return a.localeCompare(b);
}

/**
 * Determines whether URL has a match in URL template list.
 * @param url Site URL.
 * @paramlist List to search into.
 */
export function isURLInList(url: string, list: string[]) {
    for (let i = 0; i < list.length; i++) {
        if (isURLMatched(url, list[i])) {
            return true;
        }
    }
    return false;
}

/**
 * A fast way to check if IPV6 comparing is needed
 * @param ip1 First IP to check if it's IPV6 
 * @param ip2 First IP to check if it's IPV6
 */
function isIPV6(ip1: string, ip2: string) {
    if (!ip1.includes('[') && !ip2.includes('[')) {
        return false;
    }
    let isFirstIPV6 = ip1.includes('[')
    let isSecondIPV6 = ip2.includes('[')
    if (isFirstIPV6 && isSecondIPV6) {
        return true;
    } else {
        return false;
    }
}

/**
 * Determines whether URL matches the template.
 * @param url URL.
 * @param urlTemplate URL template ("google.*", "youtube.com" etc).
 */
export function isURLMatched(url: string, urlTemplate: string): boolean {
    if (isIPV6(url, urlTemplate)) {
        return compareIPV6(url, urlTemplate);
    } else {
        const regex = createUrlRegex(urlTemplate);
        return Boolean(url.match(regex));
    }
}

function createUrlRegex(urlTemplate: string): RegExp {
    urlTemplate = urlTemplate.trim();
    const exactBeginning = (urlTemplate[0] === '^');
    const exactEnding = (urlTemplate[urlTemplate.length - 1] === '$');

    urlTemplate = (urlTemplate
        .replace(/^\^/, '') // Remove ^ at start
        .replace(/\$$/, '') // Remove $ at end
        .replace(/^.*?\/{2,3}/, '') // Remove scheme
        .replace(/\?.*$/, '') // Remove query
        .replace(/\/$/, '') // Remove last slash
    );

    let slashIndex: number;
    let beforeSlash: string;
    let afterSlash: string;
    if ((slashIndex = urlTemplate.indexOf('/')) >= 0) {
        beforeSlash = urlTemplate.substring(0, slashIndex); // google.*
        afterSlash = urlTemplate.replace('$', '').substring(slashIndex); // /login/abc
    } else {
        beforeSlash = urlTemplate.replace('$', '');
    }

    //
    // SCHEME and SUBDOMAINS

    let result = (exactBeginning ?
        '^(.*?\\:\\/{2,3})?' // Scheme
        : '^(.*?\\:\\/{2,3})?([^\/]*?\\.)?' // Scheme and subdomains
    );

    //
    // HOST and PORT

    const hostParts = beforeSlash.split('.');
    result += '(';
    for (let i = 0; i < hostParts.length; i++) {
        if (hostParts[i] === '*') {
            hostParts[i] = '[^\\.\\/]+?';
        }
    }
    result += hostParts.join('\\.');
    result += ')';

    //
    // PATH and QUERY

    if (afterSlash) {
        result += '(';
        result += afterSlash.replace('/', '\\/');
        result += ')';
    }

    result += (exactEnding ?
        '(\\/?(\\?[^\/]*?)?)$' // All following queries
        : '(\\/?.*?)$' // All following paths and queries
    );

    //
    // Result

    return new RegExp(result, 'i');
}

export function isPDF(url: string) {
    if (url.includes('.pdf')) {
        if (url.includes('?')) {
            url = url.substring(0, url.lastIndexOf('?'));
        }
        if (url.includes('#')) {
            url = url.substring(0, url.lastIndexOf('#'));
        }
        if (url.endsWith('.pdf')) {
            for (let i = url.length; 0 < i; i--) {
                if (url[i] === '=') {
                    return false;
                } else if (url[i] === '/') {
                    return true;
                }
            }
        } else {
            return false;
        }
    }
    return false;
}

export function isURLEnabled(url: string, userSettings: UserSettings, {isProtected, isInDarkList}) {
    if (isProtected) {
        return false;
    }
    if (isPDF(url) && userSettings.enableForPDF) {
        return true;
    }
    if (isPDF(url) && !userSettings.enableForPDF) {
        return false;
    }
    const isURLInUserList = isURLInList(url, userSettings.siteList);
    if (userSettings.applyToListedOnly) {
        return isURLInUserList;
    }
    // TODO: Use `siteListEnabled`, `siteListDisabled`, `enabledByDefault` options.
    // Delete `siteList` and `applyToListedOnly` options, transfer user's values.
    const isURLInEnabledList = isURLInList(url, userSettings.siteListEnabled);
    if (isURLInEnabledList && isInDarkList) {
        return true;
    }
    return (!isInDarkList && !isURLInUserList);
}
