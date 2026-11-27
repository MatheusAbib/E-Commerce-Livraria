import { RelatorioService } from '../../../services/relatorio.service';
import { inject } from '@angular/core';
import { EstadoVazioComponent } from '../../../components/shared/feedback';
import { CarregamentoComponent } from '../../../components/shared/feedback';
import { CampoDirective } from '../../../components/shared/forms';
import { BotaoComponent } from '../../../components/shared/buttons/botao/botao';
import { GrupoAcoesComponent } from '../../../components/shared/buttons/grupo-acoes/grupo-acoes';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar';


@Component({
  selector: 'app-ranking-admin',
  standalone: true,
  imports: [EstadoVazioComponent, CarregamentoComponent, CampoDirective, 
    CommonModule,
    FormsModule,
    PaginatorModule,
    AdminSidebarComponent,
    BotaoComponent,
    GrupoAcoesComponent
  ],
  templateUrl: './ranking.html',
  styleUrls: ['./ranking.css', '../admin-common.css']
})
export class RankingAdminComponent implements OnInit {
  private readonly relatorioService = inject(RelatorioService);

  ranking: any[] = [];
  rankingFiltrado: any[] = [];
  rankingPaginado: any[] = [];
  loading: boolean = true;
  busca: string = '';
  filtrando: boolean = false;

  first: number = 0;
  rows: number = 10;
  totalRecords: number = 0;

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarRanking();
  }

  async carregarRanking(): Promise<void> {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      const data = await this.relatorioService.consultarRanking().toPromise();
      this.ranking = data || [];
      this.rankingFiltrado = [...this.ranking];
      this.totalRecords = this.rankingFiltrado.length;
      this.atualizarPaginacao();
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  aplicarFiltro(): void {
    this.filtrando = true;
    this.loading = true;
    this.cdr.detectChanges();

    const inicio = Date.now();

    const termo = this.busca.toLowerCase().trim();
    if (!termo) {
      this.rankingFiltrado = [...this.ranking];
    } else {
      this.rankingFiltrado = this.ranking.filter(cliente =>
        cliente.nome?.toLowerCase().includes(termo)
      );
    }

    this.totalRecords = this.rankingFiltrado.length;
    this.first = 0;
    this.atualizarPaginacao();

    const decorrido = Date.now() - inicio;
    const restante = Math.max(0, 500 - decorrido);

    setTimeout(() => {
      this.loading = false;
      this.filtrando = false;
      this.cdr.detectChanges();
    }, restante);
  }

  limparFiltro(): void {
    this.filtrando = true;
    this.loading = true;
    this.cdr.detectChanges();

    const inicio = Date.now();

    this.busca = '';
    this.rankingFiltrado = [...this.ranking];
    this.totalRecords = this.rankingFiltrado.length;
    this.first = 0;
    this.atualizarPaginacao();

    const decorrido = Date.now() - inicio;
    const restante = Math.max(0, 500 - decorrido);

    setTimeout(() => {
      this.loading = false;
      this.filtrando = false;
      this.cdr.detectChanges();
    }, restante);
  }

  atualizarPaginacao(): void {
    this.rankingPaginado = this.rankingFiltrado.slice(this.first, this.first + this.rows);
  }

  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    this.atualizarPaginacao();
  }

  getPositionClass(posicao: number): string {
    if (posicao === 0) return 'position-1';
    if (posicao === 1) return 'position-2';
    if (posicao === 2) return 'position-3';
    return '';
  }

  getMedalIcon(posicao: number): string {
    if (posicao === 0) return 'pi pi-crown';
    if (posicao === 1) return 'pi pi-medal';
    if (posicao === 2) return 'pi pi-medal';
    return '';
  }
}
