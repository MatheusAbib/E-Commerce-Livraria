import { ClienteService } from '../../../services/cliente.service';
import { inject } from '@angular/core';
import { ModalBaseComponent, ModalCabecalhoComponent, ModalCorpoComponent, ModalRodapeComponent, ModalConfirmacaoComponent } from '../../../components/shared/modals';
import { NotificacaoComponent } from '../../../components/shared/feedback';
import { EstadoVazioComponent } from '../../../components/shared/feedback';
import { CarregamentoComponent } from '../../../components/shared/feedback';
import { GrupoFormularioComponent } from '../../../components/shared/forms';
import { MascaraDirective } from '../../../components/shared/forms';
import { MensagemValidacaoComponent } from '../../../components/shared/forms';
import { CampoSelecaoComponent } from '../../../components/shared/forms';
import { CampoSenhaComponent } from '../../../components/shared/forms';
import { CampoDirective } from '../../../components/shared/forms';
import { BotaoComponent } from '../../../components/shared/buttons/botao/botao';
import { BotaoIconeComponent } from '../../../components/shared/buttons/botao-icone/botao-icone';
import { GrupoAcoesComponent } from '../../../components/shared/buttons/grupo-acoes/grupo-acoes';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';
import { MessageService } from 'primeng/api';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [ModalBaseComponent, ModalCabecalhoComponent, ModalCorpoComponent, ModalRodapeComponent, ModalConfirmacaoComponent, NotificacaoComponent, EstadoVazioComponent, CarregamentoComponent, GrupoFormularioComponent, MascaraDirective, MensagemValidacaoComponent, CampoSelecaoComponent, CampoSenhaComponent, CampoDirective, 
    CommonModule,
    FormsModule,
    PaginatorModule,
    AdminSidebarComponent,
    BotaoComponent,
    BotaoIconeComponent,
    GrupoAcoesComponent
  ],
  providers: [MessageService],
  templateUrl: './Usuarios.html',
  styleUrls: ['./Usuarios.css', '../admin-common.css']
})
export class UsuariosComponent implements OnInit, OnDestroy {
  private readonly clienteService = inject(ClienteService);


  get opcoesGenerosFiltro() {
    return this.generosOptions.map(op => ({
      rotulo: op.label,
      valor: String(op.value ?? '')
    }));
  }

  get opcoesStatusFiltro() {
    return this.statusOptions.map(op => ({
      rotulo: op.label,
      valor: String(op.value ?? '')
    }));
  }

  readonly opcoesGenerosCadastro = [
    { rotulo: 'Prefiro não informar', valor: 'PREFIRO_NAO_INFORMAR' },
    { rotulo: 'Masculino', valor: 'MASCULINO' },
    { rotulo: 'Feminino', valor: 'FEMININO' }
  ];

  clientes: any[] = [];
  clientesFiltrados: any[] = [];
  clientesPaginados: any[] = [];
  loading: boolean = true;
  totalRecords: number = 0;

  filtros = {
    nome: '',
    email: '',
    cpf: '',
    genero: '',
    ativo: ''
  };

  generosOptions = [
    { label: 'Todos', value: '' },
    { label: 'Masculino', value: 'MASCULINO' },
    { label: 'Feminino', value: 'FEMININO' },
    { label: 'Prefiro não informar', value: 'PREFIRO_NAO_INFORMAR' }
  ];

  statusOptions = [
    { label: 'Todos', value: '' },
    { label: 'Ativo', value: 'ativo' },
    { label: 'Inativo', value: 'inativo' }
  ];

  first: number = 0;
  rows: number = 10;
  timeoutFiltro: any = null;

  displayCadastroModal: boolean = false;
  displaySenhaModal: boolean = false;
  displayStatusModal: boolean = false;
  displayExcluirModal: boolean = false;

  novoCliente: any = {
    nome: '',
    email: '',
    senha: '',
    cpf: '',
    telefone: '',
    genero: 'PREFIRO_NAO_INFORMAR',
    dataNascimento: ''
  };

  clienteStatus: any = { id: null, nome: '', ativo: false };
  motivoStatus: string = '';
  clienteSenha: any = { id: null, email: '', novaSenha: '', confirmarSenha: '' };
  clienteExcluir: any = { id: null, nome: '' };

