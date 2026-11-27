import { Component, Input, booleanAttribute } from '@angular/core';

export type AlinhamentoAcoes = 'inicio' | 'centro' | 'fim' | 'distribuido';

@Component({
  selector: 'app-grupo-acoes, div[appGrupoAcoes]',
  standalone: true,
  templateUrl: './grupo-acoes.html',
  styleUrl: './grupo-acoes.css',
  host: {
    '[attr.data-alinhamento]': 'alinhamento',
    '[class.acoes-iguais]': 'largurasIguais',
    '[class.acoes-empilhadas]': 'empilharNoMobile',
    '[style.gap]': 'espacamento'
  }
})
export class GrupoAcoesComponent {
  @Input() alinhamento: AlinhamentoAcoes = 'fim';
  @Input() espacamento = 'var(--espaco-3)';
  @Input({ transform: booleanAttribute }) largurasIguais = false;
  @Input({ transform: booleanAttribute }) empilharNoMobile = false;
}
