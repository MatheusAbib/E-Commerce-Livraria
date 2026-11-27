import { RelatorioService } from '../../../services/relatorio.service';
import { PedidoService } from '../../../services/pedido.service';
import { LivroService } from '../../../services/livro.service';
import { inject } from '@angular/core';
import { AvaliacaoService } from '../../../services/avaliacao.service';
import { EstadoVazioComponent } from '../../../components/shared/feedback';
import { CarregamentoComponent } from '../../../components/shared/feedback';
import { CampoDirective, CampoSelecaoComponent, OpcaoSelecao } from '../../../components/shared/forms';
import { BotaoComponent } from '../../../components/shared/buttons/botao/botao';
import { GrupoAcoesComponent } from '../../../components/shared/buttons/grupo-acoes/grupo-acoes';
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../../services/auth';
import { Router } from '@angular/router';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar';
import { PaginatorModule } from 'primeng/paginator';


Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [EstadoVazioComponent, CarregamentoComponent, 
    CampoDirective,
    CampoSelecaoComponent,
    CommonModule,
    FormsModule,
    AdminSidebarComponent,
    PaginatorModule,
    BotaoComponent,
    GrupoAcoesComponent
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css', '../admin-common.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private readonly relatorioService = inject(RelatorioService);
  private readonly pedidoService = inject(PedidoService);
  private readonly livroService = inject(LivroService);

  private readonly avaliacaoService = inject(AvaliacaoService);

  @ViewChild('salesChart') salesChartRef!: ElementRef;

  loading: boolean = true;
  loadingAvaliacoes: boolean = true;
  temDados: boolean = false;

  stats = {
    totalLivros: 0,
    totalVendas: 0,
    lucroTotal: 0,
    totalPedidos: 0
  };

  statsAvaliacoes = {
    mediaGeral: 0,
    totalAvaliacoes: 0,
    notaMaxima: 0,
    notaMinima: 0
  };

  lucros: any[] = [];
  lucrosFiltrados: any[] = [];
  lucrosPaginados: any[] = [];
  filtroLivro: string = 'todos';
  livrosOptions: string[] = [];

  readonly opcoesPeriodo: OpcaoSelecao<string>[] = [
    { rotulo: 'Hoje', valor: 'day' },
    { rotulo: 'Esta Semana', valor: 'week' },
    { rotulo: 'Este Mês', valor: 'month' },
    { rotulo: 'Este Ano', valor: 'year' }
  ];

  readonly opcoesStatus: OpcaoSelecao<string>[] = [
    { rotulo: 'Todos', valor: 'todos' },
    { rotulo: 'Entregues', valor: 'ENTREGUE' },
    { rotulo: 'Em Processamento', valor: 'EM_PROCESSAMENTO' },
    { rotulo: 'Em Trânsito', valor: 'EM_TRANSITO' },
    { rotulo: 'Cancelados', valor: 'CANCELADO' },
    { rotulo: 'Devolução', valor: 'DEVOLUCAO' }
  ];

  readonly opcoesTipoGrafico: OpcaoSelecao<string>[] = [
    { rotulo: 'Linha', valor: 'line' },
    { rotulo: 'Barras', valor: 'bar' }
  ];

  opcoesLivrosFiltro: OpcaoSelecao<string>[] = [
    { rotulo: 'Todos', valor: '' }
  ];

  opcoesLivrosLucro: OpcaoSelecao<string>[] = [
    { rotulo: 'Todos os livros', valor: 'todos' }
  ];

  statusDistribuicao: any[] = [];

  rankingLivros: any[] = [];
  rankingLivrosPaginados: any[] = [];
  distribuicaoNotas: any[] = [];

  firstLucro: number = 0;
  rowsLucro: number = 10;
  totalRecordsLucro: number = 0;

  firstRanking: number = 0;
  rowsRanking: number = 5;
  totalRecordsRanking: number = 0;

  filtrando: boolean = false;

  filtros = {
    periodo: 'month',
    status: 'todos',
    livro: '',
    chartType: 'line',
    dataInicio: '',
    dataFim: ''
  };

  private chart: Chart | null = null;
  private maxLucro: number = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (!user || user.perfil !== 'ADMIN') {
      this.router.navigate(['/principal']);
      return;
    }
    this.carregarDados();
    this.carregarAvaliacoes();
  }

