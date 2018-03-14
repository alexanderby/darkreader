import {FilterMode} from './generators/css-filter';

export interface ExtensionInfo {
    enabled: boolean;
    ready: boolean;
    filterConfig: FilterConfig;
    fonts: string[];
    activeTab: TabInfo;
    devInversionFixesText: string;
}

export interface FilterConfig {
    mode?: FilterMode;
    brightness?: number;
    contrast?: number;
    grayscale?: number;
    sepia?: number;
    useFont?: boolean;
    fontFamily?: string;
    textStroke?: number;
    siteList?: string[];
    invertListed?: boolean;
}

export interface UserSettings {
    enabled: boolean;
    config: FilterConfig;
}

export interface TabInfo {
    url: string;
    host: string;
    isProtected: boolean;
    isInDarkList: boolean;
}

export interface InversionFixes {
    common: InversionFix;
    sites: SiteFix[];
}

export interface InversionFix {
    invert: string[];
    noinvert: string[];
    removebg: string[];
    rules: string[];
}

export interface SiteFix extends InversionFix {
    url: string | string[];
}
