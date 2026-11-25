import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService } from '../../../services/auth';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-cadastro-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './cadastro-modal.html',
  styleUrls: ['./cadastro-modal.css']
})
export class CadastroModalComponent {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() loginClick = new EventEmitter<void>();

  nome: string = '';
  email: string = '';
  senha: string = '';
  confirmarSenha: string = '';
  loading: boolean = false;
  showSenha: boolean = false;
  showConfirmarSenha: boolean = false;
  emailTocado: boolean = false;

  constructor(
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  verificarEmail(): void {
  this.emailTocado = true;
  }

  fechar(): void {
    if (this.loading) return;
    this.visible = false;
    this.visibleChange.emit(false);
    this.nome = '';
    this.email = '';
    this.senha = '';
    this.confirmarSenha = '';
    this.showSenha = false;
    this.showConfirmarSenha = false;
    this.emailTocado = false;
  }

  toggleSenha(): void {
    this.showSenha = !this.showSenha;
  }

  toggleConfirmarSenha(): void {
    this.showConfirmarSenha = !this.showConfirmarSenha;
  }

validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}


  get temMaiuscula(): boolean {
    return /[A-Z]/.test(this.senha);
  }

  get temMinuscula(): boolean {
    return /[a-z]/.test(this.senha);
  }

  get temNumero(): boolean {
    return /[0-9]/.test(this.senha);
  }

  get temEspecial(): boolean {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(this.senha);
  }

  validarSenha(): void {
    // Apenas para atualizar a UI
  }

  senhaValida(): boolean {
    return this.senha.length >= 6 &&
           this.temMaiuscula &&
           this.temMinuscula &&
           this.temNumero &&
           this.temEspecial;
  }


formValido(): boolean {
  return this.nome.trim() !== '' &&
         this.validarEmail(this.email) &&
         this.senhaValida() &&
         this.confirmarSenha !== '' &&
         this.senha === this.confirmarSenha;
}


  async fazerCadastro(): Promise<void> {
if (!this.nome.trim() || !this.email.trim() || !this.senha || !this.confirmarSenha) {
  this.messageService.add({
    severity: 'error',
    summary: 'Erro',
    detail: 'Preencha todos os campos obrigatórios'
  });
  return;
}

    if (this.senha !== this.confirmarSenha) {
      this.messageService.add({severity:'error', summary:'Erro', detail:'As senhas não conferem'});
      return;
    }

    if (!this.senhaValida()) {
      this.messageService.add({severity:'error', summary:'Erro', detail:'A senha não atende aos requisitos mínimos de segurança'});
      return;
    }

    if (!this.validarEmail(this.email)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'E-mail inválido',
        detail: 'Informe um endereço de e-mail válido.'
      });
      return;
    }

    this.loading = true;

    try {
      const response = await fetch(`${environment.apiUrl}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: this.nome,
          email: this.email,
          senha: this.senha,
          ativo: true
        })
      });

        if (response.ok) {
          try {
            await firstValueFrom(
              this.authService.login(this.email.trim(), this.senha)
            );

            this.authService.adicionarNotificacao(
              'Cadastro',
              'Conta criada com sucesso!',
              'success'
            );

            this.messageService.add({
              severity: 'success',
              summary: 'Bem-vindo!',
              detail: 'Sua conta foi criada e você já está conectado.'
            });

            this.loading = false;
            this.fechar();

          } catch (error) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Conta criada',
              detail: 'Cadastro realizado com sucesso. Faça login para continuar.'
            });

            this.loading = false;
            this.fechar();
            this.loginClick.emit();
          }
        }else {
        let errorMsg = 'Erro ao cadastrar';
        try {
          const error = await response.json();
          if (error.message) {
            errorMsg = error.message;
          } else if (typeof error === 'string') {
            errorMsg = error;
          }
        } catch (e) {
          errorMsg = 'Erro ao processar a resposta do servidor';
        }

        if (errorMsg.toLowerCase().includes('email') || errorMsg.toLowerCase().includes('e-mail')) {
          this.messageService.add({severity:'error', summary:'E-mail já cadastrado', detail:'Este e-mail já está sendo usado por outra conta. Tente fazer login ou use outro e-mail.'});
        } else if (errorMsg.toLowerCase().includes('cpf')) {
          this.messageService.add({severity:'error', summary:'CPF já cadastrado', detail:'Este CPF já está cadastrado em outra conta. Verifique os dados e tente novamente.'});
        } else {
          this.messageService.add({severity:'error', summary:'Erro', detail: errorMsg});
        }
        this.loading = false;
      }
    } catch (error) {
      this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao conectar ao servidor'});
      this.loading = false;
    }
  }

  abrirLogin(): void {
    this.fechar();
    this.loginClick.emit();
  }
}
