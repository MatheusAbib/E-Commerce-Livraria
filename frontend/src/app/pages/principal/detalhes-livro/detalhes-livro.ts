import { inject } from '@angular/core';
import { AvaliacaoService } from '../../../services/avaliacao.service';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnDestroy,
  DoCheck,
  SimpleChanges,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { BotaoComponent, BotaoIconeComponent } from '../../../components/shared/buttons';
import { CampoQuantidadeComponent, CampoAvaliacaoComponent } from '../../../components/shared/forms';
import { CarregamentoComponent, EstadoVazioComponent } from '../../../components/shared/feedback';
import { ModalBaseComponent, ModalCabecalhoComponent, ModalCorpoComponent } from '../../../components/shared/modals';

@Component({
  selector: 'app-principal-detalhes-livro',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginatorModule,
    TooltipModule,
    BotaoComponent,
    BotaoIconeComponent,
    CampoQuantidadeComponent,
    CampoAvaliacaoComponent,
    CarregamentoComponent,
    EstadoVazioComponent,
    ModalBaseComponent,
    ModalCabecalhoComponent,
    ModalCorpoComponent
  ],
  templateUrl: './detalhes-livro.html',
  styleUrls: ['./detalhes-livro.css']
})
export class DetalhesLivroComponent implements OnChanges, DoCheck, OnDestroy {
  private readonly avaliacaoService = inject(AvaliacaoService);

  @Input() displayDialog = false;
  @Input() selectedLivro: any = null;
  @Input() isLoggedIn = false;
  @Input() favoritosIds: number[] = [];
  @Input() carregandoFavorito: Record<number, boolean> = {};
  @Input() carregandoCarrinhoModal = false;

  @Input({ required: true }) estoqueDisponivel!: (livro: any) => number;
  @Input({ required: true }) limiteAdicao!: (livro: any) => number;

  @Input({ required: true }) formatarNota!: (nota: number) => string;

  @Output() fechar = new EventEmitter<void>();
  @Output() favoritoAlterado = new EventEmitter<number>();
  @Output() compraSolicitada = new EventEmitter<{ id: number; quantidade: number }>();

  quantidadeSelecionada = 1;
  comentarios: any[] = [];
  comentariosPaginados: any[] = [];
  comentariosLoading = false;
  comentariosExpandido = false;
  comentariosFirst = 0;
  comentariosRows = 5;
  comentariosTotal = 0;

  private requisicaoComentarios = 0;
  private destruido = false;

  constructor(private cdr: ChangeDetectorRef) {}

  get selectedIsFavorited(): boolean {
    return !!this.selectedLivro && this.favoritosIds.includes(this.selectedLivro.id);
  }

  get carregandoFavoritoModal(): boolean {
    return !!this.selectedLivro && !!this.carregandoFavorito[this.selectedLivro.id];
  }

  ngOnChanges(alteracoes: SimpleChanges): void {
    if (!this.displayDialog) {
      this.requisicaoComentarios++;
      this.comentariosLoading = false;
      return;
    }

    if (
      this.selectedLivro &&
      (alteracoes['selectedLivro'] || alteracoes['displayDialog'])
    ) {
      this.quantidadeSelecionada = 1;
      this.comentarios = [];
      this.comentariosPaginados = [];
      this.comentariosExpandido = false;
      this.comentariosFirst = 0;
      this.comentariosTotal = 0;

      void this.carregarComentarios(this.selectedLivro.id);
    }
  }

  ngDoCheck(): void {
    if (!this.displayDialog || !this.selectedLivro) return;

    this.quantidadeSelecionada = Math.max(
      1,
      Math.min(this.quantidadeSelecionada, this.limiteAdicao(this.selectedLivro))
    );
  }

  fecharModal(): void {
    this.fechar.emit();
  }

  favoritarDoModal(): void {
    if (!this.selectedLivro || this.carregandoFavoritoModal) return;

    this.favoritoAlterado.emit(this.selectedLivro.id);
  }

  adicionarAoCarrinhoComQuantidade(id: number): void {
    if (
      !this.selectedLivro ||
      this.carregandoCarrinhoModal ||
      this.quantidadeSelecionada > this.limiteAdicao(this.selectedLivro)
    ) return;

    this.compraSolicitada.emit({
      id,
      quantidade: this.quantidadeSelecionada
    });
  }

  ativarZoom(): void {
    if (!this.selectedLivro) return;
    const img = document.querySelector('.detalhes-imagem') as HTMLElement | null;
    img?.classList.add('zoom-ativo');
  }

  desativarZoom(): void {
    const img = document.querySelector('.detalhes-imagem') as HTMLElement | null;
    img?.classList.remove('zoom-ativo');
    const imgEl = img?.querySelector('img') as HTMLElement | null;
    if (imgEl) imgEl.style.transformOrigin = 'center center';
  }

  moverZoom(evento: MouseEvent): void {
    const wrapper = evento.currentTarget as HTMLElement;
    if (!wrapper) return;
    const img = wrapper.querySelector('img') as HTMLElement | null;
    if (!img) return;
    const rect = wrapper.getBoundingClientRect();
    const x = ((evento.clientX - rect.left) / rect.width) * 100;
    const y = ((evento.clientY - rect.top) / rect.height) * 100;
    img.style.transformOrigin = `${x}% ${y}%`;
  }

  async carregarComentarios(livroId: number): Promise<void> {
    const requisicao = ++this.requisicaoComentarios;
    this.comentariosLoading = true;

    try {
      const response = await this.avaliacaoService.listarPorLivro(livroId);

      if (!response.ok) return;

      const comentarios: any[] = await response.json();

      if (
        this.destruido ||
        requisicao !== this.requisicaoComentarios ||
        this.selectedLivro?.id !== livroId
      ) return;

      this.comentarios = comentarios.sort((a, b) =>
        new Date(b.dataAvaliacao).getTime() -
        new Date(a.dataAvaliacao).getTime()
      );

      this.comentariosTotal = this.comentarios.length;
      this.atualizarComentariosPaginados();
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    } finally {
      if (!this.destruido && requisicao === this.requisicaoComentarios) {
        this.comentariosLoading = false;
        this.cdr.markForCheck();
      }
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

  ngOnDestroy(): void {
    this.destruido = true;
    this.requisicaoComentarios++;
  }
}
