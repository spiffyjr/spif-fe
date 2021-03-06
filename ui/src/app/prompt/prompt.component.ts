import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';

import { GameService } from '../game.service';

@Component({
    selector: 'app-prompt',
    templateUrl: './prompt.component.html',
    styleUrls: ['./prompt.component.scss'],
})
export class PromptComponent implements AfterViewInit {
    @ViewChild('prompt', { static: true })
    prompt: ElementRef;

    @ViewChild('roundtime', { static: true })
    roundtime: ElementRef;

    promptText = '>';

    history: Array<string> = [];
    historyIndex = -1;

    roundtimeCount = 0;
    roundtimeType = null;

    private interval: NodeJS.Timer;
    private serverTimeOffset = 0;

    constructor(public gameService: GameService) {}

    ngAfterViewInit() {
        this.prompt.nativeElement.focus();

        this.gameService.ontag.subscribe(t => {
            if (t.name === 'prompt') {
                if (this.promptText === t.text) {
                    return;
                } else {
                    this.serverTimeOffset = +new Date() / 1000 - +t.attrs.time;
                    this.promptText = t.text;
                }
            } else if (t.name === 'roundTime' || t.name === 'castTime') {
                const updateEveryMs = 100;

                let time = (+t.attrs.value - +new Date() / 1000 + this.serverTimeOffset) * 1000;
                this.roundtimeCount = Math.ceil(time / 1000);
                this.roundtimeType = t.name;

                if (this.interval) {
                    clearInterval(this.interval);
                }

                this.interval = setInterval(() => {
                    time -= updateEveryMs;
                    if (time <= 0) {
                        clearInterval(this.interval);
                    }

                    const newCount = Math.ceil(time / 1000);
                    if (newCount < this.roundtimeCount) {
                        this.roundtimeCount = newCount;
                    }
                }, updateEveryMs);
            } else if (t.name === 'clearPrompt') {
                this.prompt.nativeElement.value = '';
            } else if (t.name === 'sendPrompt') {
                this.send(this.prompt.nativeElement.value, false);
                this.prompt.nativeElement.value = '';
            } else if (t.name === 'addPrompt') {
                this.prompt.nativeElement.value += t.text;
            }
        });
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyPress(event: KeyboardEvent) {
        switch (event.key) {
            case 'ArrowUp':
                this.handleArrowUp();
                break;
            case 'ArrowDown':
                this.handleArrowDown();
                break;
            case 'Enter':
                this.handleEnter(event);
                break;
        }

        // skip modifiers
        if (event.ctrlKey || event.altKey || event.shiftKey) {
            return;
        }

        // auto-focus prompt for A-Z, 0-9, ;, .
        if (
            [186, 190].includes(event.keyCode) ||
            (event.keyCode >= 48 && event.keyCode <= 57) ||
            (event.keyCode >= 65 && event.keyCode <= 90)
        ) {
            if (this.prompt.nativeElement !== document.activeElement) {
                this.prompt.nativeElement.focus();
            }
        }
    }

    send(txt: string, save: boolean) {
        if (txt.trim() === '') {
            return;
        }

        if (save) {
            if (txt.length >= 3) {
                this.history.push(txt);
            }
        } else {
            this.historyIndex = -1;
        }

        this.gameService.ontag.next({ name: 'text', text: `${this.promptText}${txt}` });
        this.gameService.send(txt);
    }

    private handleArrowUp() {
        let idx: number;

        if (this.historyIndex === -1) {
            idx = this.history.length - 1;
        } else {
            idx = this.historyIndex - 1;
        }

        if (idx > -1) {
            const el: HTMLInputElement = this.prompt.nativeElement;
            el.focus();
            el.value = this.history[idx];
            this.historyIndex = idx;

            // TODO: surely a better way to do this?
            setTimeout(() => (el.selectionStart = el.selectionEnd = el.value.length));
        }
    }

    private handleArrowDown() {
        let idx: number;

        if (this.historyIndex === -1) {
            return;
        }

        idx = this.historyIndex + 1;
        if (idx < this.history.length) {
            const el: HTMLInputElement = this.prompt.nativeElement;
            el.focus();
            el.value = this.history[idx];
            this.historyIndex = idx;
        } else {
            this.prompt.nativeElement.value = '';
            this.historyIndex = -1;
        }
    }

    private handleEnter(event: KeyboardEvent) {
        const el = this.prompt.nativeElement as HTMLElement;

        if (event.ctrlKey && this.history.length > 0) {
            this.send(this.history[this.history.length - 1], false);
        } else if (event.altKey && this.history.length > 1) {
            this.send(this.history[this.history.length - 2], false);
        } else if (el === document.activeElement) {
            this.send(this.prompt.nativeElement.value, this.historyIndex === -1);
            this.prompt.nativeElement.value = '';
        } else {
            this.prompt.nativeElement.focus();
        }
    }
}
