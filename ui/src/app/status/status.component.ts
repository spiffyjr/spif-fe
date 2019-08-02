import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Input,
    ViewChild,
} from '@angular/core';

import { GameService } from '../game.service';

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
    name: string;

    @Input()
    color: string;

    @Input()
    background: string;

    @Input()
    fill: string;

    text = 'n/a';
    percent = '0%';

    constructor(private chRef: ChangeDetectorRef, private gameService: GameService) {
        this.chRef.detach();
    }

    ngAfterViewInit() {
        this.chRef.detectChanges();

        (this.barEl.nativeElement as HTMLElement).style.color = this.color;
        (this.barEl.nativeElement as HTMLElement).style.backgroundColor = this.background;
        (this.fillEl.nativeElement as HTMLElement).style.backgroundColor = this.fill;

        this.gameService.ontag.subscribe(t => {
            if (t.name !== 'dialogData') {
                return;
            } else if (t.attrs['id'] !== this.type) {
                return;
            }

            const child = t.children.find(c => c.name === 'progressBar' && c.attrs && c.attrs.id === this.name);

            if (!child) {
                return;
            }

            if (child.attrs.text) {
                this.text = child.attrs.text;
            }

            if (['pbarStance', 'mindState', 'encumlevel'].includes(this.name)) {
                this.percent = `${child.attrs.value}%`;
            } else {
                const match = child.attrs.text.match(/(\d+)\/(\d+)/);
                if (match) {
                    this.percent = `${Math.floor((+match[1] / +match[2]) * 100)}%`;
                }
            }

            this.chRef.detectChanges();
        });
    }
}
