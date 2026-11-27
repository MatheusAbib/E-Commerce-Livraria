import type { ItemCarrinho, CarrinhoResponse } from '../models/carrinho.model';
export type { ItemCarrinho, CarrinhoResponse } from '../models/carrinho.model';
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import {
  BehaviorSubject,
  Subject,
  Observable,
  Subscription,
  firstValueFrom,
  distinctUntilChanged,
  map
} from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth';

interface SessaoCarrinho {
  clienteId: number;
  token: string;
  geracao: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarrinhoService implements OnDestroy {
  private readonly apiUrl = `${environment.apiUrl}/carrinho`;

  private readonly carrinhoSubject =
    new BehaviorSubject<CarrinhoResponse | null>(null);

  readonly carrinho$ = this.carrinhoSubject.asObservable();

  private readonly carrinhoItensSubject =
    new BehaviorSubject<number>(0);

  readonly carrinhoItens$ =
    this.carrinhoItensSubject.asObservable();

  private readonly carrinhoAtualizadoSubject =
    new Subject<boolean>();

  readonly carrinhoAtualizado$ =
    this.carrinhoAtualizadoSubject.asObservable();

  private readonly carregandoSubject =
    new BehaviorSubject<boolean>(false);

  readonly carregando$ =
    this.carregandoSubject.asObservable();

  private readonly tempoRestanteSubject =
    new BehaviorSubject<number>(0);

  readonly tempoRestante$ =
    this.tempoRestanteSubject.asObservable();

  private readonly expiracaoSubject =
    new Subject<number>();

  readonly expiracao$ =
    this.expiracaoSubject.asObservable();

  private readonly erroSubject =
    new Subject<string>();

  readonly erro$ =
    this.erroSubject.asObservable();

  private readonly subscriptions = new Subscription();

  private filaOperacoes: Promise<unknown> = Promise.resolve();

  private clienteIdAtual: number | null = null;

  private geracaoSessao = 0;

  private prazoLocal = 0;

  private intervaloSincronizacao:
    ReturnType<typeof setInterval> | null = null;

  private intervaloTemporizador:
    ReturnType<typeof setInterval> | null = null;

  private sincronizacaoPendente = false;

  private carrinhoExpiradoNotificado: number | null = null;

  private canal: BroadcastChannel | null = null;

  private readonly sincronizarAoFocar = (): void => {
    this.atualizarContador();
  };

  private readonly sincronizarVisibilidade = (): void => {
    if (document.visibilityState === 'visible') {
      this.atualizarContador();
    }
  };

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.configurarSincronizacao();
    this.observarUsuario();
    this.iniciarTemporizador();
  }

  private observarUsuario(): void {
    this.subscriptions.add(
      this.authService.usuario$.pipe(
        map(usuario => {
          return usuario?.id &&
            this.authService.isAuthenticated()
              ? Number(usuario.id)
              : null;
        }),
        distinctUntilChanged()
      ).subscribe(clienteId => {
        this.geracaoSessao++;
        this.clienteIdAtual = clienteId;
        this.prazoLocal = 0;
        this.carrinhoExpiradoNotificado = null;
        this.sincronizacaoPendente = false;
        this.filaOperacoes = Promise.resolve();

        this.carrinhoSubject.next(null);
        this.carrinhoItensSubject.next(0);
        this.tempoRestanteSubject.next(0);
        this.carregandoSubject.next(false);

        if (clienteId !== null) {
          this.atualizarContador();
        }
      })
    );
  }

