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

    async ngOnInit() {
        if (!(await this.gameService.connected())) {
            this.router.navigateByUrl('/login');
        }
    }
}
