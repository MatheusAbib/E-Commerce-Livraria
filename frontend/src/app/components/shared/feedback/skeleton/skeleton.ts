import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  templateUrl: './skeleton.html',
  styleUrls: ['./skeleton.css']
})
export class SkeletonComponent {
  @Input() largura = '100%';
  @Input() altura = '16px';
  @Input() formato: 'retangular' | 'circular' = 'retangular';
  @Input() quantidade = 1;
  @Input() espacamento = '12px';

  get itens(): number[] {
    return Array.from(
      { length: Math.min(100, Math.max(1, Math.floor(this.quantidade) || 1)) },
      (_, indice) => indice
    );
  }
}
