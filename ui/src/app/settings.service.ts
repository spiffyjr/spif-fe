import { Injectable } from '@angular/core';

interface Settings {
    highlights: SettingsHighlight[];
    macros: SettingsMacro[];
}

interface SettingsHighlight {
    pattern: string | RegExp;
    color: string;
}

interface SettingsMacro {
    key: string;
    cmd: string;
}

declare global {
    interface Window {
        settingsLoad(): Promise<Settings>;
    }
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
    highlights: SettingsHighlight[] = [];
    macros: SettingsMacro[] = [];

    async load(): Promise<void> {
        return window.settingsLoad().then(settings => {
            console.log(`settings loaded: ${JSON.stringify(settings)}`);

            this.highlights = settings.highlights;

            for (const highlight of settings.highlights) {
                highlight.pattern = new RegExp(highlight.pattern);
            }

            this.macros = settings.macros;
            this.applyHighlights();
        });
    }

    private applyHighlights() {
        // clean up old styles if they exist
        const ele = document.getElementById('hl-styles');
        if (ele) {
            document.head.removeChild(ele);
        }

        // apply highlight styling to body
        const head = document.head;
        const style = document.createElement('style');
        style.setAttribute('id', 'hl-styles');
        style.setAttribute('type', 'text/css');

        head.appendChild(style);

        let css = '';

        for (let i = 0; i < this.highlights.length; i++) {
            css += `.hl-${i}{ color: ${this.highlights[i].color} }\n`;
        }

        style.appendChild(document.createTextNode(css));
    }
}