  constructor(
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.carregarClientes();
  }

  async carregarClientes(filtros: any = {}): Promise<void> {
    this.loading = true;
    try {
      const params = new URLSearchParams();
      if (filtros.nome) params.append('nome', filtros.nome);
      if (filtros.email) params.append('email', filtros.email);
      if (filtros.cpf) params.append('cpf', filtros.cpf);
      if (filtros.genero) params.append('genero', filtros.genero);
      if (filtros.ativo !== undefined && filtros.ativo !== null && filtros.ativo !== '') {
        params.append('ativo', filtros.ativo === 'ativo' ? 'true' : 'false');
      }
      const url = `${environment.apiUrl}/clientes/consulta?${params.toString()}`;
      const data = await this.clienteService.consultarAdministrativo(url).toPromise();
      this.clientes = data || [];
      this.clientesFiltrados = [...this.clientes];
      this.totalRecords = this.clientesFiltrados.length;
      this.atualizarPaginacao();
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      this.messageService.add({severity:'error', summary:'Erro', detail:'Falha ao carregar clientes'});
    } finally {
      this.loading = false;
    }
  }


  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly DEBOUNCE_MS = 350;

  onFiltroTextoChange(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    const vazio = !this.filtros.nome && !this.filtros.email && !this.filtros.cpf
      && !this.filtros.genero && !this.filtros.ativo;
    if (vazio) {
      this.aplicarFiltros();
      return;
    }
    this.debounceTimer = setTimeout(() => this.aplicarFiltros(), this.DEBOUNCE_MS);
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }
filtrando: boolean = false;

aplicarFiltros(): void {
  this.filtrando = true;
  clearTimeout(this.timeoutFiltro);
  this.loading = true;

  const inicio = Date.now();

  const filtros: any = {};
  if (this.filtros.nome) filtros.nome = this.filtros.nome;
  if (this.filtros.email) filtros.email = this.filtros.email;
  if (this.filtros.cpf) filtros.cpf = this.filtros.cpf;
  if (this.filtros.genero) filtros.genero = this.filtros.genero;
  if (this.filtros.ativo) filtros.ativo = this.filtros.ativo;

  this.carregarClientes(filtros);

  const decorrido = Date.now() - inicio;
  const restante = Math.max(0, 500 - decorrido);

  setTimeout(() => {
    this.loading = false;
    this.filtrando = false;
  }, restante);
}

limparFiltros(): void {
  this.filtrando = true;
  clearTimeout(this.timeoutFiltro);
  this.loading = true;

  const inicio = Date.now();

  this.filtros = { nome: '', email: '', cpf: '', genero: '', ativo: '' };
  this.carregarClientes();

  const decorrido = Date.now() - inicio;
  const restante = Math.max(0, 500 - decorrido);

  setTimeout(() => {
    this.loading = false;
    this.filtrando = false;
  }, restante);
}

