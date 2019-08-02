import { Component, OnInit } from '@angular/core';
import { GameService } from './game.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    constructor(private gameService: GameService, private router: Router) {}

    ngOnInit() {
        const check = setInterval(async () => {
            if (window.connected) {
                clearInterval(check);

                if (await this.gameService.connected()) {
                    this.router.navigateByUrl('/game');
                } else {
                    this.router.navigateByUrl('/login');
                }
            }
        }, 100);
    }
}
