import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AvaliacaoService {
  listarTodas(opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/avaliacoes/todas`, opcoes);
  }

  listarPorCliente(clienteId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/avaliacoes/cliente/${clienteId}`, opcoes);
  }

  listarPorLivro(livroId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/avaliacoes/livro/${livroId}`, opcoes);
  }

  removerComentario(id: number, opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/avaliacoes/${id}/remover-comentario`, opcoes);
  }

  verificar(clienteId: number, pedidoId: number, livroId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/avaliacoes/verificar?clienteId=${clienteId}&pedidoId=${pedidoId}&livroId=${livroId}`, opcoes);
  }

  cadastrar(clienteId: number, opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/avaliacoes?clienteId=${clienteId}`, opcoes);
  }

  atualizar(id: number, clienteId: number, opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/avaliacoes/${id}?clienteId=${clienteId}`, opcoes);
  }

  buscarResumo(livroId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/avaliacoes/livro/${livroId}/resumo`, opcoes);
  }

  salvar(clienteId: number, avaliacaoId: number | null | undefined, opcoes: RequestInit): Promise<Response> {
    return avaliacaoId !== null && avaliacaoId !== undefined
      ? this.atualizar(avaliacaoId, clienteId, { ...opcoes, method: 'PUT' })
      : this.cadastrar(clienteId, { ...opcoes, method: 'POST' });
  }
}
