import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { Notificacao } from '../models/notificacao.model';

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private readonly apiUrl = `${environment.apiUrl}/notificacoes`;

  constructor(private http: HttpClient) {}

  listar(clienteId: number): Observable<Notificacao[]> {
    return this.http.get<Notificacao[]>(this.apiUrl, {
      params: { clienteId: String(clienteId) }
    });
  }

  contarNaoLidas(clienteId: number): Observable<{ quantidade: number }> {
    return this.http.get<{ quantidade: number }>(`${this.apiUrl}/nao-lidas`, {
      params: { clienteId: String(clienteId) }
    });
  }

  marcarComoLida(clienteId: number, id: number): Observable<Notificacao> {
    return this.http.put<Notificacao>(`${this.apiUrl}/${id}/lida`, {}, {
      params: { clienteId: String(clienteId) }
    });
  }

  marcarTodasComoLidas(clienteId: number): Observable<{ mensagem: string }> {
    return this.http.put<{ mensagem: string }>(`${this.apiUrl}/marcar-todas-lidas`, {}, {
      params: { clienteId: String(clienteId) }
    });
  }

  excluir(clienteId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      params: { clienteId: String(clienteId) }
    });
  }

  excluirTodas(clienteId: number): Observable<{ mensagem: string }> {
    return this.http.delete<{ mensagem: string }>(this.apiUrl, {
      params: { clienteId: String(clienteId) }
    });
  }
}