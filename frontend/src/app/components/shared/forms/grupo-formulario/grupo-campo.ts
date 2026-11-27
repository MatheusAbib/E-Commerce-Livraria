import {
  Component,
  Input,
  booleanAttribute
} from '@angular/core';

@Component({
  selector: 'app-grupo-campo, div[appGrupoCampo]',
  standalone: true,
  templateUrl: './grupo-campo.html',
  styleUrl: './grupo-campo.css',
  host: {
    '[class.grupo-campo-completo]': 'larguraTotal'
  }
})
export class GrupoCampoComponent {
  @Input() rotulo = '';
  @Input() campoId = '';
  @Input() descricao = '';
  @Input() descricaoId = '';
  @Input({ transform: booleanAttribute }) obrigatorio = false;
  @Input({ transform: booleanAttribute }) larguraTotal = false;
}
