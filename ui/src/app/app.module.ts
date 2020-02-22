import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import 'reflect-metadata';

import '../polyfills';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CompassComponent } from './compass/compass.component';
import { PromptComponent } from './prompt/prompt.component';
import { WindowComponent } from './window/window.component';
import { WoundsComponent } from './wounds/wounds.component';
import { LoginComponent } from './login/login.component';
import { GameComponent } from './game/game.component';
import { LoginLichComponent } from './login-lich/login-lich.component';
import { LoginPlayComponent } from './login-play/login-play.component';
import { DialogModule } from './dialog/dialog.module';
import { SidebarComponent } from './sidebar/sidebar.component';

@NgModule({
    declarations: [
        AppComponent,
        CompassComponent,
        PromptComponent,
        WindowComponent,
        WoundsComponent,
        LoginComponent,
        GameComponent,
        LoginLichComponent,
        LoginPlayComponent,
        SidebarComponent,
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
        DialogModule,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
