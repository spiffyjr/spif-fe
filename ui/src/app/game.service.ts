import { Injectable } from '@angular/core';
import { Tag } from './tag';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

declare global {
    interface Window {
        disconnect(): Promise<void>;
        connectPlayNet(host: string, port: number, key: string): Promise<void>;
        connectLich(name: string, port: number): Promise<void>;
        connected(): Promise<boolean>;
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

    connectLich(name: string, port: number): Promise<void> {
        return window.connectLich(name, port);
    }

    connectPlayNet(host: string, port: number, key: string): Promise<void> {
        return window.connectPlayNet(host, port, key);
    }

    disconnect(): Promise<void> {
        return window.disconnect();
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
