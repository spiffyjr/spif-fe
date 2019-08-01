import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    ViewChild,
} from '@angular/core';

import { PlayService } from '../play.service';

@Component({
    selector: 'app-prompt',
    templateUrl: './prompt.component.html',
    styleUrls: ['./prompt.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
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

    constructor(public playService: PlayService, private chRef: ChangeDetectorRef) {
        this.chRef.detach();
    }

    ngAfterViewInit() {
        this.chRef.detectChanges();

        this.prompt.nativeElement.focus();

        this.playService.ontag.subscribe(t => {
            if (t.name === 'prompt') {
                if (this.promptText === t.text) {
                    return;
                } else {
                    this.serverTimeOffset = +new Date() / 1000 - +t.attrs.time;
                    this.promptText = t.text;
                    this.chRef.detectChanges();
                }
            } else if (t.name === 'roundTime' || t.name === 'castTime') {
                const updateEveryMs = 100;

                let time = (+t.attrs.value - +new Date() / 1000 + this.serverTimeOffset) * 1000;
                this.roundtimeCount = Math.ceil(time / 1000);
                this.roundtimeType = t.name;
                this.chRef.detectChanges();

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
                        this.chRef.detectChanges();
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
            default:
                if (this.prompt.nativeElement !== document.activeElement) {
                    this.prompt.nativeElement.focus();
                }
                break;
        }
    }

    send(txt: string, save: boolean) {
        if (txt.trim() === '') {
            return;
        }

        if (save) {
            if (txt.length > 3) {
                this.history.push(txt);
            }
        } else {
            this.historyIndex = -1;
        }

        this.playService.ontag.next({ name: 'text', text: `${this.promptText}${txt}` });
        this.playService.send(txt);
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
            el.value = this.history[idx];
            this.historyIndex = idx;
        }
    }

    private handleArrowDown() {
        let idx: number;

        if (this.historyIndex === -1) {
            return;
        }

        idx = this.historyIndex + 1;
        if (idx < this.history.length) {
            this.prompt.nativeElement.value = this.history[idx];
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
