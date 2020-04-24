import {m} from 'malevic';
import {Button} from '../../controls';
import {ViewProps} from '../types';
import AppSwitch from './app-switch';
import SiteToggleGroup from './site-toggle';
import ThemeGroup from './theme-group';

function SwitchGroup(props: ViewProps) {
    return (
        <Array>
            <AppSwitch {...props} />
            <SiteToggleGroup {...props} />
        </Array>
    );
}

function SettingsNavButton(props: {onClick: () => void}) {
    return (
        <Button class="m-settings-button" onclick={props.onClick}>
            <span class="m-settings-button__content">
                <span class="m-settings-button__icon" />
                <span class="m-settings-button__text">Settings</span>
            </span>
        </Button>
    );
}

export default function MainPage(props: ViewProps & {onSettingsNavClick: () => void}) {
    return (
        <Array>
            <section class="m-section">
                <SwitchGroup {...props} />
            </section>
            <section class="m-section">
                <ThemeGroup {...props} />
            </section>
            <section class="m-section">
                <SettingsNavButton onClick={props.onSettingsNavClick} />
            </section>
        </Array>
    );
}
