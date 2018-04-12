import {parse, rgbToHSL, hslToRGB, rgbToString, rgbToHexString, RGBA, HSLA} from '../../utils/color';
import {scale, clamp} from '../../utils/math';
import {getMatches} from '../../utils/text';
import {applyColorMatrix, createFilterMatrix} from '../../generators/utils/matrix';
import {cssURLRegex, getCSSURLValue, getCSSBaseBath} from './css-rules';
import {analyzeImage, applyFilterToImage, loadImage} from './image';
import state from './state';
import {getAbsoluteURL} from './url';
import {FilterConfig} from '../../definitions';

type CSSValueModifier = (filter: FilterConfig) => string | Promise<string>;

export interface ModifiableCSSDeclaration {
    property: string;
    value: string | CSSValueModifier;
}

export interface ModifiableCSSRule {
    selector: string;
    media?: string;
    declarations: ModifiableCSSDeclaration[];
}

export function getModifiableCSSDeclaration(property: string, value: string, rule: CSSStyleRule): ModifiableCSSDeclaration {
    if (property.indexOf('color') >= 0 && property !== '-webkit-print-color-adjust') {
        const modifier = getColorModifier(property, value);
        if (modifier) {
            return {property, value: modifier};
        }
    } else if (property === 'background-image') {
        const modifier = getBgImageModifier(property, value, rule);
        if (modifier) {
            return {property, value: modifier};
        }
    } else if (property.indexOf('shadow') >= 0) {
        const modifier = getShadowModifier(property, value);
        if (modifier) {
            return {property, value: modifier};
        }
    }
    return null;
}

export function getModifiedUserAgentStyle(filter: FilterConfig) {
    const lines: string[] = [];
    lines.push('html, body, input, textarea, select, button {');
    lines.push(`    background-color: ${modifyBackgroundColor({r: 255, g: 255, b: 255}, filter)} !important;`);
    lines.push(`    border-color: ${modifyBorderColor({r: 76, g: 76, b: 76}, filter)} !important;`);
    lines.push(`    color: ${modifyForegroundColor({r: 0, g: 0, b: 0}, filter)} !important;`);
    lines.push('}');
    lines.push('table {');
    lines.push(`    border-color: ${modifyBorderColor({r: 128, g: 128, b: 128}, filter)} !important;`);
    lines.push('}');
    lines.push('::placeholder {');
    lines.push(`    color: ${modifyForegroundColor({r: 169, g: 169, b: 169}, filter)} !important;`);
    lines.push('}');
    return lines.join('\n');
}

export function getModifiedFallbackStyle(filter: FilterConfig) {
    const lines: string[] = [];
    lines.push('html *, body * {');
    lines.push(`    background-color: ${modifyBackgroundColor({r: 255, g: 255, b: 255}, filter)} !important;`)
    lines.push(`    color: ${modifyForegroundColor({r: 0, g: 0, b: 0}, filter)} !important;`);
    lines.push('}');
    return lines.join('\n');
}

const unparsableColors = new Set([
    'inherit',
    'transparent',
    'initial',
    'currentcolor',
    '-webkit-focus-ring-color',
]);

const colorModificationCache = new Map<Function, Map<string, string>>();

function modifyColorWithCache(rgb: RGBA, filter: FilterConfig, modifyHSL: (hsl: HSLA) => HSLA) {
    let fnCache: Map<string, string>;
    if (colorModificationCache.has(modifyHSL)) {
        fnCache = colorModificationCache.get(modifyHSL);
    } else {
        fnCache = new Map();
        colorModificationCache.set(modifyHSL, fnCache);
    }
    const id = Object.entries(rgb)
        .concat(Object.entries(filter).filter(([key]) => ['mode', 'brightness', 'contrast', 'grayscale', 'sepia'].indexOf(key) >= 0))
        .map(([key, value]) => `${key}:${value}`)
        .join(';');
    if (fnCache.has(id)) {
        return fnCache.get(id);
    }

    const hsl = rgbToHSL(rgb);
    const modified = modifyHSL(hsl);
    const {r, g, b, a} = hslToRGB(modified);
    const [rf, gf, bf] = applyColorMatrix([r, g, b], createFilterMatrix({...filter, mode: 0}));

    const color = (a === 1 ?
        rgbToHexString({r: rf, g: gf, b: bf}) :
        rgbToString({r: rf, g: gf, b: bf, a}));

    fnCache.set(id, color);
    return color;
}