  private configurarSincronizacao(): void {
    if (typeof BroadcastChannel !== 'undefined') {
      this.canal = new BroadcastChannel(
        'livraria-online-carrinho'
      );

      this.canal.onmessage = evento => {
        if (
          evento.data?.tipo === 'carrinho-atualizado' &&
          evento.data?.clienteId === this.clienteIdAtual
        ) {
          this.atualizarContador();
        }
      };
    }

    if (typeof window !== 'undefined') {
      window.addEventListener(
        'focus',
        this.sincronizarAoFocar
      );
    }

    if (typeof document !== 'undefined') {
      document.addEventListener(
        'visibilitychange',
        this.sincronizarVisibilidade
      );
    }

    this.intervaloSincronizacao = setInterval(() => {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        return;
      }

      this.atualizarContador();
    }, 15000);
  }

  private iniciarTemporizador(): void {
    this.intervaloTemporizador = setInterval(() => {
      const carrinho = this.carrinhoSubject.value;

      if (
        !carrinho ||
        carrinho.vazio ||
        carrinho.id === null ||
        this.prazoLocal <= 0
      ) {
        if (this.tempoRestanteSubject.value !== 0) {
          this.tempoRestanteSubject.next(0);
        }

        return;
      }

      const segundos = Math.max(
        0,
        Math.ceil(
          (this.prazoLocal - performance.now()) / 1000
        )
      );

      if (this.tempoRestanteSubject.value !== segundos) {
        this.tempoRestanteSubject.next(segundos);
      }

      if (segundos === 0) {
        this.atualizarContador();
      }
    }, 1000);
  }

  private obterSessao(): SessaoCarrinho | null {
    const usuario = this.authService.getUser();
    const token = this.authService.getToken();

    if (
      !usuario?.id ||
      !token ||
      !this.authService.isAuthenticated() ||
      Number(usuario.id) !== this.clienteIdAtual
    ) {
      return null;
    }

    return {
      clienteId: Number(usuario.id),
      token,
      geracao: this.geracaoSessao
    };
  }

  private sessaoValida(sessao: SessaoCarrinho): boolean {
    const atual = this.obterSessao();

    return atual !== null &&
      atual.clienteId === sessao.clienteId &&
      atual.token === sessao.token &&
      atual.geracao === sessao.geracao;
  }

  private validarSessao(sessao: SessaoCarrinho): void {
    if (!this.sessaoValida(sessao)) {
      throw new Error(
        'A sessão do usuário foi alterada.'
      );
    }
  }

  private obterHeaders(sessao: SessaoCarrinho): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${sessao.token}`
    });
  }

  private executarNaFila<T>(
    operacao: (sessao: SessaoCarrinho) => Promise<T>
  ): Promise<T> {
    const sessao = this.obterSessao();

    if (!sessao) {
      return Promise.reject(
        new Error('Faça login para acessar o carrinho.')
      );
    }

    const executar = async (): Promise<T> => {
      this.validarSessao(sessao);
      this.carregandoSubject.next(true);

      try {
        const resultado = await operacao(sessao);

        this.validarSessao(sessao);

        return resultado;
      } finally {
        if (this.sessaoValida(sessao)) {
          this.carregandoSubject.next(false);
        }
      }
    };

    const resultado = this.filaOperacoes.then(
      executar,
      executar
    );

    this.filaOperacoes = resultado.then(
      () => undefined,
      () => undefined
    );

    return resultado;
  }

  private aplicarCarrinho(
    resposta: CarrinhoResponse,
    sessao: SessaoCarrinho,
    duracaoRequisicao: number = 0
  ): CarrinhoResponse {
    this.validarSessao(sessao);

    const anterior = this.carrinhoSubject.value;

    const carrinho: CarrinhoResponse = {
      ...resposta,
      itens: Array.isArray(resposta.itens)
        ? resposta.itens
        : []
    };

    const expiracao = carrinho.expiraEm
      ? Date.parse(carrinho.expiraEm)
      : NaN;

    const horarioServidor = Date.parse(
      carrinho.horarioServidor
    );

    let tempoRestante = 0;

    if (!carrinho.vazio && carrinho.id !== null) {
      if (
        Number.isFinite(expiracao) &&
        Number.isFinite(horarioServidor)
      ) {
        tempoRestante = Math.max(
          0,
          expiracao -
            horarioServidor -
            duracaoRequisicao
        );
      } else {
        tempoRestante = Math.max(
          0,
          carrinho.segundosRestantes * 1000 -
            duracaoRequisicao
        );
      }
    }

    this.prazoLocal = tempoRestante > 0
      ? performance.now() + tempoRestante
      : 0;

    this.carrinhoSubject.next(carrinho);

    this.carrinhoItensSubject.next(
      carrinho.quantidadeTotal || 0
    );

    this.tempoRestanteSubject.next(
      Math.ceil(tempoRestante / 1000)
    );

    const alterado =
      anterior?.id !== carrinho.id ||
      anterior?.revisao !== carrinho.revisao ||
      anterior?.quantidadeTotal !==
        carrinho.quantidadeTotal ||
      anterior?.subtotal !== carrinho.subtotal ||
      JSON.stringify(anterior?.itens) !==
        JSON.stringify(carrinho.itens);

    if (alterado) {
      this.carrinhoAtualizadoSubject.next(true);
    }

    const expirouCarrinhoAnterior =
      anterior?.id != null &&
      anterior.id !== carrinho.id &&
      (
        carrinho.expirado ||
        (
          anterior.expiraEm !== null &&
          Number.isFinite(horarioServidor) &&
          Date.parse(anterior.expiraEm) <= horarioServidor
        )
      );

    if (
      expirouCarrinhoAnterior &&
      anterior?.id != null &&
      anterior.id !== this.carrinhoExpiradoNotificado
    ) {
      this.carrinhoExpiradoNotificado = anterior.id;
      this.expiracaoSubject.next(anterior.id);
    }

    return carrinho;
  }

  private async consultarServidor(
    sessao: SessaoCarrinho
  ): Promise<CarrinhoResponse> {
    const inicio = performance.now();

    const resposta = await firstValueFrom(
      this.http.get<CarrinhoResponse>(
        this.apiUrl,
        {
          headers: this.obterHeaders(sessao)
        }
      )
    );

    return this.aplicarCarrinho(
      resposta,
      sessao,
      performance.now() - inicio
    );
  }

  carregarCarrinho(): Promise<CarrinhoResponse> {
    return this.executarNaFila(sessao =>
      this.consultarServidor(sessao)
    );
  }

  atualizarContador(): void {
    if (!this.obterSessao()) {
      this.carrinhoSubject.next(null);
      this.carrinhoItensSubject.next(0);
      this.tempoRestanteSubject.next(0);
      this.prazoLocal = 0;
      return;
    }

    if (this.sincronizacaoPendente) {
      return;
    }

    const geracao = this.geracaoSessao;

    this.sincronizacaoPendente = true;

    this.carregarCarrinho()
      .catch(() => undefined)
      .finally(() => {
        if (geracao === this.geracaoSessao) {
          this.sincronizacaoPendente = false;
        }
      });
  }

  obterCarrinho(): ItemCarrinho[] {
    if (!this.obterSessao()) {
      return [];
    }

    return this.carrinhoSubject.value?.itens.map(
      item => ({ ...item })
    ) || [];
  }

  obterEstadoCarrinho(): CarrinhoResponse | null {
    if (!this.obterSessao()) {
      return null;
    }

    return this.carrinhoSubject.value;
  }

  obterTempoRestante(): number {
    return this.tempoRestanteSubject.value;
  }

  obterQuantidadeLivro(livroId: number): number {
    return this.obterCarrinho().find(
      item => item.livroId === livroId
    )?.quantidade || 0;
  }

  private obterIdentificacaoCarrinho(): {
    carrinhoId: number;
    revisao: number;
  } {
    const carrinho = this.obterEstadoCarrinho();

    if (
      !carrinho ||
      carrinho.vazio ||
      carrinho.id === null ||
      carrinho.revisao === null
    ) {
      throw new Error(
        'O carrinho não está mais disponível.'
      );
    }

    return {
      carrinhoId: carrinho.id,
      revisao: carrinho.revisao
    };
  }

  private validarQuantidade(quantidade: number): void {
    if (
      !Number.isInteger(quantidade) ||
      quantidade < 1 ||
      quantidade > 3
    ) {
      throw new Error(
        'A quantidade deve estar entre 1 e 3 unidades.'
      );
    }
  }

  private validarLivro(livroId: number): void {
    if (
      !Number.isSafeInteger(livroId) ||
      livroId <= 0
    ) {
      throw new Error('Livro inválido.');
    }
  }

  private async executarMutacao(
    sessao: SessaoCarrinho,
    requisicao: Observable<CarrinhoResponse>
  ): Promise<CarrinhoResponse> {
    const inicio = performance.now();

    try {
      const resposta = await firstValueFrom(requisicao);

      const carrinho = this.aplicarCarrinho(
        resposta,
        sessao,
        performance.now() - inicio
      );

      this.notificarOutrasAbas(sessao.clienteId);

      return carrinho;
    } catch (erro: any) {
      if (
        this.sessaoValida(sessao) &&
        [404, 409].includes(erro?.status)
      ) {
        try {
          await this.consultarServidor(sessao);
        } catch {
        }
      }

      if (this.sessaoValida(sessao)) {
        this.erroSubject.next(
          this.obterMensagemErro(erro)
        );
      }

      throw erro;
    }
  }

  adicionarAoCarrinho(
    produtoId: number,
    quantidade: number = 1
  ): Promise<CarrinhoResponse> {
    return this.executarNaFila(async sessao => {
      this.validarLivro(produtoId);
      this.validarQuantidade(quantidade);

      const acesso =
        await this.authService.verificarAcessoCarrinho();

      this.validarSessao(sessao);

      if (!acesso.permitido) {
        throw new Error(acesso.mensagem);
      }

      return this.executarMutacao(
        sessao,
        this.http.post<CarrinhoResponse>(
          `${this.apiUrl}/itens`,
          {
            livroId: produtoId,
            quantidade
          },
          {
            headers: this.obterHeaders(sessao)
          }
        )
      );
    });
  }

  atualizarQuantidade(
    produtoId: number,
    quantidade: number
  ): Promise<CarrinhoResponse> {
    return this.executarNaFila(sessao => {
      this.validarLivro(produtoId);
      this.validarQuantidade(quantidade);

      const identificacao =
        this.obterIdentificacaoCarrinho();

      return this.executarMutacao(
        sessao,
        this.http.put<CarrinhoResponse>(
          `${this.apiUrl}/itens/${produtoId}`,
          {
            ...identificacao,
            quantidade
          },
          {
            headers: this.obterHeaders(sessao)
          }
        )
      );
    });
  }

  removerDoCarrinho(
    produtoId: number
  ): Promise<CarrinhoResponse> {
    return this.executarNaFila(sessao => {
      this.validarLivro(produtoId);

      const identificacao =
        this.obterIdentificacaoCarrinho();

      const params = new HttpParams()
        .set(
          'carrinhoId',
          String(identificacao.carrinhoId)
        )
        .set(
          'revisao',
          String(identificacao.revisao)
        );

      return this.executarMutacao(
        sessao,
        this.http.delete<CarrinhoResponse>(
          `${this.apiUrl}/itens/${produtoId}`,
          {
            headers: this.obterHeaders(sessao),
            params
          }
        )
      );
    });
  }

  limparCarrinho(): Promise<CarrinhoResponse> {
    return this.executarNaFila(sessao => {
      const identificacao =
        this.obterIdentificacaoCarrinho();

      const params = new HttpParams()
        .set(
          'carrinhoId',
          String(identificacao.carrinhoId)
        )
        .set(
          'revisao',
          String(identificacao.revisao)
        );

      return this.executarMutacao(
        sessao,
        this.http.delete<CarrinhoResponse>(
          this.apiUrl,
          {
            headers: this.obterHeaders(sessao),
            params
          }
        )
      );
    });
  }

  async sincronizarAposCompra(): Promise<CarrinhoResponse> {
    const sessao = this.obterSessao();

    if (!sessao) {
      throw new Error('Usuário não autenticado.');
    }

    const carrinho = await this.carregarCarrinho();

    if (this.sessaoValida(sessao)) {
      this.notificarOutrasAbas(sessao.clienteId);
    }

    return carrinho;
  }

  notificarCarrinhoAtualizado(): void {
    this.atualizarContador();
  }

  private notificarOutrasAbas(clienteId: number): void {
    this.canal?.postMessage({
      tipo: 'carrinho-atualizado',
      clienteId
    });
  }

  obterMensagemErro(erro: any): string {
    if (typeof erro?.error?.mensagem === 'string') {
      return erro.error.mensagem;
    }

    if (typeof erro?.error?.message === 'string') {
      return erro.error.message;
    }

    if (erro?.status === 0) {
      return 'Não foi possível conectar ao servidor.';
    }

    if (erro?.status === 401) {
      return 'Sua sessão expirou. Faça login novamente.';
    }

    if (erro?.status === 403) {
      return 'Você não tem permissão para realizar esta operação.';
    }

    if (erro?.status === 409) {
      return 'O carrinho foi alterado. Confira os produtos e tente novamente.';
    }

    if (typeof erro?.message === 'string') {
      return erro.message;
    }

    return 'Não foi possível realizar a operação no carrinho.';
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();

    if (this.intervaloSincronizacao !== null) {
      clearInterval(this.intervaloSincronizacao);
    }

    if (this.intervaloTemporizador !== null) {
      clearInterval(this.intervaloTemporizador);
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener(
        'focus',
        this.sincronizarAoFocar
      );
    }

    if (typeof document !== 'undefined') {
      document.removeEventListener(
        'visibilitychange',
        this.sincronizarVisibilidade
      );
    }

    this.canal?.close();
  }
}
