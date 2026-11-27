import type { Autor, AutorFormulario } from '../models/autor.model';
export type { Autor, AutorFormulario } from '../models/autor.model';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AutorService {
  private readonly url = `${environment.apiUrl}/autores`;

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<Autor[]>(this.url);
  }

  listarPublicos() {
    return this.http.get<Autor[]>(`${this.url}/publicos`);
  }

  buscar(id: number) {
    return this.http.get<Autor>(`${this.url}/${id}`);
  }

  importar() {
    return this.http.post<{ importados: number }>(`${this.url}/importar`, {});
  }

  salvar(dados: AutorFormulario, imagem: File | null, id?: number) {
    const formulario = new FormData();

    formulario.append(
      'autor',
      new Blob([JSON.stringify(dados)], { type: 'application/json' })
    );

    if (imagem) {
      formulario.append('imagem', imagem);
    }

    return id == null
      ? this.http.post<Autor>(this.url, formulario)
      : this.http.put<Autor>(`${this.url}/${id}`, formulario);
  }

  alterarStatus(id: number, ativo: boolean) {
    return this.http.put<Autor>(`${this.url}/${id}/status`, { ativo });
  }

  excluir(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}