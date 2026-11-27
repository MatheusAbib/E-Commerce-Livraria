import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RelatorioService {
  constructor(private http: HttpClient) {}

  consultarLucros(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/vendas/lucros`);
  }

  consultarVendasPorCategoria(dataInicio: string, dataFim: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/vendas/categorias?dataInicio=${dataInicio}&dataFim=${dataFim}`);
  }

  consultarRanking(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/clientes/ranking`);
  }
}