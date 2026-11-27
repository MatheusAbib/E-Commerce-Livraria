import {
  Component,
  Input,
  Output,
  EventEmitter,
  booleanAttribute
} from '@angular/core';
import { BotaoIconeComponent } from '../../buttons/botao-icone/botao-icone';
import { ModalVariante } from '../modal.types';

@Component({
  selector: 'app-modal-cabecalho',
  standalone: true,
  imports: [BotaoIconeComponent],
  templateUrl: './modal-cabecalho.html',
  styleUrls: ['./modal-cabecalho.css']
})
export class ModalCabecalhoComponent {
  @Input() titulo = '';
  @Input() subtitulo = '';
  @Input() tituloId = '';
  @Input() subtituloId = '';
  @Input() icone = '';
  @Input() variante: ModalVariante = 'neutro';
  @Input() espacamento = '';
  @Input({ transform: booleanAttribute }) exibirFechar = true;
  @Input({ transform: booleanAttribute }) desabilitarFechar = false;

  @Output() fechar = new EventEmitter<void>();
}
