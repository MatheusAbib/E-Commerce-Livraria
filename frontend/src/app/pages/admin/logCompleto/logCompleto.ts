import { LogService } from '../../../services/log.service';
import { ClienteService } from '../../../services/cliente.service';
import { inject } from '@angular/core';
import { ModalBaseComponent, ModalCabecalhoComponent, ModalCorpoComponent, ModalRodapeComponent } from '../../../components/shared/modals';
import { NotificacaoComponent } from '../../../components/shared/feedback';
import { EstadoVazioComponent } from '../../../components/shared/feedback';
import { CarregamentoComponent } from '../../../components/shared/feedback';
import { CampoSelecaoComponent } from '../../../components/shared/forms';
import { CampoDirective } from '../../../components/shared/forms';
import { BotaoComponent } from '../../../components/shared/buttons/botao/botao';
import { BotaoIconeComponent } from '../../../components/shared/buttons/botao-icone/botao-icone';
import { GrupoAcoesComponent } from '../../../components/shared/buttons/grupo-acoes/grupo-acoes';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';
import { MessageService } from 'primeng/api';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar';


@Component({
  selector: 'app-log-completo',
  standalone: true,
  imports: [ModalBaseComponent, ModalCabecalhoComponent, ModalCorpoComponent, ModalRodapeComponent, NotificacaoComponent, EstadoVazioComponent, CarregamentoComponent, CampoSelecaoComponent, CampoDirective, 
    CommonModule,
    FormsModule,
    PaginatorModule,
    AdminSidebarComponent,
    BotaoComponent,
    BotaoIconeComponent,
    GrupoAcoesComponent
  ],
  providers: [MessageService],
  templateUrl: './logCompleto.html',
  styleUrls: ['./logCompleto.css', '../admin-common.css']
})
export class LogCompletoComponent implements OnInit {
  private readonly logService = inject(LogService);
  private readonly clienteService = inject(ClienteService);

  private usuariosFiltroReferencia: unknown = null;

  private usuariosFiltroCache: { rotulo: string; valor: string }[] = [];

  get opcoesUsuariosFiltro() {
    if (this.usuariosFiltroReferencia !== this.usuarios) {
      this.usuariosFiltroReferencia = this.usuarios;
      this.usuariosFiltroCache = [
        { rotulo: 'Todos os usuários', valor: '' },
        ...this.usuarios.map(u => ({
          rotulo: u.nome,
          valor: String(u.id)
        }))
      ];
    }

    return this.usuariosFiltroCache;
  }

  get opcoesAcoesFiltro() {
    return this.acoesOptions.map(op => ({
      rotulo: op.label,
      valor: String(op.value ?? '')
    }));
  }

  get opcoesNiveisFiltro() {
    return this.niveisOptions.map(op => ({
      rotulo: op.label,
      valor: String(op.value ?? '')
    }));
  }

  logs: any[] = [];
  logsFiltrados: any[] = [];
  logsPaginados: any[] = [];
  loading: boolean = true;
  usuarios: any[] = [];
  usuariosMap: any = {};

  filtros = {
    usuario: '',
    acao: '',
    data: '',
    nivel: ''
  };

