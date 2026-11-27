import { Component, Input, booleanAttribute } from '@angular/core';

@Component({
  selector: 'app-carregamento',
  standalone: true,
  templateUrl: './carregamento.html',
  styleUrls: ['./carregamento.css']
})
export class CarregamentoComponent {
  @Input() texto = 'Carregando...';
  @Input() tamanho: 'pequeno' | 'medio' | 'grande' = 'medio';
  @Input() modelo: 'aneis' | 'simples' = 'aneis';
  @Input() direcao: 'vertical' | 'horizontal' = 'vertical';
  @Input({ transform: booleanAttribute }) compacto = false;
  @Input({ transform: booleanAttribute }) exibirTexto = true;
}