  atualizarPaginacao(): void {
    this.clientesPaginados = this.clientesFiltrados.slice(this.first, this.first + this.rows);
  }

  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    this.atualizarPaginacao();
  }

  abrirCadastro(): void {
    this.novoCliente = {
      nome: '',
      email: '',
      senha: '',
      cpf: '',
      telefone: '',
      genero: 'PREFIRO_NAO_INFORMAR',
      dataNascimento: ''
    };
    this.displayCadastroModal = true;
  }

  async salvarCliente(): Promise<void> {
    if (!this.novoCliente.nome || !this.novoCliente.email || !this.novoCliente.senha) {
      this.messageService.add({severity:'error', summary:'Erro', detail:'Preencha os campos obrigatórios'});
      return;
    }
    try {
      await this.clienteService.cadastrarAdministrativo(this.novoCliente).toPromise();
      this.messageService.add({severity:'success', summary:'Sucesso', detail:'Cliente cadastrado com sucesso!'});
      this.displayCadastroModal = false;
      this.carregarClientes();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      this.messageService.add({severity:'error', summary:'Erro', detail:'Falha ao cadastrar cliente'});
    }
  }

  abrirSenha(cliente: any): void {
    this.clienteSenha = {
      id: cliente.id,
      email: cliente.email,
      novaSenha: '',
      confirmarSenha: ''
    };
    this.displaySenhaModal = true;
  }

  async confirmarAlterarSenha(): Promise<void> {
    if (!this.clienteSenha.novaSenha || !this.clienteSenha.confirmarSenha) {
      this.messageService.add({severity:'error', summary:'Erro', detail:'Preencha os dois campos'});
      return;
    }
    if (this.clienteSenha.novaSenha !== this.clienteSenha.confirmarSenha) {
      this.messageService.add({severity:'error', summary:'Erro', detail:'Senhas não conferem'});
      return;
    }
    try {
      await this.clienteService.alterarSenhaAdministrativo(this.clienteSenha.id, this.clienteSenha.novaSenha, this.clienteSenha.confirmarSenha).toPromise();

      // Atualizar a senha salva no "Lembrar-me" do cliente
      this.atualizarSenhaSalva(this.clienteSenha.email, this.clienteSenha.novaSenha);

      this.messageService.add({severity:'success', summary:'Sucesso', detail:'Senha alterada com sucesso!'});
      this.displaySenhaModal = false;
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      this.messageService.add({severity:'error', summary:'Erro', detail:'Falha ao alterar senha'});
    }
  }

  private atualizarSenhaSalva(email: string, novaSenha: string): void {
    const REMEMBER_KEY = 'login_remember';
    const dados = localStorage.getItem(REMEMBER_KEY);
    if (dados) {
      try {
        const parsed = JSON.parse(dados);
        // Verifica se o email salvo é o mesmo do cliente que está tendo a senha alterada
        if (parsed.email === email) {
          parsed.senha = novaSenha;
          localStorage.setItem(REMEMBER_KEY, JSON.stringify(parsed));
        }
      } catch (e) {
        console.error('Erro ao atualizar senha salva:', e);
      }
    }
  }

  abrirStatus(cliente: any, ativo: boolean): void {
    this.clienteStatus = { id: cliente.id, nome: cliente.nome, ativo: ativo };
    this.motivoStatus = '';
    this.displayStatusModal = true;
  }

  async confirmarAlterarStatus(): Promise<void> {
    if (!this.motivoStatus.trim()) {
      this.messageService.add({severity:'error', summary:'Erro', detail:'Informe o motivo da alteração'});
      return;
    }
    try {
      await this.clienteService.alterarStatusAdministrativo(this.clienteStatus.id, this.clienteStatus.ativo, this.motivoStatus).toPromise();
      this.messageService.add({severity:'success', summary:'Sucesso', detail:'Status alterado com sucesso!'});
      this.displayStatusModal = false;
      this.carregarClientes();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      this.messageService.add({severity:'error', summary:'Erro', detail:'Falha ao alterar status'});
    }
  }

  abrirExcluir(cliente: any): void {
    this.clienteExcluir = { id: cliente.id, nome: cliente.nome };
    this.displayExcluirModal = true;
  }

  async confirmarExcluir(): Promise<void> {
    try {
      await this.clienteService.excluirAdministrativo(this.clienteExcluir.id).toPromise();
      this.messageService.add({severity:'success', summary:'Sucesso', detail:'Cliente excluído com sucesso!'});
      this.displayExcluirModal = false;
      this.carregarClientes();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      this.messageService.add({severity:'error', summary:'Erro', detail:'Falha ao excluir cliente'});
    }
  }




  formatarCPFExibicao(cpf: string): string {
    if (!cpf) return '-';
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length === 11) {
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  }

  formatarTelefoneExibicao(telefone: string): string {
    if (!telefone) return '-';
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 11) {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numeros.length === 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  }

  getStatusClass(ativo: boolean): string {
    return ativo ? 'status-ativo' : 'status-inativo';
  }

  getStatusText(ativo: boolean): string {
    return ativo ? 'Ativo' : 'Inativo';
  }

  getStatusIcon(ativo: boolean): string {
    return ativo ? 'pi pi-check-circle' : 'pi pi-times-circle';
  }

  getGeneroLabel(genero: string): string {
    const labels: any = {
      'MASCULINO': 'Masculino',
      'FEMININO': 'Feminino',
      'PREFIRO_NAO_INFORMAR': 'Prefiro não informar'
    };
    return labels[genero] || genero || '-';
  }
}





