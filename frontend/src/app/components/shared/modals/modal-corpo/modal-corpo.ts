import { Component, Input, booleanAttribute } from '@angular/core';

@Component({
  selector: 'app-modal-corpo',
  standalone: true,
  templateUrl: './modal-corpo.html',
  styleUrls: ['./modal-corpo.css']
})
export class ModalCorpoComponent {
  @Input() espacamento = '';
  @Input() alturaMaxima = '';
  @Input({ transform: booleanAttribute }) semEspacamento = false;
  @Input({ transform: booleanAttribute }) rolagemInterna = false;
}
