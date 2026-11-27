import { ViewEncapsulation } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { AvaliacaoService } from '../../services/avaliacao.service';
import { inject } from '@angular/core';
import { FavoritoService } from '../../services/favorito.service';
import { LivroService } from '../../services/livro.service';
import { AutoresComponent } from './autores/autores';
import { DescobertaLiterariaComponent } from './descoberta-literaria/descoberta-literaria';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AberturaComponent } from './abertura/abertura';
import { ExploracaoComponent } from './exploracao/exploracao';
import { MaisVendidosComponent } from './mais-vendidos/mais-vendidos';
import { CatalogoComponent } from './catalogo/catalogo';
import { DetalhesLivroComponent } from './detalhes-livro/detalhes-livro';
import { NotificacaoComponent } from '../../components/shared/feedback';
import { CarrinhoService } from '../../services/carrinho';
import { AuthService } from '../../services/auth';


@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    AberturaComponent,
    ExploracaoComponent,
    MaisVendidosComponent,
    DescobertaLiterariaComponent,
    AutoresComponent,
    CatalogoComponent,
    DetalhesLivroComponent,
    NotificacaoComponent
  ],
  providers: [MessageService],
  templateUrl: './principal.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./principal.css']
})
export class Principal implements OnInit, OnDestroy {
  private readonly avaliacaoService = inject(AvaliacaoService);

  private readonly favoritoService = inject(FavoritoService);
  private readonly livroService = inject(LivroService);

  readonly consultarEstoque = (livro: any): number => this.estoqueDisponivel(livro);
  readonly consultarLimiteAdicao = (livro: any): number => this.limiteAdicao(livro);
  readonly consultarTipoEstrela = (nota: number, indice: number): string => this.getTipoEstrelaPrincipal(nota, indice);
  readonly consultarNota = (nota: number): string => this.formatarNota(nota);

  get opcoesCategoriasCompartilhadas() {
    return [
      { rotulo: 'Todas as categorias', valor: '' },
      ...this.categorias.map(categoria => ({
        rotulo: categoria.label,
        valor: String(categoria.value)
      }))
    ];
  }

  private inscricoes = new Subscription();
  private intervaloEstoque?: ReturnType<typeof setInterval>;
  private atualizandoEstoque = false;
  private destruido = false;
  private quantidadesReservadas = new Map<number, number>();
  livros: any[] = [];
  maisVendidos: any[] = [];
  carregandoMaisVendidos: boolean = false;
  filteredLivros: any[] = [];
  selectedLivro: any = null;
  displayDialog: boolean = false;
  loading: boolean = false;
  totalRecords: number = 0;
  first: number = 0;
  rows: number = 24;
  isLoggedIn: boolean = false;
  favoritosIds: number[] = [];
  favoritosCount: number = 0;
  carrinhoItens: number = 0;
  cuponsDisponiveisCount: number = 0;
  carregandoFiltro: boolean = false;
  carregandoLimpar: boolean = false;
  carregandoCarrinho: { [key: number]: boolean } = {};
  carregandoFavorito: { [key: number]: boolean } = {};
  carregandoCarrinhoModal: boolean = false;
  filtros = {
    titulo: '',
    autor: '',
    editora: '',
    categoria: '',
    precoMax: null as number | null,
      avaliacao: '',
      ordenacao: ''
  };
  categorias: any[] = [];
  constructor(
    private messageService: MessageService,
    private carrinhoService: CarrinhoService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.inscricoes.add(this.carrinhoService.carrinhoItens$.subscribe(total => {
      this.carrinhoItens = total;
      this.cdr.markForCheck();
    }));

    this.inscricoes.add(this.authService.favoritosCount$.subscribe(count => {
      this.favoritosCount = count;
      this.cdr.markForCheck();
    }));

    this.inscricoes.add(this.authService.cuponsCount$.subscribe(count => {
      this.cuponsDisponiveisCount = count;
      this.cdr.markForCheck();
    }));

    this.inscricoes.add(this.carrinhoService.carrinhoAtualizado$.subscribe(() => {
      this.quantidadesReservadas.clear();
      void this.atualizarEstoqueCatalogo();
    }));
    this.intervaloEstoque = setInterval(() => void this.atualizarEstoqueCatalogo(), 10000);
    this.carregarLivros();
    this.carregarMaisVendidos();
    const user = JSON.parse(localStorage.getItem('clienteLogado') || 'null');
    this.isLoggedIn = !!user;
    if (this.isLoggedIn) {
      this.carregarFavoritos();
    }
    this.inscricoes.add(this.authService.loginStatus$.subscribe(async logado => {
      this.isLoggedIn = logado;
      if (!logado) {
        this.favoritosIds = [];

      } else {
        await this.carregarFavoritos();
      }
      this.cdr.detectChanges();
    }));
    this.inscricoes.add(this.authService.favoritosAtualizados$.subscribe(() => {
      this.carregarFavoritos();
    }));
    this.inscricoes.add(this.route.queryParams.subscribe(params => {
      const livroId = params['livroId'];
      if (livroId) {
        setTimeout(() => {
          const livro = this.livros.find(l => l.id == livroId);
          if (livro) {
            this.verDetalhes(livro);
            this.router.navigate([], { queryParams: {}, replaceUrl: true });
          }
        }, 500);
      }
    }));
  }
  async carregarFavoritos(): Promise<void> {
    const user = JSON.parse(localStorage.getItem('clienteLogado') || 'null');
    if (!user) return;
    try {
      const token = this.authService.getToken();
      const response = await this.favoritoService.listar(user.id, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        }
      });
      if (response.ok) {
        const favoritos = await response.json();
        this.favoritosIds = favoritos.map((f: any) => f.id);
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    }
  }
