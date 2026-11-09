
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { AuthService, Notificacao } from '../../../services/auth';

@Component({
  selector: 'app-notificacoes-modal',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './notificacoes-modal.html',
  styleUrls: ['./notificacoes-modal.css']
})
export class NotificacoesModalComponent implements OnInit, OnChanges, OnDestroy {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  notificacoes: Notificacao[] = [];
  loading: boolean = false;
  usuario: any = null;

  private notificacoesSubscription?: Subscription;
  private usuarioSubscription?: Subscription;
  private requisicaoSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUser();

    this.notificacoesSubscription = this.authService.notificacoes$.subscribe(
      notificacoes => {
        this.notificacoes = notificacoes;
        this.cdr.detectChanges();
      }
    );

    this.usuarioSubscription = this.authService.usuario$.subscribe(usuario => {
      const usuarioAnteriorId = this.usuario?.id;
      this.usuario = usuario;

      if (!usuario) {
        this.requisicaoSubscription?.unsubscribe();
        this.notificacoes = [];
        this.loading = false;
        this.cdr.detectChanges();
        return;
      }

      if (usuarioAnteriorId !== usuario.id || this.visible) {
        this.carregarNotificacoes();
      }
    });

    if (this.usuario && this.authService.isAuthenticated()) {
      this.carregarNotificacoes();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.carregarNotificacoes();
    }
  }

  ngOnDestroy(): void {
    this.notificacoesSubscription?.unsubscribe();
    this.usuarioSubscription?.unsubscribe();
    this.requisicaoSubscription?.unsubscribe();
  }

  carregarNotificacoes(): void {
    this.usuario = this.authService.getUser();

    if (!this.usuario || !this.authService.isAuthenticated()) {
      this.notificacoes = [];
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.requisicaoSubscription?.unsubscribe();

    this.loading = true;
    this.cdr.detectChanges();

    this.requisicaoSubscription = this.authService.buscarNotificacoes().subscribe({
      next: notificacoes => {
        if (this.authService.getUser()?.id !== this.usuario?.id) {
          return;
        }

        this.notificacoes = notificacoes;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao carregar notificações',
          detail: 'Não foi possível consultar suas notificações.',
          life: 3000
        });

        this.cdr.detectChanges();
      }
    });
  }

  fechar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  marcarComoLida(id: number): void {
    if (!this.usuario || !this.authService.isAuthenticated()) {
      return;
    }

    this.authService.marcarNotificacaoComoLida(id).subscribe({
      next: () => {
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível marcar a notificação como lida.',
          life: 3000
        });
      }
    });
  }

  limparTodas(): void {
    if (!this.usuario || !this.authService.isAuthenticated()) {
      return;
    }

    this.loading = true;

    this.authService.excluirTodasNotificacoes().subscribe({
      next: () => {
        this.notificacoes = [];
        this.loading = false;

        this.messageService.add({
          severity: 'success',
          summary: 'Notificações limpas',
          detail: 'Todas as notificações foram removidas com sucesso!',
          life: 3000
        });

        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível excluir as notificações.',
          life: 3000
        });

        this.cdr.detectChanges();
      }
    });
  }
}
