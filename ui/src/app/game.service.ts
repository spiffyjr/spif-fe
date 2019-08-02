import { Injectable } from '@angular/core';
import { Tag } from './tag';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { PlayNetInstance, PlayNetCharacter, PlayNetLoginData } from './playnet';

declare global {
    interface Window {
        connected(): Promise<boolean>;
        disconnect(): Promise<void>;

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

    async send(cmd: string): Promise<void> {
        if (cmd[0] === '.') {
            cmd = cmd.substring(1);

            switch (cmd) {
                case 'disconnect':
                case 'quit':
                    await this.disconnect();
                    this.message('*');
                    this.message('* Disconnected');
                    this.message('*');
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