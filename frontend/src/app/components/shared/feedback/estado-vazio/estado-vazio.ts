import { Component, Input, booleanAttribute } from '@angular/core';

@Component({
  selector: 'app-estado-vazio',
  standalone: true,
  templateUrl: './estado-vazio.html',
  styleUrls: ['./estado-vazio.css']
})
export class EstadoVazioComponent {
  @Input() icone = 'pi pi-inbox';
  @Input() titulo = '';
  @Input() descricao = '';
  @Input() tamanho: 'pequeno' | 'medio' | 'grande' = 'medio';
  @Input({ transform: booleanAttribute }) compacto = false;
}
