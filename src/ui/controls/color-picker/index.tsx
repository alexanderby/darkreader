import {m} from 'malevic';
import {getContext} from 'malevic/dom';
import {parse} from '../../../utils/color';
import TextBox from '../textbox';
import HSBPicker from './hsb-picker';

interface ColorPickerProps {
    class?: any;
    color: string;
    onChange: (color: string) => void;
    onReset: () => void;
}

function isValidColor(color: string) {
    try {
        parse(color);
        return true;
    } catch (err) {
        return false;
    }
}

export default function ColorPicker(props: ColorPickerProps) {
    const context = getContext();
    const store = context.store as {isFocused: boolean, textBoxNode: HTMLInputElement};

    const isColorValid = isValidColor(props.color);

    function onColorPreview(previewColor: string) {
        store.textBoxNode.value = previewColor
        store.textBoxNode.blur();
    }

    function onColorChange(rawValue: string) {
        const value = rawValue.trim();
        if (isValidColor(value)) {
            props.onChange(value);
        } else {
            props.onChange(props.color);
        }
    }

    function focus() {
        if (store.isFocused) {
            return;
        }
        store.isFocused = true;
        context.refresh();
        window.addEventListener('mousedown', onOuterClick);
    }

    function blur() {
        if (!store.isFocused) {
            return;
        }
        window.removeEventListener('mousedown', onOuterClick);
        store.isFocused = false;
        context.refresh();
    }

    function toggleFocus() {
        if (store.isFocused) {
            blur();
        } else {
            focus();
        }
    }

    function onOuterClick(e: MouseEvent) {
        if (!e.composedPath().some((el) => el === context.node)) {
            blur();
        }
    }

    const textBox = (
        <TextBox
            class="color-picker__input"
            onrender={(el) => {
                store.textBoxNode = el as HTMLInputElement;
                store.textBoxNode.value = isColorValid ? props.color : ''
            }}
            onchange={(e) => onColorChange(e.target.value)}
            onkeypress={(e) => {
                const input = e.target as HTMLInputElement;
                if (e.key === 'Enter') {
                    input.blur();
                    blur();
                    onColorChange(input.value);
                }
            }}
            onfocus={focus}
        />
    );

    const previewElement = (
        <span
            class="color-picker__preview"
            style={{'background-color': isColorValid ? props.color : 'transparent'}}
            onclick={toggleFocus}
        ></span>
    );

    const resetButton = (
        <span
            role="button"
            class="color-picker__reset"
            onclick={props.onReset}
        ></span>
    );

    const textBoxLine = (
        <span class="color-picker__textbox-line">
            {textBox}
            {previewElement}
            {resetButton}
        </span>
    );

    const hsbLine = isColorValid ? (
        <span class="color-picker__hsb-line">
            <HSBPicker
                color={props.color}
                onChange={onColorChange}
                onColorPreview={onColorPreview}
            />
        </span>
    ) : null;

    return (
        <span class={['color-picker', store.isFocused && 'color-picker--focused', props.class]}>
            <span class="color-picker__wrapper">
                {textBoxLine}
                {hsbLine}
            </span>
        </span>
    );
}
