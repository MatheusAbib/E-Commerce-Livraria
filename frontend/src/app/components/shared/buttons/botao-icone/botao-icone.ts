import { Component, Input, booleanAttribute } from '@angular/core';

export type VarianteBotaoIcone = 'neutro' | 'primario' | 'perigo' | 'sucesso' | 'transparente';
export type TamanhoBotaoIcone = 'pequeno' | 'medio' | 'grande';

@Component({
  selector: 'button[appBotaoIcone]',
  standalone: true,
  templateUrl: './botao-icone.html',
  styleUrl: './botao-icone.css',
  host: {
    'type': 'button',
    '[attr.data-variante]': 'variante',
    '[attr.data-tamanho]': 'tamanho',
    '[attr.data-aparencia]': 'aparencia',
    '[attr.aria-label]': 'rotulo',
    '[attr.title]': 'rotulo',
    '[attr.aria-busy]': 'carregando ? "true" : null',
    '[attr.aria-pressed]': 'selecionado',
    '[class.botao-icone-redondo]': 'redondo',
    '[class.botao-icone-selecionado]': 'selecionado === true',
    '[class.botao-icone-carregando]': 'carregando',
    '[disabled]': 'desabilitado || carregando'
  }
})
export class BotaoIconeComponent {
  @Input({ required: true }) icone = '';
  @Input({ required: true }) rotulo = '';
  @Input() variante: VarianteBotaoIcone = 'neutro';
  @Input() aparencia: 'padrao' | 'autenticacao' = 'padrao';
  @Input() tamanho: TamanhoBotaoIcone = 'medio';
  @Input() selecionado: boolean | null = null;
  @Input({ transform: booleanAttribute }) redondo = false;
  @Input({ transform: booleanAttribute }) carregando = false;
  @Input({ transform: booleanAttribute }) desabilitado = false;
}
