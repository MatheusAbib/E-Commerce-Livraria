
import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { AdminService } from '../../services/admin.service';
import { DropdownModule } from 'primeng/dropdown';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-modals',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule, DropdownModule],
  providers: [MessageService],
  templateUrl: './admin-modals.html',
  styleUrls: ['./admin-modals.css']
})
export class AdminModalsComponent {
  @Output() perfilAtualizado = new EventEmitter<void>();
  @Input() categorias: string[] = [];

  usuario: any = {};
  novaSenha: string = '';
  confirmarSenha: string = '';
  displayPerfilModal: boolean = false;
  displayLogoutModal: boolean = false;

  displayFormModal: boolean = false;
  displayExcluirModal: boolean = false;
  displayStatusModal: boolean = false;
  displayDetalhesModal: boolean = false;

  displayPedidoDetalhesModal: boolean = false;
  displayPedidoStatusModal: boolean = false;
  displayPedidoExcluirModal: boolean = false;

  incluirRastreamento: boolean = false;
  codigoRastreamentoAdmin: string = '';

  motivoStatus: string = '';
  statusAtivo: boolean = false;
  detalhesItem: any = null;
  detalhesItens: any[] = [];
  gerarCupom: boolean = false;
  porcentagemCupom: number = 15;

  livroEditando: any = {
    id: null,
    titulo: '',
    autor: '',
    editora: '',
    categoria: null,
    edicao: null,
    isbn: '',
    paginas: null,
    sinopse: '',
    altura: null,
    largura: null,
    profundidade: null,
    peso: null,
    codigoBarras: '',
    precoCusto: null,
    estoque: null,
    dataEntrada: new Date(),
    imagem: null,
    imagemUrl: ''
  };

  imagemPreview: string | null = null;

  pedidoSelecionado: any = null;
  pedidoStatus: any = null;
  pedidoNovoStatus: string = '';
  pedidoExcluir: any = null;

  erroRastreamentoAdmin: string = '';
  rastreamentoAdminSalvo: boolean = false;

  carregandoSalvarPerfil: boolean = false;
  carregandoSalvarLivro: boolean = false;
  carregandoExcluir: boolean = false;
  carregandoStatus: boolean = false;
  carregandoPedidoStatus: boolean = false;
  carregandoPedidoExcluir: boolean = false;

  onConfirmarExcluir: (() => void) | null = null;
  onConfirmarStatus: (() => void) | null = null;
  onSalvarLivro: (() => void) | null = null;
  onConfirmarPedidoStatus: ((pedido: any, status: string, dadosCupom?: any, codigoRastreamento?: string) => void) | null = null;
  onConfirmarPedidoExcluir: ((pedido: any) => void) | null = null;

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private messageService: MessageService,
    private router: Router
  ) {}

  abrirPerfil(): void {
    const user = this.authService.getUser();

    if (user) {
      this.usuario = { ...user };
    }

    this.novaSenha = '';
    this.confirmarSenha = '';
    this.displayPerfilModal = true;
  }

  fecharPerfil(): void {
    this.displayPerfilModal = false;
    this.novaSenha = '';
    this.confirmarSenha = '';
  }

  togglePassword(inputId: string): void {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (!input) return;

    const icon = input.parentElement?.querySelector('.password-toggle') as HTMLElement;
    if (!icon) return;

    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'pi pi-eye-slash password-toggle';
    } else {
      input.type = 'password';
      icon.className = 'pi pi-eye password-toggle';
    }
  }

