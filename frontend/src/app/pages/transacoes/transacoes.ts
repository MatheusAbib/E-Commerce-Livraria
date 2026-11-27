import { inject } from '@angular/core';
import { LogService } from '../../services/log.service';
import { ModalBaseComponent, ModalCabecalhoComponent, ModalCorpoComponent, ModalRodapeComponent } from '../../components/shared/modals';
import { NotificacaoComponent } from '../../components/shared/feedback';
import { EstadoVazioComponent } from '../../components/shared/feedback';
import { CarregamentoComponent } from '../../components/shared/feedback';
import { CampoSelecaoComponent } from '../../components/shared/forms';
import { BotaoComponent } from '../../components/shared/buttons/botao/botao';
import { BotaoIconeComponent } from '../../components/shared/buttons/botao-icone/botao-icone';
import { GrupoAcoesComponent } from '../../components/shared/buttons/grupo-acoes/grupo-acoes';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth';


@Component({
  selector: 'app-transacoes',
  standalone: true,
  imports: [ModalBaseComponent, ModalCabecalhoComponent, ModalCorpoComponent, ModalRodapeComponent, NotificacaoComponent, EstadoVazioComponent, CarregamentoComponent, CampoSelecaoComponent, 
    CommonModule,
    FormsModule,
    RouterModule,
    CalendarModule,
    TableModule,
    BotaoComponent,
    BotaoIconeComponent,
    GrupoAcoesComponent
  ],
  providers: [MessageService],
  templateUrl: './transacoes.html',
  styleUrls: ['./transacoes.css']
})
export class TransacoesComponent implements OnInit {
  private readonly logService = inject(LogService);

  get opcoesAcoesCompartilhadas() {
    return this.actionOptions.map(opcao => ({
      rotulo: opcao.label,
      valor: opcao.value
    }));
  }

  get opcoesNiveisCompartilhados() {
    return this.levelOptions.map(opcao => ({
      rotulo: opcao.label,
      valor: opcao.value
    }));
  }

  logs: any[] = [];
  filteredLogs: any[] = [];
  logsPaginados: any[] = [];
  loading: boolean = false;
  totalRecords: number = 0;
  first: number = 0;
  rows: number = 10;

  filtros = {
    action: '',
    date: null,
    level: ''
  };

  actionOptions = [
    { label: 'Todas as ações', value: '' },
    { label: 'Login', value: 'login' },
    { label: 'Compra', value: 'compra' },
    { label: 'Cadastro', value: 'cadastro' },
    { label: 'Exclusão', value: 'exclusao' },
    { label: 'Em Trânsito', value: 'Em Trânsito' },
    { label: 'Devolvido', value: 'Devolvido' },
    { label: 'Trocado', value: 'Trocado' },
    { label: 'Cancelado', value: 'Cancelado' },
    { label: 'Edição de Dados', value: 'edicao_dados' },
    { label: 'Edição de Endereço', value: 'edicao_enderecos' },
    { label: 'Edição de Cartão', value: 'edicao_cartoes' },
    { label: 'Endereço Adicionado', value: 'endereco_adicionado' },
    { label: 'Endereço Removido', value: 'endereco_removido' },
    { label: 'Cartão Adicionado', value: 'cartao_adicionado' },
    { label: 'Cartão Removido', value: 'cartao_removido' },
    { label: 'Alteração de Senha', value: 'alteracao_senha' },
    { label: 'Status do Cliente', value: 'status_cliente' }
  ];

  levelOptions = [
    { label: 'Todos os níveis', value: '' },
    { label: 'Informação', value: 'info' },
    { label: 'Aviso', value: 'warning' },
    { label: 'Erro', value: 'error' },
    { label: 'Sucesso', value: 'success' }
  ];

  displayDetalhesModal: boolean = false;
  logSelecionado: any = null;
  filtrando: boolean = false;

