import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressBarComponent } from './progress-bar/progress-bar.component';
import { LabelComponent } from './label/label.component';
import { DataComponent } from './data/data.component';
import { MatExpansionModule } from '@angular/material';

@NgModule({
    declarations: [DataComponent, ProgressBarComponent, LabelComponent],
    imports: [CommonModule, MatExpansionModule],
})
export class DialogModule {}
