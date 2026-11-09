
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, of, forkJoin } from 'rxjs';
import { tap, switchMap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  token?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: string;
  data: string;
  lida: boolean;
  pedidoId?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private userKey = 'user_data';
  private notificacoesStorageKey = 'notificacoesPorUsuario';

  private notificacoesServidor: Notificacao[] = [];
  private notificacoesLocais: Notificacao[] = [];

  private loginStatusSubject = new BehaviorSubject<boolean>(false);
  loginStatus$ = this.loginStatusSubject.asObservable();

  private favoritosCountSubject = new BehaviorSubject<number>(0);
  favoritosCount$ = this.favoritosCountSubject.asObservable();

  private cuponsCountSubject = new BehaviorSubject<number>(0);
  public cuponsCount$ = this.cuponsCountSubject.asObservable();

  private usuarioSubject = new BehaviorSubject<any>(null);
  usuario$ = this.usuarioSubject.asObservable();

  private favoritosAtualizadosSubject = new BehaviorSubject<boolean>(false);
  favoritosAtualizados$ = this.favoritosAtualizadosSubject.asObservable();

  public notificacoesSubject = new BehaviorSubject<Notificacao[]>([]);
  notificacoes$ = this.notificacoesSubject.asObservable();

  private dadosClienteAtualizadosSubject = new BehaviorSubject<boolean>(false);
  dadosClienteAtualizados$ = this.dadosClienteAtualizadosSubject.asObservable();

  private abrirChatSubject = new Subject<number>();
  abrirChat$ = this.abrirChatSubject.asObservable();

  constructor(private http: HttpClient) {
    const user = this.getUserFromStorage();

    if (user) {
      this.usuarioSubject.next(user);
      this.loginStatusSubject.next(true);
      this.carregarNotificacoesLocais(user.id);
    }
  }


login(email: string, senha: string): Observable<LoginResponse> {
  return this.http.post<LoginResponse>(
    `${this.apiUrl}/clientes/login`,
    { email, senha }
  ).pipe(
    tap(response => {
      const userWithoutPassword: User = { ...response.user };

      delete (userWithoutPassword as any).senha;

      response.user = userWithoutPassword;

      this.storeAuthData(response.token, response.user);
      this.usuarioSubject.next(response.user);
      this.loginStatusSubject.next(true);

      this.notificacoesServidor = [];
      this.carregarNotificacoesLocais(response.user.id);
    })
  );
}


  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('clienteLogado');

    this.usuarioSubject.next(null);
    this.loginStatusSubject.next(false);

    this.notificacoesServidor = [];
    this.notificacoesLocais = [];
    this.notificacoesSubject.next([]);
  }

  notificarAbrirChat(pedidoId: number): void {
    this.abrirChatSubject.next(pedidoId);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): User | null {
    return this.usuarioSubject.value;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    return !this.isTokenExpired(token);
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.perfil === 'ADMIN';
  }

  private storeAuthData(token: string, user: User): void {
    localStorage.setItem(this.tokenKey, token);

    const userToStore: any = { ...user };
    delete userToStore.senha;

    localStorage.setItem(this.userKey, JSON.stringify(userToStore));
    localStorage.setItem('clienteLogado', JSON.stringify(userToStore));
  }

  private getUserFromStorage(): User | null {
    const userData = localStorage.getItem(this.userKey);

    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        return null;
      }
    }

    const oldUserData = localStorage.getItem('clienteLogado');

    if (oldUserData) {
      try {
        return JSON.parse(oldUserData);
      } catch (e) {
        return null;
      }
    }

    return null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;

      return Date.now() > exp;
    } catch (e) {
      return true;
    }
  }

  atualizarLoginStatus(logado: boolean): void {
    this.loginStatusSubject.next(logado);
  }

  atualizarFavoritosCount(count: number): void {
    this.favoritosCountSubject.next(count);
  }

  atualizarCuponsCount(count: number): void {
    this.cuponsCountSubject.next(count);
  }

  atualizarUsuario(usuario: any): void {
    const usuarioAnterior = this.getUser();

    this.usuarioSubject.next(usuario);

    if (usuario?.id && usuarioAnterior?.id !== usuario.id) {
      this.notificacoesServidor = [];
      this.carregarNotificacoesLocais(usuario.id);
    }

    if (!usuario) {
      this.notificacoesServidor = [];
      this.notificacoesLocais = [];
      this.notificacoesSubject.next([]);
    }
  }

  notificarFavoritosAtualizados(): void {
    this.favoritosAtualizadosSubject.next(true);
  }

  private obterNotificacoesArmazenadas(): Record<string, Notificacao[]> {
    try {
      const dados = JSON.parse(
        localStorage.getItem(this.notificacoesStorageKey) || '{}'
      );

      if (dados && typeof dados === 'object' && !Array.isArray(dados)) {
        return dados;
      }

      return {};
    } catch (e) {
      return {};
    }
  }

  private carregarNotificacoesLocais(clienteId: number): void {
    const dados = this.obterNotificacoesArmazenadas();
    const notificacoes = dados[clienteId];

    this.notificacoesLocais = Array.isArray(notificacoes)
      ? notificacoes.map(notificacao => ({
          ...notificacao,
          id: -Math.abs(Number(notificacao.id)),
          lida: Boolean(notificacao.lida)
        }))
      : [];

    this.salvarNotificacoesLocais(clienteId);
    this.atualizarListaNotificacoes();
  }

  private salvarNotificacoesLocais(clienteId: number): void {
    const dados = this.obterNotificacoesArmazenadas();

    dados[clienteId] = this.notificacoesLocais;

    localStorage.setItem(
      this.notificacoesStorageKey,
      JSON.stringify(dados)
    );
  }

  private atualizarListaNotificacoes(): void {
    const notificacoes = [
      ...this.notificacoesServidor,
      ...this.notificacoesLocais
    ].sort((a, b) => {
      return new Date(b.data).getTime() - new Date(a.data).getTime();
    });

    this.notificacoesSubject.next(notificacoes);
  }

  private gerarIdNotificacaoLocal(clienteId: number): number {
    const dados = this.obterNotificacoesArmazenadas();
    const notificacoes = Array.isArray(dados[clienteId])
      ? dados[clienteId]
      : [];

    const ids = notificacoes
      .map(notificacao => Number(notificacao.id))
      .filter(id => Number.isFinite(id))
      .map(id => -Math.abs(id));

    return Math.min(0, ...ids) - 1;
  }

  private adicionarNotificacaoLocal(
    clienteId: number,
    titulo: string,
    mensagem: string,
    tipo: string
  ): void {
    const dados = this.obterNotificacoesArmazenadas();
    const notificacoes = Array.isArray(dados[clienteId])
      ? dados[clienteId]
      : [];

    const novaNotificacao: Notificacao = {
      id: this.gerarIdNotificacaoLocal(clienteId),
      titulo,
      mensagem,
      tipo,
      data: new Date().toISOString(),
      lida: false,
      pedidoId: null
    };

    dados[clienteId] = [
      novaNotificacao,
      ...notificacoes
    ];

    localStorage.setItem(
      this.notificacoesStorageKey,
      JSON.stringify(dados)
    );

    if (this.getUser()?.id === clienteId) {
      this.carregarNotificacoesLocais(clienteId);
    }
  }

  buscarNotificacoes(): Observable<Notificacao[]> {
    const user = this.getUser();

    if (!user || !this.isAuthenticated()) {
      this.notificacoesServidor = [];
      this.notificacoesLocais = [];
      this.notificacoesSubject.next([]);
      return of([]);
    }

    if (this.notificacoesLocais.length === 0) {
      this.carregarNotificacoesLocais(user.id);
    }

    return this.http.get<Notificacao[]>(
      `${this.apiUrl}/notificacoes`,
      {
        params: {
          clienteId: String(user.id)
        }
      }
    ).pipe(
      map(notificacoes => {
        if (this.getUser()?.id === user.id) {
          this.notificacoesServidor = notificacoes;
          this.atualizarListaNotificacoes();
          return this.notificacoesSubject.value;
        }

        return [];
      })
    );
  }

  contarNotificacoesNaoLidas(): Observable<{ quantidade: number }> {
    const user = this.getUser();

    if (!user || !this.isAuthenticated()) {
      return of({ quantidade: 0 });
    }

    return this.http.get<{ quantidade: number }>(
      `${this.apiUrl}/notificacoes/nao-lidas`,
      {
        params: {
          clienteId: String(user.id)
        }
      }
    ).pipe(
      map(resultado => {
        const locaisNaoLidas = this.notificacoesLocais.filter(
          notificacao => !notificacao.lida
        ).length;

        return {
          quantidade: resultado.quantidade + locaisNaoLidas
        };
      })
    );
  }

  marcarNotificacaoComoLida(id: number): Observable<Notificacao> {
    const user = this.getUser();

    if (!user || !this.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

    if (id < 0) {
      const notificacao = this.notificacoesLocais.find(
        item => item.id === id
      );

      if (!notificacao) {
        throw new Error('Notificação não encontrada');
      }

      const notificacaoAtualizada = {
        ...notificacao,
        lida: true
      };

      this.notificacoesLocais = this.notificacoesLocais.map(item =>
        item.id === id ? notificacaoAtualizada : item
      );

      this.salvarNotificacoesLocais(user.id);
      this.atualizarListaNotificacoes();

      return of(notificacaoAtualizada);
    }

    return this.http.put<Notificacao>(
      `${this.apiUrl}/notificacoes/${id}/lida`,
      {},
      {
        params: {
          clienteId: String(user.id)
        }
      }
    ).pipe(
      tap(notificacaoAtualizada => {
        if (this.getUser()?.id !== user.id) {
          return;
        }

        this.notificacoesServidor = this.notificacoesServidor.map(
          notificacao =>
            notificacao.id === id
              ? { ...notificacao, lida: notificacaoAtualizada.lida }
              : notificacao
        );

        this.atualizarListaNotificacoes();
      })
    );
  }

  marcarTodasNotificacoesComoLidas(): Observable<{ mensagem: string }> {
    const user = this.getUser();

    if (!user || !this.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

    return this.http.put<{ mensagem: string }>(
      `${this.apiUrl}/notificacoes/marcar-todas-lidas`,
      {},
      {
        params: {
          clienteId: String(user.id)
        }
      }
    ).pipe(
      tap(() => {
        if (this.getUser()?.id !== user.id) {
          return;
        }

        this.notificacoesServidor = this.notificacoesServidor.map(
          notificacao => ({
            ...notificacao,
            lida: true
          })
        );

        this.notificacoesLocais = this.notificacoesLocais.map(
          notificacao => ({
            ...notificacao,
            lida: true
          })
        );

        this.salvarNotificacoesLocais(user.id);
        this.atualizarListaNotificacoes();
      })
    );
  }

  excluirNotificacao(id: number): Observable<void> {
    const user = this.getUser();

    if (!user || !this.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

    if (id < 0) {
      this.notificacoesLocais = this.notificacoesLocais.filter(
        notificacao => notificacao.id !== id
      );

      this.salvarNotificacoesLocais(user.id);
      this.atualizarListaNotificacoes();

      return of(void 0);
    }

    return this.http.delete<void>(
      `${this.apiUrl}/notificacoes/${id}`,
      {
        params: {
          clienteId: String(user.id)
        }
      }
    ).pipe(
      tap(() => {
        if (this.getUser()?.id !== user.id) {
          return;
        }

        this.notificacoesServidor = this.notificacoesServidor.filter(
          notificacao => notificacao.id !== id
        );

        this.atualizarListaNotificacoes();
      })
    );
  }

  excluirTodasNotificacoes(): Observable<{ mensagem: string }> {
    const user = this.getUser();

    if (!user || !this.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

    return this.http.delete<{ mensagem: string }>(
      `${this.apiUrl}/notificacoes`,
      {
        params: {
          clienteId: String(user.id)
        }
      }
    ).pipe(
      tap(() => {
        if (this.getUser()?.id !== user.id) {
          return;
        }

        this.notificacoesServidor = [];
        this.notificacoesLocais = [];

        this.salvarNotificacoesLocais(user.id);
        this.atualizarListaNotificacoes();
      })
    );
  }

  adicionarNotificacao(
    titulo: string,
    mensagem: string,
    tipo: string = 'info'
  ): void {
    const user = this.getUser();

    if (!user || !this.isAuthenticated()) {
      return;
    }

    this.adicionarNotificacaoLocal(
      user.id,
      titulo,
      mensagem,
      tipo
    );
  }

  adicionarNotificacaoParaCliente(
    clienteId: number,
    titulo: string,
    mensagem: string,
    tipo: string = 'info'
  ): void {
    this.adicionarNotificacaoLocal(
      clienteId,
      titulo,
      mensagem,
      tipo
    );
  }

  notificarDadosClienteAtualizados(): void {
    this.dadosClienteAtualizadosSubject.next(true);
  }
}
