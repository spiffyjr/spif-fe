import { ChangeDetectionStrategy, Component, HostListener, OnInit } from '@angular/core';

import { PlayService } from './play.service';
import { SettingsService } from './settings.service';

interface Key {
    key?: { [key: string]: Key };
    cmd?: string;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
    keys: { [key: string]: Key } = {};

    constructor(private playService: PlayService, private settings: SettingsService) {}

    ngOnInit() {
        // this.playService.connect('localhost', 8000);

        this.applyHighlights();

        for (const macro of this.settings.macros) {
            const keyParts = macro.key.split('+');

            let currentKey: any = this.keys;
            for (let i = 0; i < keyParts.length; i++) {
                const key = keyParts[i].toLowerCase().trim();
                if (!currentKey[key]) {
                    currentKey[key] = {};
                }
                currentKey = currentKey[key];

                if (i === keyParts.length - 1) {
                    currentKey.cmd = macro.cmd;
                }
            }
        }
    }

    @HostListener('document:keydown', ['$event'])
    handleMacros(event: KeyboardEvent) {
        let key: Key;
        if (event.ctrlKey) {
            if (!this.keys.ctrl) {
                return;
            }
            key = this.keys.ctrl;
        } else if (event.altKey) {
            if (!this.keys.alt) {
                return;
            }
            key = this.keys.alt;
        } else {
            key = this.keys;
        }

        key = key[event.key.toLowerCase().trim()];

        if (!key || !key.cmd) {
            return;
        }

        event.preventDefault();

        let backslash = false;
        for (const ch of key.cmd) {
            if (backslash) {
                if (ch === '\\') {
                } else if (ch === 'x') {
                    this.playService.ontag.next({ name: 'clearPrompt' });
                } else if (ch === 'r') {
                    this.playService.ontag.next({ name: 'sendPrompt' });
                }
                backslash = false;
            } else {
                if (ch === '\\') {
                    backslash = true;
                } else {
                    this.playService.ontag.next({ name: 'addPrompt', text: ch });
                }
            }
        }
    }

    private applyHighlights() {
        const head = document.head;
        const style = document.createElement('style');
        style.setAttribute('type', 'text/css');

        head.appendChild(style);

        let css = '';

        for (let i = 0; i < this.settings.highlights.length; i++) {
            css += `.hl-${i}{ color: ${this.settings.highlights[i].color} }\n`;
        }

        style.appendChild(document.createTextNode(css));
    }
}
