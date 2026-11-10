import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { GalleriaModule } from 'primeng/galleria';
import { PaginatorModule } from 'primeng/paginator';
import { DialogModule } from 'primeng/dialog';
import { BadgeModule } from 'primeng/badge';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { CarrinhoService } from '../../services/carrinho';
import { AuthService } from '../../services/auth';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    GalleriaModule,
    PaginatorModule,
    DialogModule,
    BadgeModule,
    ProgressSpinnerModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './principal.html',
  styleUrls: ['./principal.css']
})
export class Principal implements OnInit {
  livros: any[] = [];
  maisVendidos: any[] = [];
  carregandoMaisVendidos: boolean = false;
  filteredLivros: any[] = [];
  selectedLivro: any = null;
  displayDialog: boolean = false;
  loading: boolean = false;
  totalRecords: number = 0;
  first: number = 0;
  rows: number = 12;
  isLoggedIn: boolean = false;
  favoritosIds: number[] = [];
  favoritosCount: number = 0;
  carrinhoItens: number = 0;
  cuponsDisponiveisCount: number = 0;
  comentarios: any[] = [];
  comentariosPaginados: any[] = [];
  comentariosLoading: boolean = false;
  comentariosExpandido: boolean = false;
  comentariosFirst: number = 0;
  comentariosRows: number = 5;
  comentariosTotal: number = 0;
  carregandoFiltro: boolean = false;
  carregandoLimpar: boolean = false;
  carregandoCarrinho: { [key: number]: boolean } = {};
  carregandoFavorito: { [key: number]: boolean } = {};
  carregandoCarrinhoModal: boolean = false;
  carregandoFavoritoModal: boolean = false;
  filtros = {
    titulo: '',
    autor: '',
    editora: '',
    categoria: '',
    precoMax: null
  };
  categorias: any[] = [];
  quantidadeSelecionada: number = 1;
  selectedIsFavorited: boolean = false;
  constructor(
    private messageService: MessageService,
    private carrinhoService: CarrinhoService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.carrinhoService.carrinhoItens$.subscribe(total => {
      this.carrinhoItens = total;
      this.cdr.markForCheck();
    });

    this.authService.favoritosCount$.subscribe(count => {
      this.favoritosCount = count;
      this.cdr.markForCheck();
    });

    this.authService.cuponsCount$.subscribe(count => {
      this.cuponsDisponiveisCount = count;
      this.cdr.markForCheck();
    });

    this.carregarLivros();
    this.carregarMaisVendidos();
    const user = JSON.parse(localStorage.getItem('clienteLogado') || 'null');
    this.isLoggedIn = !!user;
    if (this.isLoggedIn) {
      this.carregarFavoritos();
    }
    this.authService.loginStatus$.subscribe(async logado => {
      this.isLoggedIn = logado;
      if (!logado) {
        this.favoritosIds = [];
        this.selectedIsFavorited = false;
      } else {
        await this.carregarFavoritos();
      }
      this.cdr.detectChanges();
    });
    this.authService.favoritosAtualizados$.subscribe(() => {
      this.carregarFavoritos();
    });
    this.route.queryParams.subscribe(params => {
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
    });
  }
  async carregarComentarios(livroId: number): Promise<void> {
    this.comentariosLoading = true;
    try {
      const response = await fetch(`${environment.apiUrl}/avaliacoes/livro/${livroId}`);
      if (response.ok) {
        this.comentarios = await response.json();
        this.comentarios.sort((a, b) =>
          new Date(b.dataAvaliacao).getTime() - new Date(a.dataAvaliacao).getTime()
        );
        this.comentariosTotal = this.comentarios.length;
        this.atualizarComentariosPaginados();
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    } finally {
      this.comentariosLoading = false;
    }
  }
  atualizarComentariosPaginados(): void {
    this.comentariosPaginados = this.comentarios.slice(
      this.comentariosFirst,
      this.comentariosFirst + this.comentariosRows
    );
  }
  onComentariosPageChange(event: any): void {
    this.comentariosFirst = event.first;
    this.comentariosRows = event.rows;
    this.atualizarComentariosPaginados();
  }
  toggleComentarios(): void {
    this.comentariosExpandido = !this.comentariosExpandido;
    if (this.comentariosExpandido && this.comentarios.length === 0) {
      this.carregarComentarios(this.selectedLivro.id);
    }
  }
  formatarDataComentario(data: string): string {
    const date = new Date(data);
    const hoje = new Date();
    const diff = hoje.getTime() - date.getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (dias === 0) return 'Hoje';
    if (dias === 1) return 'Ontem';
    if (dias < 7) return `${dias} dias atrás`;
    if (dias < 30) return `${Math.floor(dias / 7)} semanas atrás`;
    if (dias < 365) return `${Math.floor(dias / 30)} meses atrás`;
    return `${Math.floor(dias / 365)} anos atrás`;
  }
  getIniciais(nome: string): string {
    if (!nome) return '?';
    return nome.charAt(0).toUpperCase();
  }
  async carregarFavoritos(): Promise<void> {
    const user = JSON.parse(localStorage.getItem('clienteLogado') || 'null');
    if (!user) return;
    try {
      const token = this.authService.getToken();
      const response = await fetch(`${environment.apiUrl}/clientes/${user.id}/favoritos`, {
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
  abrirAtalho(tipo: 'favoritos' | 'carrinho' | 'cupons'): void {
    window.dispatchEvent(new CustomEvent('livraria:abrir-atalho', { detail: tipo }));
  }

  painelExploracao: 'autores' | 'generos' | null = null;
  buscaExploracaoAutor: string = '';
  buscaExploracaoGenero: string = '';

  get autoresExploracaoFiltrados(): string[] {
    const termo = this.normalizarBuscaExploracao(this.buscaExploracaoAutor);
    return this.autoresDisponiveis.filter(autor => this.normalizarBuscaExploracao(autor).includes(termo));
  }

  get generosExploracaoFiltrados(): string[] {
    const termo = this.normalizarBuscaExploracao(this.buscaExploracaoGenero);
    return this.generosDisponiveis.filter(genero => this.normalizarBuscaExploracao(genero).includes(termo));
  }

  private normalizarBuscaExploracao(valor: string): string {
    return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
  }

  get autoresDisponiveis(): string[] {
    return [...new Set(
      this.livros
        .map(l => String(l.autor || '').trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  get generosDisponiveis(): string[] {
    return [...new Set(
      this.livros
        .map(l => String(l.categoria || '').trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  quantidadePorAutor(autor: string): number {
    return this.livros.filter(l => l.autor === autor).length;
  }

  quantidadePorGenero(genero: string): number {
    return this.livros.filter(l => l.categoria === genero).length;
  }

  abrirExploracao(tipo: 'catalogo' | 'autores' | 'generos'): void {
    if (tipo === 'catalogo') {
      this.painelExploracao = null;
      this.limparFiltros();
      setTimeout(() => this.scrollTo('produtos'), 0);
      return;
    }

    this.painelExploracao = this.painelExploracao === tipo ? null : tipo;
  }

  selecionarAutor(autor: string): void {
    this.filtros = {
      titulo: '',
      autor,
      editora: '',
      categoria: '',
      precoMax: null
    };

    this.painelExploracao = null;
    this.aplicarFiltros();
    setTimeout(() => this.scrollTo('produtos'), 0);
  }

  selecionarGenero(genero: string): void {
    this.filtros = {
      titulo: '',
      autor: '',
      editora: '',
      categoria: genero,
      precoMax: null
    };

    this.painelExploracao = null;
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
    const response = await fetch(`${environment.apiUrl}/livros/mais-vendidos`);

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
      const response = await fetch(`${environment.apiUrl}/livros`);
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
        const response = await fetch(`${environment.apiUrl}/avaliacoes/livro/${livro.id}/resumo`);
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
  filtrando: boolean = false;
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
    if (this.filtros.precoMax && l.precoVenda > this.filtros.precoMax) match = false;

    return match;
  });

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
    precoMax: null
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
    this.quantidadeSelecionada = 1;
    this.selectedIsFavorited = this.favoritosIds.includes(livro.id);
    this.displayDialog = true;
    this.comentarios = [];
    this.comentariosPaginados = [];
    this.comentariosExpandido = false;
    this.comentariosFirst = 0;
    this.carregarComentarios(livro.id);
  }
async favoritarDoModal(): Promise<void> {
  if (!this.selectedLivro) return;
  this.carregandoFavoritoModal = true;
  try {
    await this.favoritar(this.selectedLivro.id);
    this.selectedIsFavorited = this.favoritosIds.includes(this.selectedLivro.id);
  } finally {
    this.carregandoFavoritoModal = false;
  }
}
  aumentarQuantidade(): void {
    if (this.selectedLivro && this.quantidadeSelecionada < this.selectedLivro.estoque) {
      this.quantidadeSelecionada++;
    }
  }
  diminuirQuantidade(): void {
    if (this.quantidadeSelecionada > 1) {
      this.quantidadeSelecionada--;
    }
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
      const response = await fetch(`${environment.apiUrl}/clientes/${user.id}/favoritos/${livroId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      if (response.ok) {
        this.favoritosIds = this.favoritosIds.filter(id => id !== livroId);
        this.selectedIsFavorited = false;
        const livro = this.livros.find(l => l.id === livroId);
        const nomeLivro = livro ? livro.titulo : 'Livro';
        this.messageService.add({severity:'info', summary:'Removido', detail:`${nomeLivro} removido dos favoritos`});
        this.authService.adicionarNotificacao('Removido', `${nomeLivro} removido dos favoritos`, 'info');
        await this.atualizarContadorFavoritos();
        this.authService.notificarFavoritosAtualizados();
      }
    } else {
      const body = { livroId };
      const response = await fetch(`${environment.apiUrl}/clientes/${user.id}/favoritos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        this.favoritosIds.push(livroId);
        this.selectedIsFavorited = true;
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
      const response = await fetch(`${environment.apiUrl}/clientes/${user.id}/favoritos`, {
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
  async adicionarAoCarrinhoComQuantidade(id: number): Promise<void> {
    if (this.carregandoCarrinhoModal) return;
    this.carregandoCarrinhoModal = true;
    const user = this.authService.getUser();
    if (!user) {
      this.messageService.add({severity:'error', summary:'Erro', detail:'Faça login para comprar'});
      this.carregandoCarrinhoModal = false;
      return;
    }
    try {
      const carrinhos = JSON.parse(localStorage.getItem('carrinhosPorUsuario') || '{}');
      let carrinho = carrinhos[user.id] || [];
      const carrinhoValido = carrinho.filter((item: any) => {
        if (!item.dataAdicao) {
          item.dataAdicao = new Date().toISOString();
          return true;
        }
        const dataAdicao = new Date(item.dataAdicao);
        const agora = new Date();
        const diff = (agora.getTime() - dataAdicao.getTime()) / (1000 * 60);
        return diff < 30;
      });
      if (carrinhoValido.length !== carrinho.length) {
        carrinho = carrinhoValido;
        carrinhos[user.id] = carrinho;
        localStorage.setItem('carrinhosPorUsuario', JSON.stringify(carrinhos));
        this.messageService.add({
          severity: 'warn',
          summary: 'Carrinho atualizado',
          detail: 'Itens antigos foram removidos por expiração.'
        });
      }
      const token = this.authService.getToken();
      const responseUser = await fetch(`${environment.apiUrl}/clientes/${user.id}`, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      if (responseUser.ok) {
        const usuarioCompleto = await responseUser.json();
        const temEndereco = usuarioCompleto.enderecos && usuarioCompleto.enderecos.length > 0;
        const temCartao = usuarioCompleto.cartoes && usuarioCompleto.cartoes.length > 0;
        if (!temEndereco || !temCartao) {
          let mensagem = '';
          if (!temEndereco && !temCartao) {
            mensagem = 'Cadastre um endereco e um cartao para finalizar a compra';
          } else if (!temEndereco) {
            mensagem = 'Cadastre um endereco para finalizar a compra';
          } else {
            mensagem = 'Cadastre um cartao para finalizar a compra';
          }
          this.messageService.add({
            severity: 'warn',
            summary: 'Dados incompletos',
            detail: mensagem,
            life: 4000
          });
          this.authService.adicionarNotificacao('Dados incompletos', mensagem, 'warning');
          this.carregandoCarrinhoModal = false;
          return;
        }
      }
      const response = await fetch(`${environment.apiUrl}/livros/${id}`);
      const produto = await response.json();
      if (produto.estoque <= 0) {
        this.messageService.add({severity:'error', summary:'Erro', detail:'Produto indisponivel'});
        this.carregandoCarrinhoModal = false;
        return;
      }
      const existente = carrinho.find((i: any) => i.id === id);
      const novaQuantidade = this.quantidadeSelecionada;
      if (existente) {
        if (existente.quantidade + novaQuantidade > produto.estoque) {
          this.messageService.add({severity:'error', summary:'Erro', detail:'Quantidade indisponivel em estoque'});
          this.carregandoCarrinhoModal = false;
          return;
        }
        existente.quantidade += novaQuantidade;
        existente.dataAdicao = new Date().toISOString();
      } else {
        carrinho.push({
          id,
          quantidade: novaQuantidade,
          dataAdicao: new Date().toISOString()
        });
      }
      carrinhos[user.id] = carrinho;
      localStorage.setItem('carrinhosPorUsuario', JSON.stringify(carrinhos));
      this.carrinhoService.atualizarContador();
      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: `${novaQuantidade}x ${produto.titulo} adicionado ao carrinho!`
      });
      this.authService.adicionarNotificacao('Carrinho', `${produto.titulo} adicionado ao carrinho!`, 'success');
      this.displayDialog = false;
      this.quantidadeSelecionada = 1;
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao adicionar produto'
      });
    } finally {
      this.carregandoCarrinhoModal = false;
    }
  }
  arredondarNota(nota: number): number {
    return Math.round(nota);
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
  getTipoEstrelaComentario(nota: number, estrelaIndex: number): string {
    if (!nota) return 'vazia';
    if (nota >= estrelaIndex + 1) {
      return 'cheia';
    } else if (nota > estrelaIndex && nota < estrelaIndex + 1) {
      return 'meia';
    } else {
      return 'vazia';
    }
  }
  async adicionarAoCarrinho(id: number): Promise<void> {
    if (this.carregandoCarrinho[id]) return;
    this.carregandoCarrinho[id] = true;
    const user = this.authService.getUser();
    if (!user) {
      this.messageService.add({severity:'error', summary:'Erro', detail:'Faça login para comprar'});
      this.carregandoCarrinho[id] = false;
      return;
    }
    try {
      const carrinhos = JSON.parse(localStorage.getItem('carrinhosPorUsuario') || '{}');
      let carrinho = carrinhos[user.id] || [];
      const carrinhoValido = carrinho.filter((item: any) => {
        if (!item.dataAdicao) {
          item.dataAdicao = new Date().toISOString();
          return true;
        }
        const dataAdicao = new Date(item.dataAdicao);
        const agora = new Date();
        const diff = (agora.getTime() - dataAdicao.getTime()) / (1000 * 60);
        return diff < 30;
      });
      if (carrinhoValido.length !== carrinho.length) {
        carrinho = carrinhoValido;
        carrinhos[user.id] = carrinho;
        localStorage.setItem('carrinhosPorUsuario', JSON.stringify(carrinhos));
        this.messageService.add({
          severity: 'warn',
          summary: 'Carrinho atualizado',
          detail: 'Itens antigos foram removidos por expiração.'
        });
      }
      const token = this.authService.getToken();
      const responseUser = await fetch(`${environment.apiUrl}/clientes/${user.id}`, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      if (responseUser.ok) {
        const usuarioCompleto = await responseUser.json();
        const temEndereco = usuarioCompleto.enderecos && usuarioCompleto.enderecos.length > 0;
        const temCartao = usuarioCompleto.cartoes && usuarioCompleto.cartoes.length > 0;
        if (!temEndereco || !temCartao) {
          let mensagem = '';
          if (!temEndereco && !temCartao) {
            mensagem = 'Cadastre um endereco e um cartao para finalizar a compra';
          } else if (!temEndereco) {
            mensagem = 'Cadastre um endereco para finalizar a compra';
          } else {
            mensagem = 'Cadastre um cartao para finalizar a compra';
          }
          this.messageService.add({
            severity: 'warn',
            summary: 'Dados incompletos',
            detail: mensagem,
            life: 4000
          });
          this.authService.adicionarNotificacao('Dados incompletos', mensagem, 'warning');
          this.carregandoCarrinho[id] = false;
          return;
        }
      }
      const response = await fetch(`${environment.apiUrl}/livros/${id}`);
      const produto = await response.json();
      if (produto.estoque <= 0) {
        this.messageService.add({severity:'error', summary:'Erro', detail:'Produto indisponivel'});
        this.carregandoCarrinho[id] = false;
        return;
      }
      const existente = carrinho.find((i: any) => i.id === id);
      if (existente) {
        if (existente.quantidade + 1 > produto.estoque) {
          this.messageService.add({severity:'error', summary:'Erro', detail:'Quantidade indisponivel em estoque'});
          this.carregandoCarrinho[id] = false;
          return;
        }
        existente.quantidade++;
        existente.dataAdicao = new Date().toISOString();
      } else {
        carrinho.push({
          id,
          quantidade: 1,
          dataAdicao: new Date().toISOString()
        });
      }
      carrinhos[user.id] = carrinho;
      localStorage.setItem('carrinhosPorUsuario', JSON.stringify(carrinhos));
      this.carrinhoService.atualizarContador();
      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: `${produto.titulo} adicionado ao carrinho!`
      });
      this.authService.adicionarNotificacao('Carrinho', `${produto.titulo} adicionado ao carrinho!`, 'success');
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao adicionar produto'
      });
    } finally {
      this.carregandoCarrinho[id] = false;
    }
  }
}

