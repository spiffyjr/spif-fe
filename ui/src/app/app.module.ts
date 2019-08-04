import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import 'reflect-metadata';

import '../polyfills';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CompassComponent } from './compass/compass.component';
import { PromptComponent } from './prompt/prompt.component';
import { StatusComponent } from './status/status.component';
import { WindowComponent } from './window/window.component';
import { WoundsComponent } from './wounds/wounds.component';
import { LoginComponent } from './login/login.component';
import { GameComponent } from './game/game.component';
import { LoginLichComponent } from './login-lich/login-lich.component';
import { LoginPlayComponent } from './login-play/login-play.component';

@NgModule({
    declarations: [
        AppComponent,
        CompassComponent,
        PromptComponent,
        StatusComponent,
        WindowComponent,
        WoundsComponent,
        LoginComponent,
        GameComponent,
        LoginLichComponent,
        LoginPlayComponent,
    ],
    imports: [
        // @angular/angular
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,

        // @angular/material
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatTabsModule,

        AppRoutingModule,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
