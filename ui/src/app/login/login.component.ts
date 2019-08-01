import { Component, OnInit } from '@angular/core';
import { GameService } from '../game.service';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PlayNetInstance, PlayNetCharacter } from '../playnet';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
    lichForm: FormGroup;
    playForm: FormGroup;
    playCharacters: PlayNetCharacter[];
    playInstances: PlayNetInstance[];
    playActiveInstance: string;

    error: string;
    working = false;

    constructor(fb: FormBuilder, private gameService: GameService, private router: Router) {
        this.lichForm = fb.group({
            character: ['', Validators.required],
            port: [8000, Validators.required],
        });

        this.playForm = fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required],
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

        this.error = '';
        this.working = true;

        const data = this.lichForm.value;

        try {
            await this.gameService.loginLich(data.character, data.port);
            this.ngOnInit();
        } catch (err) {
            this.error = err;
        }

        this.working = false;
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
