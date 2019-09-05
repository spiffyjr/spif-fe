import { Component, Input, ChangeDetectorRef } from '@angular/core';

@Component({
    selector: 'dialog-progress-bar',
    templateUrl: './progress-bar.component.html',
    styleUrls: ['./progress-bar.component.scss'],
})
export class ProgressBarComponent {
    @Input()
    attrs: { [key: string]: string } = {};

    constructor(private chRef: ChangeDetectorRef) {}

    update() {
        this.chRef.markForCheck();
    }
}
