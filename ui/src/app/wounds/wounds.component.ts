import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

import { PlayService } from '../play.service';

@Component({
    selector: 'app-wounds',
    templateUrl: './wounds.component.html',
    styleUrls: ['./wounds.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WoundsComponent implements OnInit {
    constructor(private playService: PlayService) {}

    ngOnInit() {
        this.playService.ontag.subscribe(t => {
            if (t.name !== 'image' || !t.attrs.name || !t.attrs.name.match(/^(?:Wound|Scar)/)) {
                return;
            }

            const el: HTMLSpanElement = document.getElementById(t.attrs.id);
            if (!el) {
                return;
            }

            el.className = t.attrs.name.toLowerCase();
        });
    }
}
