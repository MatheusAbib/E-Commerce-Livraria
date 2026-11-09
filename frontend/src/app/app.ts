
import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterModule,
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
  Event as RouterEvent
} from '@angular/router';
import { HeaderComponent } from './components/header/header';
import { FooterComponent } from './components/footer/footer';
import { AdminModalsComponent } from './components/admin-modals/admin-modals';
import { AuthService, Notificacao } from './services/auth';
import { ChatService } from './services/chat.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { GlobalChatComponent } from './app/global-chat.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { environment } from '../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    AdminModalsComponent,
    ToastModule,
    GlobalChatComponent,
    ChatbotComponent
  ],
  providers: [MessageService],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit, OnDestroy {
  loading: boolean = false;
  isLoggedIn: boolean = false;
  isAdmin: boolean = false;

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private pedidosAnteriores: any[] = [];
  private notificacoesConhecidas = new Set<number>();
  private notificacoesInicializadas = false;
  private pollingEmAndamento = false;
  private usuarioMonitoradoId: number | null = null;
  private subscriptions = new Subscription();

  constructor(
    public router: Router,
    private authService: AuthService,
    private messageService: MessageService,
    private chatService: ChatService
  ) {
    this.subscriptions.add(
      this.router.events.subscribe((event: RouterEvent) => {
        if (event instanceof NavigationStart) {
          this.loading = true;
        }

        if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          const inicio = Date.now();

          setTimeout(() => {
            const decorrido = Date.now() - inicio;
            const restante = Math.max(0, 900 - decorrido);

            setTimeout(() => {
              this.loading = false;
            }, restante);
          }, 0);
        }
      })
    );
  }

  ngOnInit(): void {
    const user = this.authService.getUser();

    if (user) {
      this.isLoggedIn = true;
      this.isAdmin = user.perfil === 'ADMIN';

      const currentUrl = this.router.url;

      if (user.perfil === 'ADMIN' && !currentUrl.includes('/admin')) {
        this.router.navigate(['/admin/dashboard']);
      }
    }

    this.subscriptions.add(
      this.authService.loginStatus$.subscribe(logado => {
        this.isLoggedIn = logado;

        if (logado) {
          const usuario = this.authService.getUser();

          this.isAdmin = usuario?.perfil === 'ADMIN';

          if (usuario?.perfil === 'ADMIN') {
            this.loading = true;

            setTimeout(() => {
              this.router.navigate(['/admin/dashboard']);
              this.loading = false;
            }, 300);
          }

          if (usuario && this.usuarioMonitoradoId !== usuario.id) {
            this.reiniciarMonitoramento(usuario.id);
          }

          this.iniciarPolling();
        } else {
          this.isAdmin = false;
          this.pararPolling();
          this.limparMonitoramento();
        }
      })
    );

    this.subscriptions.add(
      this.authService.abrirChat$.subscribe((pedidoId: number) => {
        const pedido = this.pedidosAnteriores.find(
          p => p.id === pedidoId
        );

        this.chatService.limparUltimoPedido();

        setTimeout(() => {
          this.chatService.abrirChat(pedidoId, pedido || null);
        }, 50);
      })
    );
  }

  ngOnDestroy(): void {
    this.pararPolling();
    this.subscriptions.unsubscribe();
  }

  iniciarPolling(): void {
    if (this.intervalId) {
      return;
    }

    this.verificarPedidos();

    this.intervalId = setInterval(() => {
      this.verificarPedidos();
    }, 3000);
  }

  pararPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private reiniciarMonitoramento(usuarioId: number): void {
    this.usuarioMonitoradoId = usuarioId;
    this.pedidosAnteriores = [];
    this.notificacoesConhecidas.clear();
    this.notificacoesInicializadas = false;
  }

  private limparMonitoramento(): void {
    this.usuarioMonitoradoId = null;
    this.pedidosAnteriores = [];
    this.notificacoesConhecidas.clear();
    this.notificacoesInicializadas = false;
  }

  async verificarPedidos(): Promise<void> {
    if (this.pollingEmAndamento) {
      return;
    }

    const usuario = this.authService.getUser();

    if (!usuario || !this.authService.isAuthenticated()) {
      return;
    }

    this.pollingEmAndamento = true;

    try {
      const usuarioId = usuario.id;
      const token = this.authService.getToken();

      const response = await fetch(
        `${environment.apiUrl}/pedidos?clienteId=${usuarioId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          }
        }
      );

      if (response.ok) {
        const pedidos = await response.json();

        if (this.authService.getUser()?.id !== usuarioId) {
          return;
        }

        this.pedidosAnteriores = pedidos;
      }

      await this.sincronizarNotificacoes(usuarioId);
    } catch (error) {
      console.error('Erro ao verificar pedidos e notificações:', error);
    } finally {
      this.pollingEmAndamento = false;
    }
  }

  private async sincronizarNotificacoes(usuarioId: number): Promise<void> {
    return new Promise<void>(resolve => {
      this.authService.buscarNotificacoes().subscribe({
        next: notificacoes => {
          if (this.authService.getUser()?.id !== usuarioId) {
            resolve();
            return;
          }

          this.processarNotificacoes(notificacoes);
          resolve();
        },
        error: error => {
          console.error('Erro ao sincronizar notificações:', error);
          resolve();
        }
      });
    });
  }

  private processarNotificacoes(notificacoes: Notificacao[]): void {
    if (!this.notificacoesInicializadas) {
      notificacoes.forEach(notificacao => {
        this.notificacoesConhecidas.add(notificacao.id);
      });

      this.notificacoesInicializadas = true;
      return;
    }

    const novasNotificacoes = notificacoes.filter(
      notificacao => !this.notificacoesConhecidas.has(notificacao.id)
    );

    notificacoes.forEach(notificacao => {
      this.notificacoesConhecidas.add(notificacao.id);
    });

    novasNotificacoes
      .filter(notificacao => notificacao.id > 0 && !notificacao.lida)
      .reverse()
      .forEach(notificacao => {
        this.messageService.add({
          severity: this.getSeveridadeNotificacao(notificacao.tipo),
          summary: notificacao.titulo,
          detail: notificacao.mensagem,
          life: 5000
        });
      });
  }

  private getSeveridadeNotificacao(tipo: string): string {
    switch (tipo?.toLowerCase()) {
      case 'success':
      case 'sucesso':
        return 'success';

      case 'warning':
      case 'warn':
      case 'aviso':
        return 'warn';

      case 'error':
      case 'erro':
        return 'error';

      default:
        return 'info';
    }
  }

  showLoader(): void {
    this.loading = true;
  }

  hideLoader(): void {
    setTimeout(() => {
      this.loading = false;
    }, 3000);
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    try {
      const target = event.target as HTMLInputElement;

      if (target && target.value && target.value.length > 1000) {
        target.value = target.value.slice(0, 1000);
      }
    } catch (e) {
      console.warn('Input error suppressed');
    }
  }

  @HostListener('error', ['$event'])
  onError(event: ErrorEvent): void {
    event.preventDefault();
    console.warn('Error suppressed:', event.message);
  }

  @HostListener('window:error', ['$event'])
  onWindowError(event: ErrorEvent): void {
    event.preventDefault();
    console.warn('Window error suppressed:', event.message);
  }
}
