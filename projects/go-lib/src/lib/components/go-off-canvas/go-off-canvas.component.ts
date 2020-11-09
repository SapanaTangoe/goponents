import {
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { fadeAnimation } from '../../animations/fade.animation';
import { offCanvasAnimation } from '../../animations/off-canvas.animation';
import { GoOffCanvasDirective } from './go-off-canvas.directive';
import { GoOffCanvasItem } from './go-off-canvas.interface';
import { GoOffCanvasService } from './go-off-canvas.service';

@Component({
  selector: 'go-off-canvas',
  templateUrl: './go-off-canvas.component.html',
  styleUrls: [
    './go-off-canvas.component.scss'
  ],
  animations: [
    fadeAnimation,
    offCanvasAnimation
  ]
})
export class GoOffCanvasComponent implements OnInit, OnDestroy {
  currentOffCanvasItem: GoOffCanvasItem;
  opened: boolean = false;
  header: string;
  screenWidth: number;

  private destroy$: Subject<void> = new Subject();

  @ViewChild(GoOffCanvasDirective, { static: true }) goOffCanvasHost: GoOffCanvasDirective;
  size: 'large' | 'small' = 'small';

  @HostListener('window:resize')
  onResize(): void {
    this.screenWidth = window.innerWidth;
  }

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private goOffCanvasService: GoOffCanvasService
  ) { }

  ngOnInit(): void {
    this.screenWidth = window.innerWidth;

    this.goOffCanvasService.activeOffCanvasComponent
      .pipe(takeUntil(this.destroy$))
      .subscribe((goOffCanvasItem: GoOffCanvasItem) => {
        this.currentOffCanvasItem = goOffCanvasItem;
        this.loadComponent();
      });

    this.goOffCanvasService.offCanvasOpen
      .pipe(takeUntil(this.destroy$))
      .subscribe((value: boolean) => {
        this.opened = value;
        if (this.opened === false) {
          this.destroyComponent();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  closeOffCanvas(): void {
    this.goOffCanvasService.closeOffCanvas();
  }

  getOffCanvasWidth(): string {
    if (this.screenWidth > 768) {
      return this.size === 'large' ? '75vw' : '350px';
    } else {
      return '100vw';
    }
  }

  private loadComponent(): void {
    const componentFactory: ComponentFactory<any> = this.componentFactoryResolver.resolveComponentFactory(
      this.currentOffCanvasItem.component
    );
    const viewContainerRef: ViewContainerRef = this.goOffCanvasHost.viewContainerRef;
    const componentRef: ComponentRef<any> = viewContainerRef.createComponent(componentFactory);

    Object.keys(this.currentOffCanvasItem.bindings).forEach((key: string) => {
      componentRef.instance[key] = this.currentOffCanvasItem.bindings[key];
    });

    this.size = this.currentOffCanvasItem.size || 'small';
    this.header = this.currentOffCanvasItem.header;
  }

  private destroyComponent(): void {
    this.goOffCanvasHost.viewContainerRef.clear();
  }
}
