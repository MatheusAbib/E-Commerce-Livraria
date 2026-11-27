import { EnderecoService } from '../../../services/endereco.service';
import { CepService } from '../../../services/cep.service';
import { inject } from '@angular/core';
import { ClienteService } from '../../../services/cliente.service';
﻿import { ModalBaseComponent } from '../../../components/shared/modals/modal-base/modal-base';
import { ModalCabecalhoComponent } from '../../../components/shared/modals/modal-cabecalho/modal-cabecalho';
import { ModalCorpoComponent } from '../../../components/shared/modals/modal-corpo/modal-corpo';
import { ModalRodapeComponent } from '../../../components/shared/modals/modal-rodape/modal-rodape';
import { ModalConfirmacaoComponent } from '../../../components/shared/modals/modal-confirmacao/modal-confirmacao';
import { NotificacaoComponent } from '../../../components/shared/feedback';
import { EstadoVazioComponent } from '../../../components/shared/feedback';
import { CarregamentoComponent } from '../../../components/shared/feedback';
import { CampoSenhaComponent, MensagemValidacaoComponent } from '../../shared/forms';
import { CampoSelecaoComponent, MascaraDirective, GrupoFormularioComponent } from '../../shared/forms';
import { CampoDirective } from '../../shared/forms';
import { Component, Input, Output, EventEmitter, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BotaoComponent } from '../../shared/buttons/botao/botao';
import { BotaoIconeComponent } from '../../shared/buttons/botao-icone/botao-icone';
import { GrupoAcoesComponent } from '../../shared/buttons/grupo-acoes/grupo-acoes';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-perfil-modal',
  standalone: true,
  imports: [ModalBaseComponent, ModalCabecalhoComponent, ModalCorpoComponent, ModalRodapeComponent, ModalConfirmacaoComponent, NotificacaoComponent, EstadoVazioComponent, CarregamentoComponent, CampoSenhaComponent, MensagemValidacaoComponent, CampoSelecaoComponent, MascaraDirective, GrupoFormularioComponent, CampoDirective, CommonModule, FormsModule, BotaoComponent, BotaoIconeComponent, GrupoAcoesComponent, DialogModule, ToastModule],
  providers: [MessageService],
  templateUrl: './perfil-modal.html',
  styleUrls: ['./perfil-modal.css']
})
export class PerfilModalComponent implements OnInit {
  private readonly enderecoService = inject(EnderecoService);

  private readonly cepService = inject(CepService);

  private readonly clienteService = inject(ClienteService);

  readonly opcoesEstados = [
    { rotulo: 'Acre', valor: 'AC' },
    { rotulo: 'Alagoas', valor: 'AL' },
    { rotulo: 'AmapÃ¡', valor: 'AP' },
    { rotulo: 'Amazonas', valor: 'AM' },
    { rotulo: 'Bahia', valor: 'BA' },
    { rotulo: 'CearÃ¡', valor: 'CE' },
    { rotulo: 'Distrito Federal', valor: 'DF' },
    { rotulo: 'EspÃ­rito Santo', valor: 'ES' },
    { rotulo: 'GoiÃ¡s', valor: 'GO' },
    { rotulo: 'MaranhÃ£o', valor: 'MA' },
    { rotulo: 'Mato Grosso', valor: 'MT' },
    { rotulo: 'Mato Grosso do Sul', valor: 'MS' },
    { rotulo: 'Minas Gerais', valor: 'MG' },
    { rotulo: 'ParÃ¡', valor: 'PA' },
    { rotulo: 'ParaÃ­ba', valor: 'PB' },
    { rotulo: 'ParanÃ¡', valor: 'PR' },
    { rotulo: 'Pernambuco', valor: 'PE' },
    { rotulo: 'PiauÃ­', valor: 'PI' },
    { rotulo: 'Rio de Janeiro', valor: 'RJ' },
    { rotulo: 'Rio Grande do Norte', valor: 'RN' },
    { rotulo: 'Rio Grande do Sul', valor: 'RS' },
    { rotulo: 'RondÃ´nia', valor: 'RO' },
    { rotulo: 'Roraima', valor: 'RR' },
    { rotulo: 'Santa Catarina', valor: 'SC' },
    { rotulo: 'SÃ£o Paulo', valor: 'SP' },
    { rotulo: 'Sergipe', valor: 'SE' },
    { rotulo: 'Tocantins', valor: 'TO' },
  ];

