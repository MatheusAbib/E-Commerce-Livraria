import { NotificacaoComponent } from '../../../components/shared/feedback';
import { CampoSenhaComponent } from '../../shared/forms';
import { CampoDirective, GrupoCampoComponent } from '../../shared/forms';
import { ModalBaseComponent, ModalCabecalhoComponent, ModalCorpoComponent, ModalRodapeComponent } from '../../shared/modals';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AppComponent } from '../../../app';
import { AuthService } from '../../../services/auth';
import { Router } from '@angular/router';
import { BotaoComponent } from '../../shared/buttons/botao/botao';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [
    NotificacaoComponent,
    CampoSenhaComponent,
    CampoDirective,
    GrupoCampoComponent,
    CommonModule,
    FormsModule,
    ToastModule,
    BotaoComponent,
    ModalBaseComponent,
    ModalCabecalhoComponent,
    ModalCorpoComponent,
    ModalRodapeComponent
  ],
  providers: [MessageService],
  templateUrl: './login-modal.html',
  styleUrls: ['./login-modal.css']
})
export class LoginModalComponent implements OnInit {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() loginSuccess = new EventEmitter<any>();
  @Output() cadastroClick = new EventEmitter<void>();

  email: string = '';
  senha: string = '';
  lembrarMe: boolean = false;
  loading: boolean = false;
  dadosCarregados: boolean = false;

  private readonly REMEMBER_KEY = 'login_remember';

  constructor(
    private messageService: MessageService,
    private appComponent: AppComponent,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarDadosLembrar();
  }

  carregarDadosLembrar(): void {
    const dados = localStorage.getItem(this.REMEMBER_KEY);
    if (dados) {
      try {
        const parsed = JSON.parse(dados);
        this.email = parsed.email || '';
        this.senha = parsed.senha || '';
        this.lembrarMe = true;
        setTimeout(() => {
          this.dadosCarregados = true;
        }, 100);
      } catch (e) {
        console.error('Erro ao carregar dados de lembrar:', e);
      }
    } else {
      this.lembrarMe = false;
    }
  }

  salvarDadosLembrar(): void {
    if (this.lembrarMe) {
      localStorage.setItem(this.REMEMBER_KEY, JSON.stringify({
        email: this.email,
        senha: this.senha
      }));
    } else {
      localStorage.removeItem(this.REMEMBER_KEY);
    }
  }

  atualizarSenhaSalva(novaSenha: string): void {
    const dados = localStorage.getItem(this.REMEMBER_KEY);
    if (dados) {
      try {
        const parsed = JSON.parse(dados);
        parsed.senha = novaSenha;
        localStorage.setItem(this.REMEMBER_KEY, JSON.stringify(parsed));
        this.senha = novaSenha;
      } catch (e) {
        console.error('Erro ao atualizar senha salva:', e);
      }
    }
  }

  formValido(): boolean {
    return this.email.trim() !== '' && this.senha.trim() !== '';
  }

  fechar(): void {
    this.visible = false;
    this.visibleChange.emit(false);

    if (!this.lembrarMe) {
      this.email = '';
      this.senha = '';
      this.dadosCarregados = false;
      localStorage.removeItem(this.REMEMBER_KEY);
    }

    this.loading = false;
  }

  async fazerLogin(): Promise<void> {
    if (!this.email || !this.senha) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Preencha todos os campos'
      });
      return;
    }

    this.loading = true;

    try {
      const response = await this.authService.login(this.email, this.senha).toPromise();

      if (response) {
        const user = response.user;

        if (this.lembrarMe) {
          localStorage.setItem(this.REMEMBER_KEY, JSON.stringify({
            email: this.email,
            senha: this.senha
          }));
        } else {
          localStorage.removeItem(this.REMEMBER_KEY);
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Bem-vindo, ' + user.nome + '!'
        });

        this.appComponent.loading = true;
        this.loginSuccess.emit(user);
        this.fechar();

        setTimeout(() => {
          this.appComponent.loading = false;

          if (user.perfil === 'ADMIN') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/principal']);
          }
        }, 1000);
      }
    } catch (error: any) {
      this.loading = false;

      let errorMsg = 'Email ou senha inválidos';

      if (error.error?.message) {
        errorMsg = error.error.message;
      } else if (error.message) {
        errorMsg = error.message;
      }

      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: errorMsg
      });
    }
  }

  abrirCadastro(): void {
    this.fechar();
    this.cadastroClick.emit();
  }
}