abrirAtalho(tipo: 'favoritos' | 'carrinho' | 'cupons' | 'perfil'): void {
  window.dispatchEvent(new CustomEvent('livraria:abrir-atalho', { detail: tipo }));
}

  abrirCatalogo(): void {
    this.limparFiltros();
    setTimeout(() => this.scrollTo('produtos'), 0);
  }

  selecionarAutor(autor: string): void {
    this.filtros = {
      titulo: '',
      autor,
      editora: '',
      categoria: '',
      precoMax: null as number | null,
      avaliacao: '',
      ordenacao: ''
    };

    this.aplicarFiltros();
    setTimeout(() => this.scrollTo('produtos'), 0);
  }

  selecionarGenero(genero: string): void {
    this.filtros = {
      titulo: '',
      autor: '',
      editora: '',
      categoria: genero,
      precoMax: null as number | null,
      avaliacao: '',
      ordenacao: ''
    };

    this.aplicarFiltros();
    setTimeout(() => this.scrollTo('produtos'), 0);
  }
scrollTo(elementId: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

private rolarParaCatalogo(): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const catalogo = document.getElementById('produtos');

      if (!catalogo) return;

      const headerOffset = 90;
      const posicao = catalogo.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({
        top: Math.max(0, posicao),
        behavior: 'smooth'
      });
    });
  });
}

async carregarMaisVendidos(): Promise<void> {
  this.carregandoMaisVendidos = true;

  try {
    const response = await this.livroService.listarMaisVendidos();

    if (!response.ok) {
      throw new Error('Erro ao buscar os livros mais vendidos');
    }

    this.maisVendidos = await response.json();
  } catch (error) {
    console.error('Erro ao carregar os mais vendidos:', error);
    this.maisVendidos = [];
  } finally {
    this.carregandoMaisVendidos = false;
    this.cdr.detectChanges();
  }
}