abrirFotoAmpliada(caminho: string): void {
  const url = caminho.startsWith('http')
    ? caminho
    : `http://localhost:8081/${caminho.replace(/^\/+/, '')}`;

  window.open(url, '_blank');
}

  async salvarPerfil(): Promise<void> {
    if (this.carregandoSalvarPerfil) return;

    this.carregandoSalvarPerfil = true;

    try {
      const user = this.authService.getUser();

      if (!user) {
        this.carregandoSalvarPerfil = false;
        return;
      }

      const dados: any = {
        nome: this.usuario.nome,
        email: this.usuario.email
      };

      let senhaAlterada = false;

      if (this.novaSenha) {
        if (this.novaSenha !== this.confirmarSenha) {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'As senhas não conferem'
          });

          this.carregandoSalvarPerfil = false;
          return;
        }

        dados.senha = this.novaSenha;
        dados.confirmacaoSenha = this.confirmarSenha;
        senhaAlterada = true;
      }

      await this.adminService.atualizarAdmin(user.id, dados).toPromise();

      const userAtualizado = {
        ...user,
        nome: this.usuario.nome,
        email: this.usuario.email
      };

      localStorage.setItem('user_data', JSON.stringify(userAtualizado));
      localStorage.setItem('clienteLogado', JSON.stringify(userAtualizado));

      this.authService.atualizarUsuario(userAtualizado);
      this.usuario = { ...userAtualizado };
      this.perfilAtualizado.emit();

      if (senhaAlterada) {
        this.atualizarSenhaSalva(this.novaSenha);
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Perfil atualizado com sucesso!'
      });

      this.fecharPerfil();
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);

      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Falha ao atualizar perfil'
      });
    } finally {
      this.carregandoSalvarPerfil = false;
    }
  }

  private atualizarSenhaSalva(novaSenha: string): void {
    const REMEMBER_KEY = 'login_remember';
    const dados = localStorage.getItem(REMEMBER_KEY);

    if (dados) {
      try {
        const parsed = JSON.parse(dados);
        parsed.senha = novaSenha;
        localStorage.setItem(REMEMBER_KEY, JSON.stringify(parsed));
      } catch (e) {
        console.error('Erro ao atualizar senha salva:', e);
      }
    }
  }

  validarRastreamentoAdmin(): void {
    this.erroRastreamentoAdmin = '';
    this.rastreamentoAdminSalvo = false;

    if (!this.codigoRastreamentoAdmin) {
      return;
    }

    const regex = /^[A-Z]{2}[0-9]{9}[A-Z]{2}$/;
    const codigo = this.codigoRastreamentoAdmin.toUpperCase();

    if (!regex.test(codigo)) {
      this.erroRastreamentoAdmin = 'Formato inválido. Use: 2 letras + 9 números + 2 letras';
      return;
    }

    this.codigoRastreamentoAdmin = codigo;
    this.rastreamentoAdminSalvo = true;
  }

  abrirLogout(): void {
    this.displayLogoutModal = true;
  }

  fecharLogout(): void {
    this.displayLogoutModal = false;
  }

  confirmarLogout(): void {
    this.fecharLogout();
    this.authService.logout();
    this.router.navigate(['/principal']);
  }

  abrirFormulario(livro?: any): void {
    if (livro) {
      this.livroEditando = {
        id: livro.id,
        titulo: livro.titulo || '',
        autor: livro.autor || '',
        editora: livro.editora || '',
        categoria: livro.categoria || null,
        edicao: livro.edicao || null,
        isbn: livro.isbn || '',
        paginas: livro.paginas || null,
        sinopse: livro.sinopse || '',
        altura: livro.altura || null,
        largura: livro.largura || null,
        profundidade: livro.profundidade || null,
        peso: livro.peso || null,
        codigoBarras: livro.codigoBarras || '',
        precoCusto: livro.precoCusto || null,
        estoque: livro.estoque || null,
        dataEntrada: livro.dataEntrada ? new Date(livro.dataEntrada) : new Date(),
        imagem: null,
        imagemUrl: livro.imagemUrl || ''
      };

      if (livro.imagemUrl) {
        this.imagemPreview = `${environment.apiUrl}/../uploads/${livro.imagemUrl}`;
      } else {
        this.imagemPreview = null;
      }
    } else {
      this.livroEditando = {
        id: null,
        titulo: '',
        autor: '',
        editora: '',
        categoria: null,
        edicao: null,
        isbn: '',
        paginas: null,
        sinopse: '',
        altura: null,
        largura: null,
        profundidade: null,
        peso: null,
        codigoBarras: '',
        precoCusto: null,
        estoque: null,
        dataEntrada: new Date(),
        imagem: null,
        imagemUrl: ''
      };

      this.imagemPreview = null;
    }

    this.displayFormModal = true;
  }

  fecharFormulario(): void {
    this.displayFormModal = false;

    this.livroEditando = {
      id: null,
      titulo: '',
      autor: '',
      editora: '',
      categoria: null,
      edicao: null,
      isbn: '',
      paginas: null,
      sinopse: '',
      altura: null,
      largura: null,
      profundidade: null,
      peso: null,
      codigoBarras: '',
      precoCusto: null,
      estoque: null,
      dataEntrada: new Date(),
      imagem: null,
      imagemUrl: ''
    };

    this.imagemPreview = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];

    if (file) {
      this.livroEditando.imagem = file;

      const reader = new FileReader();

      reader.onload = (e: any) => {
        this.imagemPreview = e.target.result;
      };

      reader.readAsDataURL(file);
    }
  }

  removerImagem(): void {
    this.imagemPreview = null;
    this.livroEditando.imagem = null;
    this.livroEditando.imagemUrl = '';
  }

  setSalvarLivroCallback(callback: () => void): void {
    this.onSalvarLivro = callback;
  }

  salvarLivro(): void {
    if (this.carregandoSalvarLivro) return;

    this.carregandoSalvarLivro = true;

    if (this.onSalvarLivro) {
      this.onSalvarLivro();
    }

    this.carregandoSalvarLivro = false;
  }

  abrirExcluir(onConfirm: () => void): void {
    this.onConfirmarExcluir = onConfirm;
    this.displayExcluirModal = true;
  }

  confirmarExcluir(): void {
    if (this.carregandoExcluir) return;

    this.carregandoExcluir = true;

    if (this.onConfirmarExcluir) {
      this.onConfirmarExcluir();
    }

    this.displayExcluirModal = false;
    this.carregandoExcluir = false;
  }

  formatarPreco(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');

    if (valor === '') {
      this.livroEditando.precoCusto = null;
      event.target.value = '';
      return;
    }

    const valorNumerico = parseFloat(valor) / 100;

    this.livroEditando.precoCusto = valorNumerico;
    event.target.value = valorNumerico.toFixed(2).replace('.', ',');
  }

  abrirStatus(ativo: boolean, onConfirm: () => void): void {
    this.statusAtivo = ativo;
    this.motivoStatus = '';
    this.onConfirmarStatus = onConfirm;
    this.displayStatusModal = true;
  }

  confirmarStatus(): void {
    if (this.carregandoStatus) return;

    this.carregandoStatus = true;

    if (!this.motivoStatus.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Informe o motivo'
      });

      this.carregandoStatus = false;
      return;
    }

    if (this.onConfirmarStatus) {
      this.onConfirmarStatus();
    }

    this.displayStatusModal = false;
    this.carregandoStatus = false;
  }

  abrirDetalhes(item: any, itens: any[]): void {
    this.detalhesItem = item;
    this.detalhesItens = itens;
    this.displayDetalhesModal = true;
  }

  abrirPedidoDetalhes(pedido: any): void {
    let cartoesAdicionais = pedido.cartoesAdicionais;

    if (typeof cartoesAdicionais === 'string') {
      try {
        cartoesAdicionais = JSON.parse(cartoesAdicionais);
      } catch {
        cartoesAdicionais = [];
      }
    }

    this.pedidoSelecionado = {
      ...pedido,
      pagamentos: Array.isArray(pedido.pagamentos) ? pedido.pagamentos : [],
      cartoesAdicionais: Array.isArray(cartoesAdicionais) ? cartoesAdicionais : []
    };

    this.displayPedidoDetalhesModal = true;
  }

  abrirPedidoStatus(pedido: any, status: string): void {
    this.pedidoStatus = pedido;
    this.pedidoNovoStatus = status;
    this.displayPedidoStatusModal = true;
  }

  confirmarPedidoStatus(): void {
    if (this.carregandoPedidoStatus) return;

    this.carregandoPedidoStatus = true;

    if (this.onConfirmarPedidoStatus) {
      const dadosCupom = this.gerarCupom && this.pedidoNovoStatus === 'DEVOLVIDO'
        ? { gerarCupom: true, porcentagem: this.porcentagemCupom }
        : { gerarCupom: false, porcentagem: 0 };

      const codigoRastreamentoEnvio = this.pedidoNovoStatus === 'EM_TRANSITO' && this.rastreamentoAdminSalvo
        ? this.codigoRastreamentoAdmin
        : null;

      this.onConfirmarPedidoStatus(
        this.pedidoStatus,
        this.pedidoNovoStatus,
        dadosCupom,
        codigoRastreamentoEnvio || undefined
      );
    }

    this.displayPedidoStatusModal = false;
    this.gerarCupom = false;
    this.porcentagemCupom = 15;
    this.codigoRastreamentoAdmin = '';
    this.rastreamentoAdminSalvo = false;
    this.erroRastreamentoAdmin = '';
    this.carregandoPedidoStatus = false;
  }

  abrirPedidoExcluir(pedido: any): void {
    this.pedidoExcluir = pedido;
    this.displayPedidoExcluirModal = true;
  }

  confirmarPedidoExcluir(): void {
    if (this.carregandoPedidoExcluir) return;

    this.carregandoPedidoExcluir = true;

    if (this.onConfirmarPedidoExcluir) {
      this.onConfirmarPedidoExcluir(this.pedidoExcluir);
    }

    this.displayPedidoExcluirModal = false;
    this.carregandoPedidoExcluir = false;
  }

  getStatusLabel(status: string): string {
    if (!status) return 'Status desconhecido';

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
