import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[filtroAuto]',
  standalone: true
})
export class FiltroAutoDirective {
  @Input() filtroAutoDebounce = 350;
  @Input() filtroAutoCallback!: () => void;

  private timer: ReturnType<typeof setTimeout> | null = null;

  @HostListener('ngModelChange')
  onChange(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.filtroAutoCallback?.(), this.filtroAutoDebounce);
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }
}
