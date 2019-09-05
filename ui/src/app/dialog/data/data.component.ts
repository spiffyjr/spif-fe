import {
    Component,
    ComponentFactoryResolver,
    ViewContainerRef,
    ViewChild,
    Input,
    ChangeDetectorRef,
} from '@angular/core';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { Tag } from 'src/app/tag';

@Component({
    selector: 'dialog-data',
    templateUrl: './data.component.html',
    styleUrls: ['./data.component.scss'],
})
export class DataComponent {
    static componentMap = {
        progressBar: ProgressBarComponent,
    };

    @ViewChild('viewRef', { read: ViewContainerRef, static: true })
    viewRef: ViewContainerRef;

    @Input()
    tag: Tag;

    id: string;

    constructor(private cmpFactory: ComponentFactoryResolver, private chRef: ChangeDetectorRef) {}

    update() {
        this.viewRef.clear();

        if (this.tag.attrs.clear && this.tag.attrs.clear != '') {
            return;
        }

        this.id = this.tag.attrs.id;

        for (const child of this.tag.children) {
            if (!DataComponent.componentMap[child.name]) {
                continue;
            }

            const cmp = DataComponent.componentMap[child.name];
            const cmpRef: any = this.viewRef.createComponent(this.cmpFactory.resolveComponentFactory(cmp)).instance;
            cmpRef.attrs = child.attrs;
            cmpRef.update();
        }

        this.chRef.detectChanges();
    }
}
