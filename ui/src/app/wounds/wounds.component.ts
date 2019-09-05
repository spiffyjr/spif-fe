import { Component, OnInit } from '@angular/core';

import { GameService } from '../game.service';

@Component({
    selector: 'app-wounds',
    templateUrl: './wounds.component.html',
    styleUrls: ['./wounds.component.scss'],
})
export class WoundsComponent implements OnInit {
    constructor(private gameService: GameService) {}

    ngOnInit() {
        this.gameService.ontag.subscribe(t => {
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
