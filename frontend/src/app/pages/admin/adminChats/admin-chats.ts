import { ChatApiService } from '../../../services/chat-api.service';
import { inject } from '@angular/core';
import { PedidoService } from '../../../services/pedido.service';
import { EstadoVazioComponent } from '../../../components/shared/feedback';
import { CarregamentoComponent } from '../../../components/shared/feedback';
import { CampoDirective } from '../../../components/shared/forms';
import { BotaoComponent } from '../../../components/shared/buttons/botao/botao';
import { BotaoIconeComponent } from '../../../components/shared/buttons/botao-icone/botao-icone';
import { GrupoAcoesComponent } from '../../../components/shared/buttons/grupo-acoes/grupo-acoes';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../services/auth';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-admin-chats',
  standalone: true,
  imports: [EstadoVazioComponent, CarregamentoComponent, CampoDirective, CommonModule, FormsModule, RouterModule, ToastModule, AdminSidebarComponent, BotaoComponent, BotaoIconeComponent, GrupoAcoesComponent],
  providers: [MessageService],
  templateUrl: './admin-chats.html',
  styleUrls: ['./admin-chats.css', '../admin-common.css']
})
export class AdminChatsComponent implements OnInit, OnDestroy {
  private readonly chatApiService = inject(ChatApiService);

  private readonly pedidoService = inject(PedidoService);

  @ViewChild('chatAdminMessagesPage') chatAdminMessagesPage!: ElementRef;

  conversas: any = {};
  conversasKeys: number[] = [];
  conversasFiltradas: any[] = [];
  loading: boolean = true;
  chatsTabAtivo: string = 'ativos';
  filtroCliente: string = '';
  totalAtivos: number = 0;

  chatAdminPedido: any = null;
  mensagensChatAdmin: any[] = [];
  novaMensagemChatAdmin: string = '';
  chatAdminAtivo: boolean = true;
  chatAdminInterval: any = null;
  filtrando: boolean = false;

  pedidoDetalhes: any = null;

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarConversas();

