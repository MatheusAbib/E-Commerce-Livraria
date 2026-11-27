import { Directive, Input, booleanAttribute } from '@angular/core';

export type CampoTamanho = 'pequeno' | 'medio' | 'grande';
export type CampoAparencia = 'padrao' | 'autenticacao' | 'administrativo' | 'compacto';

@Directive({
  selector: 'input[appCampo], textarea[appCampo], select[appCampo]',
  standalone: true,
  host: {
    'class': 'campo-compartilhado',
    '[attr.data-campo-tamanho]': 'tamanho',
    '[attr.data-campo-aparencia]': 'aparencia',
    '[class.campo-invalido]': 'invalido',
    '[class.campo-largura-total]': 'larguraTotal',
    '[attr.aria-invalid]': 'invalido ? "true" : null',
    '[attr.aria-describedby]': 'descricaoId || null'
  }
})
export class CampoDirective {
  @Input() tamanho: CampoTamanho = 'medio';
  @Input() aparencia: CampoAparencia = 'padrao';
  @Input() descricaoId = '';
  @Input({ transform: booleanAttribute }) invalido = false;
  @Input({ transform: booleanAttribute }) larguraTotal = true;
}
