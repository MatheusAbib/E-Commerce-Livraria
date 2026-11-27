import { Component, Input, booleanAttribute } from '@angular/core';

export type VarianteBotao = 'primario' | 'secundario' | 'perigo' | 'sucesso' | 'aviso' | 'link';
export type TamanhoBotao = 'pequeno' | 'medio' | 'grande';

@Component({
  selector: 'button[appBotao]',
  standalone: true,
  templateUrl: './botao.html',
  styleUrl: './botao.css',
  host: {
    '[attr.type]': 'tipo',
    '[attr.data-variante]': 'variante',
    '[attr.data-tamanho]': 'tamanho',
    '[attr.data-aparencia]': 'aparencia',
    '[class.botao-largura-total]': 'larguraTotal',
    '[class.botao-carregando]': 'carregando',
    '[disabled]': 'desabilitado || carregando',
    '[attr.aria-busy]': 'carregando ? "true" : null'
  }
})
export class BotaoComponent {
  @Input() variante: VarianteBotao = 'primario';
  @Input() aparencia: 'padrao' | 'autenticacao' | 'confirmacao' = 'padrao';
  @Input() tamanho: TamanhoBotao = 'medio';
  @Input() tipo: 'button' | 'submit' | 'reset' = 'button';
  @Input() icone = '';
  @Input() posicaoIcone: 'inicio' | 'fim' = 'inicio';
  @Input() textoCarregando = '';
  @Input({ transform: booleanAttribute }) carregando = false;
  @Input({ transform: booleanAttribute }) desabilitado = false;
  @Input({ transform: booleanAttribute }) larguraTotal = false;
}
