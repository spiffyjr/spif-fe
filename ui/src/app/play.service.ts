import { Injectable } from '@angular/core';
import { Tag } from './tag';
import { Subject } from 'rxjs';

declare global {
    interface Window {
        connect(host: string, port: number): Promise<void>;
        ontag(tag: Tag): void;
        send(cmd: string): Promise<void>;
    }
}

@Injectable({ providedIn: 'root' })
export class PlayService {
    ontag = new Subject<Tag>();

    constructor() {
        window.ontag = (tag: Tag) => {
            this.ontag.next(tag);
        };
    }

    async connect(host: string, port: number): Promise<void> {
        return window
            .connect(host, port)
            .then(() => this.message(`connected to ${host}:${port}`))
            .catch(err => this.error(`failed to connect: ${err}`));
    }

    async send(cmd: string): Promise<void> {
        return window.send(cmd).catch(err => this.error(`failed to send: ${err}`));
    }

    error(text: string) {
        this.ontag.next({ name: 'text', text, attrs: { class: 'error' } });
    }

    message(text: string) {
        this.ontag.next({ name: 'text', text });
    }
}
