import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    ViewChild,
} from '@angular/core';

import { PlayService } from '../play.service';

@Component({
    selector: 'app-status',
    templateUrl: './status.component.html',
    styleUrls: ['./status.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusComponent implements AfterViewInit {
    @ViewChild('barEl', { static: true })
    barEl: ElementRef;

    @ViewChild('fillEl', { static: true })
    fillEl: ElementRef;

    @Input()
    type: string;

    @Input()
    color: string;

    @Input()
    background: string;

    @Input()
    fill: string;

    text = 'n/a';
    percent = '0%';

    constructor(private chRef: ChangeDetectorRef, private playService: PlayService) {
        this.chRef.detach();
    }

    ngAfterViewInit() {
        this.chRef.detectChanges();

        (this.barEl.nativeElement as HTMLElement).style.color = this.color;
        (this.barEl.nativeElement as HTMLElement).style.backgroundColor = this.background;
        (this.fillEl.nativeElement as HTMLElement).style.backgroundColor = this.fill;

        this.playService.ontag.subscribe(t => {
            if (t.name !== 'progressBar' || t.attrs.id !== this.type) {
                return;
            }

            if (t.attrs.text) {
                this.text = t.attrs.text;
            }

            if (['pbarStance', 'mindState', 'encumlevel'].includes(this.type)) {
                this.percent = `${t.attrs.value}%`;
            } else {
                const match = t.attrs.text.match(/(\d+)\/(\d+)/);
                if (match) {
                    this.percent = `${Math.floor((+match[1] / +match[2]) * 100)}%`;
                }
            }

            this.chRef.detectChanges();
        });
    }
}
