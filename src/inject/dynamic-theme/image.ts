import {createFilterMatrix, applyColorMatrix} from '../../generators/utils/matrix';
import state from './state';
import {getAbsoluteURL} from './url';
import {scale, clamp} from '../../utils/math';
import {FilterConfig} from '../../definitions';

export function analyzeImage(image: HTMLImageElement) {
    const MAX_ANALIZE_PIXELS_COUNT = 32 * 32;

    const naturalPixelsCount = image.naturalWidth * image.naturalHeight;
    const k = Math.min(1, Math.sqrt(MAX_ANALIZE_PIXELS_COUNT / naturalPixelsCount));
    const width = Math.max(1, Math.round(image.naturalWidth * k));
    const height = Math.max(1, Math.round(image.naturalHeight * k));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    const d = imageData.data;

    const TRANSPARENT_ALPHA_THRESHOLD = 0.25;
    const DARK_LIGHTNESS_THRESHOLD = 0.4;
    const LIGHT_LIGHTNESS_THRESHOLD = 0.6;

    let transparentPixelsCount = 0;
    let darkPixelsCount = 0;
    let lightPixelsCount = 0;

    let i: number, x: number, y: number;
    let r: number, g: number, b: number, a: number;
    let l: number, min: number, max: number;
    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            i = 4 * (y * width + x);
            r = d[i + 0] / 255;
            g = d[i + 1] / 255;
            b = d[i + 2] / 255;
            a = d[i + 3] / 255;

            if (a < TRANSPARENT_ALPHA_THRESHOLD) {
                transparentPixelsCount++;
            } else {
                min = Math.min(r, g, b);
                max = Math.max(r, g, b);
                l = (max + min) / 2;
                if (l < DARK_LIGHTNESS_THRESHOLD) {
                    darkPixelsCount++;
                }
                if (l > LIGHT_LIGHTNESS_THRESHOLD) {
                    lightPixelsCount++;
                }
            }
        }
    }

    const totalPixelsCount = width * height;
    const opaquePixelsCount = totalPixelsCount - transparentPixelsCount;

    const DARK_IMAGE_THRESHOLD = 0.7;
    const LIGHT_IMAGE_THRESHOLD = 0.7;
    const TRANSPARENT_IMAGE_THRESHOLD = 0.1;

    return {
        isDark: ((darkPixelsCount / opaquePixelsCount) >= DARK_IMAGE_THRESHOLD),
        isLight: ((lightPixelsCount / opaquePixelsCount) >= LIGHT_IMAGE_THRESHOLD),
        isTransparent: ((transparentPixelsCount / totalPixelsCount) >= TRANSPARENT_IMAGE_THRESHOLD),
    };
}

export function applyFilterToImage(image: HTMLImageElement, filter: FilterConfig) {
    const matrix = createFilterMatrix(filter);
    const width = image.naturalWidth;
    const height = image.naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    const d = imageData.data;

    let i: number, x: number, y: number;
    let r: number, g: number, b: number, a: number;
    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            i = 4 * (y * width + x);
            r = d[i + 0];
            g = d[i + 1];
            b = d[i + 2];
            a = d[i + 3];
            [r, g, b] = applyColorMatrix([r, g, b], matrix);
            d[i + 0] = r;
            d[i + 1] = g;
            d[i + 2] = b;
            d[i + 3] = a;
        }
    }
    context.putImageData(imageData, 0, 0);

    const HIGH_QUALITY_PIXELS_COUNT = 256 * 256;
    const LOW_QUALITY_PIXELS_COUNT = 1920 * 1080;

    const pixelsCount = width * height;
    return (pixelsCount <= HIGH_QUALITY_PIXELS_COUNT ?
        canvas.toDataURL('image/png') :
        canvas.toDataURL('image/jpeg', clamp(scale(pixelsCount, LOW_QUALITY_PIXELS_COUNT, HIGH_QUALITY_PIXELS_COUNT, 0, 1), 0, 1)));
}

export function loadImage(url: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => {
            resolve(image);
        });
        let triedBGFetch = false;
        image.addEventListener('error', () => {
            if (triedBGFetch || url.match(/^data\:/)) {
                reject(`Unable to load image ${url}`);
            } else {
                console.warn(`Unable to load image ${url}`);
                if (!state.watching) {
                    reject('Image loading cancelled');
                    return;
                }
                triedBGFetch = true;
                chrome.runtime.sendMessage({type: 'fetch', data: url}, ({data, error}) => {
                    if (error) {
                        reject(error);
                    } else {
                        const dataURL = URL.createObjectURL(data);
                        image.src = dataURL;
                        image.addEventListener('load', () => URL.revokeObjectURL(data));
                        image.addEventListener('error', () => URL.revokeObjectURL(data));
                    }
                });
            }
        });
        image.crossOrigin = 'Anonymous';
        image.src = url;
    });
}
