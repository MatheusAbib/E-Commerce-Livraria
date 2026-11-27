import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  constructor(private http: HttpClient) {}

  cadastrar(opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/clientes`, opcoes);
  }

  buscarPorId(id: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/clientes/${id}`, opcoes);
  }

  atualizar(id: number, opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/clientes/${id}`, opcoes);
  }

  alterarSenha(id: number, opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/clientes/${id}/change-password`, opcoes);
  }

  validarCpf(id: number, opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/clientes/${id}/validar-cpf`, opcoes);
  }

  listarCartoes(id: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/clientes/${id}/cartoes`, opcoes);
  }

  cadastrarCartao(id: number, opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/clientes/${id}/cartoes`, opcoes);
  }

  salvarCartao(clienteId: number, cartaoId: number | null | undefined, opcoes: RequestInit): Promise<Response> {
    return cartaoId
      ? fetch(`${environment.apiUrl}/clientes/${clienteId}/cartoes/${cartaoId}`, { ...opcoes, method: 'PUT' })
      : this.cadastrarCartao(clienteId, { ...opcoes, method: 'POST' });
  }

  excluirCartao(clienteId: number, cartaoId: number, opcoes: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/clientes/${clienteId}/cartoes/${cartaoId}`, { ...opcoes, method: 'DELETE' });
  }

  listarAdministrativo(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/clientes`);
  }

  consultarAdministrativo(url: string): Observable<any> {
    return this.http.get(url);
  }

  buscarAdministrativo(id: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/clientes/${id}`);
  }

  cadastrarAdministrativo(cliente: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/clientes`, cliente);
  }

  atualizarAdministrativo(id: number, dados: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/clientes/${id}`, dados);
  }

  alterarSenhaAdministrativo(id: number, senha: string, confirmacaoSenha: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/clientes/${id}/change-password`, { senha, confirmacaoSenha });
  }

  alterarStatusAdministrativo(id: number, ativo: boolean, motivo: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/clientes/change-status/${id}`, { ativo, motivo });
  }

  excluirAdministrativo(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/clientes/${id}`);
  }
}
