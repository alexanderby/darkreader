import {formatCSS} from '../../src/utils/text';

test('CSS formatting', () => {
    expect(formatCSS('div { color: red; }'))
        .toEqual([
            'div {',
            '    color: red;',
            '}',
        ].join('\n'));

    expect(formatCSS('div { color: red; } .list-item { background: rgb(0, 0, 0); color: white; }'))
        .toEqual([
            'div {',
            '    color: red;',
            '}',
            '.list-item {',
            '    background: rgb(0, 0, 0);',
            '    color: white;',
            '}',
        ].join('\n'));

    expect(formatCSS('@media screen { div { color: red; } span { color: red; } } @media all { p { color: green; } }'))
        .toEqual([
            '@media screen {',
            '    div {',
            '        color: red;',
            '    }',
            '    span {',
            '        color: red;',
            '    }',
            '}',
            '@media all {',
            '    p {',
            '        color: green;',
            '    }',
            '}',
        ].join('\n'));

    expect(formatCSS('div, span { background: green; color: red; }'))
        .toEqual([
            'div,',
            'span {',
            '    background: green;',
            '    color: red;',
            '}',
        ].join('\n'));

    expect(formatCSS('@media print, screen and (min-width: 20rem) { div, span { background: green; color: red; } }'))
        .toEqual([
            '@media print,',
            'screen and (min-width: 20rem) {',
            '    div,',
            '    span {',
            '        background: green;',
            '        color: red;',
            '    }',
            '}',
        ].join('\n'));

    expect(formatCSS('.icon { background-image: url(data:image/gif;base64,XYZ); }'))
        .toEqual([
            '.icon {',
            '    background-image: url(data:image/gif;base64,XYZ);',
            '}',
        ].join('\n'));

    expect(formatCSS('img[src*="a,b;c"] { filter: invert(1); }'))
        .toEqual([
            'img[src*="a,b;c"] {',
            '    filter: invert(1);',
            '}',
        ].join('\n'));
});
