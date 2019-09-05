import { Component, AfterViewInit, ComponentFactoryResolver, ViewChild, ViewContainerRef } from '@angular/core';
import { DataComponent } from '../dialog/data/data.component';
import { GameService } from '../game.service';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements AfterViewInit {
    @ViewChild('container', { read: ViewContainerRef, static: true })
    container: ViewContainerRef;

    dialogs: { [id: string]: DataComponent } = {};

    constructor(private cmpFactory: ComponentFactoryResolver, private gameService: GameService) {}

    ngAfterViewInit() {
        this.gameService.ondialogdata.subscribe(t => {
            if (!['ActiveSpells', 'stance', 'expr'].includes(t.attrs.id)) {
                return;
            }

            if (!this.dialogs[t.attrs.id]) {
                this.dialogs[t.attrs.id] = this.container.createComponent(
                    this.cmpFactory.resolveComponentFactory(DataComponent),
                ).instance;
            }

            const cmp = this.dialogs[t.attrs.id];
            cmp.tag = t;
            cmp.update();
        });
    }
}
