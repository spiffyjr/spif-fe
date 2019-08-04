import { Component, OnInit, OnDestroy } from '@angular/core';
import { GameService } from '../game.service';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PlayNetInstance, PlayNetCharacter } from '../playnet';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnDestroy, OnInit {
    update$ = new Subject<{ error?: string; working?: boolean; login?: boolean }>();

    playForm: FormGroup;
    playCharacters: PlayNetCharacter[];
    playInstances: PlayNetInstance[];
    playActiveInstance: string;

    error: string;
    working = false;

    private ngUnsubscribe = new Subject<void>();

    constructor(fb: FormBuilder, private gameService: GameService, private router: Router) {
        this.playForm = fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required],
        });
    }

    async ngOnInit() {
        if (await this.gameService.connected()) {
            this.router.navigateByUrl('/game');
        }
        this.update$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(update => {
            this.working = update.working;
            this.error = update.error;

            if (update.login) {
                this.router.navigateByUrl('/game');
            }
        });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    async playNetConnect() {
        if (this.playForm.invalid) {
            return;
        }

        this.error = '';
        this.working = true;

        const data = this.playForm.value;

        try {
            await this.gameService.playNetConnect(data.username, data.password);
        } catch (err) {
            this.error = err;
            return;
        }

        try {
            this.playInstances = await this.gameService.playNetInstances();
        } catch (err) {
            this.error = err;
            return;
        }

        this.working = false;
    }

    async playNetCharacters(code: string) {
        this.playActiveInstance = code;

        try {
            this.playCharacters = await this.gameService.playNetCharacters(code);
        } catch (err) {
            this.error = err;
        }
    }

    async loginPlayNet(characterId: string) {
        try {
            const loginData = await this.gameService.playNetLoginData(this.playActiveInstance, characterId);
            await this.gameService.loginPlayNet(loginData.host, loginData.port, loginData.key);
            this.ngOnInit();
        } catch (err) {
            this.error = err;
        }

        this.playActiveInstance = undefined;
        this.playCharacters = undefined;
        this.playInstances = undefined;
        this.working = false;
    }
}