  readonly opcoesBandeiras = [
    { rotulo: 'Visa', valor: 'Visa' },
    { rotulo: 'Mastercard', valor: 'Mastercard' },
    { rotulo: 'Elo', valor: 'Elo' },
    { rotulo: 'American Express', valor: 'American Express' },
  ];

  readonly opcoesGeneros = [
    { rotulo: 'Masculino', valor: 'MASCULINO' },
    { rotulo: 'Feminino', valor: 'FEMININO' },
    { rotulo: 'Prefiro nÃ£o informar', valor: 'PREFIRO_NAO_INFORMAR' },
  ];

  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() usuario: any = null;
  perfilEnderecos: any[] = [];
  perfilCartoes: any[] = [];
  loading: boolean = false;
  displayEditarEndereco: boolean = false;
  displayEditarCartao: boolean = false;
  displayEditarPerfil: boolean = false;
  displayAlterarSenha: boolean = false;
  displayConfirmarExclusao: boolean = false;
  cpfTocado: boolean = false;
  cpfErro: string = '';
  validandoCpf: boolean = false;
  cpfVerificado: string | null = null;
  private cpfValidacaoId = 0;
  buscandoCep = false;
  cepEncontrado = false;
  cepErro = '';
  private consultaCepId = 0;

  get cepCompleto(): boolean {
    return (this.enderecoEditando?.cep || '').replace(/\D/g, '').length === 8;
  }

