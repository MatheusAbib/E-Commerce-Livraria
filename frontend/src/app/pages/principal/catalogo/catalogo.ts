import { TemplateRef } from '@angular/core';
import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import {
  BotaoComponent,
  BotaoIconeComponent,
  GrupoAcoesComponent
} from '../../../components/shared/buttons';
import {
  CampoDirective,
  CampoSelecaoComponent,
  CampoAvaliacaoComponent
} from '../../../components/shared/forms';
import {
  CarregamentoComponent,
  EstadoVazioComponent
} from '../../../components/shared/feedback';

interface FiltrosCatalogo {
  titulo: string;
  autor: string;
  editora: string;
  categoria: string;
  precoMax: number | null;
  avaliacao: string;
  ordenacao: string;
}

type AtalhoCatalogo = 'favoritos' | 'carrinho' | 'cupons' | 'perfil';

@Component({
  selector: 'app-principal-catalogo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginatorModule,
    TooltipModule,
    BotaoComponent,
    BotaoIconeComponent,
    GrupoAcoesComponent,
    CampoDirective,
    CampoSelecaoComponent,
    CampoAvaliacaoComponent,
    CarregamentoComponent,
    EstadoVazioComponent
  ],
  templateUrl: './catalogo.html',
  styleUrls: ['./catalogo.css']
})
export class CatalogoComponent implements OnDestroy {
  @Input({ required: true }) cabecalhoSecao!: TemplateRef<any>;

  @Input() isLoggedIn = false;
  @Input() favoritosCount = 0;
  @Input() carrinhoItens = 0;
  @Input() cuponsDisponiveisCount = 0;
  @Input() loading = false;
  @Input() totalRecords = 0;
  @Input() first = 0;
  @Input() rows = 24;
  @Input() filteredLivros: any[] = [];
  @Input() livrosPaginados: any[] = [];
  @Input() favoritosIds: number[] = [];
  @Input() carregandoFiltro = false;
  @Input() carregandoLimpar = false;
  @Input() carregandoFavorito: Record<number, boolean> = {};
  @Input() carregandoCarrinho: Record<number, boolean> = {};

  @Input() filtros: FiltrosCatalogo = {
    titulo: '',
    autor: '',
    editora: '',
    categoria: '',
    precoMax: null,
    avaliacao: '',
    ordenacao: ''
  };

  @Input() opcoesCategoriasCompartilhadas: {
    rotulo: string;
    valor: string;
  }[] = [];

  @Input({ required: true }) estoqueDisponivel!: (livro: any) => number;
  @Input({ required: true }) limiteAdicao!: (livro: any) => number;
  @Input({ required: true }) getTipoEstrelaPrincipal!: (nota: number, indice: number) => string;
  @Input({ required: true }) formatarNota!: (nota: number) => string;

  @Output() filtrosAplicados = new EventEmitter<void>();
  @Output() filtrosLimpos = new EventEmitter<void>();
  @Output() livroSelecionado = new EventEmitter<any>();
  @Output() favoritoAlterado = new EventEmitter<number>();
  @Output() livroAdicionado = new EventEmitter<number>();
  @Output() paginaAlterada = new EventEmitter<any>();
  @Output() atalhoSelecionado = new EventEmitter<AtalhoCatalogo>();

  readonly opcoesAvaliacoes = [
    { rotulo: 'Todas as avaliações', valor: '' },
    { rotulo: '4 estrelas ou mais', valor: '4' },
    { rotulo: '3 estrelas ou mais', valor: '3' },
    { rotulo: '2 estrelas ou mais', valor: '2' },
    { rotulo: '1 estrela ou mais', valor: '1' },
    { rotulo: 'Sem avaliações', valor: 'sem' }
  ];

  readonly opcoesOrdenacao = [
    { rotulo: 'Ordem padrão', valor: '' },
    { rotulo: 'Melhor avaliação', valor: 'avaliacao' },
    { rotulo: 'Mais vendidos', valor: 'vendas' },
    { rotulo: 'Menor preço', valor: 'preco-asc' },
    { rotulo: 'Maior preço', valor: 'preco-desc' },
    { rotulo: 'Título (A–Z)', valor: 'titulo' }
  ];

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly DEBOUNCE_MS = 350;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  identificarLivro(indice: number, livro: any): number {
    return livro.id;
  }

  alterarOrdenacao(valor: string): void {
    this.filtros.ordenacao = valor || '';
    this.aplicarFiltros();
  }

  onFiltroTextoChange(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    const vazio = !this.filtros.titulo && !this.filtros.autor
      && !this.filtros.editora && this.filtros.precoMax === null;
    if (vazio) {
      this.aplicarFiltros();
      return;
    }
    this.debounceTimer = setTimeout(() => this.aplicarFiltros(), this.DEBOUNCE_MS);
  }

  aplicarFiltros(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.filtrosAplicados.emit();
  }

  limparFiltros(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.filtrosLimpos.emit();
  }

  verDetalhes(livro: any): void {
    this.livroSelecionado.emit(livro);
  }

  favoritar(id: number): void {
    this.favoritoAlterado.emit(id);
  }

  adicionarAoCarrinho(id: number): void {
    this.livroAdicionado.emit(id);
  }

  onPageChange(evento: any): void {
    this.paginaAlterada.emit(evento);
  }

  abrirAtalho(tipo: AtalhoCatalogo): void {
    this.atalhoSelecionado.emit(tipo);
  }

  destacarTrecho(texto: string, termo: string): SafeHtml {
    const textoEscapado = this.escaparHtml(texto ?? '');
    const termoLimpo = (termo ?? '').trim();

    if (!termoLimpo) {
      return this.sanitizer.bypassSecurityTrustHtml(textoEscapado);
    }

    const padrao = new RegExp(`(${this.escapeRegex(this.escaparHtml(termoLimpo))})`, 'gi');
    const html = textoEscapado.replace(padrao, '<mark class="livro-destaque">$1</mark>');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private escaparHtml(valor: string): string {
    return valor
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private escapeRegex(valor: string): string {
    return valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
