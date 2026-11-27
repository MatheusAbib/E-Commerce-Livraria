import { Component, Input, booleanAttribute } from '@angular/core';

@Component({
  selector: 'app-modal-rodape',
  standalone: true,
  templateUrl: './modal-rodape.html',
  styleUrls: ['./modal-rodape.css']
})
export class ModalRodapeComponent {
  @Input() espacamento = '';
  @Input({ transform: booleanAttribute }) separador = false;
  @Input({ transform: booleanAttribute }) semEspacamento = false;
}