  enderecoEditando: any = {};
  cartaoEditando: any = {};
  itemParaExcluir: { tipo: string, id: number } | null = null;
  novaSenha: string = '';
  confirmarSenha: string = '';
  carregandoEditarPerfil: boolean = false;
  carregandoSalvarPerfil: boolean = false;
  carregandoSalvarSenha: boolean = false;
  carregandoSalvarEndereco: boolean = false;
  carregandoSalvarCartao: boolean = false;
  carregandoExcluir: boolean = false;
  constructor(
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}
  ngOnInit(): void {
    this.authService.dadosClienteAtualizados$.subscribe(() => {
      if (this.visible) {
        this.carregarDadosPerfil();
      }
    });
  }
  ngOnChanges(): void {
    if (this.visible) {
      this.carregarDadosPerfil();
    }
  }
  fechar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
  async carregarDadosPerfil(): Promise<void> {
    if (!this.visible) return;
    const user = JSON.parse(localStorage.getItem('clienteLogado') || 'null');
    if (!user) {
      this.loading = false;
      return;
    }
    this.loading = true;
    this.cdr.detectChanges();
    try {
      const token = this.authService.getToken();
      const response = await this.clienteService.buscarPorId(user.id, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        }
      });
      if (response.ok) {
        const text = await response.text();
        const dados = JSON.parse(text);
        this.usuario = dados;
        this.perfilEnderecos = dados.enderecos || [];
        this.perfilCartoes = dados.cartoes || [];
        if (this.usuario) {
          localStorage.setItem('clienteLogado', JSON.stringify(this.usuario));
          this.authService.atualizarUsuario(this.usuario);
        }
        this.cdr.detectChanges();
      } else {
        this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao carregar perfil'});
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao conectar ao servidor'});
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
    editarDados(): void {
      this.cpfValidacaoId++;
      this.cpfTocado = false;
      this.cpfErro = '';
      this.validandoCpf = false;
      this.cpfVerificado = null;
      this.displayEditarPerfil = true;
    }
    async salvarDados(): Promise<void> {
      if (this.carregandoSalvarPerfil || this.validandoCpf) return;
      this.carregandoSalvarPerfil = true;
      try {
    if (!(await this.verificarCPF())) return;
      if (!this.usuario) {
        this.carregandoSalvarPerfil = false;
        return;
      }
      const token = this.authService.getToken();
      const usuarioAntigo = { ...this.usuario };
      const dadosParaEnviar = { ...this.usuario };
      delete dadosParaEnviar.senha;
      const response = await this.clienteService.atualizar(this.usuario.id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(dadosParaEnviar)
      });
      if (response.ok) {
        const camposAlterados = [];
        if (usuarioAntigo.nome !== this.usuario.nome) camposAlterados.push('Nome');
        if (usuarioAntigo.email !== this.usuario.email) camposAlterados.push('E-mail');
        if (usuarioAntigo.cpf !== this.usuario.cpf) camposAlterados.push('CPF');
        if (usuarioAntigo.nascimento !== this.usuario.nascimento) camposAlterados.push('Data de Nascimento');
        if (usuarioAntigo.genero !== this.usuario.genero) camposAlterados.push('GÃªnero');
        if (usuarioAntigo.telefone !== this.usuario.telefone) camposAlterados.push('Telefone');
        if (usuarioAntigo.tipotelefone !== this.usuario.tipotelefone) camposAlterados.push('Tipo de Telefone');
        this.messageService.add({severity:'success', summary:'Sucesso', detail:'Dados atualizados!'});
        if (camposAlterados.length > 0) {
          this.authService.adicionarNotificacao(
            'Perfil Atualizado',
            `Campos alterados: ${camposAlterados.join(', ')}`,
            'success'
          );
        } else {
          this.authService.adicionarNotificacao('Perfil Atualizado', 'Seus dados pessoais foram atualizados com sucesso!', 'success');
        }
        this.displayEditarPerfil = false;
        await this.carregarDadosPerfil();
        localStorage.setItem('clienteLogado', JSON.stringify(this.usuario));
        this.authService.atualizarUsuario(this.usuario);
        setTimeout(() => {
          const user = JSON.parse(localStorage.getItem('clienteLogado') || 'null');
          const header = document.querySelector('app-header') as any;
          if (header && header.atualizarNomeDoUsuario) {
            header.atualizarNomeDoUsuario(user);
          }
        }, 100);
      } else {
        const mensagem = await response.text();
        if (response.status === 400 && mensagem.toLowerCase().includes('cpf')) {
          this.cpfErro = mensagem;
          this.cpfTocado = true;
          this.cpfVerificado = null;
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao atualizar dados'
          });
        }
      }
    } catch (error) {
      this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao conectar ao servidor'});
    } finally {
      this.carregandoSalvarPerfil = false;
    }
  }

get pendenciasPerfil(): string[] {
  if (!this.usuario || this.loading) return [];

  return this.authService.obterPendenciasPerfil({
    ...this.usuario,
    enderecos: this.perfilEnderecos,
    cartoes: this.perfilCartoes
  });
}

get perfilIncompleto(): boolean {
  return this.pendenciasPerfil.length > 0;
}

