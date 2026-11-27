import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LogService {
  constructor(private http: HttpClient) {}

  listar(opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/logs`, opcoes);
  }

  listarAdministrativo(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/logs`);
  }
}