    this.route.queryParams.subscribe(params => {
      const pedidoId = params['pedidoId'];
      if (pedidoId) {
        setTimeout(() => {
          this.abrirChatAdminPorId(Number(pedidoId));
        }, 1000);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.chatAdminInterval) {
      clearInterval(this.chatAdminInterval);
      this.chatAdminInterval = null;
    }
  }

  async carregarConversas(): Promise<void> {
    this.loading = true;
    this.cdr.detectChanges();
    try {
      const token = this.authService.getToken();
      const response = await this.chatApiService.listarConversasAdmin({
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (response.ok) {
        this.conversas = await response.json();
        this.conversasKeys = Object.keys(this.conversas).map(Number).sort((a, b) => b - a);
        this.totalAtivos = this.conversasKeys.filter(id => this.conversas[id].ativo !== false).length;
        this.aplicarFiltro();
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao carregar conversas'
      });
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async aplicarFiltro(): Promise<void> {
    this.filtrando = true;
    await new Promise(resolve => setTimeout(resolve, 100));

    let lista = this.conversasKeys.map(id => ({
      pedidoId: id,
      ...this.conversas[id],
      ativo: this.conversas[id]?.ativo !== undefined ? this.conversas[id].ativo : true
    }));

    this.totalAtivos = lista.filter(item => item.ativo !== false).length;

    if (this.chatsTabAtivo === 'ativos') {
      lista = lista.filter(item => item.ativo !== false);
    } else {
      lista = lista.filter(item => item.ativo === false);
    }

    if (this.filtroCliente.trim()) {
      const search = this.filtroCliente.toLowerCase().trim();
      lista = lista.filter(item =>
        item.clienteNome?.toLowerCase().includes(search)
      );
    }

    this.conversasFiltradas = lista;
    this.filtrando = false;
    this.cdr.detectChanges();
  }

  async limparFiltro(): Promise<void> {
    this.filtrando = true;
    await new Promise(resolve => setTimeout(resolve, 50));

    this.filtroCliente = '';

    let lista = this.conversasKeys.map(id => ({
      pedidoId: id,
      ...this.conversas[id],
      ativo: this.conversas[id]?.ativo !== undefined ? this.conversas[id].ativo : true
    }));

    if (this.chatsTabAtivo === 'ativos') {
      lista = lista.filter(item => item.ativo !== false);
    } else {
      lista = lista.filter(item => item.ativo === false);
    }

    this.conversasFiltradas = lista;
    this.filtrando = false;
    this.cdr.detectChanges();
  }

  async reativarAtendimentoAdmin(): Promise<void> {
    if (!this.chatAdminPedido) return;

    try {
      const token = this.authService.getToken();
      const response = await this.chatApiService.reativarAdmin(this.chatAdminPedido.id, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (response.ok) {
        this.chatAdminAtivo = true;
        if (this.conversas[this.chatAdminPedido.id]) {
          this.conversas[this.chatAdminPedido.id].ativo = true;
        }
        this.totalAtivos = this.totalAtivos + 1;
        this.aplicarFiltro();
        this.messageService.add({
          severity: 'success',
          summary: 'Atendimento reativado',
          detail: 'O atendimento foi reativado com sucesso'
        });
        await this.carregarMensagensChatAdmin(this.chatAdminPedido.id);
      } else {
        const error = await response.json();
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.mensagem || 'Erro ao reativar atendimento'
        });
      }
    } catch (error) {
      console.error('Erro ao reativar atendimento:', error);
    }
  }

  async abrirChatAdminPorId(pedidoId: number): Promise<void> {
    const pedidoInfo = this.conversas[pedidoId];
    if (!pedidoInfo) return;

    this.chatAdminPedido = {
      id: pedidoId,
      clienteNome: pedidoInfo.clienteNome,
      cliente: { nome: pedidoInfo.clienteNome }
    };

    await this.carregarDetalhesPedido(pedidoId);
    await this.carregarMensagensChatAdmin(pedidoId);
    await this.verificarAtendimentoAdmin(pedidoId);

    if (this.chatAdminInterval) {
      clearInterval(this.chatAdminInterval);
    }
    this.chatAdminInterval = setInterval(() => {
      this.carregarMensagensChatAdminSilenciosamente(pedidoId);
    }, 2000);
  }

  async carregarDetalhesPedido(pedidoId: number): Promise<void> {
    try {
      const token = this.authService.getToken();
      const response = await this.pedidoService.buscarPorId(pedidoId, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      if (response.ok) {
        this.pedidoDetalhes = await response.json();
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do pedido:', error);
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
        this.cdr.detectChanges();

       await this.chatApiService.marcarLidasAdmin(pedidoId, {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer ' + token
          }
        });

        if (this.conversas[pedidoId]) {
          this.conversas[pedidoId].naoLidasAdmin = 0;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  }

  async carregarMensagensChatAdminSilenciosamente(pedidoId: number): Promise<void> {
    try {
      const token = this.authService.getToken();
      const response = await this.chatApiService.listarMensagensAdminRelativo(pedidoId, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (response.ok) {
        const novasMensagens = await response.json();
        if (JSON.stringify(novasMensagens) !== JSON.stringify(this.mensagensChatAdmin)) {
          this.mensagensChatAdmin = novasMensagens;
          this.scrollChatAdminParaBaixo();
          this.cdr.detectChanges();

          await this.chatApiService.marcarLidasAdminRelativo(pedidoId, {
            method: 'PUT',
            headers: {
              'Authorization': 'Bearer ' + token
            }
          });

          if (this.conversas[pedidoId]) {
            this.conversas[pedidoId].naoLidasAdmin = 0;
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  }

  scrollChatAdminParaBaixo(): void {
    setTimeout(() => {
      if (this.chatAdminMessagesPage) {
        this.chatAdminMessagesPage.nativeElement.scrollTop = this.chatAdminMessagesPage.nativeElement.scrollHeight;
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
        const novoAtivo = data.ativo;

        if (this.conversas[pedidoId]) {
          const antigoAtivo = this.conversas[pedidoId].ativo !== undefined ? this.conversas[pedidoId].ativo : true;
          this.conversas[pedidoId].ativo = novoAtivo;

          if (antigoAtivo !== novoAtivo) {
            if (novoAtivo) {
              this.totalAtivos = this.totalAtivos + 1;
            } else {
              this.totalAtivos = Math.max(0, this.totalAtivos - 1);
            }
            this.aplicarFiltro();
          }
        }

        this.chatAdminAtivo = novoAtivo;
        this.cdr.detectChanges();
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
        if (this.conversas[this.chatAdminPedido.id]) {
          this.conversas[this.chatAdminPedido.id].ativo = false;
        }
        this.totalAtivos = Math.max(0, this.totalAtivos - 1);
        this.aplicarFiltro();
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

  fecharChatAdmin(): void {
    this.chatAdminPedido = null;
    this.mensagensChatAdmin = [];
    if (this.chatAdminInterval) {
      clearInterval(this.chatAdminInterval);
      this.chatAdminInterval = null;
    }
    this.cdr.detectChanges();
  }
}
