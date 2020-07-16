import {m} from 'malevic';
import {ViewProps} from '../types';
import {Button} from '../../controls';
import {saveFile} from '../../utils';
import ControlGroup from '../control-group';
import {getURLHost} from '../../../utils/url';

export default function ExportTheme(props: ViewProps) {
    const listener = ({type, data}, sender: chrome.runtime.MessageSender) => {
        if (type === 'export-css-response') {
            const url = getURLHost(sender.tab.url).replace(/[^a-z0-1\-]/g, '-');
            saveFile(`DarkReader-${url}.css`, data);
            chrome.runtime.onMessage.removeListener(listener);
        }
    };

    function exportCSS() {
        chrome.runtime.onMessage.addListener(listener);
        chrome.runtime.sendMessage({type: 'request-export-css'});
    }
    return (
        <ControlGroup>
            <ControlGroup.Control>
                <Button
                    onclick={exportCSS}
                    class="settings-button"
                >
                    Export Dynamic Theme
                </Button>
            </ControlGroup.Control>
            <ControlGroup.Description>
                Save generated CSS to a file
            </ControlGroup.Description>
        </ControlGroup>
    );
}
