import { ClienteService } from './cliente.service';
import { NotificacaoService } from './notificacao.service';
import type { Notificacao } from '../models/notificacao.model';
export type { Notificacao } from '../models/notificacao.model';
import type { User, LoginResponse } from '../models/usuario.model';
export type { User, LoginResponse } from '../models/usuario.model';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, ReplaySubject, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private temporizadorSessao: ReturnType<typeof setTimeout> | null = null;
  private sessaoExpiradaSubject = new ReplaySubject<void>(1);
  readonly sessaoExpirada$ = this.sessaoExpiradaSubject.asObservable();

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

  constructor(private http: HttpClient, private clienteService: ClienteService, private notificacaoService: NotificacaoService) {
    const user = this.getUserFromStorage();
    const token = this.getToken();

    if (user && token && !this.isTokenExpired(token)) {
      this.usuarioSubject.next(user);
      this.loginStatusSubject.next(true);
      this.carregarNotificacoesLocais(user.id);
      this.agendarExpiracaoSessao(token);
    } else if (user || token) {
      this.logout();
      this.sessaoExpiradaSubject.next();
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
      this.agendarExpiracaoSessao(response.token);
      this.usuarioSubject.next(response.user);
      this.loginStatusSubject.next(true);

      this.notificacoesServidor = [];
      this.carregarNotificacoesLocais(response.user.id);
    })
  );
}

validarCPF(cpf: string | null | undefined): boolean {
  const numeros = String(cpf || '').replace(/\D/g, '');

  if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) {
    return false;
  }

  for (let i = 9; i < 11; i++) {
    let soma = 0;

    for (let j = 0; j < i; j++) {
      soma += Number(numeros[j]) * (i + 1 - j);
    }

    let digito = (soma * 10) % 11;

    if (digito === 10) digito = 0;

    if (digito !== Number(numeros[i])) {
      return false;
    }
  }

  return true;
}

async verificarAcessoCarrinho(): Promise<{
  permitido: boolean;
  mensagem: string;
}> {
  const user = this.getUser();
  const token = this.getToken();

  if (!user || !token || !this.isAuthenticated()) {
    return {
      permitido: false,
      mensagem: 'Faça login para acessar o carrinho.'
    };
  }

  try {
    const response = await this.clienteService.buscarPorId(user.id, {
        headers: {
          Authorization: 'Bearer ' + token
        }
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao consultar usuário');
    }

    const usuarioCompleto = await response.json();

    if (!this.isAuthenticated() || this.getUser()?.id !== user.id) {
      return {
        permitido: false,
        mensagem: 'Faça login para acessar o carrinho.'
      };
    }

    delete usuarioCompleto.senha;

    this.atualizarUsuario(usuarioCompleto);

    const pendencias = this.obterPendenciasPerfil(usuarioCompleto);

    if (pendencias.length > 0) {
      const campos = pendencias.length === 1
        ? pendencias[0]
        : pendencias.slice(0, -1).join(', ') +
          ' e ' + pendencias[pendencias.length - 1];

      return {
        permitido: false,
        mensagem: `Cadastre ${campos} antes de acessar o carrinho.`
      };
    }

    return {
      permitido: true,
      mensagem: ''
    };
  } catch {
    return {
      permitido: false,
      mensagem: 'Não foi possível verificar seus dados. Tente novamente.'
    };
  }
}

obterPendenciasPerfil(usuario: any): string[] {
  if (!usuario) return [];

  const pendencias: string[] = [];

  if (!this.validarCPF(usuario.cpf)) {
    pendencias.push('um CPF válido');
  }

  if (!this.validarTelefone(usuario.telefone, usuario.tipotelefone)) {
    pendencias.push('um telefone válido');
  }

  if (!usuario.enderecos?.length) {
    pendencias.push('um endereço');
  }

  if (!usuario.cartoes?.length) {
    pendencias.push('um cartão');
  }

  return pendencias;
}

validarTelefone(telefone: string | null | undefined, tipo?: string): boolean {
  const numeros = String(telefone || '').replace(/\D/g, '');

  if (/^(\d)\1+$/.test(numeros)) return false;

  if (tipo === 'CELULAR') {
    return /^[1-9]\d9\d{8}$/.test(numeros);
  }

  if (tipo === 'RESIDENCIAL' || tipo === 'COMERCIAL') {
    return /^[1-9]\d[2-5]\d{7}$/.test(numeros);
  }

  return false;
}

  logout(): void {
    this.cancelarTemporizadorSessao();
    this.favoritosCountSubject.next(0);
    this.cuponsCountSubject.next(0);
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
      if (this.usuarioSubject.value) {
        this.encerrarSessaoExpirada();
      }

      return false;
    }

    if (this.isTokenExpired(token)) {
      this.encerrarSessaoExpirada(token);
      return false;
    }

    return true;
  }

  encerrarSessaoExpirada(tokenEsperado?: string): void {
    const tokenAtual = this.getToken();

    if (tokenEsperado && tokenAtual !== tokenEsperado) {
      return;
    }

    if (!tokenAtual && !this.usuarioSubject.value) {
      return;
    }

    this.logout();
    this.sessaoExpiradaSubject.next();
  }

  private cancelarTemporizadorSessao(): void {
    if (this.temporizadorSessao !== null) {
      clearTimeout(this.temporizadorSessao);
      this.temporizadorSessao = null;
    }
  }

  private obterExpiracaoToken(token: string): number {
    try {
      const parte = token.split('.')[1];

      if (!parte) return 0;

      const base64 = parte.replace(/-/g, '+').replace(/_/g, '/');
      const preenchido = base64.padEnd(
        Math.ceil(base64.length / 4) * 4,
        '='
      );

      const payload = JSON.parse(atob(preenchido));

      return typeof payload.exp === 'number' && Number.isFinite(payload.exp)
        ? payload.exp * 1000
        : 0;
    } catch {
      return 0;
    }
  }

  private agendarExpiracaoSessao(token: string): void {
    this.cancelarTemporizadorSessao();

    const restante = this.obterExpiracaoToken(token) - Date.now();

    this.temporizadorSessao = setTimeout(() => {
      this.temporizadorSessao = null;

      if (this.getToken() !== token) {
        return;
      }

      if (this.isTokenExpired(token)) {
        this.encerrarSessaoExpirada(token);
      } else {
        this.agendarExpiracaoSessao(token);
      }
    }, Math.max(0, Math.min(restante, 2147483647)));
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
    return Date.now() >= this.obterExpiracaoToken(token);
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

    return this.notificacaoService.listar(user.id).pipe(
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

    return this.notificacaoService.contarNaoLidas(user.id).pipe(
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

    return this.notificacaoService.marcarComoLida(user.id, id).pipe(
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

    return this.notificacaoService.marcarTodasComoLidas(user.id).pipe(
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

    return this.notificacaoService.excluir(user.id, id).pipe(
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

    return this.notificacaoService.excluirTodas(user.id).pipe(
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
