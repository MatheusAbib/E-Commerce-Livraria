import {
  Component,
  Input,
  Output,
  EventEmitter,
  booleanAttribute,
  inject
} from '@angular/core';
import { ModalBaseComponent } from '../modal-base/modal-base';
import { ModalCabecalhoComponent } from '../modal-cabecalho/modal-cabecalho';
import { ModalCorpoComponent } from '../modal-corpo/modal-corpo';
import { ModalRodapeComponent } from '../modal-rodape/modal-rodape';
import { ModalService } from '../modal.service';
import { ModalVariante } from '../modal.types';
import { BotaoComponent } from '../../buttons/botao/botao';
import { GrupoAcoesComponent } from '../../buttons/grupo-acoes/grupo-acoes';

@Component({
  selector: 'app-modal-confirmacao',
  standalone: true,
  imports: [
    ModalBaseComponent,
    ModalCabecalhoComponent,
    ModalCorpoComponent,
    ModalRodapeComponent,
    BotaoComponent,
    GrupoAcoesComponent
  ],
  templateUrl: './modal-confirmacao.html',
  styleUrls: ['./modal-confirmacao.css']
})
export class ModalConfirmacaoComponent {
  private readonly modalService = inject(ModalService);

  readonly tituloId = `${this.modalService.gerarId()}-titulo`;

  @Input({ transform: booleanAttribute }) visivel = false;
  @Input() titulo = 'Confirmar operação';
  @Input() mensagem = '';
  @Input() subtitulo = '';
  @Input() icone = 'pi pi-exclamation-triangle';
  @Input() variante: ModalVariante = 'neutro';
  @Input() largura = '380px';
  @Input() textoCancelar = 'Cancelar';
  @Input() textoConfirmar = 'Confirmar';
  @Input() iconeCancelar = 'pi pi-times';
  @Input() iconeConfirmar = 'pi pi-check';
  @Input() textoCarregando = 'Processando...';
  @Input({ transform: booleanAttribute }) carregando = false;
  @Input({ transform: booleanAttribute }) desabilitado = false;
  @Input({ transform: booleanAttribute }) exibirFechar = false;
  @Input({ transform: booleanAttribute }) fecharAoClicarFora = true;
  @Input({ transform: booleanAttribute }) fecharComEscape = true;
  @Input({ transform: booleanAttribute }) bloquearComOverlay = false;

  @Output() cancelar = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<void>();

  get varianteBotao(): 'primario' | 'perigo' | 'sucesso' | 'aviso' {
    return this.variante === 'neutro' ? 'primario' : this.variante;
  }

  solicitarCancelamento(): void {
    if (!this.carregando) {
      this.cancelar.emit();
    }
  }

  solicitarConfirmacao(): void {
    if (!this.carregando && !this.desabilitado) {
      this.confirmar.emit();
    }
  }
}