async carregarLivros(): Promise<void> {
    this.loading = true;
    try {
      const response = await this.livroService.listar();
      this.livros = await response.json();
      this.filteredLivros = [...this.livros];
      await this.carregarAvaliacoesDosLivros();
      this.totalRecords = this.filteredLivros.length;
      this.carregarCategorias();
    } catch (error) {
      console.error('Erro ao carregar livros:', error);
    } finally {
      this.loading = false;
    }
  }
  async carregarAvaliacoesDosLivros(): Promise<void> {
    for (const livro of this.livros) {
      try {
        const response = await this.avaliacaoService.buscarResumo(livro.id);
        if (response.ok) {
          livro.avaliacao = await response.json();
        }
      } catch (error) {
        console.error('Erro ao buscar avaliação do livro:', error);
      }
    }
  }
  formatarNota(nota: number): string {
    return nota.toFixed(1);
  }
  carregarCategorias(): void {
    const cats = this.livros.map(l => l.categoria).filter(c => c);
    this.categorias = [...new Set(cats)].map(c => ({ label: c, value: c }));
  }
  private ordenarLivrosCatalogo(): void {
    const compararTitulo = (a: any, b: any): number =>
      String(a.titulo ?? '').localeCompare(String(b.titulo ?? ''), 'pt-BR');

    const nota = (livro: any): number =>
      Number(livro.avaliacao?.totalAvaliacoes ?? 0) > 0
        ? Number(livro.avaliacao?.media ?? 0)
        : -1;

    switch (this.filtros.ordenacao) {
      case 'avaliacao':
        this.filteredLivros.sort((a, b) =>
          nota(b) - nota(a) ||
          Number(b.avaliacao?.totalAvaliacoes ?? 0) - Number(a.avaliacao?.totalAvaliacoes ?? 0) ||
          compararTitulo(a, b)
        );
        break;

      case 'vendas':
        this.filteredLivros.sort((a, b) =>
          Number(b.quantidadeVendida ?? 0) - Number(a.quantidadeVendida ?? 0) ||
          compararTitulo(a, b)
        );
        break;

      case 'preco-asc':
        this.filteredLivros.sort((a, b) =>
          Number(a.precoVenda ?? 0) - Number(b.precoVenda ?? 0) ||
          compararTitulo(a, b)
        );
        break;

      case 'preco-desc':
        this.filteredLivros.sort((a, b) =>
          Number(b.precoVenda ?? 0) - Number(a.precoVenda ?? 0) ||
          compararTitulo(a, b)
        );
        break;

      case 'titulo':
        this.filteredLivros.sort(compararTitulo);
        break;
    }
  }

async aplicarFiltros(): Promise<void> {
  if (this.carregandoFiltro) return;

  this.carregandoFiltro = true;
  this.loading = true;

  const inicio = Date.now();

  this.filteredLivros = this.livros.filter(l => {
    let match = true;

    if (this.filtros.titulo && !l.titulo?.toLowerCase().includes(this.filtros.titulo.toLowerCase())) match = false;
    if (this.filtros.autor && !l.autor?.toLowerCase().includes(this.filtros.autor.toLowerCase())) match = false;
    if (this.filtros.editora && !l.editora?.toLowerCase().includes(this.filtros.editora.toLowerCase())) match = false;
    if (this.filtros.categoria && l.categoria !== this.filtros.categoria) match = false;
    if (this.filtros.precoMax !== null && l.precoVenda > this.filtros.precoMax) match = false;

    const totalAvaliacoes = Number(l.avaliacao?.totalAvaliacoes ?? 0);
    const media = Number(l.avaliacao?.media ?? 0);

    if (this.filtros.avaliacao === 'sem' && (!l.avaliacao || totalAvaliacoes !== 0)) {
      match = false;
    } else if (this.filtros.avaliacao && this.filtros.avaliacao !== 'sem') {
      if (totalAvaliacoes <= 0 || media < Number(this.filtros.avaliacao)) {
        match = false;
      }
    }

    return match;
  });

  this.ordenarLivrosCatalogo();

  this.totalRecords = this.filteredLivros.length;
  this.first = 0;

  this.rolarParaCatalogo();

  const decorrido = Date.now() - inicio;
  const restante = Math.max(0, 500 - decorrido);

  setTimeout(() => {
    this.loading = false;
    this.carregandoFiltro = false;
    this.cdr.detectChanges();
  }, restante);
}
async limparFiltros(): Promise<void> {
  if (this.carregandoLimpar) return;

  this.carregandoLimpar = true;
  this.loading = true;

  const inicio = Date.now();

  this.filtros = {
    titulo: '',
    autor: '',
    editora: '',
    categoria: '',
    precoMax: null as number | null,
      avaliacao: '',
      ordenacao: ''
  };

  this.filteredLivros = [...this.livros];
  this.totalRecords = this.filteredLivros.length;
  this.first = 0;

  this.rolarParaCatalogo();

  const decorrido = Date.now() - inicio;
  const restante = Math.max(0, 500 - decorrido);

  setTimeout(() => {
    this.loading = false;
    this.carregandoLimpar = false;
    this.cdr.detectChanges();
  }, restante);
}
onPageChange(event: any): void {
  this.loading = true;
  this.first = event.first;
  this.rows = event.rows;

  this.rolarParaCatalogo();

  setTimeout(() => {
    this.loading = false;
    this.cdr.detectChanges();
  }, 300);
}
  get livrosPaginados(): any[] {
    return this.filteredLivros.slice(this.first, this.first + this.rows);
  }
  verDetalhes(livro: any): void {
    this.selectedLivro = livro;

    this.displayDialog = true;
    void this.atualizarEstoqueCatalogo();

  }
