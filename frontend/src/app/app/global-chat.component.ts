import { inject } from '@angular/core';
import { PedidoService } from '../services/pedido.service';
import { ChatApiService } from '../services/chat-api.service';

import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../services/auth';
import { MessageService } from 'primeng/api';
import { ModalBaseComponent, ModalConfirmacaoComponent } from '../components/shared/modals';
import { BotaoComponent, BotaoIconeComponent } from '../components/shared/buttons';
import { CampoDirective } from '../components/shared/forms';
import { NotificacaoComponent } from '../components/shared/feedback';

@Component({
  selector: 'app-global-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalBaseComponent, ModalConfirmacaoComponent, BotaoComponent, BotaoIconeComponent, CampoDirective, NotificacaoComponent],
  providers: [MessageService],
  template: `
    <app-modal-base
      [visivel]="chatAberto && !!pedidoChat"
      largura="580px"
      altura="100dvh"
      alturaMaxima="100dvh"
      rotulo="Chat do pedido"
      lateral
      (fechar)="fecharChat()">
      <div class="chat-panel" *ngIf="pedidoChat">
        <header class="chat-header">
          <div class="chat-header-top">
            <span class="chat-eyebrow">
              <span class="chat-eyebrow-line"></span>
              CENTRAL DE ATENDIMENTO
            </span>

            <button
              appBotaoIcone
              icone="pi pi-times"
              rotulo="Fechar chat"
              aparencia="autenticacao"
              (click)="fecharChat()">
            </button>
          </div>

          <div class="chat-heading">
            <div>
              <h2>Conversa com o vendedor<span class="chat-heading-dot">.</span></h2>
              <p>Acompanhe e converse sobre seu pedido.</p>
            </div>
          </div>

          <div class="chat-order-bar">
            <div class="chat-order-info">
              <span class="chat-order-label">REFERÊNCIA DO PEDIDO</span>
              <strong>#{{ pedidoChat?.id }}</strong>
            </div>
            <span class="chat-status" [class.chat-status-inactive]="!chatAtivo">
              <span class="chat-status-dot"></span>
              {{ chatAtivo ? 'ATENDIMENTO ATIVO' : 'ATENDIMENTO ENCERRADO' }}
            </span>
          </div>
        </header>

        <div class="chat-conversation">
          <div class="chat-conversation-heading">
            <span>HISTÓRICO DA CONVERSA</span>
            <span>{{ mensagensChat.length }} {{ mensagensChat.length === 1 ? 'MENSAGEM' : 'MENSAGENS' }}</span>
          </div>

          <div class="chat-messages" #chatMessages>
            <div *ngIf="mensagensChat.length === 0" class="chat-empty">
              <div class="chat-empty-icon">
                <i class="pi pi-comment"></i>
              </div>
              <h3>Sua conversa começa aqui.</h3>
              <p>Envie uma mensagem para iniciar o atendimento sobre este pedido.</p>
            </div>

            <div
              *ngFor="let msg of mensagensChat"
              class="chat-message"
              [class.message-admin]="msg.doAdmin"
              [class.message-cliente]="!msg.doAdmin"
            >
              <div class="message-author">
                <span class="message-author-icon">
                  <i [class]="msg.doAdmin ? 'pi pi-briefcase' : 'pi pi-user'"></i>
                </span>
                <span>{{ msg.doAdmin ? 'Vendedor' : 'Você' }}</span>
              </div>

              <div class="message-bubble">
                <p class="message-text">{{ msg.mensagem }}</p>
                <span class="message-time">{{ msg.dataEnvio | date:'HH:mm' }}</span>
              </div>
            </div>
          </div>
        </div>

        <footer class="chat-footer" *ngIf="chatAtivo">
          <div class="chat-compose-heading">
            <span>ESCREVER MENSAGEM</span>
          </div>

          <div class="chat-input-wrapper">
            <input
              type="text"
              [(ngModel)]="novaMensagemChat"
              placeholder="Digite sua mensagem..."
              (keyup.enter)="enviarMensagemChat()"
              appCampo class="chat-input"
              maxlength="1000"
              aria-label="Digite sua mensagem"
            >

            <button
              appBotaoIcone
              icone="pi pi-send"
              rotulo="Enviar mensagem"
              variante="primario"
              tamanho="grande"
              class="chat-send-btn"
              [desabilitado]="!novaMensagemChat.trim()"
              (click)="enviarMensagemChat()">
            </button>
          </div>

          <div class="chat-footer-bottom">
            <span class="chat-footer-hint">
              <i class="pi pi-info-circle"></i>
              Pressione Enter para enviar
            </span>

            <button
              *ngIf="isAdmin"
              appBotao
              variante="perigo"
              tamanho="pequeno"
              icone="pi pi-times-circle"
              class="chat-encerrar-btn"
              (click)="encerrarAtendimento()">
              Encerrar atendimento
            </button>
          </div>
        </footer>

        <footer class="chat-footer chat-footer-inactive" *ngIf="!chatAtivo">
          <div class="chat-encerrado">
            <div class="chat-encerrado-icon">
              <i class="pi pi-lock"></i>
            </div>
            <div>
              <strong>Atendimento encerrado</strong>
              <p>Esta conversa está temporariamente encerrada.</p>
            </div>
          </div>

          <button
            appBotao
            variante="primario"
            tamanho="grande"
            icone="pi pi-refresh"
            larguraTotal
            (click)="reativarAtendimento()">
            Iniciar nova conversa
          </button>
        </footer>
      </div>
    </app-modal-base>

    <app-modal-confirmacao
      [visivel]="displayConfirmarEncerrar"
      titulo="Encerrar atendimento"
      mensagem="Tem certeza de que deseja encerrar esta conversa?"
      icone="pi pi-exclamation-triangle"
      variante="perigo"
      largura="500px"
      textoCancelar="Cancelar"
      textoConfirmar="Sim, encerrar"
      iconeConfirmar="pi pi-check"
      (cancelar)="cancelarEncerrar()"
      (confirmar)="confirmarEncerrarAtendimento()">
      <div class="chat-confirm-notice">
        <i class="pi pi-info-circle"></i>
        <div>
          <strong>O que acontece depois?</strong>
          <p>O envio de mensagens ficará indisponível até que o atendimento seja reativado. O histórico da conversa será preservado.</p>
        </div>
      </div>
    </app-modal-confirmacao>

    <app-notificacao></app-notificacao>
  `,
  styles: [`
    :host {
      --chat-ink: var(--cor-texto);
      --chat-muted: var(--cor-texto-secundario);
      --chat-line: var(--cor-borda-suave);
      --chat-soft: var(--cor-superficie-suave);
      --chat-white: var(--cor-superficie);
      --chat-danger: var(--cor-perigo);
      font-family: inherit;
    }

    .chat-panel {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      width: 100%;
      height: 100%;
      min-height: 0;
      min-width: 0;
      background: var(--chat-white);
      color: var(--chat-ink);
      overflow: hidden;
    }

    

    

    .chat-header {
      flex-shrink: 0;
      background: var(--chat-white);
      border-bottom: 1px solid var(--chat-line);
    }

    .chat-header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 22px 30px 0;
    }

    .chat-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--chat-muted);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .12em;
    }

    .chat-eyebrow-line {
      width: 22px;
      height: 1px;
      background: var(--chat-ink);
    }

    .chat-heading {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      padding: 23px 30px 30px;
    }

    .chat-heading h2 {
      margin: 0;
      max-width: 360px;
      color: var(--chat-ink);
      font-family: inherit;
      font-size: clamp(28px, 3vw, 40px);
      font-weight: 800;
      line-height: 1.05;
      letter-spacing: -.055em;
    }

    .chat-heading-dot {
      color: #8793a2;
    }

    .chat-heading p {
      margin: 12px 0 0;
      color: var(--chat-muted);
      font-size: 12px;
      line-height: 1.6;
    }

    .chat-order-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
      padding: 18px 30px;
      background: var(--chat-soft);
      border-top: 1px solid var(--chat-line);
    }

    .chat-order-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .chat-order-label {
      color: var(--chat-muted);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: .09em;
    }

    .chat-order-info strong {
      color: var(--chat-ink);
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -.045em;
    }

    .chat-status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 11px;
      background: #eff7f3;
      border: 1px solid #d6e8dd;
      color: #39735d;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: .045em;
    }

    .chat-status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .chat-status-inactive {
      background: #fbf2f2;
      border-color: #eed7d7;
      color: var(--chat-danger);
    }

    .chat-conversation {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-height: 0;
      background: var(--chat-white);
    }

    .chat-conversation-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 20px 30px;
      border-bottom: 1px solid var(--chat-line);
      color: var(--chat-muted);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: .08em;
    }

    .chat-messages {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 28px 30px;
      scrollbar-width: thin;
      scrollbar-color: #cbd2da transparent;
    }

    .chat-messages::-webkit-scrollbar {
      width: 5px;
    }

    .chat-messages::-webkit-scrollbar-thumb {
      background: #cbd2da;
    }

    .chat-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100%;
      padding: 50px 15px;
      text-align: center;
    }

    .chat-empty-icon {
      display: grid;
      place-items: center;
      width: 70px;
      height: 70px;
      margin-bottom: 25px;
      border: 1px solid var(--chat-line);
      background: var(--chat-soft);
    }

    .chat-empty-icon i {
      font-size: 26px;
      color: var(--chat-ink);
    }

    .chat-empty h3 {
      margin: 0 0 10px;
      color: var(--chat-ink);
      font-size: 21px;
      font-weight: 800;
      letter-spacing: -.04em;
    }

    .chat-empty p {
      max-width: 280px;
      margin: 0;
      color: var(--chat-muted);
      font-size: 12px;
      line-height: 1.8;
    }

    .chat-message {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: 25px;
    }

    .chat-message.message-cliente {
      align-items: flex-end;
    }

    .message-author {
      display: flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 9px;
      color: var(--chat-muted);
      font-size: 10px;
      font-weight: 700;
    }

    .message-author-icon {
      display: grid;
      place-items: center;
      width: 22px;
      height: 22px;
      background: var(--chat-soft);
      border: 1px solid var(--chat-line);
    }

    .message-author-icon i {
      font-size: 10px;
    }

    .message-bubble {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 11px;
      width: fit-content;
      max-width: 82%;
      min-width: 90px;
      padding: 15px 17px 12px;
      border: 1px solid var(--chat-line);
      background: var(--chat-soft);
      border-radius: 0;
      overflow-wrap: anywhere;
    }

    .message-cliente .message-bubble {
      background: var(--chat-ink);
      border-color: var(--chat-ink);
      color: white;
    }

    .message-admin .message-bubble {
      background: var(--chat-soft);
      color: var(--chat-ink);
    }

    .message-text {
      align-self: stretch;
      margin: 0;
      font-size: 12px;
      line-height: 1.75;
      white-space: pre-wrap;
    }

    .message-time {
      font-size: 9px;
      font-weight: 600;
      opacity: .6;
    }

    .chat-footer {
      flex-shrink: 0;
      padding: 22px 30px 25px;
      border-top: 1px solid var(--chat-line);
      background: var(--chat-white);
    }

    .chat-compose-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 13px;
      color: var(--chat-ink);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .07em;
    }

    .chat-input-wrapper {
      display: flex;
      align-items: stretch;
      gap: 0;
      border: 1px solid #cbd2da;
      transition: border-color .2s ease;
    }

    .chat-input-wrapper:focus-within {
      border-color: var(--chat-ink);
    }

    .chat-input {
      flex: 1;
      min-width: 0;
      min-height: 51px;
      padding: 14px 16px;
      background: white;
      border: 0;
      border-radius: 0;
      outline: none;
      color: var(--chat-ink);
      font-family: inherit;
      font-size: 12px;
    }

    .chat-input::placeholder {
      color: #98a1ad;
    }

    .chat-footer-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 14px;
    }

    .chat-footer-hint {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      color: var(--chat-muted);
      font-size: 10px;
    }

    .chat-footer-hint i {
      font-size: 11px;
    }

    .chat-footer-inactive {
      padding-top: 25px;
    }

    .chat-encerrado {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
    }

    .chat-encerrado-icon {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      background: #fbf2f2;
      border: 1px solid #eed7d7;
      color: var(--chat-danger);
    }

    .chat-encerrado-icon i {
      font-size: 16px;
    }

    .chat-encerrado strong {
      display: block;
      color: var(--chat-ink);
      font-size: 13px;
      font-weight: 800;
    }

    .chat-encerrado p {
      margin: 5px 0 0;
      color: var(--chat-muted);
      font-size: 11px;
      line-height: 1.6;
    }

    

    .chat-confirm-notice {
      display: flex;
      align-items: flex-start;
      gap: 13px;
      margin-top: 27px;
      padding: 17px;
      background: var(--chat-soft);
      border: 1px solid var(--chat-line);
    }

    .chat-confirm-notice > i {
      margin-top: 2px;
      color: var(--chat-ink);
      font-size: 15px;
    }

    .chat-confirm-notice strong {
      display: block;
      margin-bottom: 6px;
      color: var(--chat-ink);
      font-size: 12px;
      font-weight: 800;
    }

    .chat-confirm-notice p {
      margin: 0;
      color: var(--chat-muted);
      font-size: 11px;
      line-height: 1.75;
    }

    @media (max-width: 768px) {
      .chat-panel {
        width: 100%;
        border-left: 0;
      }

      .chat-header-top {
        padding: 18px 22px 0;
      }

      .chat-heading {
        padding: 22px;
      }

      .chat-heading h2 {
        font-size: clamp(27px, 6vw, 36px);
      }

      .chat-order-bar {
        padding: 16px 22px;
      }

      .chat-conversation-heading {
        padding: 16px 22px;
      }

      .chat-messages {
        padding: 22px;
      }

      .chat-footer {
        padding: 19px 22px 22px;
      }
    }

    @media (max-width: 480px) {
      .chat-header-top {
        padding: 14px 16px 0;
      }

      .chat-eyebrow {
        font-size: 8px;
      }

      .chat-heading {
        gap: 12px;
        padding: 17px 16px 20px;
      }

      .chat-heading h2 {
        font-size: 27px;
      }

      .chat-heading p {
        font-size: 11px;
      }

      .chat-order-bar {
        padding: 14px 16px;
      }

      .chat-status {
        font-size: 8px;
      }

      .chat-conversation-heading {
        padding: 15px 16px;
        font-size: 8px;
      }

      .chat-messages {
        padding: 20px 16px;
      }

      .message-bubble {
        max-width: 88%;
        padding: 13px 14px 10px;
      }

      .chat-footer {
        padding: 16px;
      }

      .chat-footer-bottom {
        align-items: flex-start;
      }

    }

    

    .chat-input-wrapper {
      display: flex;
      align-items: stretch;
      gap: 0;
      border: 1px solid var(--cor-borda);
    }

    .chat-input-wrapper:focus-within {
      border-color: var(--cor-primaria);
    }

    .chat-input-wrapper .chat-input {
      flex: 1 1 auto;
      width: 0;
      min-width: 0;
      height: 51px;
      border: 0;
      box-shadow: none;
    }

    .chat-input-wrapper .chat-send-btn {
      flex: 0 0 54px;
      width: 54px;
      height: 51px;
      border: 0;
      border-radius: 0;
    }

    .chat-confirm-notice {
      margin-top: 20px;
      border-left: 3px solid var(--cor-primaria);
    }

    .chat-empty {
      box-sizing: border-box;
    }

    .message-bubble {
      box-sizing: border-box;
    }

    @media (max-width: 480px) {
      .chat-input-wrapper .chat-input {
        font-size: 16px;
      }

      .chat-encerrar-btn {
        width: 100%;
      }
    }

    @media (max-height: 650px) {
      .chat-heading {
        padding-top: 12px;
        padding-bottom: 15px;
      }

      .chat-heading h2 {
        font-size: 25px;
      }

      .chat-order-bar,
      .chat-conversation-heading {
        padding-top: 10px;
        padding-bottom: 10px;
      }

      .chat-footer {
        padding-top: 12px;
        padding-bottom: 12px;
      }
    }
  `]
})
export class GlobalChatComponent implements OnInit, OnDestroy {
  private readonly pedidoService = inject(PedidoService);
  private readonly chatApiService = inject(ChatApiService);

