import { ChatApiService } from '../../../services/chat-api.service';
import { inject } from '@angular/core';
import { PedidoService } from '../../../services/pedido.service';
import { NotificacaoComponent } from '../../../components/shared/feedback';
import { EstadoVazioComponent } from '../../../components/shared/feedback';
import { CarregamentoComponent } from '../../../components/shared/feedback';
import { CampoSelecaoComponent } from '../../../components/shared/forms';
import { CampoDirective } from '../../../components/shared/forms';
import { BotaoComponent } from '../../../components/shared/buttons/botao/botao';
import { BotaoIconeComponent } from '../../../components/shared/buttons/botao-icone/botao-icone';
import { GrupoAcoesComponent } from '../../../components/shared/buttons/grupo-acoes/grupo-acoes';
import { Component, OnInit, ViewChild, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';

import { PaginatorModule } from 'primeng/paginator';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar';
import { AdminModalsComponent } from '../../../components/admin-modals/admin-modals';
import { AuthService } from '../../../services/auth';
import { Router } from '@angular/router';


@Component({
  selector: 'app-pedidos-admin',
  standalone: true,
  imports: [NotificacaoComponent, EstadoVazioComponent, CarregamentoComponent, CampoSelecaoComponent, CampoDirective, 
    CommonModule,
    FormsModule,
    RouterModule,
    ToastModule,
    DialogModule,

    PaginatorModule,
    AdminSidebarComponent,
    AdminModalsComponent,
    BotaoComponent,
    BotaoIconeComponent,
    GrupoAcoesComponent
  ],
  providers: [MessageService],
  templateUrl: './pedidosAdmin.html',
  styleUrls: ['./pedidosAdmin.css', '../admin-common.css']
})
export class PedidosAdminComponent implements OnInit, OnDestroy {
  private readonly chatApiService = inject(ChatApiService);

  private readonly pedidoService = inject(PedidoService);

  @ViewChild(AdminModalsComponent) adminModals!: AdminModalsComponent;

  pedidos: any[] = [];
  pedidosFiltrados: any[] = [];
  pedidosPaginados: any[] = [];
  loading: boolean = true;
  totalRecords: number = 0;
  first: number = 0;
  rows: number = 10;

  chatAdminAberto: boolean = false;
  chatAdminPedido: any = null;
  mensagensChatAdmin: any[] = [];
  novaMensagemChatAdmin: string = '';
  chatAdminAtivo: boolean = true;
  chatAdminInterval: any = null;

  carregandoFiltrar: boolean = false;
  carregandoLimpar: boolean = false;
  carregandoStatus: boolean = false;
  carregandoExcluir: boolean = false;

  tabAtivo: string = 'todos';


  readonly opcoesStatusFiltro = [
    { rotulo: 'Todos', valor: '' },
    { rotulo: 'Em Processamento', valor: 'EM_PROCESSAMENTO' },
    { rotulo: 'Em Trânsito', valor: 'EM_TRANSITO' },
    { rotulo: 'Entregue', valor: 'ENTREGUE' },
    { rotulo: 'Cancelado', valor: 'CANCELADO' },
    { rotulo: 'Devolução Solicitada', valor: 'DEVOLUCAO' },
    { rotulo: 'Devolução Autorizada', valor: 'AUTORIZADO_DEVOLUCAO' },
    { rotulo: 'Devolução Enviada', valor: 'ENVIADO_DEVOLUCAO' },
    { rotulo: 'Devolvido', valor: 'DEVOLVIDO' }
  ];
  filtros = {
    status: '',
    cliente: ''
  };

  statusMap: any = {
    'todos': '',
    'processamento': 'EM_PROCESSAMENTO',
    'transito': 'EM_TRANSITO',
    'entregues': 'ENTREGUE',
    'devolucao': 'DEVOLUCAO',
    'autorizado': 'AUTORIZADO_DEVOLUCAO',
    'enviado': 'ENVIADO_DEVOLUCAO',
    'devolvidos': 'DEVOLVIDO',
    'cancelados': 'CANCELADO'
  };

  pedidoSelecionado: any = null;
  private intervalId: any = null;

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarPedidos();
    this.intervalId = setInterval(() => {
      this.carregarPedidosSilenciosamente();
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.chatAdminInterval) {
      clearInterval(this.chatAdminInterval);
      this.chatAdminInterval = null;
    }
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  abrirChatAdmin(pedido: any): void {
    this.router.navigate(['/admin/chats'], { queryParams: { pedidoId: pedido.id } });
  }

  fecharChatAdmin(): void {
    this.chatAdminAberto = false;
    this.chatAdminPedido = null;
    this.mensagensChatAdmin = [];
    if (this.chatAdminInterval) {
      clearInterval(this.chatAdminInterval);
      this.chatAdminInterval = null;
    }
  }

  async carregarMensagensChatAdmin(pedidoId: number): Promise<void> {
    try {
      const token = this.authService.getToken();
      const response = await this.chatApiService.listarMensagensAdmin(pedidoId, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (response.ok) {
        this.mensagensChatAdmin = await response.json();
        this.scrollChatAdminParaBaixo();

        await this.chatApiService.marcarLidasAdmin(pedidoId, {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer ' + token
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  }

  async carregarMensagensChatAdminSilenciosamente(pedidoId: number): Promise<void> {
    try {
      const token = this.authService.getToken();
      const response = await this.chatApiService.listarMensagensAdmin(pedidoId, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (response.ok) {
        const novasMensagens = await response.json();
        if (JSON.stringify(novasMensagens) !== JSON.stringify(this.mensagensChatAdmin)) {
          this.mensagensChatAdmin = novasMensagens;
          this.scrollChatAdminParaBaixo();

          await this.chatApiService.marcarLidasAdmin(pedidoId, {
            method: 'PUT',
            headers: {
              'Authorization': 'Bearer ' + token
            }
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  }

  scrollChatAdminParaBaixo(): void {
    setTimeout(() => {
      const container = document.querySelector('.chat-messages-admin');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  async enviarMensagemChatAdmin(): Promise<void> {
    if (!this.novaMensagemChatAdmin.trim() || !this.chatAdminPedido) return;

    try {
      const token = this.authService.getToken();
      const response = await this.chatApiService.enviarMensagemAdmin(this.chatAdminPedido.id, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ mensagem: this.novaMensagemChatAdmin })
      });

      if (response.ok) {
        this.novaMensagemChatAdmin = '';
        await this.carregarMensagensChatAdmin(this.chatAdminPedido.id);
      } else {
        const error = await response.json();
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.mensagem || 'Erro ao enviar mensagem'
        });
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  }

  async verificarAtendimentoAdmin(pedidoId: number): Promise<void> {
    try {
      const token = this.authService.getToken();
      const response = await this.chatApiService.consultarAtendimento(pedidoId, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.chatAdminAtivo = data.ativo;
      }
    } catch (error) {
      console.error('Erro ao verificar atendimento:', error);
    }
  }

  async encerrarAtendimentoAdmin(): Promise<void> {
    if (!this.chatAdminPedido) return;

    try {
      const token = this.authService.getToken();
      const response = await this.chatApiService.encerrarAdmin(this.chatAdminPedido.id, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (response.ok) {
        this.chatAdminAtivo = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Atendimento encerrado',
          detail: 'O atendimento foi encerrado com sucesso'
        });
        await this.carregarMensagensChatAdmin(this.chatAdminPedido.id);
      } else {
        const error = await response.json();
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.mensagem || 'Erro ao encerrar atendimento'
        });
      }
    } catch (error) {
      console.error('Erro ao encerrar atendimento:', error);
    }
  }

  async carregarPedidosSilenciosamente(): Promise<void> {
    try {
      const token = this.authService.getToken();
      const response = await this.pedidoService.listarTodos({
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      if (response.ok) {
        const novosPedidos = await response.json();

        for (const pedido of novosPedidos) {
          const mensagensResponse = await this.chatApiService.listarMensagensAdminRelativo(pedido.id, {
            headers: {
              'Authorization': 'Bearer ' + token
            }
          });
          if (mensagensResponse.ok) {
            const mensagens = await mensagensResponse.json();
            pedido.temConversa = mensagens.length > 0;
          }

          const naoLidasResponse = await this.chatApiService.contarNaoLidasAdminRelativo(pedido.id, {
            headers: {
              'Authorization': 'Bearer ' + token
            }
          });
          if (naoLidasResponse.ok) {
            const data = await naoLidasResponse.json();
            pedido.chatNaoLidas = data.naoLidas || 0;
          }
        }

        const pedidosAtuaisStr = JSON.stringify(this.pedidos.map((p: any) => ({
          id: p.id,
          status: p.status,
          temConversa: p.temConversa,
          chatNaoLidas: p.chatNaoLidas
        })));
        const novosPedidosStr = JSON.stringify(novosPedidos.map((p: any) => ({
          id: p.id,
          status: p.status,
          temConversa: p.temConversa,
          chatNaoLidas: p.chatNaoLidas
        })));

        if (pedidosAtuaisStr !== novosPedidosStr) {
          this.pedidos = novosPedidos;
          this.aplicarFiltrosSemLoading();
          this.cdr.detectChanges();
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar pedidos:', error);
    }
  }

  aplicarFiltrosSemLoading(): void {
    this.pedidosFiltrados = this.pedidos.filter(pedido => {
      let match = true;
      if (this.filtros.status && pedido.status !== this.filtros.status) match = false;
      if (this.filtros.cliente) {
        const nomeCliente = pedido.cliente?.nome || '';
        if (!nomeCliente.toLowerCase().includes(this.filtros.cliente.toLowerCase())) match = false;
      }
      return match;
    });
    this.totalRecords = this.pedidosFiltrados.length;
    this.atualizarPaginacao();
  }

  atualizarPaginacao(): void {
    this.pedidosPaginados = this.pedidosFiltrados.slice(this.first, this.first + this.rows);
  }

  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    this.atualizarPaginacao();
  }

  trocarTab(tab: string): void {
    this.tabAtivo = tab;
    this.filtros.status = this.statusMap[tab] || '';
    this.aplicarFiltros();
  }

  
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly DEBOUNCE_MS = 600;

  onFiltroTextoChange(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (!this.filtros.cliente && !this.filtros.status) {
      this.aplicarFiltros();
      return;
    }
    this.debounceTimer = setTimeout(() => this.aplicarFiltros(), this.DEBOUNCE_MS);
  }
filtrando: boolean = false;

aplicarFiltros(): void {
  if (this.carregandoFiltrar) return;
  this.carregandoFiltrar = true;
  this.loading = true;
  this.cdr.detectChanges();

  const inicio = Date.now();

  this.pedidosFiltrados = this.pedidos.filter(pedido => {
    let match = true;
    if (this.filtros.status && pedido.status !== this.filtros.status) match = false;
    if (this.filtros.cliente) {
      const nomeCliente = pedido.cliente?.nome || '';
      if (!nomeCliente.toLowerCase().includes(this.filtros.cliente.toLowerCase())) match = false;
    }
    return match;
  });

  this.totalRecords = this.pedidosFiltrados.length;
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

  this.filtros = { status: '', cliente: '' };
  this.tabAtivo = 'todos';
  this.pedidosFiltrados = [...this.pedidos];
  this.totalRecords = this.pedidosFiltrados.length;
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

async carregarPedidos(): Promise<void> {
  this.loading = true;
  this.cdr.detectChanges();
  try {
    const token = this.authService.getToken();
    const response = await this.pedidoService.listarTodos({
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    if (response.ok) {
      this.pedidos = await response.json();

      await Promise.all(this.pedidos.map(async (pedido) => {
        const [mensagensResponse, naoLidasResponse] = await Promise.all([
          this.chatApiService.listarMensagensAdminRelativo(pedido.id, {
            headers: { 'Authorization': 'Bearer ' + token }
          }),
          this.chatApiService.contarNaoLidasAdminRelativo(pedido.id, {
            headers: { 'Authorization': 'Bearer ' + token }
          })
        ]);

        if (mensagensResponse.ok) {
          const mensagens = await mensagensResponse.json();
          pedido.temConversa = mensagens.length > 0;
        }

        if (naoLidasResponse.ok) {
          const data = await naoLidasResponse.json();
          pedido.chatNaoLidas = data.naoLidas || 0;
        }
      }));

      this.aplicarFiltrosSemLoading();
    }
  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
    this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao carregar pedidos'});
  } finally {
    this.loading = false;
    this.cdr.detectChanges();
  }
}
  abrirDetalhes(pedido: any): void {
    this.pedidoSelecionado = pedido;
    this.adminModals.abrirPedidoDetalhes(pedido);
  }

  abrirStatus(pedido: any, status: string): void {
    this.adminModals.onConfirmarPedidoStatus = (pedidoParam: any, statusParam: string, dadosCupom: any, codigoRastreamento?: string) => {
      this.confirmarStatus(pedidoParam, statusParam, dadosCupom, codigoRastreamento);
    };
    this.adminModals.abrirPedidoStatus(pedido, status);
  }

  async confirmarStatus(pedido: any, status: string, dadosCupom?: any, codigoRastreamento?: string): Promise<void> {
  if (this.carregandoStatus) return;
  this.carregandoStatus = true;

  if (!pedido || !status) {
    this.carregandoStatus = false;
    return;
  }

  try {
    const token = this.authService.getToken();
    const body: any = { novoStatus: status };

    if (status === 'DEVOLVIDO' && dadosCupom && dadosCupom.gerarCupom) {
      body.cupom = {
        gerarCupom: true,
        porcentagem: dadosCupom.porcentagem
      };
    }

    if (status === 'EM_TRANSITO' && codigoRastreamento) {
      body.codigoRastreamentoEnvio = codigoRastreamento;
    }

    const response = await this.pedidoService.alterarStatus(pedido.id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      const pedidoAtualizado = await response.json();
      const index = this.pedidos.findIndex(p => p.id === pedidoAtualizado.id);
      if (index !== -1) {
        this.pedidos[index] = pedidoAtualizado;
      }

      const clienteId = pedido.cliente?.id;
      if (clienteId) {
        let mensagem = `Pedido #${pedido.id} foi atualizado para ${this.getStatusLabel(status)}`;
        if (status === 'DEVOLVIDO' && dadosCupom && dadosCupom.gerarCupom) {
          mensagem += ` e você ganhou um cupom de ${dadosCupom.porcentagem}% de desconto!`;
        }
        if (status === 'EM_TRANSITO' && codigoRastreamento) {
          mensagem += ` Código de rastreamento: ${codigoRastreamento}`;
        }
        this.authService.adicionarNotificacaoParaCliente(
          clienteId,
          'Status do Pedido',
          mensagem,
          'info'
        );
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: `Status atualizado para: ${this.getStatusLabel(status)}`
      });
      this.aplicarFiltros();
    } else {
      this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao atualizar status'});
    }
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    this.messageService.add({severity:'error', summary:'Erro', detail:'Falha ao atualizar status'});
  } finally {
    this.carregandoStatus = false;
  }
}

  abrirExcluir(pedido: any): void {
    this.adminModals.onConfirmarPedidoExcluir = (pedidoParam: any) => {
      this.confirmarExcluir(pedidoParam);
    };
    this.adminModals.abrirPedidoExcluir(pedido);
  }

async confirmarExcluir(pedido: any): Promise<void> {
  if (this.carregandoExcluir) return;
  this.carregandoExcluir = true;

  if (!pedido) {
    this.carregandoExcluir = false;
    return;
  }

  try {
    const token = this.authService.getToken();
    const response = await this.pedidoService.excluir(pedido.id, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    if (response.ok) {
      this.pedidos = this.pedidos.filter(p => p.id !== pedido.id);
      this.messageService.add({severity:'success', summary:'Sucesso', detail:'Pedido excluído com sucesso!'});
      this.aplicarFiltros();
    } else {
      this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao excluir pedido'});
    }
  } catch (error) {
    console.error('Erro ao excluir pedido:', error);
    this.messageService.add({severity:'error', summary:'Erro', detail:'Falha ao excluir pedido'});
  } finally {
    this.carregandoExcluir = false;
  }
}

  getStatusLabel(status: string): string {
    const labels: any = {
      'EM_PROCESSAMENTO': 'Em Processamento',
      'EM_TRANSITO': 'Em Trânsito',
      'ENTREGUE': 'Entregue',
      'DEVOLUCAO': 'Devolução Solicitada',
      'AUTORIZADO_DEVOLUCAO': 'Devolução Autorizada',
      'ENVIADO_DEVOLUCAO': 'Devolução Enviada',
      'DEVOLVIDO': 'Devolvido',
      'CANCELADO': 'Cancelado'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: any = {
      'EM_PROCESSAMENTO': 'status-pendente',
      'EM_TRANSITO': 'status-envio',
      'ENTREGUE': 'status-entregue',
      'DEVOLUCAO': 'status-devolucao',
      'AUTORIZADO_DEVOLUCAO': 'status-devolucao-autorizada',
      'ENVIADO_DEVOLUCAO': 'status-devolucao-enviada',
      'DEVOLVIDO': 'status-devolvido',
      'CANCELADO': 'status-cancelado'
    };
    return classes[status] || 'status-pendente';
  }
}





