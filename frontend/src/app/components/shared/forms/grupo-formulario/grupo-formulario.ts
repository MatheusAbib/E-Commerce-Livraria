import {
  Component,
  Input,
  numberAttribute,
  booleanAttribute
} from '@angular/core';

@Component({
  selector: 'app-grupo-formulario, div[appGrupoFormulario]',
  standalone: true,
  templateUrl: './grupo-formulario.html',
  styleUrl: './grupo-formulario.css',
  host: {
    '[style.--formulario-colunas]': 'colunasValidas',
    '[style.--formulario-colunas-tablet]': 'colunasTabletValidas',
    '[style.--formulario-gap]': 'espacamento',
    '[attr.data-alinhamento]': 'alinhamento',
    '[class.formulario-empilhar]': 'empilharNoMobile'
  }
})
export class GrupoFormularioComponent {
  @Input({ transform: numberAttribute }) colunas = 2;
  @Input({ transform: numberAttribute }) colunasTablet = 2;
  @Input() espacamento = '16px';
  @Input() alinhamento: 'inicio' | 'centro' | 'fim' | 'esticar' = 'inicio';
  @Input({ transform: booleanAttribute }) empilharNoMobile = true;

  get colunasValidas(): number {
    return this.normalizarColunas(this.colunas);
  }

  get colunasTabletValidas(): number {
    return Math.min(
      this.colunasValidas,
      this.normalizarColunas(this.colunasTablet)
    );
  }

  private normalizarColunas(valor: number): number {
    return Number.isFinite(valor)
      ? Math.min(6, Math.max(1, Math.floor(valor)))
      : 1;
  }
}
