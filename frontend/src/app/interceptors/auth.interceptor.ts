import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const api = new URL(environment.apiUrl, window.location.origin);
    const destino = new URL(req.url, window.location.origin);
    const caminhoApi = api.pathname.replace(/\/+$/, '');

    const pertenceApi =
      destino.origin === api.origin &&
      (
        destino.pathname === caminhoApi ||
        destino.pathname.startsWith(caminhoApi + '/')
      );

    const login = destino.pathname.endsWith('/clientes/login');

    if (!pertenceApi || login) {
      return next.handle(req);
    }

    const token = this.authService.getToken();

    if (token && !this.authService.isAuthenticated()) {
      return throwError(() => new HttpErrorResponse({
        status: 401,
        statusText: 'Sessao expirada',
        url: req.url
      }));
    }

    const requisicao = token
      ? req.clone({
          setHeaders: {
            Authorization: 'Bearer ' + token
          }
        })
      : req;

    return next.handle(requisicao).pipe(
      catchError(error => {
        if (
          error instanceof HttpErrorResponse &&
          error.status === 401 &&
          token
        ) {
          this.authService.encerrarSessaoExpirada(token);
        }

        return throwError(() => error);
      })
    );
  }
}