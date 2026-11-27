import { Component, Input } from '@angular/core';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-notificacao',
  standalone: true,
  imports: [ToastModule],
  templateUrl: './notificacao.html',
  styleUrls: ['./notificacao.css']
})
export class NotificacaoComponent {
  @Input() duracao = 2000;
  @Input() chave: string | undefined;
}