  carregandoFiltrar: boolean = false;
  carregandoLimpar: boolean = false;

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarLogs();
  }

  atualizarPaginacao(): void {
    this.logsPaginados = this.filteredLogs.slice(this.first, this.first + this.rows);
  }

  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    this.atualizarPaginacao();
  }

  async carregarLogs(): Promise<void> {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      const user = JSON.parse(localStorage.getItem('clienteLogado') || 'null');
      if (!user) {
        this.messageService.add({severity:'error', summary:'Erro', detail:'Faça login para visualizar suas transações'});
        this.authService.adicionarNotificacao('Erro', 'Faça login para visualizar suas transações', 'error');
        return;
      }

      const token = this.authService.getToken();
      const response = await this.logService.listar({
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        }
      });
      if (response.ok) {
        const allLogs = await response.json();
        this.logs = allLogs.filter((log: any) => log.userId == user.id);
        this.logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        this.filteredLogs = [...this.logs];
        this.totalRecords = this.filteredLogs.length;
        this.first = 0;
        this.atualizarPaginacao();
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      this.messageService.add({severity:'error', summary:'Erro', detail:'Falha ao carregar transações'});
      this.authService.adicionarNotificacao('Erro', 'Falha ao carregar transações', 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  getActionIcon(action: string): string {
    const icons: any = {
      login: 'pi pi-sign-in',
      compra: 'pi pi-shopping-cart',
      cadastro: 'pi pi-user-plus',
      exclusao: 'pi pi-trash',
      'Em Trânsito': 'pi pi-truck',
      Devolvido: 'pi pi-undo',
      Trocado: 'pi pi-refresh',
      Cancelado: 'pi pi-times-circle',
      edicao_dados: 'pi pi-pencil',
      edicao_enderecos: 'pi pi-map-marker',
      edicao_cartoes: 'pi pi-credit-card',
      endereco_adicionado: 'pi pi-map-marker',
      endereco_removido: 'pi pi-map-marker',
      cartao_adicionado: 'pi pi-credit-card',
      cartao_removido: 'pi pi-credit-card',
      alteracao_senha: 'pi pi-key',
      status_cliente: 'pi pi-user'
    };
    return icons[action] || 'pi pi-info-circle';
  }

  getActionLabel(action: string): string {
    const labels: any = {
      login: 'Login',
      compra: 'Compra',
      cadastro: 'Cadastro',
      exclusao: 'Exclusão',
      'Em Trânsito': 'Em Trânsito',
      'Em Devolução': 'Em Devolução',
      Devolvido: 'Devolvido',
      Trocado: 'Trocado',
      Cancelado: 'Cancelado',
      edicao_dados: 'Edição de Dados',
      edicao_enderecos: 'Edição de Endereço',
      edicao_cartoes: 'Edição de Cartão',
      endereco_adicionado: 'Endereço Adicionado',
      endereco_removido: 'Endereço Removido',
      cartao_adicionado: 'Cartão Adicionado',
      cartao_removido: 'Cartão Removido',
      alteracao_senha: 'Alteração de Senha',
      status_cliente: 'Status do Cliente'
    };
    return labels[action] || action;
  }

  getActionBadgeClass(action: string): string {
    const classes: any = {
      login: 'badge-info',
      compra: 'badge-success',
      cadastro: 'badge-primary',
      exclusao: 'badge-danger',
      'Em Trânsito': 'badge-warning',
      Devolvido: 'badge-info',
      Trocado: 'badge-primary',
      Cancelado: 'badge-danger',
      edicao_dados: 'badge-info',
      edicao_enderecos: 'badge-info',
      edicao_cartoes: 'badge-info',
      endereco_adicionado: 'badge-success',
      endereco_removido: 'badge-danger',
      cartao_adicionado: 'badge-success',
      cartao_removido: 'badge-danger',
      alteracao_senha: 'badge-warning',
      status_cliente: 'badge-warning'
    };
    return classes[action] || 'badge-info';
  }

  getLevelClass(level: string): string {
    return `log-level-${level || 'info'}`;
  }

  getLevelLabel(level: string): string {
    const levels: any = {
      info: 'Informação',
      warning: 'Aviso',
      error: 'Erro',
      success: 'Sucesso'
    };
    return levels[level] || level;
  }

  aplicarFiltros(): void {
    if (this.carregandoFiltrar) return;
    this.carregandoFiltrar = true;
    this.loading = true;
    this.cdr.detectChanges();

    const inicio = Date.now();

    this.filteredLogs = this.logs.filter(log => {
      let match = true;
      if (this.filtros.action && log.action !== this.filtros.action) match = false;
      if (this.filtros.date) {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        const filterDate = new Date(this.filtros.date).toISOString().split('T')[0];
        if (logDate !== filterDate) match = false;
      }
      if (this.filtros.level && log.level !== this.filtros.level) match = false;
      return match;
    });

    this.totalRecords = this.filteredLogs.length;
    this.first = 0;
    this.atualizarPaginacao();

    const decorrido = Date.now() - inicio;
    const restante = Math.max(0, 500 - decorrido);

    setTimeout(() => {
      this.loading = false;
      this.carregandoFiltrar = false;
      this.cdr.detectChanges();
    }, restante);
  }

  limparFiltros(): void {
    if (this.carregandoLimpar) return;
    this.carregandoLimpar = true;
    this.loading = true;
    this.cdr.detectChanges();

    const inicio = Date.now();

    this.filtros = { action: '', date: null, level: '' };
    this.filteredLogs = [...this.logs];
    this.totalRecords = this.filteredLogs.length;
    this.first = 0;
    this.atualizarPaginacao();

    const decorrido = Date.now() - inicio;
    const restante = Math.max(0, 500 - decorrido);

    setTimeout(() => {
      this.loading = false;
      this.carregandoLimpar = false;
      this.cdr.detectChanges();
    }, restante);
  }

  translateAction(action: string): string {
    const actions: any = {
      login: 'Login',
      compra: 'Compra',
      cadastro: 'Cadastro',
      exclusao: 'Exclusão',
      'Em Trânsito': 'Em Trânsito',
      'Em Devolução': 'Em Devolução',
      Devolvido: 'Devolvido',
      Trocado: 'Trocado',
      Cancelado: 'Cancelado'
    };
    return actions[action] || action;
  }

  translateLevel(level: string): string {
    const levels: any = {
      info: 'Informação',
      warning: 'Aviso',
      error: 'Erro',
      success: 'Sucesso'
    };
    return levels[level] || level;
  }

  abrirDetalhes(log: any): void {
    this.logSelecionado = log;
    this.displayDetalhesModal = true;
  }

  getDetalhesHtml(details: string): string {
    if (!details) return 'Sem detalhes';
    return details.replace(/\n/g, '<br>');
  }

  isCompra(action: string): boolean {
    return action === 'compra';
  }

  isEdicao(action: string): boolean {
    return ['edicao_dados', 'edicao_enderecos', 'edicao_cartoes'].includes(action);
  }

  getIconClass(level: string): string {
    const classes: any = {
      info: 'pi pi-info-circle',
      warning: 'pi pi-exclamation-triangle',
      error: 'pi pi-times-circle',
      success: 'pi pi-check-circle'
    };
    return classes[level] || 'pi pi-info-circle';
  }
}