  @ViewChild('chatMessages') chatMessages!: ElementRef;

  chatAberto: boolean = false;
  pedidoChat: any = null;
  mensagensChat: any[] = [];
  novaMensagemChat: string = '';
  chatAtivo: boolean = true;
  chatInterval: ReturnType<typeof setInterval> | null = null;
  displayConfirmarEncerrar: boolean = false;
  isAdmin: boolean = false;

  private ultimoStatusPorPedido: Map<number, boolean> = new Map();
  private carregandoMensagens: boolean = false;
  private pedidoIdAtual: number = 0;
  private subscriptions = new Subscription();

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.chatService.abrirChat$.subscribe(({ pedidoId, pedido }) => {
        if (this.pedidoIdAtual !== pedidoId || !this.chatAberto) {
          this.fecharChat();
          this.abrirChat(pedidoId, pedido);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.limparIntervalo();
    this.subscriptions.unsubscribe();
  }

  private limparIntervalo(): void {
    if (this.chatInterval) {
      clearInterval(this.chatInterval);
      this.chatInterval = null;
    }
  }

  async abrirChat(pedidoId: number, pedido: any): Promise<void> {
    if (!pedido || !pedido.id) {
      try {
        const user = this.authService.getUser();

        if (!user) {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Usuário não autenticado'
          });
          return;
        }

        const token = this.authService.getToken();
        const response = await this.pedidoService.buscarPorIdRelativo(pedidoId, {
          headers: {
            Authorization: 'Bearer ' + token
          }
        });

        if (response.ok) {
          pedido = await response.json();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível carregar os dados do pedido'
          });
          return;
        }
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar dados do pedido'
        });
        return;
      }
    }

    this.pedidoIdAtual = pedidoId;
    this.pedidoChat = pedido;
    this.chatAberto = true;
    this.novaMensagemChat = '';
    this.mensagensChat = [];
    this.carregandoMensagens = false;
    this.chatAtivo = true;

    const user = this.authService.getUser();
    this.isAdmin = user?.perfil === 'ADMIN';

    this.limparIntervalo();

    await this.carregarMensagensChat(pedidoId);
    await this.verificarAtendimento(pedidoId);

    if (!this.chatAberto || this.pedidoIdAtual !== pedidoId) {
      return;
    }

    this.chatInterval = setInterval(() => {
      if (
        this.chatAberto &&
        this.pedidoIdAtual === pedidoId &&
        !this.carregandoMensagens
      ) {
        this.carregarMensagensChatSilenciosamente(pedidoId);
      }
    }, 5000);
  }

  fecharChat(): void {
    this.chatAberto = false;
    this.pedidoChat = null;
    this.mensagensChat = [];
    this.novaMensagemChat = '';
    this.carregandoMensagens = false;
    this.pedidoIdAtual = 0;
    this.displayConfirmarEncerrar = false;
    this.limparIntervalo();
  }

  async carregarMensagensChat(pedidoId: number): Promise<void> {
    if (this.carregandoMensagens) {
      return;
    }

    this.carregandoMensagens = true;

    try {
      const user = this.authService.getUser();

      if (!user) {
        return;
      }

      const token = this.authService.getToken();
      const url = `/api/chat/cliente/${pedidoId}?clienteId=${user.id}`;

      const response = await this.chatApiService.consultarMensagensPorUrl(url, {
        headers: {
          Authorization: 'Bearer ' + token
        }
      });

      if (response.ok) {
        const mensagens = await response.json();

        if (!this.chatAberto || this.pedidoIdAtual !== pedidoId) {
          return;
        }

        this.mensagensChat = mensagens;
        this.scrollChatParaBaixo();

        await this.chatApiService.marcarLidasClienteRelativo(pedidoId, {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer ' + token
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      this.carregandoMensagens = false;
    }
  }

  async carregarMensagensChatSilenciosamente(pedidoId: number): Promise<void> {
    if (this.carregandoMensagens || !this.chatAberto) {
      return;
    }

    this.carregandoMensagens = true;

    try {
      const user = this.authService.getUser();

      if (!user) {
        return;
      }

      const token = this.authService.getToken();

      const response = await this.chatApiService.listarMensagensClienteRelativo(pedidoId, user.id, {
          headers: {
            Authorization: 'Bearer ' + token
          }
        });

      if (response.ok) {
        const novasMensagens = await response.json();

        if (!this.chatAberto || this.pedidoIdAtual !== pedidoId) {
          return;
        }

        if (JSON.stringify(novasMensagens) !== JSON.stringify(this.mensagensChat)) {
          this.mensagensChat = novasMensagens;
          this.scrollChatParaBaixo();

          await this.chatApiService.marcarLidasClienteRelativo(pedidoId, {
            method: 'PUT',
            headers: {
              Authorization: 'Bearer ' + token
            }
          });
        }
      }

      if (this.chatAberto && this.pedidoIdAtual === pedidoId) {
        await this.verificarAtendimento(pedidoId);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      this.carregandoMensagens = false;
    }
  }

  scrollChatParaBaixo(): void {
    setTimeout(() => {
      if (this.chatMessages?.nativeElement) {
        this.chatMessages.nativeElement.scrollTop =
          this.chatMessages.nativeElement.scrollHeight;
      }
    }, 100);
  }

  async enviarMensagemChat(): Promise<void> {
    if (!this.novaMensagemChat.trim() || !this.chatAtivo || !this.pedidoChat) {
      return;
    }

    try {
      const user = this.authService.getUser();

      if (!user) {
        return;
      }

      const token = this.authService.getToken();
      const mensagem = this.novaMensagemChat.trim();
      const pedidoId = this.pedidoChat.id;

      const response = await this.chatApiService.enviarMensagemClienteRelativo(pedidoId, user.id, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token
          },
          body: JSON.stringify({ mensagem })
        });

      if (response.ok) {
        this.novaMensagemChat = '';
        await this.carregarMensagensChat(pedidoId);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  }

  async verificarAtendimento(pedidoId: number): Promise<void> {
    try {
      const token = this.authService.getToken();

      const response = await this.chatApiService.consultarAtendimentoRelativo(pedidoId, {
          headers: {
            Authorization: 'Bearer ' + token
          }
        });

      if (response.ok) {
        const data = await response.json();

        if (!this.chatAberto || this.pedidoIdAtual !== pedidoId) {
          return;
        }

        const novoStatus = data.ativo;
        const statusAnterior = this.ultimoStatusPorPedido.get(pedidoId);

        if (statusAnterior !== undefined && statusAnterior !== novoStatus) {
          if (!novoStatus) {
            this.messageService.add({
              severity: 'info',
              summary: 'Atendimento encerrado',
              detail: 'O vendedor encerrou o atendimento'
            });
          } else {
            this.messageService.add({
              severity: 'info',
              summary: 'Atendimento reativado',
              detail: 'A conversa foi reativada'
            });
          }
        }

        this.ultimoStatusPorPedido.set(pedidoId, novoStatus);
        this.chatAtivo = novoStatus;
      }
    } catch (error) {
      console.error('Erro ao verificar atendimento:', error);
    }
  }

  encerrarAtendimento(): void {
    this.displayConfirmarEncerrar = true;
  }

  async confirmarEncerrarAtendimento(): Promise<void> {
    this.displayConfirmarEncerrar = false;

    if (!this.pedidoChat?.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Pedido não identificado'
      });
      return;
    }

    try {
      const pedidoId = this.pedidoChat.id;
      const token = this.authService.getToken();

      const response = await this.chatApiService.encerrarClienteRelativo(pedidoId, {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer ' + token
          }
        });

      if (response.ok) {
        this.chatAtivo = false;
        this.ultimoStatusPorPedido.set(pedidoId, false);

        this.messageService.add({
          severity: 'success',
          summary: 'Atendimento encerrado',
          detail: 'O atendimento foi encerrado com sucesso'
        });
      } else {
        const error = await response.json().catch(() => ({}));

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

  cancelarEncerrar(): void {
    this.displayConfirmarEncerrar = false;
  }

  async reativarAtendimento(): Promise<void> {
    if (!this.pedidoChat?.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Pedido não identificado'
      });
      return;
    }

    try {
      const pedidoId = this.pedidoChat.id;
      const token = this.authService.getToken();

      const response = await this.chatApiService.reativarClienteRelativo(pedidoId, {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer ' + token
          }
        });

      if (response.ok) {
        this.chatAtivo = true;
        this.ultimoStatusPorPedido.set(pedidoId, true);

        this.messageService.add({
          severity: 'success',
          summary: 'Atendimento reativado',
          detail: 'A conversa foi reaberta com sucesso'
        });

        await this.carregarMensagensChat(pedidoId);
      } else {
        const error = await response.json().catch(() => ({}));

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
}