function modifyBgHSL({h, s, l, a}) {
    const lMin = 0.1;
    const lMaxS0 = 0.2;
    const lMaxS1 = 0.4;
    const sNeutralLim = 0.2;
    const sColored = 0.1;
    const hColored = 220;

    const lMax = scale(s, 0, 1, lMaxS0, lMaxS1);
    const lx = (l < lMax ?
        l :
        scale(l, lMax, 1, lMax, lMin));

    let hx = h;
    let sx = s;
    if (s < sNeutralLim) {
        sx = sColored;
        hx = hColored;
    }

    return {h: hx, s: sx, l: lx, a};
}

function modifyBackgroundColor(rgb: RGBA, filter: FilterConfig) {
    return modifyColorWithCache(rgb, filter, modifyBgHSL);
}

function modifyFgHSL({h, s, l, a}) {
    const lMax = 0.8;
    const lMinS0 = 0.6;
    const lMinS1 = 0.6;
    const sNeutralLim = 0.2;
    const sColored = 0.16;
    const hColored = 40;

    const lMin = scale(s, 0, 1, lMinS0, lMinS1);
    const lx = (l < lMax ?
        scale(l, 0, lMin, lMax, lMin) :
        l);
    let hx = h;
    let sx = s;
    if (s < sNeutralLim) {
        sx = sColored;
        hx = hColored;
    }

    return {h: hx, s: sx, l: lx, a};
}

function modifyForegroundColor(rgb: RGBA, filter: FilterConfig) {
    return modifyColorWithCache(rgb, filter, modifyFgHSL);
}

function modifyBorderHSL({h, s, l, a}) {
    const lMinS0 = 0.2;
    const lMinS1 = 0.3;
    const lMaxS0 = 0.4;
    const lMaxS1 = 0.5;

    const lMin = scale(s, 0, 1, lMinS0, lMinS1);
    const lMax = scale(s, 0, 1, lMaxS0, lMaxS1);
    const lx = scale(l, 0, 1, lMax, lMin);

    return {h, s, l: lx, a};
}

function modifyBorderColor(rgb: RGBA, filter: FilterConfig) {
    return modifyColorWithCache(rgb, filter, modifyBorderHSL);
}

function modifyShadowColor(rgb: RGBA, filter: FilterConfig) {
    return modifyBackgroundColor(rgb, filter);
}

function modifyGradientColor(rgb: RGBA, filter: FilterConfig) {
    return modifyBackgroundColor(rgb, filter);
}

const colorParseCache = new Map<string, RGBA>();

function parseColorWithCache($color: string) {
    $color = $color.trim();
    if (colorParseCache.has($color)) {
        return colorParseCache.get($color);
    }
    const color = parse($color);
    colorParseCache.set($color, color);
    return color;
}

function tryParseColor($color: string) {
    try {
        return parseColorWithCache($color);
    } catch (err) {
        return null;
    }
}

function getColorModifier(prop: string, value: string): CSSValueModifier {
    if (unparsableColors.has(value.toLowerCase())) {
        return null;
    }
    try {
        const rgb = parseColorWithCache(value);
        if (prop.indexOf('background') >= 0) {
            return (filter) => modifyBackgroundColor(rgb, filter);
        }
        if (prop.indexOf('border') >= 0 || prop.indexOf('outline') >= 0) {
            return (filter) => modifyBorderColor(rgb, filter);
        }
        return (filter) => modifyForegroundColor(rgb, filter);

    } catch (err) {
        console.warn('Color parse error', err);
        return null;
    }
}

const gradientRegex = /[\-a-z]+gradient\(([^\(\)]*(\(.*?\)))*[^\(\)]*\)/g;
const loadedBgImages = new Map<string, HTMLImageElement>();
const filteredImagesDataURLs = new Map<string, string>();
const awaitingForFilters = new Map<string, ((result: string) => void)[]>();

