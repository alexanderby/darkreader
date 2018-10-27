import {html, ChildDeclaration} from 'malevic';

interface ToggleProps {
    class?: string;
    checked: boolean;
    labelOn: ChildDeclaration;
    labelOff: ChildDeclaration;
    onChange: (checked: boolean) => void;
}

export default function Toggle(props: ToggleProps) {
    const {checked, onChange} = props;

    const cls = [
        'toggle',
        checked ? 'toggle--checked' : null,
        props.class,
    ];

    const clsOn = {
        'toggle__btn': true,
        'toggle__on': true,
        'toggle__btn--active': checked
    };

    const clsOff = {
        'toggle__btn': true,
        'toggle__off': true,
        'toggle__btn--active': !checked
    };

    return (
        <span class={cls}>
            <span
                class={clsOn}
                onclick={onChange ? () => !checked && onChange(true) : null}
            >
                {props.labelOn}
            </span>
            <span
                class={clsOff}
                onclick={onChange ? () => checked && onChange(false) : null}
            >
                {props.labelOff}
            </span>
        </span>
    );
}
