import { Component, OnInit, HostListener } from '@angular/core';
import { GameService } from '../game.service';
import { SettingsService } from '../settings.service';

interface Key {
    key?: { [key: string]: Key };
    cmd?: string;
}

@Component({
    selector: 'app-game',
    templateUrl: './game.component.html',
    styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit {
    keys: { [key: string]: Key } = {};

    constructor(private gameService: GameService, private settings: SettingsService) {}

    async ngOnInit() {
        await this.settings.load();

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
        this.gameService.sendCommand(key.cmd);
    }
}