function getBgImageModifier(prop: string, value: string, rule: CSSStyleRule): CSSValueModifier {
    try {

        const gradients = getMatches(gradientRegex, value);
        const urls = getMatches(cssURLRegex, value);

        if (urls.length === 0 && gradients.length === 0) {
            return null;
        }

        const getIndices = (matches: string[]) => {
            let index = 0;
            return matches.map((match) => {
                const valueIndex = value.indexOf(match, index);
                index = valueIndex + match.length;
                return {match, index: valueIndex};
            });
        };
        const matches = getIndices(urls).map((i) => ({type: 'url', ...i}))
            .concat(getIndices(gradients).map((i) => ({type: 'gradient', ...i})))
            .sort((a, b) => a.index - b.index);

        const getGradientModifier = (gradient: string) => {
            const match = gradient.match(/^(.*-gradient)\((.*)\)$/);
            const type = match[1];
            const content = match[2];

            const partsRegex = /([^\(\),]+(\([^\(\)]*\))?[^\(\),]*),?/g;

            const parts = getMatches(partsRegex, content, 1).map((part) => {
                let rgb = tryParseColor(part);
                if (rgb) {
                    return (filter: FilterConfig) => modifyGradientColor(rgb, filter);
                }
                const space = part.lastIndexOf(' ');
                rgb = tryParseColor(part.substring(0, space));
                if (rgb) {
                    return (filter: FilterConfig) => `${modifyGradientColor(rgb, filter)} ${part.substring(space + 1)}`;
                }
                return () => part;
            });

            return (filter: FilterConfig) => {
                return `${type}(${parts.map((modify) => modify(filter)).join(', ')})`;
            };
        };

        const getURLModifier = (urlValue: string) => {
            let url = getCSSURLValue(urlValue);
            if (rule.parentStyleSheet.href) {
                const basePath = getCSSBaseBath(rule.parentStyleSheet.href);
                url = getAbsoluteURL(basePath, url);
            } else {
                url = getAbsoluteURL(location.origin, url);
            }

            if (filteredImagesDataURLs.has(url)) {
                const dataURL = filteredImagesDataURLs.get(url);
                return () => `url("${dataURL}")`;
            }
            if (loadedBgImages.has(url)) {
                return () => urlValue;
            }
            if (awaitingForFilters.has(url)) {
                return () => new Promise<string>((resolve) => {
                    awaitingForFilters.get(url).push(resolve);
                });
            }
            awaitingForFilters.set(url, []);
            return async (filter: FilterConfig) => {
                const image = await loadImage(url);
                if (!state.watching) {
                    return null;
                }
                loadedBgImages.set(url, image);
                const {isDark, isLight, isTransparent, isLarge} = analyzeImage(image);
                let result: string;
                if (isDark && isTransparent && filter.mode === 1) {
                    console.warn(`Inverting dark image ${image.src}`);
                    const inverted = applyFilterToImage(image, {...filter, sepia: clamp(filter.sepia + 90, 0, 100)});
                    filteredImagesDataURLs.set(url, inverted);
                    result = `url("${inverted}")`;
                } else if (isLight && !isTransparent && filter.mode === 1) {
                    if (isLarge) {
                        result = 'none';
                    } else {
                        console.warn(`Inverting light image ${image.src}`);
                        const dimmed = applyFilterToImage(image, filter);
                        filteredImagesDataURLs.set(url, dimmed);
                        result = `url("${dimmed}")`;
                    }
                } else {
                    result = urlValue;
                }
                awaitingForFilters.get(url).forEach((resolve) => resolve(result));
                return result;
            };
        };

        const modifiers: CSSValueModifier[] = [];

        let index = 0;
        matches.forEach(({match, type, index: matchStart}, i) => {
            const prefixStart = index;
            const matchEnd = matchStart + match.length;
            index = matchEnd;
            modifiers.push(() => value.substring(prefixStart, matchStart));
            modifiers.push(type === 'url' ? getURLModifier(match) : getGradientModifier(match));
            if (i === matches.length - 1) {
                modifiers.push(() => value.substring(matchEnd));
            }
        });

        return (filter: FilterConfig) => {
            const results = modifiers.map((modify) => modify(filter));
            if (results.some((r) => r instanceof Promise)) {
                return Promise.all(results)
                    .then((asyncResults) => {
                        if (!state.watching) {
                            return null;
                        }
                        return asyncResults.join('');
                    });
            }
            return results.join('');
        }

    } catch (err) {
        console.warn(`Unable to parse gradient ${value}`, err);
        return null;
    }
}

function getShadowModifier(prop: string, value: string): CSSValueModifier {
    try {
        let index = 0;
        const colorMatches = getMatches(/(^|\s)([a-z]+\(.+?\)|#[0-9a-f]+|[a-z]+)(.*?(inset|outset)?($|,))/ig, value, 2);
        const modifiers = colorMatches.map((match, i) => {
            const prefixIndex = index;
            const matchIndex = value.indexOf(match, index);
            const matchEnd = matchIndex + match.length;
            index = matchEnd;
            const rgb = tryParseColor(match);
            if (!rgb) {
                return () => value.substring(prefixIndex, matchEnd);
            }
            return (filter: FilterConfig) => `${value.substring(prefixIndex, matchIndex)}${modifyShadowColor(rgb, filter)}${i === colorMatches.length - 1 ? value.substring(matchEnd) : ''}`;
        });

        return (filter: FilterConfig) => modifiers.map((modify) => modify(filter)).join('');

    } catch (err) {
        console.warn(`Unable to parse shadow ${value}`, err);
        return null;
    }
}

export function cleanModificationCache() {
    colorParseCache.clear();
    colorModificationCache.clear();
    loadedBgImages.clear();
    filteredImagesDataURLs.clear();
    awaitingForFilters.clear();
}
