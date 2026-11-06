
import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="chatbot-container" [class.minimized]="minimized" *ngIf="isLoggedIn">
      <button
        type="button"
        class="chatbot-header"
        (click)="toggleChat()"
        [attr.aria-expanded]="!minimized"
        aria-label="Abrir ou fechar assistente da livraria"
      >
        <i class="pi pi-book"></i>
        <span>Assistente da livraria</span>
        <i
          class="pi chatbot-toggle-icon"
          [class.pi-chevron-up]="minimized"
          [class.pi-chevron-down]="!minimized"
        ></i>
      </button>

      <div class="chatbot-body" #chatBody>
        <div class="chatbot-intro">
          <span>ATENDIMENTO DIGITAL</span>
          <p>Como podemos ajudar?</p>
        </div>

        <div class="chat-messages" #chatMessages>
          <div
            *ngFor="let msg of mensagens"
            class="message"
            [class.user]="msg.user"
            [class.bot]="!msg.user"
          >
            <div class="message-avatar">
              <i
                class="pi"
                [class.pi-book]="!msg.user"
                [class.pi-user]="msg.user"
              ></i>
            </div>
            <div class="message-content" [innerHTML]="msg.texto"></div>
          </div>

          <div *ngIf="carregando" class="message bot">
            <div class="message-avatar">
              <i class="pi pi-book"></i>
            </div>
            <div class="message-content">
              <span class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          </div>
        </div>

        <div
          class="sugestoes-container"
          *ngIf="!carregando && mensagens.length > 0"
        >
          <button
            *ngFor="let sug of sugestoes"
            type="button"
            class="sugestao-btn"
            (click)="enviarSugestao(sug)"
          >
            <i
              class="pi"
              [class.pi-book]="sug.includes('Recomendar')"
              [class.pi-history]="sug.includes('historico')"
              [class.pi-info-circle]="sug.includes('Ajuda')"
            ></i>
            {{ sug }}
          </button>
        </div>

        <div class="chat-input-area">
          <input
            type="text"
            [(ngModel)]="novaMensagem"
            placeholder="Escreva sua mensagem..."
            (keyup.enter)="enviarMensagem()"
            [disabled]="carregando"
            aria-label="Mensagem para o assistente"
          />

          <button
            type="button"
            (click)="enviarMensagem()"
            [disabled]="carregando || !novaMensagem.trim()"
            aria-label="Enviar mensagem"
          >
            <i class="pi pi-arrow-up"></i>
          </button>
        </div>

        <div class="chatbot-footer">
          ASSISTENTE VIRTUAL DA LIVRARIA
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --chat-navy: #1a2332;
      --chat-navy-hover: #344258;
      --chat-blue: #2a5298;
      --chat-text: #1a2332;
      --chat-muted: #78818d;
      --chat-border: #dfe2e6;
      --chat-background: #ffffff;
      --chat-surface: #f6f7f8;
      --chat-surface-hover: #edf0f3;
    }

    .chatbot-container {
      position: fixed;
      right: 24px;
      bottom: 24px;
      width: 370px;
      max-width: calc(100vw - 32px);
      display: flex;
      flex-direction: column;
      align-items: stretch;
      z-index: 1000;
      font-family: inherit;
      color: var(--chat-text);
    }

    .chatbot-header {
      width: 100%;
      min-height: 66px;
      padding: 0 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: var(--chat-navy);
      color: #ffffff;
      border: 1px solid var(--chat-navy);
      border-radius: 0;
      box-shadow: none;
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.01em;
      text-align: left;
      transition: background-color 0.2s ease;
    }

    .chatbot-header:hover {
      background: var(--chat-navy-hover);
    }

    .chatbot-header > .pi:first-child {
      font-size: 19px;
      flex-shrink: 0;
    }

    .chatbot-header span {
      flex: 1;
    }

    .chatbot-toggle-icon {
      font-size: 12px;
      opacity: 0.8;
    }

    .chatbot-container.minimized {
      width: 58px;
      height: 58px;
    }

    .chatbot-container.minimized .chatbot-header {
      width: 58px;
      height: 58px;
      min-height: 58px;
      padding: 0;
      justify-content: center;
      border-radius: 50%;
    }

    .chatbot-container.minimized .chatbot-header span,
    .chatbot-container.minimized .chatbot-toggle-icon {
      display: none;
    }

    .chatbot-container.minimized .chatbot-header > .pi:first-child {
      font-size: 23px;
    }

    .chatbot-body {
      width: 100%;
      height: min(550px, calc(100dvh - 115px));
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--chat-background);
      border: 1px solid var(--chat-border);
      border-top: 0;
      border-radius: 0;
      box-shadow: none;
    }

    .chatbot-container.minimized .chatbot-body {
      display: none;
    }

    .chatbot-intro {
      padding: 20px 22px 18px;
      border-bottom: 1px solid var(--chat-border);
      background: var(--chat-background);
    }

    .chatbot-intro span {
      display: block;
      margin-bottom: 7px;
      color: var(--chat-muted);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.16em;
    }

    .chatbot-intro p {
      margin: 0;
      color: var(--chat-navy);
      font-size: 19px;
      font-weight: 600;
      line-height: 1.3;
    }

    .chat-messages {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 18px;
      padding: 22px 16px;
      background: var(--chat-surface);
      scrollbar-width: thin;
      scrollbar-color: #c1c7cd transparent;
    }

    .message {
      display: flex;
      align-items: flex-start;
      gap: 9px;
      max-width: 100%;
    }

    .message.user {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .message.bot {
      align-self: flex-start;
    }

    .message-avatar {
      width: 28px;
      height: 28px;
      min-width: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--chat-navy);
      color: #ffffff;
      border-radius: 0;
    }

    .message-avatar i {
      font-size: 12px;
    }

    .message.user .message-avatar {
      background: #e6eaf0;
      color: var(--chat-navy);
    }

    .message-content {
      max-width: 265px;
      padding: 12px 14px;
      border: 1px solid var(--chat-border);
      border-radius: 0;
      background: #ffffff;
      color: var(--chat-text);
      font-size: 12px;
      font-weight: 400;
      line-height: 1.7;
      overflow-wrap: anywhere;
    }

    .message.user .message-content {
      background: var(--chat-navy);
      border-color: var(--chat-navy);
      color: #ffffff;
    }

    .message.bot .message-content {
      background: #ffffff;
      border-color: var(--chat-border);
      color: var(--chat-text);
    }

    .sugestoes-container {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      padding: 14px 16px;
      background: #ffffff;
      border-top: 1px solid var(--chat-border);
    }

    .sugestao-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 10px;
      background: #ffffff;
      border: 1px solid var(--chat-border);
      border-radius: 0;
      color: var(--chat-navy);
      font-family: inherit;
      font-size: 10px;
      font-weight: 600;
      line-height: 1.4;
      white-space: nowrap;
      cursor: pointer;
      box-shadow: none;
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }

    .sugestao-btn i {
      font-size: 11px;
      color: var(--chat-blue);
    }

    .sugestao-btn:hover {
      background: var(--chat-surface);
      border-color: #b8c0ca;
    }

    .sugestao-btn:active {
      background: var(--chat-surface-hover);
    }

    .chat-input-area {
      display: flex;
      align-items: stretch;
      gap: 8px;
      padding: 14px 16px;
      background: #ffffff;
      border-top: 1px solid var(--chat-border);
    }

    .chat-input-area input {
      flex: 1;
      min-width: 0;
      min-height: 42px;
      padding: 10px 12px;
      background: #ffffff;
      border: 1px solid var(--chat-border);
      border-radius: 0;
      color: var(--chat-text);
      outline: none;
      font-family: inherit;
      font-size: 12px !important;
      transition: border-color 0.2s ease;
    }

    .chat-input-area input::placeholder {
      color: #949ca6;
    }

    .chat-input-area input:focus {
      border-color: var(--chat-blue);
    }

    .chat-input-area input:disabled {
      background: var(--chat-surface);
      cursor: not-allowed;
    }

    .chat-input-area button {
      width: 42px;
      min-width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--chat-navy);
      border: 1px solid var(--chat-navy);
      border-radius: 0;
      color: #ffffff;
      cursor: pointer;
      box-shadow: none;
      transition: background-color 0.2s ease;
    }

    .chat-input-area button i {
      font-size: 15px;
    }

    .chat-input-area button:hover:not(:disabled) {
      background: var(--chat-navy-hover);
    }

    .chat-input-area button:disabled {
      background: #dfe2e6;
      border-color: #dfe2e6;
      color: #939ba5;
      cursor: not-allowed;
    }

    .chatbot-footer {
      padding: 11px 16px;
      background: #ffffff;
      border-top: 1px solid var(--chat-border);
      color: #939ba5;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.13em;
      text-align: center;
    }

    .loading-dots {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      min-height: 12px;
    }

    .loading-dots span {
      width: 5px;
      height: 5px;
      background: var(--chat-blue);
      border-radius: 50%;
      animation: chat-dot 1.2s ease-in-out infinite;
    }

    .loading-dots span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .loading-dots span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes chat-dot {
      0%, 60%, 100% {
        opacity: 0.3;
        transform: translateY(0);
      }

      30% {
        opacity: 1;
        transform: translateY(-3px);
      }
    }

    @media (max-width: 768px) {
      .chatbot-container {
        right: 16px;
        bottom: 16px;
        width: 340px;
      }

      .chatbot-body {
        height: min(520px, calc(100dvh - 100px));
      }
    }

    @media (max-width: 480px) {
      .chatbot-container {
        right: 12px;
        bottom: 12px;
        width: min(340px, calc(100vw - 24px));
      }

      .chatbot-container.minimized {
        width: 54px;
        height: 54px;
      }

      .chatbot-container.minimized .chatbot-header {
        width: 54px;
        height: 54px;
        min-height: 54px;
      }

      .chatbot-header {
        min-height: 58px;
        padding: 0 16px;
      }

      .chatbot-body {
        height: min(490px, calc(100dvh - 90px));
      }

      .chatbot-intro {
        padding: 17px 16px;
      }

      .chatbot-intro p {
        font-size: 17px;
      }

      .chat-messages {
        gap: 14px;
        padding: 16px 12px;
      }

      .message-content {
        max-width: 220px;
        padding: 10px 12px;
      }

      .sugestoes-container {
        padding: 12px;
      }

      .sugestao-btn {
        padding: 7px 9px;
        font-size: 10px;
      }

      .chat-input-area {
        padding: 12px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .loading-dots span {
        animation: none;
      }
    }
  `]
})
export class ChatbotComponent implements OnInit, OnDestroy {
  @ViewChild('chatMessages') chatMessages!: ElementRef;

  minimized: boolean = true;
  isLoggedIn: boolean = false;
  mensagens: any[] = [];
  novaMensagem: string = '';
  carregando: boolean = false;
  pedidosChat: any[] = [];
  private intervalId: any = null;

  sugestoes: string[] = [
    'Recomendar livros',
    'Meu historico',
    'Ver historico completo',
    'Ajuda'
  ];

  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.loginStatus$.subscribe(logado => {
      this.isLoggedIn = logado;

      if (logado) {
        this.carregarPedidos();
        this.mensagens = [{
          user: false,
          texto: 'Olá! Eu sou seu assistente de livros.<br>Posso ajudar com recomendações e seu histórico de compras.<br><br>Como posso ajudar você?'
        }];
      }
    });

    const user = this.authService.getUser();

    if (user) {
      this.isLoggedIn = true;
      this.carregarPedidos();
      this.mensagens = [{
        user: false,
        texto: 'Olá! Eu sou seu assistente de livros.<br>Posso ajudar com recomendações e seu histórico de compras.<br><br>Como posso ajudar você?'
      }];
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  toggleChat(): void {
    this.minimized = !this.minimized;

    if (!this.minimized) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  async enviarSugestao(sugestao: string): Promise<void> {
    if (this.carregando) return;

    this.novaMensagem = sugestao;
    await this.enviarMensagem();
  }

  async carregarPedidos(): Promise<void> {
    const user = this.authService.getUser();

    if (!user) return;

    try {
      const token = this.authService.getToken();

      const response = await fetch(
        `${environment.apiUrl}/pedidos?clienteId=${user.id}`,
        {
          headers: {
            Authorization: 'Bearer ' + token
          }
        }
      );

      if (response.ok) {
        const todosPedidos = await response.json();
        this.pedidosChat = todosPedidos.filter(
          (p: any) => p.status !== 'CANCELADO'
        );
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
  }

  scrollToBottom(): void {
    if (this.chatMessages) {
      this.chatMessages.nativeElement.scrollTop =
        this.chatMessages.nativeElement.scrollHeight;
    }
  }

  async enviarMensagem(): Promise<void> {
    if (!this.novaMensagem.trim() || this.carregando) return;

    const mensagem = this.novaMensagem.trim();
    this.novaMensagem = '';

    this.mensagens.push({
      user: true,
      texto: mensagem
    });

    this.scrollToBottom();
    this.carregando = true;

    try {
      const resposta = await this.processarComGemini(mensagem);

      this.mensagens.push({
        user: false,
        texto: resposta
      });
    } catch (error) {
      this.mensagens.push({
        user: false,
        texto: 'Desculpe, estou com problemas de conexão. Tente novamente em alguns instantes.'
      });
    } finally {
      this.carregando = false;
      this.scrollToBottom();
    }
  }

  async processarComGemini(mensagem: string): Promise<string> {
    const cliente = this.authService.getUser();

    if (!cliente) {
      return 'Você precisa estar logado para usar este assistente.';
    }

    if (this.pedidosChat.length === 0) {
      await this.carregarPedidos();
    }

    const contexto = this.construirContexto(cliente);

    const prompt = `${contexto}

Pergunta do usuario: "${mensagem}"

REGRAS:
1. Responda em portugues brasileiro
2. Formate com <br> para quebras de linha
3. Seja amigavel e educado
4. Foque em livros, recomendacoes e historico

Resposta:`;

    try {
      const response = await fetch(`${environment.apiUrl}/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      if (response.ok) {
        const data = await response.json();
        return data.resposta || this.fallbackResponse(mensagem);
      }

      return this.fallbackResponse(mensagem);
    } catch (error) {
      console.error('Erro no chatbot:', error);
      return this.fallbackResponse(mensagem);
    }
  }

  construirContexto(cliente: any): string {
    let contexto = `Voce e um assistente especializado em livros chamado "LivroIA".
Usuario: ${cliente.nome}

Historico de compras do usuario:`;

    const pedidosValidos = this.pedidosChat.filter(
      (p: any) => p.status !== 'CANCELADO'
    );

    if (pedidosValidos.length === 0) {
      contexto += `\n- Nenhum pedido realizado ainda.`;
    } else {
      pedidosValidos.slice(-10).forEach((pedido: any) => {
        contexto += `\nPedido #${pedido.id} (${new Date(pedido.dataPedido).toLocaleDateString('pt-BR')}) - Status: ${pedido.status}:`;

        pedido.itens.forEach((item: any) => {
          contexto += `\n  - ${item.livro?.titulo} (Autor: ${item.livro?.autor || 'N/A'}, Categoria: ${item.livro?.categoria || 'N/A'})`;
        });
      });
    }

    contexto += `\n\nVoce tem acesso a informacoes sobre livros, autores e categorias.`;

    return contexto;
  }

  fallbackResponse(mensagem: string): string {
    const msg = mensagem.toLowerCase();

    if (
      msg.includes('oi') ||
      msg.includes('ola') ||
      msg.includes('bom dia') ||
      msg.includes('boa tarde') ||
      msg.includes('boa noite')
    ) {
      return 'Olá! Tudo bem? Como posso ajudar você com livros hoje?';
    }

    if (
      msg.includes('historico') ||
      msg.includes('compras') ||
      msg.includes('pedidos')
    ) {
      if (
        msg.includes('completo') ||
        msg.includes('tudo') ||
        msg.includes('todos')
      ) {
        return this.mostrarHistoricoCompleto();
      }

      return this.mostrarHistorico();
    }

    if (
      msg.includes('recomenda') ||
      msg.includes('sugere') ||
      msg.includes('indicar') ||
      msg.includes('livro')
    ) {
      return this.mostrarRecomendacoes();
    }

    if (msg.includes('ajuda')) {
      return 'Comandos disponíveis:<br><br>• "Olá" - Cumprimentar<br>• "Meu histórico" - Ver últimas compras<br>• "Histórico completo" - Ver todas as compras<br>• "Recomendar livros" - Sugestões para você<br><br>O que gostaria de saber?';
    }

    return 'Desculpe, não entendi. Digite "ajuda" para ver os comandos disponíveis.';
  }

  mostrarHistorico(): string {
    const pedidosValidos = this.pedidosChat.filter(
      (p: any) => p.status !== 'CANCELADO'
    );

    if (pedidosValidos.length === 0) {
      return 'Você ainda não tem nenhum pedido. Explore nosso catálogo e faça sua primeira compra!';
    }

    const ultimosPedidos = pedidosValidos.slice(-5);
    let html = 'Seus últimos pedidos:<br><br>';

    ultimosPedidos.forEach((pedido: any) => {
      const data = new Date(pedido.dataPedido).toLocaleDateString('pt-BR');

      html += `<strong>Pedido #${pedido.id}</strong> - ${data}<br>`;

      pedido.itens.forEach((item: any) => {
        html += `&nbsp;&nbsp;${item.livro?.titulo} (x${item.quantidade})<br>`;
      });

      html += `<strong>Total:</strong> R$ ${pedido.valorTotal?.toFixed(2)}<br><br>`;
    });

    return html;
  }

  mostrarHistoricoCompleto(): string {
    const pedidosValidos = this.pedidosChat.filter(
      (p: any) => p.status !== 'CANCELADO'
    );

    if (pedidosValidos.length === 0) {
      return 'Você ainda não tem nenhum pedido.';
    }

    let html = 'Histórico completo de compras:<br><br>';

    pedidosValidos.forEach((pedido: any) => {
      const data = new Date(pedido.dataPedido).toLocaleDateString('pt-BR');

      html += `<strong>Pedido #${pedido.id}</strong> - ${data}<br>`;

      pedido.itens.forEach((item: any) => {
        html += `&nbsp;&nbsp;${item.livro?.titulo} (x${item.quantidade}) - R$ ${(item.precoUnitario * item.quantidade).toFixed(2)}<br>`;
      });

      html += `<strong>Total:</strong> R$ ${pedido.valorTotal?.toFixed(2)}<br>`;
      html += `<strong>Status:</strong> ${pedido.status}<br><br>`;
    });

    return html;
  }

  mostrarRecomendacoes(): string {
    const pedidosValidos = this.pedidosChat.filter(
      (p: any) => p.status !== 'CANCELADO'
    );

    if (pedidosValidos.length === 0) {
      return 'Faça sua primeira compra para eu poder recomendar livros com base no seu gosto!';
    }

    const categorias: any = {};

    pedidosValidos.forEach((pedido: any) => {
      pedido.itens.forEach((item: any) => {
        if (item.livro && item.livro.categoria) {
          categorias[item.livro.categoria] =
            (categorias[item.livro.categoria] || 0) + 1;
        }
      });
    });

    const categoriaFavorita = Object.keys(categorias).reduce(
      (a, b) => categorias[a] > categorias[b] ? a : b,
      'Romance'
    );

    const recomendacoes: any = {
      Romance: [
        'Orgulho e Preconceito - Jane Austen',
        'O Morro dos Ventos Uivantes - Emily Bronte',
        'Jane Eyre - Charlotte Bronte'
      ],
      Terror: [
        'O Iluminado - Stephen King',
        'Dracula - Bram Stoker',
        'Frankenstein - Mary Shelley'
      ],
      'Ficcao Cientifica': [
        'Duna - Frank Herbert',
        'Fundacao - Isaac Asimov',
        '1984 - George Orwell'
      ],
      Fantasia: [
        'Harry Potter e a Pedra Filosofal',
        'O Senhor dos Aneis - J.R.R. Tolkien',
        'As Cronicas de Narnia - C.S. Lewis'
      ]
    };

    const sugestoes =
      recomendacoes[categoriaFavorita] || recomendacoes['Romance'];

    return `Baseado nas suas compras, sua categoria favorita é <strong>${categoriaFavorita}</strong>.<br><br>Recomendações para você:<br>${sugestoes.join('<br>')}`;
  }
}