get mensagemPendenciasPerfil(): string {
  const pendencias = this.pendenciasPerfil;

  if (pendencias.length === 0) return '';

  const campos = pendencias.length === 1
    ? pendencias[0]
    : pendencias.slice(0, -1).join(', ') +
      ' e ' + pendencias[pendencias.length - 1];

  return `Cadastre ${campos} para realizar suas compras.`;
}

  alterarSenha(): void {
    this.novaSenha = '';
    this.confirmarSenha = '';
    this.displayAlterarSenha = true;
  }
  async salvarSenha(): Promise<void> {
    if (this.carregandoSalvarSenha) return;
    this.carregandoSalvarSenha = true;
    try {
      if (!this.novaSenha || !this.confirmarSenha) {
        this.messageService.add({severity:'error', summary:'Erro', detail:'Preencha todos os campos'});
        this.carregandoSalvarSenha = false;
        return;
      }
      if (this.novaSenha !== this.confirmarSenha) {
        this.messageService.add({severity:'error', summary:'Erro', detail:'As senhas nÃ£o conferem'});
        this.carregandoSalvarSenha = false;
        return;
      }
      const token = this.authService.getToken();
      const response = await this.clienteService.alterarSenha(this.usuario.id, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ senha: this.novaSenha, confirmacaoSenha: this.confirmarSenha })
      });
      if (response.ok) {
        this.messageService.add({severity:'success', summary:'Sucesso', detail:'Senha alterada!'});
        this.authService.adicionarNotificacao('Senha Alterada', 'Sua senha foi alterada com sucesso!', 'success');
        this.displayAlterarSenha = false;
        this.novaSenha = '';
        this.confirmarSenha = '';
        this.atualizarSenhaSalva(this.novaSenha);
      } else {
        this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao alterar senha'});
      }
    } catch (error) {
      this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao conectar ao servidor'});
    } finally {
      this.carregandoSalvarSenha = false;
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
  getTelefonePlaceholder(): string {
    if (!this.usuario) {
      return '(00) 0000-0000';
    }
    const tipo = this.usuario?.tipotelefone;
    if (tipo === 'CELULAR') {
      return '(00) 00000-0000';
    }
    return '(00) 0000-0000';
  }
  getTelefoneIcon(tipo: string): string {
    const icons: any = {
      'CELULAR': 'pi pi-mobile',
      'RESIDENCIAL': 'pi pi-home',
      'COMERCIAL': 'pi pi-building'
    };
    return icons[tipo] || 'pi pi-phone';
  }
  onTipoTelefoneChange(): void {
    if (this.usuario?.telefone) {
      this.usuario.telefone = '';
    }
  }

  adicionarEndereco(): void {
    this.resetarConsultaCep();
    this.enderecoEditando = {
      nomeEndereco: '',
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
      tipoResidencia: '',
      complemento: '',
      tipo: 'ENTREGA',
      pais: 'Brasil'
    };
    this.displayEditarEndereco = true;
  }
  async editarEndereco(endereco: any): Promise<void> {
    this.resetarConsultaCep();
    this.enderecoEditando = { ...endereco };
    this.enderecoEditando.cep = (endereco.cep || '').replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2');
    this.displayEditarEndereco = true;
  }
  async salvarEndereco(): Promise<void> {
    if (this.carregandoSalvarEndereco || this.buscandoCep || this.cepErro || !this.cepCompleto) return;
    this.carregandoSalvarEndereco = true;
    try {
      if (!this.enderecoEditando.rua || !this.enderecoEditando.numero || !this.enderecoEditando.bairro ||
          !this.enderecoEditando.cidade || !this.enderecoEditando.estado || !this.enderecoEditando.cep) {
        this.messageService.add({severity:'error', summary:'Erro', detail:'Preencha todos os campos obrigatÃ³rios'});
        this.carregandoSalvarEndereco = false;
        return;
      }
      const token = this.authService.getToken();
      const enderecoAntigo = this.enderecoEditando.id ? { ...this.enderecoEditando } : null;
      const endereco = {
        ...this.enderecoEditando,
        cliente: { id: this.usuario.id },
        cep: this.enderecoEditando.cep.replace(/\D/g, ''),
        pais: 'Brasil'
      };
      const response = await this.enderecoService.salvar(this.enderecoEditando.id, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(endereco)
      });
      if (response.ok) {
        const mensagem = this.enderecoEditando.id ? 'EndereÃ§o atualizado!' : 'EndereÃ§o adicionado!';
        this.messageService.add({severity:'success', summary:'Sucesso', detail: mensagem});
        if (this.enderecoEditando.id) {
          const camposEndereco = [];
          if (enderecoAntigo.rua !== this.enderecoEditando.rua) camposEndereco.push('Rua');
          if (enderecoAntigo.numero !== this.enderecoEditando.numero) camposEndereco.push('NÃºmero');
          if (enderecoAntigo.bairro !== this.enderecoEditando.bairro) camposEndereco.push('Bairro');
          if (enderecoAntigo.cidade !== this.enderecoEditando.cidade) camposEndereco.push('Cidade');
          if (enderecoAntigo.estado !== this.enderecoEditando.estado) camposEndereco.push('Estado');
          if (enderecoAntigo.cep !== this.enderecoEditando.cep) camposEndereco.push('CEP');
          if (camposEndereco.length > 0) {
            this.authService.adicionarNotificacao(
              'EndereÃ§o Atualizado',
              `EndereÃ§o "${this.enderecoEditando.nomeEndereco || 'sem nome'}" - Campos alterados: ${camposEndereco.join(', ')}`,
              'success'
            );
          } else {
            this.authService.adicionarNotificacao(
              'EndereÃ§o Atualizado',
              `EndereÃ§o "${this.enderecoEditando.nomeEndereco || 'sem nome'}" foi atualizado!`,
              'success'
            );
          }
        } else {
          this.authService.adicionarNotificacao(
            'EndereÃ§o Adicionado',
            `Novo endereÃ§o "${this.enderecoEditando.nomeEndereco || 'sem nome'}" foi adicionado!`,
            'success'
          );
        }
        this.displayEditarEndereco = false;
        await this.carregarDadosPerfil();
      } else {
        this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao salvar endereÃ§o'});
      }
    } catch (error) {
      this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao conectar ao servidor'});
    } finally {
      this.carregandoSalvarEndereco = false;
    }
  }
  adicionarCartao(): void {
    this.cartaoEditando = {
      nomeCartao: '',
      numero: '',
      nomeTitular: '',
      bandeira: '',
      cvv: '',
      dataValidade: '',
      preferencial: false
    };
    this.displayEditarCartao = true;
  }
  async editarCartao(cartao: any): Promise<void> {
    this.cartaoEditando = { ...cartao };
    this.displayEditarCartao = true;
  }
  async salvarCartao(): Promise<void> {
    if (this.carregandoSalvarCartao) return;
    this.carregandoSalvarCartao = true;
    try {
      if (!this.cartaoEditando.numero || !this.cartaoEditando.nomeTitular || !this.cartaoEditando.bandeira ||
          !this.cartaoEditando.cvv || !this.cartaoEditando.dataValidade) {
        this.messageService.add({severity:'error', summary:'Erro', detail:'Preencha todos os campos obrigatÃ³rios'});
        this.carregandoSalvarCartao = false;
        return;
      }
      const token = this.authService.getToken();
      const cartaoAntigo = this.cartaoEditando.id ? { ...this.cartaoEditando } : null;
      const cartao = {
        numero: this.cartaoEditando.numero.replace(/\s/g, ''),
        nomeTitular: this.cartaoEditando.nomeTitular,
        bandeira: this.cartaoEditando.bandeira,
        cvv: this.cartaoEditando.cvv,
        dataValidade: this.cartaoEditando.dataValidade,
        preferencial: this.cartaoEditando.preferencial || false
      };
      const response = await this.clienteService.salvarCartao(this.usuario.id, this.cartaoEditando.id, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(cartao)
      });
      if (response.ok) {
        const mensagem = this.cartaoEditando.id ? 'CartÃ£o atualizado!' : 'CartÃ£o adicionado!';
        this.messageService.add({severity:'success', summary:'Sucesso', detail: mensagem});
        if (this.cartaoEditando.id) {
          const camposCartao = [];
          if (cartaoAntigo.bandeira !== this.cartaoEditando.bandeira) camposCartao.push('Bandeira');
          if (cartaoAntigo.nomeTitular !== this.cartaoEditando.nomeTitular) camposCartao.push('Nome do Titular');
          if (cartaoAntigo.dataValidade !== this.cartaoEditando.dataValidade) camposCartao.push('Data de Validade');
          if (cartaoAntigo.preferencial !== this.cartaoEditando.preferencial) camposCartao.push('Preferencial');
          if (camposCartao.length > 0) {
            this.authService.adicionarNotificacao(
              'CartÃ£o Atualizado',
              `CartÃ£o ${this.cartaoEditando.bandeira} - Campos alterados: ${camposCartao.join(', ')}`,
              'success'
            );
          } else {
            this.authService.adicionarNotificacao(
              'CartÃ£o Atualizado',
              `CartÃ£o ${this.cartaoEditando.bandeira} foi atualizado!`,
              'success'
            );
          }
        } else {
          this.authService.adicionarNotificacao(
            'CartÃ£o Adicionado',
            `Novo cartÃ£o ${this.cartaoEditando.bandeira} foi adicionado!`,
            'success'
          );
        }
        this.displayEditarCartao = false;
        await this.carregarDadosPerfil();
      } else {
        this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao salvar cartÃ£o'});
      }
    } catch (error) {
      this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao conectar ao servidor'});
    } finally {
      this.carregandoSalvarCartao = false;
    }
  }
  confirmarExclusao(tipo: string, id: number): void {
    this.itemParaExcluir = { tipo, id };
    this.displayConfirmarExclusao = true;
  }
  async executarExclusao(): Promise<void> {
    if (this.carregandoExcluir) return;
    this.carregandoExcluir = true;
    try {
      const item = this.itemParaExcluir;
      if (!item) {
        this.carregandoExcluir = false;
        return;
      }
      const token = this.authService.getToken();
      let nomeItem = '';
      if (item.tipo === 'endereco') {
        const endereco = this.perfilEnderecos.find(e => e.id === item.id);
        nomeItem = endereco?.nomeEndereco || 'EndereÃ§o';
      } else if (item.tipo === 'cartao') {
        const cartao = this.perfilCartoes.find(c => c.id === item.id);
        nomeItem = cartao?.bandeira || 'CartÃ£o';
      }
      const opcoes: RequestInit = {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token
        }
      };

      if (item.tipo !== 'endereco' && item.tipo !== 'cartao') {
        throw new Error('Tipo de item inválido');
      }

      const response = await (
        item.tipo === 'endereco'
          ? this.enderecoService.excluir(item.id, opcoes)
          : this.clienteService.excluirCartao(this.usuario.id, item.id, opcoes)
      );
      if (response.ok) {
        const tipoNome = item.tipo === 'endereco' ? 'EndereÃ§o' : 'CartÃ£o';
        this.messageService.add({severity:'success', summary:'Sucesso', detail: `${tipoNome} excluÃ­do!`});
        this.authService.adicionarNotificacao(
          `${tipoNome} ExcluÃ­do`,
          `${tipoNome} "${nomeItem}" foi removido do seu perfil.`,
          'warning'
        );
        this.displayConfirmarExclusao = false;
        this.itemParaExcluir = null;
        await this.carregarDadosPerfil();
      } else {
        this.messageService.add({severity:'error', summary:'Erro', detail: `Erro ao excluir ${item.tipo === 'endereco' ? 'endereÃ§o' : 'cartÃ£o'}`});
      }
    } catch (error) {
      this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao conectar ao servidor'});
    } finally {
      this.carregandoExcluir = false;
    }
  }
    atualizarCpfFormatado(valor: string): void {
      this.usuario.cpf = valor;
      this.cpfValidacaoId++;
      this.cpfVerificado = null;
      this.validandoCpf = false;
      this.cpfErro = '';
      if (this.cpfTocado && !this.validarCPF(valor)) {
        this.cpfErro = 'Informe um CPF vÃ¡lido.';
      }
    }
    validarCPF(cpf: string): boolean {
        if (!cpf || !cpf.trim()) return true;
        cpf = cpf.replace(/\D/g, '');
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
          return false;
        }
        for (let i = 9; i < 11; i++) {
          let soma = 0;
          for (let j = 0; j < i; j++) {
            soma += Number(cpf[j]) * (i + 1 - j);
          }
          let digito = (soma * 10) % 11;
          if (digito === 10) digito = 0;
          if (digito !== Number(cpf[i])) {
            return false;
          }
        }
        return true;
      }
      async verificarCPF(): Promise<boolean> {
  const validacaoId = ++this.cpfValidacaoId;
  this.cpfTocado = true;
  this.cpfErro = '';
  this.cpfVerificado = null;
  this.validandoCpf = false;
  const cpf = this.usuario?.cpf?.trim() || '';
  if (!cpf) {
    this.cpfVerificado = '';
    return true;
  }
  if (!this.validarCPF(cpf)) {
    this.cpfErro = 'Informe um CPF vÃ¡lido.';
    return false;
  }
  this.validandoCpf = true;
  try {
    const token = this.authService.getToken();
    const response = await this.clienteService.validarCpf(this.usuario.id, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ cpf })
      });
    const dados = await response.json().catch(() => ({}));
    if (validacaoId !== this.cpfValidacaoId) {
      return false;
    }
    if (!response.ok || !dados.valido) {
      this.cpfErro = dados.message || 'NÃ£o foi possÃ­vel verificar o CPF.';
      return false;
    }
    this.cpfVerificado = cpf.replace(/\D/g, '');
    return true;
  } catch {
    if (validacaoId === this.cpfValidacaoId) {
      this.cpfErro = 'NÃ£o foi possÃ­vel verificar o CPF.';
    }
    return false;
  } finally {
    if (validacaoId === this.cpfValidacaoId) {
      this.validandoCpf = false;
      this.cdr.detectChanges();
    }
  }
}
  atualizarCepFormatado(valor: string): void {
    const cep = valor.replace(/\D/g, '');
    const anterior = (this.enderecoEditando.cep || '').replace(/\D/g, '');
this.enderecoEditando.cep = valor;
    if (cep === anterior) return;
    this.resetarConsultaCep();
    this.enderecoEditando.rua = '';
    this.enderecoEditando.bairro = '';
    this.enderecoEditando.cidade = '';
    this.enderecoEditando.estado = '';
    if (cep.length === 8) void this.buscarCEP(cep);
  }

  async buscarCEP(cep: string): Promise<void> {
    const consultaId = ++this.consultaCepId;
    this.buscandoCep = true;
    this.cepErro = '';
    this.cepEncontrado = false;
    try {
      const response = await this.cepService.consultar(cep, {
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw new Error('Erro ao consultar CEP');
      const dados = await response.json();
      if (consultaId !== this.consultaCepId || !this.displayEditarEndereco) return;
      if (dados.erro) {
        this.cepErro = 'CEP nÃ£o encontrado.';
        return;
      }
      this.enderecoEditando.rua = dados.logradouro || '';
      this.enderecoEditando.bairro = dados.bairro || '';
      this.enderecoEditando.cidade = dados.localidade || '';
      this.enderecoEditando.estado = dados.uf || '';
      this.enderecoEditando.pais = 'Brasil';
      this.cepEncontrado = true;
    } catch {
      if (consultaId === this.consultaCepId && this.displayEditarEndereco) {
        this.cepErro = 'NÃ£o foi possÃ­vel consultar o CEP. Tente novamente.';
      }
    } finally {
      if (consultaId === this.consultaCepId) {
        this.buscandoCep = false;
        this.cdr.detectChanges();
      }
    }
  }

  verificarCepAoSair(): void {
    const cep = (this.enderecoEditando?.cep || '').replace(/\D/g, '');
    if (!cep) this.cepErro = 'Informe o CEP.';
    else if (cep.length !== 8) this.cepErro = 'Informe um CEP vÃ¡lido.';
  }

  private resetarConsultaCep(): void {
    this.consultaCepId++;
    this.buscandoCep = false;
    this.cepEncontrado = false;
    this.cepErro = '';
  }

  fecharEndereco(): void {
    if (this.carregandoSalvarEndereco) return;
    this.resetarConsultaCep();
    this.displayEditarEndereco = false;
  }




  getGeneroLabel(genero: string): string {
    const labels: any = {
      'MASCULINO': 'Masculino',
      'FEMININO': 'Feminino',
      'PREFIRO_NAO_INFORMAR': 'Prefiro nÃ£o informar'
    };
    return labels[genero] || genero;
  }
  getTipoTelefoneLabel(tipo: string): string {
    const labels: any = {
      'RESIDENCIAL': 'Residencial',
      'COMERCIAL': 'Comercial',
      'CELULAR': 'Celular'
    };
    return labels[tipo] || tipo;
  }
  cancelarExclusao(): void {
    this.displayConfirmarExclusao = false;
    this.itemParaExcluir = null;
  }
  getEnderecoIcon(tipo: string): string {
    return tipo === 'COBRANCA' ? 'pi pi-credit-card' : 'pi pi-truck';
  }
  getEnderecoLabel(tipo: string): string {
    return tipo === 'COBRANCA' ? 'CobranÃ§a' : 'Entrega';
  }
}

