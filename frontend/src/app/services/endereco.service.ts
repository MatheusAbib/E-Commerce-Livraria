import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EnderecoService {
  listarPorCliente(clienteId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/clientes/${clienteId}/enderecos`, opcoes);
  }

  cadastrar(opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/enderecos`, opcoes);
  }

  atualizar(id: number, opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/enderecos/${id}`, opcoes);
  }

  excluir(id: number, opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/enderecos/${id}`, opcoes);
  }

  salvar(id: number | null | undefined, opcoes: RequestInit): Promise<Response> {
    return id
      ? this.atualizar(id, { ...opcoes, method: 'PUT' })
      : this.cadastrar({ ...opcoes, method: 'POST' });
  }
}
