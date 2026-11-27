import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LivroService {
  constructor(private http: HttpClient) {}

  listar(opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/livros`, opcoes);
  }

  listarMaisVendidos(opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/livros/mais-vendidos`, opcoes);
  }

  listarCategorias(opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/livros/categorias`, opcoes);
  }

  excluir(id: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/livros/${id}`, opcoes);
  }

  alterarStatus(id: number, opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/livros/change-status/${id}`, opcoes);
  }

  salvarComImagem(id: number | null | undefined, opcoes: RequestInit): Promise<Response> {
    const url = id
      ? `${environment.apiUrl}/livros/${id}/com-imagem`
      : `${environment.apiUrl}/livros/com-imagem`;

    return fetch(url, { ...opcoes, method: id ? 'PUT' : 'POST' });
  }

  listarAdministrativo(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/livros/consulta`);
  }

  consultarAdministrativo(url: string): Observable<any> {
    return this.http.get(url);
  }
}