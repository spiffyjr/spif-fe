import { Component, OnInit } from '@angular/core';
import { GameService } from './game.service';
import { Router } from '@angular/router';
import { SettingsService } from './settings.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    constructor(private settings: SettingsService, private gameService: GameService, private router: Router) {}

    ngOnInit() {
        const check = setInterval(async () => {
            if (window.connected) {
                clearInterval(check);

                await this.settings.load();

                if (!(await this.gameService.connected())) {
                    this.router.navigateByUrl('/login');
                }
            }
        }, 100);
    }
}
