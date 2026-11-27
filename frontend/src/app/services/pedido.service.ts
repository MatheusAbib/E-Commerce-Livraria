import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  constructor(private http: HttpClient) {}

  listarPorCliente(clienteId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/pedidos?clienteId=${clienteId}`, opcoes);
  }

  listarTodos(opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/pedidos/todos`, opcoes);
  }

  buscarPorId(id: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/pedidos/${id}`, opcoes);
  }

  excluir(id: number, opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/pedidos/${id}`, opcoes);
  }

  criar(opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/pedidos`, opcoes);
  }

  alterarStatus(id: number, opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/pedidos/${id}/status`, opcoes);
  }

  cancelar(id: number, opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/pedidos/${id}/cancelar`, opcoes);
  }

  solicitarDevolucao(id: number, opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/pedidos/${id}/devolucao`, opcoes);
  }

  confirmarReembolso(id: number, opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/pedidos/${id}/confirmar-reembolso`, opcoes);
  }

  alterarEndereco(id: number, opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/pedidos/${id}/endereco-entrega`, opcoes);
  }

  buscarPorIdRelativo(id: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`/api/pedidos/${id}`, opcoes);
  }

  listarAdministrativo(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/pedidos/todos`);
  }
}
