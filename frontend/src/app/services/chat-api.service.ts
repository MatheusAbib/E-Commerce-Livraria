import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  consultarMensagensPorUrl(url: string, opcoes?: RequestInit): Promise<Response> {
    return fetch(url, opcoes);
  }

  marcarLidasClienteRelativo(pedidoId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`/api/chat/cliente/${pedidoId}/ler`, opcoes);
  }

  listarMensagensClienteRelativo(pedidoId: number, clienteId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`/api/chat/cliente/${pedidoId}?clienteId=${clienteId}`, opcoes);
  }

  enviarMensagemClienteRelativo(pedidoId: number, clienteId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`/api/chat/cliente?pedidoId=${pedidoId}&clienteId=${clienteId}`, opcoes);
  }

  consultarAtendimentoRelativo(pedidoId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`/api/chat/admin/${pedidoId}/atendimento-ativo`, opcoes);
  }

  encerrarClienteRelativo(pedidoId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`/api/chat/cliente/${pedidoId}/encerrar`, opcoes);
  }

  reativarClienteRelativo(pedidoId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`/api/chat/cliente/${pedidoId}/reativar`, opcoes);
  }

  totalNaoLidasAdmin(opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/chat/admin/total-nao-lidas`, opcoes);
  }

  listarConversasCliente(clienteId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/chat/cliente/${clienteId}/conversas`, opcoes);
  }

  listarConversasAdmin(opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/chat/admin/conversas`, opcoes);
  }

  reativarAdmin(pedidoId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/chat/admin/${pedidoId}/reativar`, opcoes);
  }

  listarMensagensAdmin(pedidoId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/chat/admin/${pedidoId}`, opcoes);
  }

  marcarLidasAdmin(pedidoId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/chat/admin/${pedidoId}/ler`, opcoes);
  }

  listarMensagensAdminRelativo(pedidoId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`/api/chat/admin/${pedidoId}`, opcoes);
  }

  marcarLidasAdminRelativo(pedidoId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`/api/chat/admin/${pedidoId}/ler`, opcoes);
  }

  enviarMensagemAdmin(pedidoId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/chat/admin?pedidoId=${pedidoId}`, opcoes);
  }

  consultarAtendimento(pedidoId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/chat/admin/${pedidoId}/atendimento-ativo`, opcoes);
  }

  encerrarAdmin(pedidoId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/chat/admin/${pedidoId}/encerrar`, opcoes);
  }

  contarNaoLidasAdminRelativo(pedidoId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`/api/chat/admin/${pedidoId}/nao-lidas`, opcoes);
  }
}
