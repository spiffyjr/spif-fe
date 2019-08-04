import { Injectable } from '@angular/core';
import { Tag } from './tag';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { PlayNetInstance, PlayNetCharacter, PlayNetLoginData } from './playnet';
import { LichProcess } from './lich';

declare global {
    interface Window {
        connected(): Promise<boolean>;
        disconnect(): Promise<void>;

        lichProcesses(): Promise<LichProcess[]>;

        loginPlayNet(host: string, port: number, key: string): Promise<void>;
        loginLich(name: string, port: number): Promise<void>;

        playNetCharacters(gameCode: string): Promise<PlayNetCharacter[]>;
        playNetConnect(username: string, password: string): Promise<void>;
        playNetInstances(): Promise<PlayNetInstance[]>;
        playNetLoginData(gameCode: string, characterId: string): Promise<PlayNetLoginData>;

        ontag(tag: Tag): void;
        send(cmd: string): Promise<void>;
    }
}

@Injectable({ providedIn: 'root' })
export class GameService {
    ontag = new Subject<Tag>();

    constructor(private router: Router) {
        window.ontag = (tag: Tag) => {
            this.ontag.next(tag);
        };
    }

    connected(): Promise<boolean> {
        return window.connected();
    }

    disconnect(): Promise<void> {
        return window.disconnect();
    }

    lichProcesses(): Promise<LichProcess[]> {
        return window.lichProcesses();
    }

    loginLich(name: string, port: number): Promise<void> {
        return window.loginLich(name, port);
    }

    loginPlayNet(host: string, port: number, key: string): Promise<void> {
        return window.loginPlayNet(host, port, key);
    }

    playNetCharacters(gameCode): Promise<PlayNetCharacter[]> {
        return window.playNetCharacters(gameCode);
    }

    playNetConnect(username: string, password: string): Promise<void> {
        return window.playNetConnect(username, password);
    }

    playNetInstances(): Promise<PlayNetInstance[]> {
        return window.playNetInstances();
    }

    playNetLoginData(gameCode: string, characterId: string): Promise<PlayNetLoginData> {
        return window.playNetLoginData(gameCode, characterId);
    }

    async sendCommand(cmd: string): Promise<void> {
        let backslash = false;
        for (const ch of cmd) {
            if (backslash) {
                if (ch === '\\') {
                } else if (ch === 'x') {
                    this.ontag.next({ name: 'clearPrompt' });
                } else if (ch === 'r') {
                    this.ontag.next({ name: 'sendPrompt' });
                }
                backslash = false;
            } else {
                if (ch === '\\') {
                    backslash = true;
                } else {
                    this.ontag.next({ name: 'addPrompt', text: ch });
                }
            }
        }
    }

    async send(cmd: string): Promise<void> {
        if (cmd[0] === '.') {
            cmd = cmd.substring(1);

            switch (cmd) {
                case 'disconnect':
                case 'quit':
                    await this.disconnect();
                    this.router.navigateByUrl('/login');
                    return;
            }

            this.error(`Unrecognized command.`);
            return;
        }
        return window.send(cmd);
    }

    error(text: string) {
        this.ontag.next({ name: 'text', text, attrs: { class: 'error' } });
    }

    message(text: string) {
        this.ontag.next({ name: 'text', text });
    }
}
