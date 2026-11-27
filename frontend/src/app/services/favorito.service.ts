import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FavoritoService {
  listar(clienteId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/clientes/${clienteId}/favoritos`, opcoes);
  }

  adicionar(clienteId: number, opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/clientes/${clienteId}/favoritos`, opcoes);
  }

  remover(clienteId: number, livroId: number, opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/clientes/${clienteId}/favoritos/${livroId}`, opcoes);
  }
}