import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-compass',
    templateUrl: './compass.component.html',
    styleUrls: ['./compass.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompassComponent implements OnInit {
    ngOnInit() {}
}
