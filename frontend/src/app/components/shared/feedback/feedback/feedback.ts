import { Component, Input, Output, EventEmitter, booleanAttribute } from '@angular/core';

@Component({
  selector: 'app-feedback',
  standalone: true,
  templateUrl: './feedback.html',
  styleUrls: ['./feedback.css']
})
export class FeedbackComponent {
  @Input() tipo: 'sucesso' | 'erro' | 'aviso' | 'info' = 'info';
  @Input() titulo = '';
  @Input() mensagem = '';
  @Input({ transform: booleanAttribute }) fechavel = false;

  @Output() fechar = new EventEmitter<void>();

  get icone(): string {
    return {
      sucesso: 'pi pi-check-circle',
      erro: 'pi pi-times-circle',
      aviso: 'pi pi-exclamation-triangle',
      info: 'pi pi-info-circle'
    }[this.tipo];
  }
}
