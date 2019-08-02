import { Injectable } from '@angular/core';

interface Settings {
    highlights: SettingsHighlight[];
    macros: SettingsMacro[];
}

interface SettingsHighlight {
    pattern: string;
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
            this.highlights = settings.highlights;
            this.macros = settings.macros;
            this.applyHighlights();
        });
    }

    private applyHighlights() {
        // apply highlight styling to body
        const head = document.head;
        const style = document.createElement('style');
        style.setAttribute('type', 'text/css');

        head.appendChild(style);

        let css = '';

        for (let i = 0; i < this.highlights.length; i++) {
            css += `.hl-${i}{ color: ${this.highlights[i].color} }\n`;
        }

        style.appendChild(document.createTextNode(css));
    }
}
