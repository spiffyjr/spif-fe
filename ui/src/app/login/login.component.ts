import { Component, OnInit } from '@angular/core';
import { GameService } from '../game.service';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
    lichForm: FormGroup;
    working = false;

    constructor(fb: FormBuilder, private gameService: GameService, private router: Router) {
        this.lichForm = fb.group({
            character: ['', Validators.required],
            port: [8000, Validators.required],
        });
    }

    async ngOnInit() {
        if (await this.gameService.connected()) {
            this.router.navigateByUrl('/');
        }
    }

    async loginLich() {
        if (this.lichForm.invalid) {
            return;
        }

        this.working = true;

        const data = this.lichForm.value;

        try {
            await this.gameService.connectLich(data.character, data.port);
        } catch (err) {
            // TODO: show error
        }

        this.working = false;
        this.ngOnInit();
    }
}
