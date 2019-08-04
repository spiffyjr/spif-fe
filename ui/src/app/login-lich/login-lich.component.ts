import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { GameService } from '../game.service';
import { LichProcess } from '../lich';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-login-lich',
    templateUrl: './login-lich.component.html',
    styleUrls: ['./login-lich.component.scss'],
})
export class LoginLichComponent implements OnInit {
    @Input()
    update$: Subject<{ error?: string; working?: boolean; login?: boolean }>;

    form: FormGroup;
    processes: LichProcess[];

    constructor(fb: FormBuilder, private gameService: GameService) {
        this.form = fb.group({
            character: ['', Validators.required],
            port: [8000, Validators.required],
        });
    }

    async ngOnInit() {
        this.processes = await this.gameService.lichProcesses();
    }

    async login(character: string, port: number) {
        this.update$.next({ working: true });

        try {
            await this.gameService.loginLich(character, port);
            this.update$.next({ login: true });
        } catch (err) {
            this.update$.next({ error: err });
        }

        this.update$.next({ working: false });
    }
}
