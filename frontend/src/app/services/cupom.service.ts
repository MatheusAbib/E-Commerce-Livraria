import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CupomService {
  listarDisponiveis(clienteId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/cupons/cliente/${clienteId}/disponiveis`, opcoes);
  }

  listarUsados(clienteId: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/cupons/cliente/${clienteId}/usados`, opcoes);
  }

  utilizar(codigo: string, clienteId: number | undefined, opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/cupons/${codigo}/usar?clienteId=${clienteId}`, opcoes);
  }
}