import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CepService {
  consultar(cep: string, opcoes?: RequestInit): Promise<Response> {
    return fetch(`https://viacep.com.br/ws/${cep}/json/`, opcoes);
  }
}