async favoritar(livroId: number): Promise<void> {
  if (this.carregandoFavorito[livroId]) return;
  this.carregandoFavorito[livroId] = true;
  const user = JSON.parse(localStorage.getItem('clienteLogado') || 'null');
  if (!user) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Faça login para favoritar livros'
    });
    this.carregandoFavorito[livroId] = false;
    return;
  }
  try {
    const token = this.authService.getToken();
    const isFavorited = this.favoritosIds.includes(livroId);
    if (isFavorited) {
      const response = await this.favoritoService.remover(user.id, livroId, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      if (response.ok) {
        this.favoritosIds = this.favoritosIds.filter(id => id !== livroId);

        const livro = this.livros.find(l => l.id === livroId);
        const nomeLivro = livro ? livro.titulo : 'Livro';
        this.messageService.add({severity:'info', summary:'Removido', detail:`${nomeLivro} removido dos favoritos`});
        this.authService.adicionarNotificacao('Removido', `${nomeLivro} removido dos favoritos`, 'info');
        await this.atualizarContadorFavoritos();
        this.authService.notificarFavoritosAtualizados();
      }
    } else {
      const body = { livroId };
      const response = await this.favoritoService.adicionar(user.id, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        this.favoritosIds.push(livroId);

        const livro = this.livros.find(l => l.id === livroId);
        const nomeLivro = livro ? livro.titulo : 'Livro';
        this.messageService.add({severity:'success', summary:'Favoritado', detail:`${nomeLivro} adicionado aos favoritos`});
        this.authService.adicionarNotificacao('Favoritado', `${nomeLivro} adicionado aos favoritos`, 'success');
        await this.atualizarContadorFavoritos();
        this.authService.notificarFavoritosAtualizados();
      }
    }
  } catch (error) {
    this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao favoritar'});
  } finally {
    this.carregandoFavorito[livroId] = false;
  }
}
  async atualizarContadorFavoritos(): Promise<void> {
    const user = JSON.parse(localStorage.getItem('clienteLogado') || 'null');
    if (!user) return;
    try {
      const token = this.authService.getToken();
      const response = await this.favoritoService.listar(user.id, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        }
      });
      if (response.ok) {
        const favoritos = await response.json();
        this.authService.atualizarFavoritosCount(favoritos.length);
      }
    } catch (error) {
      console.error('Erro ao atualizar contador de favoritos:', error);
    }
  }
  atualizarFavoritos(): void {
    this.carregarFavoritos();
  }
  async adicionarAoCarrinhoComQuantidade(id: number, quantidade: number): Promise<void> {
    if (this.carregandoCarrinhoModal || this.carregandoCarrinho[id]) return;
    this.carregandoCarrinhoModal = true;
    try {
      if (await this.reservarLivro(id, quantidade)) {
        this.displayDialog = false;

      }
    } finally {
      this.carregandoCarrinhoModal = false;
    }
  }
  getTipoEstrelaPrincipal(nota: number, estrelaIndex: number): string {
    if (nota >= estrelaIndex + 1) {
      return 'cheia';
    } else if (nota > estrelaIndex && nota < estrelaIndex + 1) {
      return 'meia';
    } else {
      return 'vazia';
    }
  }
  async adicionarAoCarrinho(id: number): Promise<void> {
    if (this.carregandoCarrinho[id] || this.carregandoCarrinhoModal) return;
    await this.reservarLivro(id, 1);
  }

  estoqueDisponivel(livro: any): number {
    return Math.max(0, Number(livro?.estoqueDisponivel ?? 0));
  }

  limiteAdicao(livro: any): number {
    return Math.max(0, Math.min(this.estoqueDisponivel(livro), 3 - (this.quantidadesReservadas.get(livro?.id) ?? 0)));
  }

  private async reservarLivro(id: number, quantidade: number): Promise<boolean> {
    if (this.carregandoCarrinho[id]) return false;
    this.carregandoCarrinho[id] = true;
    try {
      if (!this.authService.isAuthenticated()) throw new Error('Faça login para comprar');
      const acesso = await this.authService.verificarAcessoCarrinho();
      if (!acesso.permitido) {
        this.messageService.add({severity:'warn', summary:'Dados incompletos', detail:acesso.mensagem, life:2000});
        this.authService.adicionarNotificacao('Dados incompletos', acesso.mensagem, 'warning');
        if (this.authService.isAuthenticated()) {
          this.displayDialog = false;
          this.abrirAtalho('perfil');
        }
        return false;
      }
      const carrinho = await this.carrinhoService.adicionarAoCarrinho(id, quantidade);
      this.quantidadesReservadas = new Map(carrinho.itens.map(i => [i.livroId, i.quantidade]));
      const item = carrinho.itens.find(i => i.livroId === id);
      const titulo = item?.titulo ?? this.livros.find(l => l.id === id)?.titulo ?? 'Livro';
      if (item) {
        for (const livro of [...this.livros, ...this.maisVendidos, this.selectedLivro]) {
          if (livro?.id === id) livro.estoqueDisponivel = item.estoqueDisponivel;
        }
      }
      this.messageService.add({severity:'success', summary:'Sucesso', detail:`${quantidade}x ${titulo} adicionado ao carrinho!`});
      this.authService.adicionarNotificacao('Carrinho', `${titulo} adicionado ao carrinho!`, 'success');
      return true;
    } catch (erro) {
      this.messageService.add({severity:'error', summary:'Erro', detail:this.carrinhoService.obterMensagemErro(erro)});
      return false;
    } finally {
      this.carregandoCarrinho[id] = false;
      void this.atualizarEstoqueCatalogo();
      if (!this.destruido) this.cdr.markForCheck();
    }
  }

  private async atualizarEstoqueCatalogo(): Promise<void> {
    if (this.atualizandoEstoque || this.destruido || !this.livros.length) return;
    this.atualizandoEstoque = true;
    try {
      const response = await this.livroService.listar({cache:'no-store'});
      if (!response.ok) return;
      const dados: any[] = await response.json();
      if (this.destruido) return;
      const porId = new Map(dados.map(l => [l.id, l]));
      for (const livro of [...this.livros, ...this.maisVendidos, this.selectedLivro]) {
        if (!livro) continue;
        const atual = porId.get(livro.id);
        livro.estoqueDisponivel = atual?.estoqueDisponivel ?? 0;
        if (atual) livro.ativo = atual.ativo;
      }

      this.cdr.markForCheck();
    } catch (erro) {
      console.error('Erro ao atualizar estoque:', erro);
    } finally {
      this.atualizandoEstoque = false;
    }
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.inscricoes.unsubscribe();
    if (this.intervaloEstoque) clearInterval(this.intervaloEstoque);
  }
}
