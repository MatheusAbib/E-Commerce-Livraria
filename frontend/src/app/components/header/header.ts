
import { Component, OnInit, ChangeDetectorRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MenuModule } from 'primeng/menu';
import { MenuItem, MessageService } from 'primeng/api';
import { LoginModalComponent } from './login-modal/login-modal';
import { CadastroModalComponent } from './cadastro-modal/cadastro-modal';
import { PerfilModalComponent } from './perfil-modal/perfil-modal';
import { NotificacoesModalComponent } from './notificacoes-modal/notificacoes-modal';
import { LogoutModalComponent } from './logout-modal/logout-modal';
import { FavoritosModalComponent } from './favoritos-modal/favoritos-modal';
import { CupomModalComponent } from './cupom-modal/cupom-modal';
import { ChatModalComponent } from './chat-modal/chat-modal';
import { CarrinhoService } from '../../services/carrinho';
import { AuthService } from '../../services/auth';
import { ChatService } from '../../services/chat.service';
import { environment } from '../../../environments/environment';
import { AppComponent } from '../../app';
import { Menu } from 'primeng/menu';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AvatarModule,
    ButtonModule,
    ToastModule,
    MenuModule,
    FavoritosModalComponent,
    LoginModalComponent,
    CadastroModalComponent,
    PerfilModalComponent,
    NotificacoesModalComponent,
    LogoutModalComponent,
    CupomModalComponent,
    ChatModalComponent
  ],
  providers: [MessageService],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent implements OnInit {
@ViewChild(FavoritosModalComponent) favoritosModal!: FavoritosModalComponent;
@ViewChild(CupomModalComponent) cupomModal!: CupomModalComponent;
@ViewChild('menuContaPopup') menuContaPopup!: Menu;

  isLoggedIn: boolean = false;
  usuario: any = null;
  carrinhoItens: number = 0;
  notificacoes: any[] = [];
  notificacoesNaoLidas: number = 0;
  favoritosCount: number = 0;

  displayLogin: boolean = false;
  displayCadastro: boolean = false;
  displayPerfil: boolean = false;
  displayNotificacoes: boolean = false;
  displayLogout: boolean = false;
  displayFavoritos: boolean = false;
  displayCupons: boolean = false;
  cuponsDisponiveisCount: number = 0;
  menuContaAberto: boolean = false;

  displayChatsModal: boolean = false;
  chatsTabAtivo: string = 'ativos';
  chatsAtivos: any[] = [];
  chatsEncerrados: any[] = [];
  loadingChats: boolean = false;
  totalChatsNaoLidas: number = 0;
  menuAberto: boolean = false;

  itensMenuConta: MenuItem[] = [
    {
      label: 'Meu perfil',
      icon: 'pi pi-user',
      command: () => this.abrirPerfil()
    },
    {
      separator: true
    },
    {
      label: 'Sair da conta',
      icon: 'pi pi-sign-out',
      command: () => this.abrirLogout()
    }
  ];

  menuContaItems: MenuItem[] = this.itensMenuConta;

  private ultimoStatusPorPedido: Map<number, boolean> = new Map();
  private ultimosChats: any[] = [];

  constructor(
    private carrinhoService: CarrinhoService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private appComponent: AppComponent,
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.carrinhoService.carrinhoItens$.subscribe(total => {
      this.carrinhoItens = total;
      this.cdr.detectChanges();
    });

    this.authService.favoritosCount$.subscribe(count => {
      this.favoritosCount = count;
      this.cdr.detectChanges();
    });

    this.authService.cuponsCount$.subscribe(count => {
      this.cuponsDisponiveisCount = count;
      this.cdr.detectChanges();
    });

    this.authService.usuario$.subscribe(usuario => {
      if (usuario && this.usuario && usuario.id === this.usuario.id) {
        this.usuario.nome = usuario.nome;
        this.cdr.detectChanges();
      }
    });

    this.authService.notificacoes$.subscribe(notificacoes => {
      if (this.usuario) {
        this.notificacoes = notificacoes;
        this.notificacoesNaoLidas = this.notificacoes.filter((n: any) => !n.lida).length;
        this.cdr.detectChanges();
      }
    });

    if (this.authService.isAuthenticated()) {
      const user = this.authService.getUser();
      if (user) {
        this.atualizarUI(user);
      }
    } else {
      const user = JSON.parse(localStorage.getItem('clienteLogado') || 'null');
      if (user && user.id) {
        this.atualizarUI(user);
      }
    }

    this.carregarContadorChats();
    this.carregarContadorCupons();

    setInterval(() => {
      this.carregarContadorChats();
      this.carregarContadorCupons();
    }, 2000);
  }

  @HostListener('window:livraria:abrir-atalho', ['$event'])
  abrirAtalhoDaPrincipal(event: Event): void {
    if (!this.isLoggedIn) return;

    const tipo = (event as CustomEvent<string>).detail;

    if (tipo === 'favoritos') this.abrirFavoritos();
    if (tipo === 'carrinho') void this.abrirCarrinho();
    if (tipo === 'cupons') this.abrirCupons();
  }

  toggleMenu(): void {
    this.menuAberto = !this.menuAberto;
  }

  fecharMenu(): void {
    this.menuAberto = false;
  }

  abrirChatsModal(): void {
    this.chatService.limparUltimoPedido();
    this.displayChatsModal = true;
  }


@HostListener('document:click', ['$event'])
fecharMenuContaAoClicarFora(event: MouseEvent): void {
  const alvo = event.target as HTMLElement;

  if (!alvo.closest('.account-dropdown')) {
    this.menuContaAberto = false;
  }
}


  async carregarContadorChats(): Promise<void> {
    const user = this.authService.getUser();
    if (!user) return;

    try {
      const token = this.authService.getToken();
      const response = await fetch(`${environment.apiUrl}/chat/cliente/${user.id}/conversas`, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (response.ok) {
        const data = await response.json();
        const ativos = data.ativos || [];
        const encerrados = data.encerrados || [];
        const novoTotal = ativos.reduce((sum: number, chat: any) => sum + (chat.naoLidas || 0), 0);
        const todosChats = [...ativos, ...encerrados];

        for (const chat of todosChats) {
          const statusAnterior = this.ultimoStatusPorPedido.get(chat.pedidoId);
          const statusAtual = chat.ativo !== false;

          if (statusAnterior !== undefined && statusAnterior !== statusAtual) {
            let titulo, mensagem;

            if (!statusAtual) {
              titulo = 'Atendimento encerrado';
              mensagem = `O vendedor encerrou o atendimento do pedido #${chat.pedidoId}`;
            } else {
              titulo = 'Atendimento reativado';
              mensagem = `Reativado a conversa do pedido #${chat.pedidoId}`;
            }

            this.messageService.add({
              severity: 'info',
              summary: titulo,
              detail: mensagem
            });

            this.authService.adicionarNotificacao(titulo, mensagem, 'info');
          }

          this.ultimoStatusPorPedido.set(chat.pedidoId, statusAtual);
        }

        let temNovaMensagem = false;

        for (const chat of ativos) {
          const chatAnterior = this.ultimosChats.find((c: any) => c.id === chat.pedidoId);

          if (chatAnterior && chatAnterior.ultima !== chat.ultimaMensagem) {
            temNovaMensagem = true;
            break;
          }

          if (!chatAnterior) {
            temNovaMensagem = true;
            break;
          }
        }

        if (temNovaMensagem && this.ultimosChats.length > 0) {
          const totalAnterior = this.ultimosChats.reduce((sum: number, chat: any) => sum + (chat.lidas || 0), 0);

          if (novoTotal > totalAnterior) {
            this.messageService.add({
              severity: 'info',
              summary: 'Nova mensagem',
              detail: 'Você recebeu uma nova mensagem no chat'
            });

            this.authService.adicionarNotificacao('Nova mensagem', 'Você recebeu uma nova mensagem no chat', 'info');
          }
        }

        this.ultimosChats = ativos.map((c: any) => ({
          id: c.pedidoId,
          ultima: c.ultimaMensagem,
          lidas: c.naoLidas
        }));

        this.totalChatsNaoLidas = novoTotal;
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Erro ao carregar contador de chats:', error);
    }
  }

  abrirChatDrawer(event: { pedidoId: number, pedido: any }): void {
    this.chatService.limparUltimoPedido();

    setTimeout(() => {
      this.chatService.abrirChat(event.pedidoId, event.pedido);
    }, 100);
  }

  atualizarUI(usuario: any): void {
    if (usuario && usuario.id) {
      this.isLoggedIn = true;
      this.usuario = usuario;
      this.carrinhoService.atualizarContador();
      this.carregarNotificacoes(usuario.id);
      this.carregarContadorFavoritos();
      this.carregarContadorCupons();
      this.authService.atualizarLoginStatus(true);
    } else {
      this.isLoggedIn = false;
      this.usuario = null;
      this.carrinhoItens = 0;
      this.notificacoes = [];
      this.notificacoesNaoLidas = 0;
      this.favoritosCount = 0;
      this.cuponsDisponiveisCount = 0;
      this.authService.atualizarFavoritosCount(0);
      this.authService.atualizarCuponsCount(0);
      this.authService.atualizarLoginStatus(false);
    }

    this.cdr.detectChanges();
  }

  public atualizarNomeDoUsuario(usuario: any): void {
    if (usuario && this.usuario && usuario.id === this.usuario.id) {
      this.usuario.nome = usuario.nome;
      this.cdr.detectChanges();
    }
  }

  carregarNotificacoes(usuarioId: number): void {
    const notificacoesPorUsuario = JSON.parse(localStorage.getItem('notificacoesPorUsuario') || '{}');
    this.notificacoes = notificacoesPorUsuario[usuarioId] || [];
    this.notificacoesNaoLidas = this.notificacoes.filter((n: any) => !n.lida).length;
    this.authService.notificacoesSubject.next(this.notificacoes);
    this.cdr.detectChanges();
  }

  abrirCupons(): void {
    this.displayCupons = true;
    this.carregarContadorCupons();
  }

  async carregarContadorCupons(): Promise<void> {
    const user = this.authService.getUser();

    if (!user) {
      this.cuponsDisponiveisCount = 0;
      this.authService.atualizarCuponsCount(0);
      return;
    }

    try {
      const token = this.authService.getToken();
      const response = await fetch(`${environment.apiUrl}/cupons/cliente/${user.id}/disponiveis`, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (response.ok) {
        const cupons = await response.json();
        this.cuponsDisponiveisCount = cupons.length;
        this.authService.atualizarCuponsCount(cupons.length);
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Erro ao carregar contador de cupons:', error);
    }
  }

  async carregarContadorFavoritos(): Promise<void> {
    if (!this.usuario) {
      this.authService.atualizarFavoritosCount(0);
      return;
    }

    try {
      const token = this.authService.getToken();
      const headers: any = { 'Content-Type': 'application/json' };

      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }

      const response = await fetch(`${environment.apiUrl}/clientes/${this.usuario.id}/favoritos`, {
        headers: headers
      });

      if (response.ok) {
        const favoritos = await response.json();
        this.favoritosCount = favoritos.length;
        this.authService.atualizarFavoritosCount(favoritos.length);
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Erro ao carregar contador de favoritos:', error);
    }
  }

  abrirLogin(): void {
    this.displayLogin = true;
  }

  abrirCadastro(): void {
    this.displayCadastro = true;
  }

  abrirFavoritos(): void {
    this.displayFavoritos = true;

    setTimeout(() => {
      if (this.favoritosModal) {
        this.favoritosModal.usuario = this.usuario;
        this.favoritosModal.carregarFavoritos();
      }
    }, 300);
  }

  abrirPerfil(): void {
    this.displayPerfil = true;

    setTimeout(() => {
      const perfilModal = document.querySelector('app-perfil-modal') as any;

      if (perfilModal && perfilModal.carregarDadosPerfil) {
        perfilModal.carregarDadosPerfil();
      }
    }, 200);
  }

  abrirNotificacoes(): void {
    this.displayNotificacoes = true;
    this.carregarNotificacoes(this.usuario.id);
  }

  abrirLogout(): void {
    this.displayLogout = true;
  }

  fazerLogout(): void {
    this.appComponent.loading = true;
    this.authService.logout();
    this.messageService.add({
      severity: 'info',
      summary: 'Logout',
      detail: 'Você saiu da sua conta!'
    });

    this.atualizarUI(null);

    setTimeout(() => {
      this.appComponent.loading = false;
      this.router.navigate(['/principal']);
    }, 1000);
  }

  marcarNotificacaoLida(id: number): void {
    if (!this.usuario) return;

    const notificacoesPorUsuario = JSON.parse(localStorage.getItem('notificacoesPorUsuario') || '{}');
    let notificacoes = notificacoesPorUsuario[this.usuario.id] || [];

    notificacoes = notificacoes.map((n: any) => n.id === id ? { ...n, lida: true } : n);
    notificacoesPorUsuario[this.usuario.id] = notificacoes;
    localStorage.setItem('notificacoesPorUsuario', JSON.stringify(notificacoesPorUsuario));

    this.carregarNotificacoes(this.usuario.id);
  }

  limparNotificacoes(): void {
    if (!this.usuario) return;

    const notificacoesPorUsuario = JSON.parse(localStorage.getItem('notificacoesPorUsuario') || '{}');
    notificacoesPorUsuario[this.usuario.id] = [];
    localStorage.setItem('notificacoesPorUsuario', JSON.stringify(notificacoesPorUsuario));

    this.carregarNotificacoes(this.usuario.id);
    this.messageService.add({
      severity: 'success',
      summary: 'Notificações',
      detail: 'Todas as notificações foram removidas!'
    });
  }

  async abrirCarrinho(): Promise<void> {
    const user = this.authService.getUser();

    if (!user) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Faça login para acessar o carrinho'
      });
      return;
    }

    try {
      const token = this.authService.getToken();
      const response = await fetch(`${environment.apiUrl}/clientes/${user.id}`, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar dados do usuário');
      }

      const usuarioCompleto = await response.json();
      this.authService.atualizarUsuario(usuarioCompleto);

      const temEndereco = usuarioCompleto.enderecos && usuarioCompleto.enderecos.length > 0;
      const temCartao = usuarioCompleto.cartoes && usuarioCompleto.cartoes.length > 0;

      if (!temEndereco || !temCartao) {
        let mensagem = '';

        if (!temEndereco && !temCartao) {
          mensagem = 'Cadastre um endereço e um cartão antes de acessar o carrinho';
        } else if (!temEndereco) {
          mensagem = 'Cadastre um endereço antes de acessar o carrinho';
        } else {
          mensagem = 'Cadastre um cartão antes de acessar o carrinho';
        }

        this.messageService.add({
          severity: 'warn',
          summary: 'Dados incompletos',
          detail: mensagem,
          life: 4000
        });

        this.authService.adicionarNotificacao('Dados incompletos', mensagem, 'warning');
        this.abrirPerfil();
        return;
      }

      this.router.navigate(['/carrinho']);
    } catch (error) {
      console.error('Erro ao verificar dados do usuário:', error);
      this.router.navigate(['/carrinho']);
    }
  }
}