  acoesOptions = [
    { label: 'Todas as ações', value: '' },
    { label: 'Login', value: 'login' },
    { label: 'Compra', value: 'compra' },
    { label: 'Cadastro', value: 'cadastro' },
    { label: 'Exclusão', value: 'exclusao' },
    { label: 'Em Trânsito', value: 'Em Trânsito' },
    { label: 'Em Devolução', value: 'Em Devolução' },
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

  niveisOptions = [
    { label: 'Todos os níveis', value: '' },
    { label: 'Informação', value: 'info' },
    { label: 'Aviso', value: 'warning' },
    { label: 'Erro', value: 'error' },
    { label: 'Sucesso', value: 'success' }
  ];

  first: number = 0;
  rows: number = 10;
  totalRecords: number = 0;
  timeoutFiltro: any = null;

  displayDetalhesModal: boolean = false;
  logSelecionado: any = null;

  

  ngOnInit(): void {
    this.carregarUsuarios();
    this.carregarLogs();
  }

  async carregarUsuarios(): Promise<void> {
    try {
     const data = await this.clienteService.listarAdministrativo().toPromise();
      this.usuarios = data || [];
      this.usuariosMap = {};
      this.usuarios.forEach((u: any) => {
        this.usuariosMap[u.id] = u.nome;
      });
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  }

  async carregarLogs(): Promise<void> {
    this.loading = true;
    try {
      const data = await this.logService.listarAdministrativo().toPromise();
      this.logs = data || [];
      this.logs.sort((a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      this.logsFiltrados = [...this.logs];
      this.totalRecords = this.logsFiltrados.length;
      this.atualizarPaginacao();
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      this.loading = false;
    }
  }

filtrando: boolean = false;

aplicarFiltros(): void {
  this.filtrando = true;
  clearTimeout(this.timeoutFiltro);
  this.loading = true;

  const inicio = Date.now();

  this.logsFiltrados = this.logs.filter(log => {
    let match = true;
    if (this.filtros.usuario && log.userId != this.filtros.usuario) match = false;
    if (this.filtros.acao && log.action !== this.filtros.acao) match = false;
    if (this.filtros.nivel && log.level !== this.filtros.nivel) match = false;
    if (this.filtros.data) {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      if (logDate !== this.filtros.data) match = false;
    }
    return match;
  });

  this.totalRecords = this.logsFiltrados.length;
  this.first = 0;
  this.atualizarPaginacao();

  const decorrido = Date.now() - inicio;
  const restante = Math.max(0, 500 - decorrido);

  setTimeout(() => {
    this.loading = false;
    this.filtrando = false;
  }, restante);
}

limparFiltros(): void {
  this.filtrando = true;
  clearTimeout(this.timeoutFiltro);
  this.loading = true;

  const inicio = Date.now();

  this.filtros = { usuario: '', acao: '', data: '', nivel: '' };
  this.logsFiltrados = [...this.logs];
  this.totalRecords = this.logsFiltrados.length;
  this.first = 0;
  this.atualizarPaginacao();

  const decorrido = Date.now() - inicio;
  const restante = Math.max(0, 500 - decorrido);

  setTimeout(() => {
    this.loading = false;
    this.filtrando = false;
  }, restante);
}

  atualizarPaginacao(): void {
    this.logsPaginados = this.logsFiltrados.slice(this.first, this.first + this.rows);
  }

  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    this.atualizarPaginacao();
  }

  getNomeUsuario(userId: number): string {
    return this.usuariosMap[userId] || 'Sistema';
  }

  getActionIcon(action: string): string {
    const icons: any = {
      login: 'pi pi-sign-in',
      compra: 'pi pi-shopping-cart',
      cadastro: 'pi pi-user-plus',
      exclusao: 'pi pi-trash',
      'Em Trânsito': 'pi pi-truck',
      'Em Devolução': 'pi pi-undo',
      Devolvido: 'pi pi-check-circle',
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

  getNivelClass(nivel: string): string {
    const classes: any = {
      'info': 'log-level-info',
      'warning': 'log-level-warning',
      'error': 'log-level-error',
      'success': 'log-level-success'
    };
    return classes[nivel] || 'log-level-info';
  }

  getNivelLabel(nivel: string): string {
    const labels: any = {
      'info': 'Informação',
      'warning': 'Aviso',
      'error': 'Erro',
      'success': 'Sucesso'
    };
    return labels[nivel] || nivel;
  }

  getAcaoLabel(acao: string): string {
    const labels: any = {
      'login': 'Login',
      'compra': 'Compra',
      'cadastro': 'Cadastro',
      'exclusao': 'Exclusão',
      'Em Trânsito': 'Em Trânsito',
      'Em Devolução': 'Em Devolução',
      'Devolvido': 'Devolvido',
      'Trocado': 'Trocado',
      'Cancelado': 'Cancelado'
    };
    return labels[acao] || acao;
  }

  abrirDetalhes(log: any): void {
    this.logSelecionado = log;
    this.displayDetalhesModal = true;
  }

  getDetalhesHtml(details: string): string {
    if (!details) return 'Sem detalhes';
    return details.replace(/\n/g, '<br>');
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
