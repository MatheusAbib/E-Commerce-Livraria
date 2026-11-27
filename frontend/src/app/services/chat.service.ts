import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private abrirChatSubject = new Subject<{ pedidoId: number; pedido: any }>();
  readonly abrirChat$ = this.abrirChatSubject.asObservable();

  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  abrirChat(pedidoId: number, pedido: any = null): void {
    this.cancelarAberturaPendente();

    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      this.abrirChatSubject.next({ pedidoId, pedido });
    }, 50);
  }

  limparUltimoPedido(): void {
    this.cancelarAberturaPendente();
  }

  private cancelarAberturaPendente(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}