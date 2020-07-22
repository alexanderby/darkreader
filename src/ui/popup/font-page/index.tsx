import {m} from 'malevic';
import {ViewProps} from '../types';
import {CheckBox, Select, UpDown} from '../../controls';
import {getLocalMessage} from '../../../utils/locales';

export default function FontPage(props: ViewProps) {
    function onFontChange(font: any) {
        props.actions.setTheme({useFont: font});
    }
    function onFontFamilyChange(fontfamily: any) {
        props.actions.setTheme({fontFamily: fontfamily});
    }
    function onTextStrokeChange(textstroke: any) {
        props.actions.setTheme({textStroke: textstroke});
    }

    return (
        <section class="m-section">
            <div class="font-settings__line">
                <CheckBox
                    checked={props.data.settings.theme.useFont}
                    onchange={(e: any) => onFontChange(e.target.checked)}
                />
                <Select
                    value={props.data.settings.theme.fontFamily}
                    onChange={(value) => onFontFamilyChange(value)}
                    options={props.data.fonts.reduce((map, font) => {
                        map[font] = (
                            <div style={{'font-family': font}}>
                                {font}
                            </div>
                        );
                        return map;
                    }, {} as {[font: string]: Malevic.Spec})}
                />
            </div>
            <UpDown
                value={props.data.settings.theme.textStroke}
                min={0}
                max={1}
                step={0.1}
                default={0}
                name={getLocalMessage('text_stroke')}
                onChange={(value) => onTextStrokeChange(value)}
            />
        </section>
    );
}
