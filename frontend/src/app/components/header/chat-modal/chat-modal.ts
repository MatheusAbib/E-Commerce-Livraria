import { inject } from '@angular/core';
import { ChatApiService } from '../../../services/chat-api.service';
import { ModalBaseComponent, ModalCabecalhoComponent, ModalCorpoComponent } from '../../shared/modals';
import { EstadoVazioComponent } from '../../../components/shared/feedback';
import { CarregamentoComponent } from '../../../components/shared/feedback';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth';
import { ChatService } from '../../../services/chat.service';


@Component({
  selector: 'app-chat-modal',
  standalone: true,
  imports: [EstadoVazioComponent, CarregamentoComponent, CommonModule, ModalBaseComponent, ModalCabecalhoComponent, ModalCorpoComponent],
  templateUrl: './chat-modal.html',
  styleUrls: ['./chat-modal.css']
})
export class ChatModalComponent {
  private readonly chatApiService = inject(ChatApiService);

  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() abrirChat = new EventEmitter<{pedidoId: number, pedido: any}>();

  chatsTabAtivo: string = 'ativos';
  chatsAtivos: any[] = [];
  chatsEncerrados: any[] = [];
  loadingChats: boolean = false;
  totalChatsNaoLidas: number = 0;

  carregandoChats: boolean = false;

  constructor(
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnChanges(): void {
    if (this.visible) {
      this.carregandoChats = true;
      this.carregarChats();
    }
  }

  fechar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  async carregarChats(): Promise<void> {
    const user = this.authService.getUser();
    if (!user) {
      this.carregandoChats = false;
      return;
    }

    try {
      const token = this.authService.getToken();
      const response = await this.chatApiService.listarConversasCliente(user.id, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.chatsAtivos = data.ativos || [];
        this.chatsEncerrados = data.encerrados || [];
        this.totalChatsNaoLidas = this.chatsAtivos.reduce((sum: number, chat: any) => sum + (chat.naoLidas || 0), 0);
      }
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
    } finally {
      this.carregandoChats = false;
    }
  }

  selecionarChat(pedidoId: number): void {
    this.chatService.limparUltimoPedido();

    const pedido = this.chatsAtivos.find((c: any) => c.pedidoId === pedidoId) ||
                   this.chatsEncerrados.find((c: any) => c.pedidoId === pedidoId);

    this.fechar();

    setTimeout(() => {
      this.chatService.abrirChat(pedidoId, pedido);
    }, 100);
  }
}
