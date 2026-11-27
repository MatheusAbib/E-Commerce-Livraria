import { Component, Input, booleanAttribute } from '@angular/core';

export type TipoMensagemValidacao = 'erro' | 'sucesso' | 'aviso' | 'info';

@Component({
  selector: 'app-mensagem-validacao',
  standalone: true,
  templateUrl: './mensagem-validacao.html',
  styleUrl: './mensagem-validacao.css',
  host: {
    '[attr.data-tipo]': 'tipo',
    '[attr.id]': 'mensagemId || null',
    '[hidden]': '!visivel'
  }
})
export class MensagemValidacaoComponent {
  @Input() tipo: TipoMensagemValidacao = 'erro';
  @Input() mensagem = '';
  @Input() mensagemId = '';
  @Input({ transform: booleanAttribute }) visivel = true;
  @Input({ transform: booleanAttribute }) exibirIcone = true;

  get icone(): string {
    const icones: Record<TipoMensagemValidacao, string> = {
      erro: 'pi pi-exclamation-circle',
      sucesso: 'pi pi-check-circle',
      aviso: 'pi pi-exclamation-triangle',
      info: 'pi pi-info-circle'
    };

    return icones[this.tipo];
  }
}