ngAfterViewInit(): void {
  setTimeout(() => {
    this.carregarGrafico();
  }, 800);
}

  async carregarDados(): Promise<void> {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      await Promise.all([
        this.carregarLucros(),
        this.carregarLivros(),
        this.carregarStatusDistribuicao()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async carregarAvaliacoes(): Promise<void> {
    this.loadingAvaliacoes = true;
    this.cdr.detectChanges();
    try {
      const token = this.authService.getToken();
      const response = await this.avaliacaoService.listarTodas({
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (response.ok) {
        const avaliacoes = await response.json();
        this.processarAvaliacoes(avaliacoes);
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      this.loadingAvaliacoes = false;
      this.cdr.detectChanges();
    }
  }

  processarAvaliacoes(avaliacoes: any[]): void {
    if (avaliacoes.length === 0) {
      this.statsAvaliacoes = {
        mediaGeral: 0,
        totalAvaliacoes: 0,
        notaMaxima: 0,
        notaMinima: 0
      };
      this.rankingLivros = [];
      this.distribuicaoNotas = [];
      return;
    }

    const notas = avaliacoes.map(a => a.nota);
    const mediaGeral = notas.reduce((a, b) => a + b, 0) / notas.length;
    const notaMaxima = Math.max(...notas);
    const notaMinima = Math.min(...notas);

    this.statsAvaliacoes = {
      mediaGeral: mediaGeral,
      totalAvaliacoes: avaliacoes.length,
      notaMaxima: notaMaxima,
      notaMinima: notaMinima
    };

    const livroMap: any = {};
    for (const av of avaliacoes) {
      const livroId = av.livro.id;
      if (!livroMap[livroId]) {
        livroMap[livroId] = {
          id: livroId,
          titulo: av.livro.titulo,
          notas: [],
          total: 0
        };
      }
      livroMap[livroId].notas.push(av.nota);
      livroMap[livroId].total++;
    }

    this.rankingLivros = Object.values(livroMap).map((item: any) => ({
      id: item.id,
      titulo: item.titulo,
      media: item.notas.reduce((a: number, b: number) => a + b, 0) / item.notas.length,
      total: item.total
    })).sort((a, b) => b.media - a.media);

    this.totalRecordsRanking = this.rankingLivros.length;
    this.atualizarRankingPaginado();

    const distribuicao: any = {};
    for (const nota of notas) {
      const chave = Math.round(nota * 2) / 2;
      if (!distribuicao[chave]) {
        distribuicao[chave] = 0;
      }
      distribuicao[chave]++;
    }

    const total = Object.values(distribuicao).reduce((a: any, b: any) => a + b, 0) as number;
    this.distribuicaoNotas = Object.keys(distribuicao).map(key => ({
      nota: parseFloat(key),
      total: distribuicao[key],
      percentual: (distribuicao[key] / total) * 100
    })).sort((a, b) => b.nota - a.nota);
  }

  atualizarRankingPaginado(): void {
    const start = this.firstRanking;
    const end = Math.min(start + this.rowsRanking, this.totalRecordsRanking);
    this.rankingLivrosPaginados = this.rankingLivros.slice(start, end);
  }

  onPageChangeRanking(event: any): void {
    this.firstRanking = event.first;
    this.rowsRanking = event.rows;
    this.atualizarRankingPaginado();
    this.cdr.detectChanges();
  }

  getTipoEstrelaRanking(nota: number, estrelaIndex: number): string {
    if (!nota) return 'vazia';
    if (nota >= estrelaIndex + 1) {
      return 'cheia';
    } else if (nota > estrelaIndex && nota < estrelaIndex + 1) {
      return 'meia';
    } else {
      return 'vazia';
    }
  }

  getTipoEstrelaDistribuicao(nota: number, estrelaIndex: number): string {
    if (!nota) return 'vazia';
    if (nota >= estrelaIndex + 1) {
      return 'cheia';
    } else if (nota > estrelaIndex && nota < estrelaIndex + 1) {
      return 'meia';
    } else {
      return 'vazia';
    }
  }

  getCorNota(nota: number): string {
    const cores: any = {
      1: '#dc2626',
      2: '#f59e0b',
      3: '#fbbf24',
      4: '#22c55e',
      5: '#059669'
    };
    return cores[nota] || '#94a3b8';
  }

  arredondarNota(nota: number): number {
    return Math.round(nota);
  }

  async carregarLucros(): Promise<void> {
    try {
      const data = await this.relatorioService.consultarLucros().toPromise();
      if (Array.isArray(data)) {
        this.lucros = data;
        this.lucrosFiltrados = data;
        this.maxLucro = Math.max(...data.map((item: any) => Number(item[2])), 0);
        this.atualizarStats(data);
        this.atualizarPaginacaoLucros();
      }
    } catch (error) {
      console.error('Erro ao carregar lucros:', error);
    }
  }

  atualizarPaginacaoLucros(): void {
    this.totalRecordsLucro = this.lucrosFiltrados.length;
    const start = this.firstLucro;
    const end = Math.min(start + this.rowsLucro, this.totalRecordsLucro);
    this.lucrosPaginados = this.lucrosFiltrados.slice(start, end);
  }

  onPageChangeLucro(event: any): void {
    this.firstLucro = event.first;
    this.rowsLucro = event.rows;
    this.atualizarPaginacaoLucros();
    this.cdr.detectChanges();
  }

  onFiltroLivroChange(): void {
    this.lucrosFiltrados = this.filtroLivro === 'todos'
      ? this.lucros
      : this.lucros.filter((item: any) => item[0] === this.filtroLivro);

    this.maxLucro = Math.max(...this.lucrosFiltrados.map((item: any) => Number(item[2])), 0);
    this.atualizarStats(this.lucrosFiltrados);

    this.firstLucro = 0;
    this.atualizarPaginacaoLucros();
  }

  async carregarLivros(): Promise<void> {
    try {
      const data = await this.livroService.listarAdministrativo().toPromise();
      const livros = data?.livros || [];
      this.livrosOptions = livros.map((l: any) => l.titulo);

      const opcoesLivros = this.livrosOptions.map(titulo => ({
        rotulo: titulo,
        valor: titulo
      }));

      this.opcoesLivrosFiltro = [
        { rotulo: 'Todos', valor: '' },
        ...opcoesLivros
      ];

      this.opcoesLivrosLucro = [
        { rotulo: 'Todos os livros', valor: 'todos' },
        ...opcoesLivros
      ];
      this.stats.totalLivros = livros.length;
    } catch (error) {
      console.error('Erro ao carregar livros:', error);
    }
  }

  async carregarStatusDistribuicao(): Promise<void> {
    try {
      const pedidos = await this.pedidoService.listarAdministrativo().toPromise();
      const statusMap: any = {};
      (pedidos || []).forEach((p: any) => {
        const status = p.status || 'DESCONHECIDO';
        if (!statusMap[status]) statusMap[status] = 0;
        statusMap[status]++;
      });

      const total = Object.values(statusMap).reduce((a: any, b: any) => a + b, 0) as number;
      this.statusDistribuicao = Object.keys(statusMap).map(key => ({
        status: key,
        total: statusMap[key],
        percentual: (statusMap[key] / total) * 100
      }));

      this.stats.totalPedidos = total;
    } catch (error) {
      console.error('Erro ao carregar distribuição de status:', error);
    }
  }

  getLucroPercent(valor: number): number {
    if (this.maxLucro === 0) return 0;
    return (Number(valor) / this.maxLucro) * 100;
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'ENTREGUE': 'Entregue',
      'EM_PROCESSAMENTO': 'Em Processamento',
      'EM_TRANSITO': 'Em Trânsito',
      'CANCELADO': 'Cancelado',
      'DEVOLUCAO': 'Devolucao Solicitada',
      'AUTORIZADO_DEVOLUCAO': 'Devolucao Autorizada',
      'ENVIADO_DEVOLUCAO': 'Devolucao Enviada',
      'DEVOLVIDO': 'Devolvido'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: any = {
      'ENTREGUE': 'status-entregue',
      'EM_PROCESSAMENTO': 'status-pendente',
      'EM_TRANSITO': 'status-envio',
      'CANCELADO': 'status-cancelado',
      'DEVOLUCAO': 'status-devolucao',
      'AUTORIZADO_DEVOLUCAO': 'status-devolucao-autorizada',
      'ENVIADO_DEVOLUCAO': 'status-devolucao-enviada',
      'DEVOLVIDO': 'status-devolvido'
    };
    return classes[status] || 'status-pendente';
  }

  getStatusIcon(status: string): string {
    const icons: any = {
      'ENTREGUE': 'pi pi-check-circle',
      'EM_PROCESSAMENTO': 'pi pi-clock',
      'EM_TRANSITO': 'pi pi-truck',
      'CANCELADO': 'pi pi-times-circle',
      'DEVOLUCAO': 'pi pi-undo',
      'AUTORIZADO_DEVOLUCAO': 'pi pi-check',
      'ENVIADO_DEVOLUCAO': 'pi pi-send',
      'DEVOLVIDO': 'pi pi-check-circle'
    };
    return icons[status] || 'pi pi-circle';
  }

  atualizarStats(data: any[]): void {
    if (data && data.length > 0) {
      const totalVendas = data.reduce((sum: number, item: any) => sum + item[1], 0);
      const totalLucro = data.reduce((sum: number, item: any) => sum + Number(item[2]), 0);
      this.stats.totalVendas = totalVendas;
      this.stats.lucroTotal = totalLucro;
    } else {
      this.stats.totalVendas = 0;
      this.stats.lucroTotal = 0;
    }
  }

async carregarGrafico(): Promise<void> {
  try {
    const pedidos = await this.pedidoService.listarAdministrativo().toPromise();
    this.processarDadosGrafico(pedidos || []);
  } catch (error) {
    console.error('Erro ao carregar gráfico:', error);
    this.temDados = false;
    this.cdr.detectChanges();
  }
}

processarDadosGrafico(pedidos: any[]): void {
  const period = this.filtros.periodo;
  const status = this.filtros.status;
  const livro = this.filtros.livro;


  let filtered = status === 'todos' ? pedidos : pedidos.filter((p: any) => p.status === status);

  if (livro) {
    filtered = filtered.filter((pedido: any) => {
      return pedido.itens?.some((item: any) =>
        item.livro?.titulo === livro || item.livroId == livro
      );
    });
  }


  const grouped = this.agruparPorPeriodo(filtered, period);
  const labels = Object.keys(grouped);
  const data = Object.values(grouped).map((group: any) =>
    group.reduce((sum: number, pedido: any) => sum + (pedido.valorTotal || 0), 0)
  );


if (data.length === 0 || data.every((v: number) => v === 0)) {
  this.destroyChart();
  this.temDados = false;
  this.loading = false;
  this.cdr.detectChanges();
  return;
}

this.temDados = true;
this.loading = false;
this.renderChart(labels, data);
}

renderChart(labels: string[], data: number[]): void {

  if (!labels || labels.length === 0 || !data || data.length === 0) {
    this.temDados = false;
    this.cdr.detectChanges();
    return;
  }

  setTimeout(() => {
    const canvas = document.getElementById('salesChart') as HTMLCanvasElement;

    if (!canvas) {
      console.error('Canvas não encontrado');
      this.temDados = false;
      this.cdr.detectChanges();
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Contexto 2D não encontrado');
      this.temDados = false;
      this.cdr.detectChanges();
      return;
    }

    this.destroyChart();

    const isBar = this.filtros.chartType === 'bar';

    this.chart = new Chart(ctx, {
      type: isBar ? 'bar' : 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Vendas (R$)',
          data: data,
          backgroundColor: isBar ? 'rgba(42, 82, 152, 0.7)' : 'rgba(42, 82, 152, 0.2)',
          borderColor: '#2a5298',
          borderWidth: 2,
          tension: 0.4,
          fill: !isBar,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              font: { family: 'Montserrat, sans-serif', size: 12 },
              color: '#4a5a6a',
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                return 'R$ ' + context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value: any) {
                return 'R$ ' + value.toLocaleString('pt-BR');
              }
            },
            grid: { color: 'rgba(0,0,0,0.06)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });

    this.temDados = true;
    this.chart.update();
    this.cdr.detectChanges();
  }, 300);
}

  agruparPorPeriodo(pedidos: any[], period: string): any {
    const groups: any = {};
    pedidos.forEach((pedido: any) => {
      const date = new Date(pedido.dataPedido);
      let key: string;
      switch(period) {
        case 'day': key = date.toLocaleDateString('pt-BR'); break;
        case 'week': {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = 'Sem ' + weekStart.toLocaleDateString('pt-BR');
          break;
        }
        case 'month': key = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }); break;
        case 'year': key = date.getFullYear().toString(); break;
        default: key = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(pedido);
    });
    return groups;
  }

  destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    this.temDados = false;
  }

  async aplicarFiltros(): Promise<void> {
    this.filtrando = true;
    this.loading = true;
    this.cdr.detectChanges();

    const inicio = Date.now();

    try {
      await Promise.all([
        this.carregarLucros(),
        this.carregarStatusDistribuicao(),
        this.carregarGrafico()
      ]);
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
    }

    const decorrido = Date.now() - inicio;
    const restante = Math.max(0, 500 - decorrido);

    setTimeout(() => {
      this.loading = false;
      this.filtrando = false;
      this.cdr.detectChanges();
    }, restante);
  }

  async limparFiltros(): Promise<void> {
    this.filtrando = true;
    this.loading = true;
    this.cdr.detectChanges();

    const inicio = Date.now();

    this.filtros = {
      periodo: 'month',
      status: 'todos',
      livro: '',
      chartType: 'line',
      dataInicio: '',
      dataFim: ''
    };

    try {
      await Promise.all([
        this.carregarLucros(),
        this.carregarStatusDistribuicao(),
        this.carregarGrafico()
      ]);
    } catch (error) {
      console.error('Erro ao limpar filtros:', error);
    }

    const decorrido = Date.now() - inicio;
    const restante = Math.max(0, 500 - decorrido);

    setTimeout(() => {
      this.loading = false;
      this.filtrando = false;
      this.cdr.detectChanges();
    }, restante);
  }

  async exportarPDF(): Promise<void> {
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');

    const relatorio = document.createElement('div');
    relatorio.style.cssText = `
      padding: 40px;
      background: white;
      font-family: 'Segoe UI', Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
    `;

    relatorio.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2a5298; padding-bottom: 20px;">
        <h1 style="color: #2a5298; font-size: 28px; margin: 0;">Relatorio do Dashboard</h1>
        <p style="color: #6b7a8a; font-size: 14px; margin: 5px 0 0 0;">
          Gerado em ${new Date().toLocaleString('pt-BR')}
        </p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 30px;">
        <div style="background: #f0f4f8; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; color: #2a5298; font-weight: bold;">${this.stats.totalLivros}</div>
          <div style="font-size: 12px; color: #6b7a8a;">Total de Livros</div>
        </div>
        <div style="background: #f0f4f8; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; color: #2a5298; font-weight: bold;">${this.stats.totalVendas}</div>
          <div style="font-size: 12px; color: #6b7a8a;">Vendas Totais</div>
        </div>
        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; color: #2e7d32; font-weight: bold;">R$ ${this.stats.lucroTotal.toFixed(2)}</div>
          <div style="font-size: 12px; color: #6b7a8a;">Lucro Total</div>
        </div>
        <div style="background: #f0f4f8; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; color: #2a5298; font-weight: bold;">${this.stats.totalPedidos}</div>
          <div style="font-size: 12px; color: #6b7a8a;">Total de Pedidos</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 30px;">
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; color: #d97706; font-weight: bold;">${this.statsAvaliacoes.mediaGeral.toFixed(1)}</div>
          <div style="font-size: 12px; color: #6b7a8a;">Nota Media</div>
        </div>
        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; color: #2563eb; font-weight: bold;">${this.statsAvaliacoes.totalAvaliacoes}</div>
          <div style="font-size: 12px; color: #6b7a8a;">Total Avaliacoes</div>
        </div>
        <div style="background: #d1fae5; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; color: #059669; font-weight: bold;">${this.statsAvaliacoes.notaMaxima}</div>
          <div style="font-size: 12px; color: #6b7a8a;">Maior Nota</div>
        </div>
        <div style="background: #fee2e2; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; color: #dc2626; font-weight: bold;">${this.statsAvaliacoes.notaMinima}</div>
          <div style="font-size: 12px; color: #6b7a8a;">Menor Nota</div>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #2a5298; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
          Ranking de Livros por Avaliacao
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #2a5298; color: white;">
              <th style="padding: 8px 12px; text-align: left;">#</th>
              <th style="padding: 8px 12px; text-align: left;">Livro</th>
              <th style="padding: 8px 12px; text-align: center;">Media</th>
              <th style="padding: 8px 12px; text-align: center;">Avaliacoes</th>
            </tr>
          </thead>
          <tbody>
            ${this.rankingLivros.slice(0, 10).map((item, i) => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 6px 12px;">${i + 1}</td>
                <td style="padding: 6px 12px;">${item.titulo}</td>
                <td style="padding: 6px 12px; text-align: center; font-weight: bold;">${item.media.toFixed(1)}</td>
                <td style="padding: 6px 12px; text-align: center;">${item.total}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #2a5298; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
          Distribuicao por Status
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #2a5298; color: white;">
              <th style="padding: 8px 12px; text-align: left;">Status</th>
              <th style="padding: 8px 12px; text-align: center;">Quantidade</th>
              <th style="padding: 8px 12px; text-align: center;">Percentual</th>
            </tr>
          </thead>
          <tbody>
            ${this.statusDistribuicao.map(item => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 6px 12px;">${this.getStatusLabel(item.status)}</td>
                <td style="padding: 6px 12px; text-align: center;">${item.total}</td>
                <td style="padding: 6px 12px; text-align: center;">${item.percentual.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 15px;">
        Livraria Online - Dashboard Gerencial
      </div>
    `;

    document.body.appendChild(relatorio);

    try {
      const canvas = await html2canvas(relatorio, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`dashboard_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      document.body.removeChild(relatorio);
    }
  }

  exportarExcel(): void {
    const dataAtual = new Date().toLocaleString('pt-BR');

    let csv = `RELATORIO DO DASHBOARD\n`;
    csv += `Gerado em: ${dataAtual}\n`;
    csv += `Sistema: Livraria Online\n\n`;

    csv += `===== ESTATISTICAS GERAIS =====\n`;
    csv += `Total de Livros;${this.stats.totalLivros}\n`;
    csv += `Vendas Totais;${this.stats.totalVendas}\n`;
    csv += `Lucro Total;R$ ${this.stats.lucroTotal.toFixed(2)}\n`;
    csv += `Total de Pedidos;${this.stats.totalPedidos}\n\n`;

    csv += `===== AVALIACOES =====\n`;
    csv += `Nota Media Geral;${this.statsAvaliacoes.mediaGeral.toFixed(1)}\n`;
    csv += `Total de Avaliacoes;${this.statsAvaliacoes.totalAvaliacoes}\n`;
    csv += `Maior Nota;${this.statsAvaliacoes.notaMaxima}\n`;
    csv += `Menor Nota;${this.statsAvaliacoes.notaMinima}\n\n`;

    csv += `===== RANKING DE LIVROS POR AVALIACAO =====\n`;
    csv += `Posicao;Livro;Media;Total Avaliacoes\n`;
    this.rankingLivros.forEach((item, i) => {
      csv += `${i + 1};${item.titulo};${item.media.toFixed(1)};${item.total}\n`;
    });
    csv += `\n`;

    csv += `===== DISTRIBUICAO POR STATUS =====\n`;
    csv += `Status;Quantidade;Percentual\n`;
    this.statusDistribuicao.forEach(item => {
      csv += `${this.getStatusLabel(item.status)};${item.total};${item.percentual.toFixed(1)}%\n`;
    });
    csv += `\n`;

    csv += `===== LUCRO POR LIVRO =====\n`;
    csv += `Livro;Vendidos;Lucro (R$)\n`;
    this.lucros.forEach(item => {
      csv += `${item[0]};${item[1]};R$ ${Number(item[2]).toFixed(2)}\n`;
    });

    csv += `\n\nRelatorio gerado em ${dataAtual}`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dashboard_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
