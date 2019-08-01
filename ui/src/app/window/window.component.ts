import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    OnInit,
    ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as Mark from 'mark.js';

import { PlayService } from '../play.service';
import { SettingsService } from '../settings.service';

interface Output {
    id: number;
    name: string;
    html: SafeHtml;
    style: string;
}

@Component({
    selector: 'app-window',
    templateUrl: './window.component.html',
    styleUrls: ['./window.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WindowComponent implements AfterViewInit, OnInit {
    @ViewChild('container', { static: true })
    container: ElementRef;

    @Input()
    bufferSize = 1000;

    @Input()
    scrollLockOffset = 10;

    @Input()
    mode: 'buffer' | 'single' = 'buffer';

    @Input()
    stream: string = null;

    items: { id: number; class: string; text: string }[] = [];
    scrollLocked = true;

    currentStyle = null;

    lastOutput: Output;
    output: Output[] = [];

    private id = 0;
    private activeStream = null;

    constructor(
        private chRef: ChangeDetectorRef,
        private ds: DomSanitizer,
        private playService: PlayService,
        private settings: SettingsService,
    ) {
        this.chRef.detach();
    }

    ngOnInit() {
        this.playService.ontag.subscribe((tag: any) => {
            if (tag.name === 'style') {
                if (tag.attrs.id === '') {
                    this.currentStyle = null;
                } else {
                    this.currentStyle = tag.attrs.id;
                }
            } else if (tag.name === 'pushStream') {
                this.activeStream = tag.attrs.id;
            } else if (tag.name === 'clearStream' || tag.name === 'popStream') {
                this.activeStream = null;
            } else if (tag.name === 'prompt' && !this.stream) {
                this.addTag(tag);
            } else if (tag.name === 'text' && this.stream === this.activeStream) {
                this.addTag(tag);
            }
        });
    }

    ngAfterViewInit() {
        const el: HTMLElement = this.container.nativeElement;
        this.container.nativeElement.onscroll = () => {
            requestAnimationFrame(() => {
                this.scrollLocked = el.scrollHeight - el.scrollTop - el.clientHeight <= this.scrollLockOffset;
                this.chRef.detectChanges();
            });
        };
    }

    scrollToBottom() {
        const el: HTMLElement = this.container.nativeElement;
        el.scrollTop = el.scrollHeight;
    }

    trackById(_: number, output: Output) {
        return output.id;
    }

    private addTag(tag: any) {
        if (tag.name === 'prompt') {
            if (this.lastOutput && this.lastOutput.name === 'prompt') {
                return;
            }
        } else if (tag.text === undefined) {
            return;
        }

        const output = {
            id: this.id++,
            name: tag.name,
            html: null,
            style: this.currentStyle,
        };

        if (tag.text === '') {
            output.html = '&nbsp;';
        } else {
            output.html = this.ds.bypassSecurityTrustHtml(this.highlight(tag));
        }

        this.output.push(output);
        this.lastOutput = output;

        // trim output to max buffer size
        if (this.output.length > this.bufferSize) {
            this.output.shift();
        }

        this.chRef.detectChanges();

        if (this.scrollLocked) {
            requestAnimationFrame(() => this.scrollToBottom());
        }
    }

    private highlight(tag: any): string {
        const tmp = document.createElement('div');
        tmp.innerHTML = tag.text;

        const mark = new Mark(tmp);
        for (let i = 0; i < this.settings.highlights.length; i++) {
            mark.markRegExp(this.settings.highlights[i].pattern, { element: 'span', className: `hl-${i}` });
        }

        return tmp.innerHTML;
    }
}
