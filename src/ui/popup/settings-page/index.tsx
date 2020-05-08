import {m} from 'malevic';
import {ViewProps} from '../types';
import DevToolsGroup from './devtools';
import EnabledByDefaultGroup from './enabled-by-default';
import HelpGroup from './help';
import InvertPDF from './invert-pdf';
import {isFirefox} from '../../../utils/platform';
import ResetButton from './reset-settings-button';
import AutomationButton from './automation-button';

type SettingsPageProps = ViewProps & {
    onAutomationNavClick: () => void;
};

export default function SettingsPage(props: SettingsPageProps) {
    return (
        <section class="m-section">
            <EnabledByDefaultGroup {...props} />
            {isFirefox() ? null : <InvertPDF {...props} />}
            <DevToolsGroup {...props} />
            <AutomationButton onClick={props.onAutomationNavClick} />
            <ResetButton {...props} />
            <HelpGroup />
        </section>
    );
}
