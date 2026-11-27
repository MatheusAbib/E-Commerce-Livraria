import { EnderecoService } from '../../services/endereco.service';
import { ClienteService } from '../../services/cliente.service';
import { PedidoService } from '../../services/pedido.service';
import { inject } from '@angular/core';
import { CupomService } from '../../services/cupom.service';
import { ModalBaseComponent, ModalCabecalhoComponent, ModalCorpoComponent, ModalRodapeComponent, ModalConfirmacaoComponent } from '../../components/shared/modals';
import { NotificacaoComponent, CarregamentoComponent } from '../../components/shared/feedback';
import { CampoMonetarioComponent } from '../../components/shared/forms';
import { CampoQuantidadeComponent } from '../../components/shared/forms';
import { CampoDirective } from '../../components/shared/forms';
import { GrupoFormularioComponent } from '../../components/shared/forms';
import { MascaraDirective } from '../../components/shared/forms';
import { CampoSelecaoComponent } from '../../components/shared/forms';
import { BotaoComponent } from '../../components/shared/buttons/botao/botao';
import { BotaoIconeComponent } from '../../components/shared/buttons/botao-icone/botao-icone';
import { GrupoAcoesComponent } from '../../components/shared/buttons/grupo-acoes/grupo-acoes';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { RouterModule, Router } from '@angular/router';

import { MessageService } from 'primeng/api';

import { Subscription } from 'rxjs';
import { CarrinhoService } from '../../services/carrinho';
import type { CarrinhoResponse } from '../../models/carrinho.model';

import { AuthService } from '../../services/auth';



@Component({

  selector: 'app-carrinho',

  standalone: true,

  imports: [ModalBaseComponent, ModalCabecalhoComponent, ModalCorpoComponent, ModalRodapeComponent, ModalConfirmacaoComponent, CarregamentoComponent, NotificacaoComponent, CampoMonetarioComponent, CampoQuantidadeComponent, CampoDirective, GrupoFormularioComponent, MascaraDirective, CampoSelecaoComponent, 

    CommonModule,

    FormsModule,

    RouterModule,

    BotaoComponent,
    BotaoIconeComponent,
    GrupoAcoesComponent

  ],

  providers: [MessageService],

  templateUrl: './carrinho.html',

  styleUrls: ['./carrinho.css']

})

export class CarrinhoComponent implements OnInit, OnDestroy {
  private readonly enderecoService = inject(EnderecoService);
  private readonly clienteService = inject(ClienteService);
  private readonly pedidoService = inject(PedidoService);

  private readonly cupomService = inject(CupomService);

  get opcoesEnderecosCheckout() {
    return this.enderecos.map(endereco => ({
      rotulo: `${endereco.nomeEndereco} - ${endereco.cidade}, ${endereco.estado}`,
      valor: endereco
    }));
  }

  get opcoesCartoesCheckout() {
    return this.cartoesNaoSelecionados.map(cartao => ({
      rotulo: `${cartao.bandeira} •••• ${cartao.numero.slice(-4)}`,
      valor: cartao
    }));
  }

  get opcoesEstadosCheckout() {
    return this.estadosBrasil.map(estado => ({
      rotulo: estado.nome,
      valor: estado.sigla
    }));
  }

  readonly opcoesBandeirasCheckout = [
    { rotulo: 'Visa', valor: 'Visa' },
    { rotulo: 'Mastercard', valor: 'Mastercard' },
    { rotulo: 'Elo', valor: 'Elo' },
    { rotulo: 'American Express', valor: 'American Express' }
  ];

  carrinho: any[] = [];

  enderecos: any[] = [];

  cartoes: any[] = [];

  cartoesSelecionados: any[] = [];

  cuponsAplicados: any[] = [];

  usuario: any = null;

  loading: boolean = false;

  subtotal: number = 0;

  frete: number = 0;

  desconto: number = 0;

  total: number = 0;

  totalCartoes: number = 0;

  enderecoSelecionado: any = null;

  timerDisplay: string = '';

  tempoRestante: number = 0;

  displayEnderecoModal: boolean = false;

  displayCartaoModal: boolean = false;

  displayCupomModal: boolean = false;

  displayNotificacoes: boolean = false;

  displayConfirmarLimpeza: boolean = false;

  displayConfirmacao: boolean = false;

  mostrarSelectCartao: boolean = false;

  valoresInvalidos: boolean = false;

  cartaoParaAdicionar: any = null;

  notificacoes: any[] = [];

  estadosBrasil = [

    { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },

    { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },

    { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' },

    { sigla: 'GO', nome: 'Goiás' }, { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' },

    { sigla: 'MS', nome: 'Mato Grosso do Sul' }, { sigla: 'MG', nome: 'Minas Gerais' },

    { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' }, { sigla: 'PR', nome: 'Paraná' },

    { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' }, { sigla: 'RJ', nome: 'Rio de Janeiro' },

    { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },

    { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },

    { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' }

  ];

  novoEndereco: any = {};

  novoCartao: any = {};

  codigoCupom: string = '';

  freteBase: number = 0;

  adicionalEstado: number = 0;

  carregandoLimpar: boolean = false;

  carregandoFinalizar: boolean = false;

  carregandoAplicarCupom: boolean = false;

  carregandoSalvarEndereco: boolean = false;

  carregandoSalvarCartao: boolean = false;

  carregandoRemoverItem: { [key: number]: boolean } = {};

  private subscriptions = new Subscription();
  private estado: CarrinhoResponse | null = null;
  private destruido = false;
  mutacaoPendente = false;
  erroCarrinho = '';

  constructor(

    private messageService: MessageService,

    private cdr: ChangeDetectorRef,

    private router: Router,

    private carrinhoService: CarrinhoService,

    private authService: AuthService

  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUser();
    if (!this.usuario) {
      void this.router.navigate(['/principal']);
      return;
    }
    this.subscriptions.add(this.carrinhoService.carrinho$.subscribe(estado => {
      const anterior = this.estado;
      this.estado = estado;
      if (anterior?.id !== estado?.id || anterior?.revisao !== estado?.revisao) {
        this.displayConfirmacao = false;
        this.displayConfirmarLimpeza = false;
      }
      if (anterior?.id != null && anterior.id !== estado?.id) {
        this.cuponsAplicados = [];
        this.codigoCupom = '';
      }
      this.carrinho = (estado?.itens || []).map(item => ({
        id: item.livroId,
        quantidade: item.quantidade,
        produto: { ...item, id: item.livroId, estoque: item.quantidadeMaximaPermitida }
      }));
      this.calcularTotais();
    }));
    this.subscriptions.add(this.carrinhoService.tempoRestante$.subscribe(segundos => {
      this.tempoRestante = segundos;
      this.timerDisplay = this.carrinho.length ? this.formatarTempo(segundos) : '';
      if (!segundos) this.displayConfirmacao = false;
      this.cdr.markForCheck();
    }));
    void this.carregarCarrinho();
    void this.carregarEnderecos();
    void this.carregarCartoes();
    this.carregarNotificacoes();
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.subscriptions.unsubscribe();
  }

  async carregarCarrinho(): Promise<void> {
    this.loading = true;
    this.erroCarrinho = '';
    try {
      await this.carrinhoService.carregarCarrinho();
    } catch (erro) {
      this.erroCarrinho = this.carrinhoService.obterMensagemErro(erro);
    } finally {
      this.loading = false;
      if (!this.destruido) this.cdr.markForCheck();
    }
  }

  get operacaoBloqueada(): boolean {
    return this.loading || this.mutacaoPendente || this.carregandoFinalizar || this.tempoRestante <= 0 || !!this.erroCarrinho;
  }

  private async modificarCarrinho(operacao: () => Promise<CarrinhoResponse>): Promise<boolean> {
    if (this.operacaoBloqueada) return false;
    this.mutacaoPendente = true;
    try {
      const resposta = await operacao();
      return !resposta.expirado;
    } catch (erro) {
      this.messageService.add({severity: 'error', summary: 'Carrinho', detail: this.carrinhoService.obterMensagemErro(erro)});
      return false;
    } finally {
      this.mutacaoPendente = false;
      if (!this.destruido) this.cdr.markForCheck();
    }
  }

  toggleSelectCartao(): void {

    this.mostrarSelectCartao = !this.mostrarSelectCartao;

    this.cartaoParaAdicionar = null;

  }

  get cartoesNaoSelecionados(): any[] {

    return this.cartoes.filter(c =>

      !this.cartoesSelecionados.some(sel => sel.id === c.id)

    );

  }

  adicionarCartaoSelecionado(): void {

    if (!this.cartaoParaAdicionar) return;

    const cartao = this.cartaoParaAdicionar;

    if (this.cartoesSelecionados.some(c => c.id === cartao.id)) return;

    this.cartoesSelecionados.push({

      id: cartao.id,

      bandeira: cartao.bandeira,

      ultimosDigitos: String(cartao.numero || '').replace(/\D/g, '').slice(-4),

      valor: 0,

      valorErro: false

    });

    this.cartaoParaAdicionar = null;

    this.mostrarSelectCartao = false;

    this.redistribuirValoresCartoes();

  }

  calcularTotais(): void {

    if (!this.carrinho.length) {
      this.subtotal = this.freteBase = this.adicionalEstado = this.frete = this.desconto = this.total = 0;
      this.redistribuirValoresCartoes();
      return;
    }
    this.subtotal = this.carrinho.reduce((sum, item) => sum + (item.produto.precoVenda * item.quantidade), 0);

    this.freteBase = this.subtotal >= 300 ? 0 : 15 + Math.floor(this.subtotal / 70) * 7;

    if (!this.enderecoSelecionado) {

      this.adicionalEstado = 0;

      this.frete = this.freteBase;

    } else {

      const estado = this.enderecoSelecionado.estado || 'SP';

      const acrescimosPorEstado: any = {

        'AC': 9.75, 'AL': 6.45, 'AP': 10.00, 'AM': 9.85,

        'BA': 5.30, 'CE': 6.10, 'DF': 4.25, 'ES': 3.15,

        'GO': 4.55, 'MA': 7.60, 'MT': 6.90, 'MS': 5.40,

        'MG': 4.75, 'PA': 9.05, 'PB': 6.85, 'PR': 2.50,

        'PE': 6.30, 'PI': 7.20, 'RJ': 5.00, 'RN': 6.55,

        'RS': 2.90, 'RO': 8.35, 'RR': 10.00, 'SC': 2.75,

        'SP': 3.95, 'SE': 5.25, 'TO': 7.10

      };

      this.adicionalEstado = acrescimosPorEstado[estado] || 0;

      this.frete = this.cuponsAplicados.some(c => c.zerarFrete) ? 0 : this.freteBase + this.adicionalEstado;

    }

    this.desconto = this.cuponsAplicados.reduce((sum, c) => {

      const valorDesconto = (this.subtotal * c.porcentagem) / 100;

      c.valorDesconto = valorDesconto;

      return sum + valorDesconto;

    }, 0);

    const totalAnterior = this.total;

    this.total = Math.round(Math.max(0, this.subtotal + this.frete - this.desconto) * 100) / 100;

    if (Math.round(totalAnterior * 100) !== Math.round(this.total * 100)) {

      this.redistribuirValoresCartoes();

    } else {

      this.validarValoresCartoes();

    }

    this.cdr.detectChanges();

  }

  onEnderecoChange(): void {

    this.calcularTotais();

    this.validarValoresCartoes();

    this.cdr.detectChanges();

  }

  async alterarQuantidade(id: number, delta: number): Promise<void> {
    const item = this.carrinho.find(i => i.id === id);
    if (!item) return;
    const quantidade = item.quantidade + delta;
    if (quantidade < 1 || quantidade > 3 || (delta > 0 && quantidade > item.produto.estoque)) return;
    await this.modificarCarrinho(() => this.carrinhoService.atualizarQuantidade(id, quantidade));
  }

  async atualizarQuantidade(id: number, valor: string): Promise<void> {
    const item = this.carrinho.find(i => i.id === id);
    const quantidade = Number(valor);
    if (!item || !Number.isInteger(quantidade) || quantidade < 1 || quantidade > 3 || (quantidade > item.quantidade && quantidade > item.produto.estoque)) return;
    await this.modificarCarrinho(() => this.carrinhoService.atualizarQuantidade(id, quantidade));
  }

  async removerItem(id: number): Promise<void> {
    if (this.operacaoBloqueada) return;
    this.carregandoRemoverItem[id] = true;
    try {
      if (await this.modificarCarrinho(() => this.carrinhoService.removerDoCarrinho(id))) {
        this.messageService.add({severity: 'info', summary: 'Removido', detail: 'Item removido do carrinho'});
      }
    } finally {
      this.carregandoRemoverItem[id] = false;
    }
  }

  limparCarrinho(): void {
    if (!this.operacaoBloqueada) this.displayConfirmarLimpeza = true;
  }

  async confirmarLimpeza(): Promise<void> {
    if (this.operacaoBloqueada || this.carregandoLimpar) return;
    this.carregandoLimpar = true;
    try {
      if (await this.modificarCarrinho(() => this.carrinhoService.limparCarrinho())) {
        this.displayConfirmarLimpeza = false;
        this.messageService.add({severity: 'success', summary: 'Carrinho limpo', detail: 'Todos os itens foram removidos'});
        this.authService.adicionarNotificacao('Carrinho', 'Carrinho limpo com sucesso', 'success');
      }
    } finally {
      this.carregandoLimpar = false;
    }
  }

  cancelarLimpeza(): void {

    this.displayConfirmarLimpeza = false;

  }

  async carregarEnderecos(): Promise<void> {

    try {

      const token = this.authService.getToken();

      const headers: any = { 'Content-Type': 'application/json' };

      if (token) {

        headers['Authorization'] = 'Bearer ' + token;

      }

      const response = await this.enderecoService.listarPorCliente(this.usuario.id, {

        headers: headers

      });

      if (response.ok) {

        this.enderecos = await response.json();

        this.cdr.detectChanges();

      }

    } catch (error) {

      console.error('Erro ao carregar endereços:', error);

    }

  }

  async carregarCartoes(): Promise<void> {

    try {

      const token = this.authService.getToken();

      const headers: any = { 'Content-Type': 'application/json' };

      if (token) {

        headers['Authorization'] = 'Bearer ' + token;

      }

      const response = await this.clienteService.listarCartoes(this.usuario.id, {

        headers: headers

      });

      if (response.ok) {

        this.cartoes = await response.json();

        this.cdr.detectChanges();

      }

    } catch (error) {

      console.error('Erro ao carregar cartões:', error);

    }

  }

  carregarNotificacoes(): void {

    const notificacoesPorUsuario = JSON.parse(localStorage.getItem('notificacoesPorUsuario') || '{}');

    this.notificacoes = notificacoesPorUsuario[this.usuario.id] || [];

    this.cdr.detectChanges();

  }

  formatarTempo(segundos: number): string {

    const dias = Math.floor(segundos / 86400);

    segundos %= 86400;

    const horas = Math.floor(segundos / 3600);

    segundos %= 3600;

    const minutos = Math.floor(segundos / 60);

    const seg = segundos % 60;

    let partes = [];

    if (dias > 0) partes.push(dias + 'd');

    if (horas > 0 || dias > 0) partes.push(horas + 'h');

    partes.push(minutos.toString().padStart(2, '0') + 'm');

    partes.push(seg.toString().padStart(2, '0') + 's');

    return partes.join(' ');

  }

  adicionarCartaoPagamento(cartaoNovo?: any): void {

    const cartao = cartaoNovo || this.cartoesNaoSelecionados[0];

    if (!cartao || this.cartoesSelecionados.some(c => c.id === cartao.id)) return;

    this.cartoesSelecionados.push({

      id: cartao.id,

      bandeira: cartao.bandeira,

      ultimosDigitos: String(cartao.numero || '').replace(/\D/g, '').slice(-4),

      valor: 0,

      valorErro: false

    });

    this.redistribuirValoresCartoes();

  }

  removerCartaoPagamento(index: number): void {

    this.cartoesSelecionados.splice(index, 1);

    this.redistribuirValoresCartoes();

  }

  abrirConfirmacao(): void {
    if (this.operacaoBloqueada) return;

    if (this.carrinho.length === 0) {

      this.messageService.add({severity:'error', summary:'Erro', detail:'Carrinho vazio'});

      return;

    }

    if (!this.enderecoSelecionado) {

      this.messageService.add({severity:'error', summary:'Erro', detail:'Selecione um endereço'});

      return;

    }

    if (this.cartoesSelecionados.length === 0) {

      this.messageService.add({severity:'error', summary:'Erro', detail:'Adicione um cartão'});

      return;

    }

    this.validarValoresCartoes();

    if (this.valoresInvalidos || this.cartoesSelecionados.some(c => c.valorErro)) {

      this.messageService.add({ severity: 'error', summary: 'Pagamento inválido', detail: 'A soma dos cartões deve ser igual ao total do pedido.' });

      return;

    }

    if (this.cartoesSelecionados.some(c => Number(c.valor) < 10)) {

      this.messageService.add({ severity: 'error', summary: 'Pagamento inválido', detail: 'Cada cartão deve ter pelo menos R$ 10,00.' });

      return;

    }

    this.displayConfirmacao = true;

  }

  fecharConfirmacao(): void {

    this.displayConfirmacao = false;

  }

  async aplicarCupom(): Promise<void> {

    if (this.carregandoAplicarCupom) return;

    this.carregandoAplicarCupom = true;

    if (!this.codigoCupom.trim()) {

      this.messageService.add({severity:'warn', summary:'Aviso', detail:'Digite um código de cupom'});

      this.carregandoAplicarCupom = false;

      return;

    }

    const user = this.authService.getUser();

    if (!user) {

      this.messageService.add({severity:'error', summary:'Erro', detail:'Faça login para usar cupons'});

      this.carregandoAplicarCupom = false;

      return;

    }

    const cupomJaAplicado = this.cuponsAplicados.some(c => c.codigo === this.codigoCupom);

    if (cupomJaAplicado) {

      this.messageService.add({severity:'warn', summary:'Aviso', detail:'Este cupom já foi aplicado'});

      this.codigoCupom = '';

      this.carregandoAplicarCupom = false;

      return;

    }

    try {

      const token = this.authService.getToken();

      const response = await this.cupomService.listarDisponiveis(user.id, {

        headers: {

          'Authorization': 'Bearer ' + token

        }

      });

      if (!response.ok) {

        this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao verificar cupom'});

        this.carregandoAplicarCupom = false;

        return;

      }

      const cuponsDisponiveis = await response.json();

      const cupom = cuponsDisponiveis.find((c: any) => c.codigo === this.codigoCupom);

      if (!cupom) {

        this.messageService.add({severity:'error', summary:'Erro', detail:'Cupom inválido ou já utilizado'});

        this.codigoCupom = '';

        this.carregandoAplicarCupom = false;

        return;

      }

      const dataExpiracao = new Date(cupom.dataExpiracao);

      if (dataExpiracao < new Date()) {

        this.messageService.add({severity:'error', summary:'Erro', detail:'Cupom expirado'});

        this.codigoCupom = '';

        this.carregandoAplicarCupom = false;

        return;

      }

      this.cuponsAplicados.push({

        codigo: cupom.codigo,

        porcentagem: cupom.porcentagem,

        valorDesconto: 0,

        zerarFrete: cupom.zerarFrete || false,

        id: cupom.pedidoId,

        dataExpiracao: cupom.dataExpiracao

      });

      this.codigoCupom = '';

      this.calcularTotais();

      this.messageService.add({

        severity:'success',

        summary:'Cupom aplicado!',

        detail:`Desconto de ${cupom.porcentagem}% aplicado!`

      });

    } catch (error) {

      console.error('Erro ao aplicar cupom:', error);

      this.messageService.add({

        severity: 'error',

        summary: 'Erro',

        detail: 'Erro ao aplicar cupom'

      });

    } finally {

      this.carregandoAplicarCupom = false;

    }

  }

  async marcarCupomComoUsado(codigo: string): Promise<void> {

    try {

      const user = this.authService.getUser();

      if (!user) {

        console.warn('Usuário não autenticado para marcar cupom como usado');

        return;

      }

      const token = this.authService.getToken();

      await this.cupomService.utilizar(codigo, user?.id, {

        method: 'PUT',

        headers: {

          'Authorization': 'Bearer ' + token

        }

      });

    } catch (error) {

      console.error('Erro ao marcar cupom como usado:', error);

    }

  }

  removerCupom(index: number): void {

    this.cuponsAplicados.splice(index, 1);

    this.calcularTotais();

    this.messageService.add({severity:'info', summary:'Cupom removido', detail:'Cupom removido com sucesso'});

  }

  abrirModalEndereco(): void {

    this.novoEndereco = {

      nomeEndereco: '',

      rua: '',

      numero: '',

      bairro: '',

      cidade: '',

      estado: '',

      cep: '',

      complemento: ''

    };

    this.displayEnderecoModal = true;

  }

  fecharModalEndereco(): void {

    this.displayEnderecoModal = false;

    this.novoEndereco = {};

  }

  async salvarNovoEndereco(): Promise<void> {

    if (this.carregandoSalvarEndereco) return;

    this.carregandoSalvarEndereco = true;

    const endereco = {

      ...this.novoEndereco,

      tipo: 'ENTREGA',

      pais: 'Brasil',

      cliente: { id: this.usuario.id }

    };

    try {

      const token = this.authService.getToken();

      const headers: any = { 'Content-Type': 'application/json' };

      if (token) {

        headers['Authorization'] = 'Bearer ' + token;

      }

      const response = await this.enderecoService.cadastrar({

        method: 'POST',

        headers: headers,

        body: JSON.stringify(endereco)

      });

      if (response.ok) {

        this.messageService.add({severity:'success', summary:'Sucesso', detail:'Endereço adicionado!'});

        this.authService.adicionarNotificacao('Endereço', 'Novo endereço adicionado com sucesso', 'success');

        this.fecharModalEndereco();

        await this.carregarEnderecos();

        await this.atualizarUsuario();

        this.authService.notificarDadosClienteAtualizados();

      } else {

        this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao salvar endereço'});

      }

    } catch (error) {

      this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao conectar ao servidor'});

    } finally {

      this.carregandoSalvarEndereco = false;

    }

  }

  async atualizarUsuario(): Promise<void> {

    try {

      const token = this.authService.getToken();

      const response = await this.clienteService.buscarPorId(this.usuario.id, {

        headers: {

          'Authorization': 'Bearer ' + token

        }

      });

      if (response.ok) {

        const usuarioAtualizado = await response.json();

        this.authService.atualizarUsuario(usuarioAtualizado);

        this.usuario = usuarioAtualizado;

      }

    } catch (error) {

      console.error('Erro ao atualizar usuário:', error);

    }

  }

  abrirModalCartao(): void {

    this.novoCartao = {

      numero: '',

      nomeTitular: '',

      bandeira: '',

      cvv: '',

      dataValidade: '',

      preferencial: false

    };

    this.displayCartaoModal = true;

  }

  fecharModalCartao(): void {

    this.displayCartaoModal = false;

    this.novoCartao = {};

  }

  async salvarNovoCartao(): Promise<void> {

    if (this.carregandoSalvarCartao) return;

    this.carregandoSalvarCartao = true;

    try {

      const token = this.authService.getToken();

      const headers: any = { 'Content-Type': 'application/json' };

      if (token) {

        headers['Authorization'] = 'Bearer ' + token;

      }

      const response = await this.clienteService.cadastrarCartao(this.usuario.id, {

        method: 'POST',

        headers: headers,

        body: JSON.stringify(this.novoCartao)

      });

      if (response.ok) {

        this.messageService.add({severity:'success', summary:'Sucesso', detail:'Cartão adicionado!'});

        this.authService.adicionarNotificacao('Cartão', 'Novo cartão adicionado com sucesso', 'success');

        const numeroNovo = String(this.novoCartao.numero || '').replace(/\D/g, '');

        this.fecharModalCartao();

        await this.carregarCartoes();

        const cartaoCriado = this.cartoes.find(c => String(c.numero || '').replace(/\D/g, '') === numeroNovo && !this.cartoesSelecionados.some(sel => sel.id === c.id));

        if (cartaoCriado) this.adicionarCartaoPagamento(cartaoCriado);

        await this.atualizarUsuario();

        this.authService.notificarDadosClienteAtualizados();

      } else {

        this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao salvar cartão'});

      }

    } catch (error) {

      this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao conectar ao servidor'});

    } finally {

      this.carregandoSalvarCartao = false;

    }

  }

  formatarNumeroCartao(event: any): void {

    let valor = event.target.value.replace(/\D/g, '');

    if (valor.length > 16) valor = valor.slice(0, 16);

    valor = valor.replace(/(\d{4})/g, '$1 ').trim();

    event.target.value = valor;

    this.novoCartao.numero = valor;

  }

  atualizarValorCartao(cartao: any, valor: number | null): void {
    if (this.cartoesSelecionados.length <= 1) return;

    cartao.valor = valor ?? 0;
    this.validarValoresCartoes();
  }

  validarValoresCartoes(): void {

    const totalCentavos = Math.round(this.total * 100);

    const somaCentavos = this.cartoesSelecionados.reduce((soma, cartao) => soma + Math.round(Number(cartao.valor || 0) * 100), 0);

    this.totalCartoes = somaCentavos / 100;

    this.valoresInvalidos = this.cartoesSelecionados.length > 0 && somaCentavos !== totalCentavos;

    this.cartoesSelecionados.forEach(cartao => {

      cartao.valorErro = !Number.isFinite(Number(cartao.valor)) || Number(cartao.valor) < 0;

    });

  }

  redistribuirValoresCartoes(): void {

    const quantidade = this.cartoesSelecionados.length;

    if (!quantidade) {

      this.totalCartoes = 0;

      this.valoresInvalidos = false;

      return;

    }

    const centavos = Math.round(this.total * 100);

    const base = Math.floor(centavos / quantidade);

    const resto = centavos % quantidade;

    this.cartoesSelecionados.forEach((cartao, indice) => {

      cartao.valor = (base + (indice < resto ? 1 : 0)) / 100;

      cartao.valorErro = false;

    });

    this.validarValoresCartoes();

  }

  async finalizarCompra(): Promise<void> {

    if (this.operacaoBloqueada || !this.displayConfirmacao) return;
    const reserva = this.estado;
    if (reserva?.id == null || reserva.revisao == null) return;
    const cuponsCompra = this.cuponsAplicados.map(c => ({ ...c }));
    const clienteCompra = this.usuario.id;

    this.carregandoFinalizar = true;

    if (this.carrinho.length === 0) {

      this.messageService.add({severity:'error', summary:'Erro', detail:'Carrinho vazio'});

      this.carregandoFinalizar = false;

      return;

    }

    if (!this.enderecoSelecionado) {

      this.messageService.add({severity:'error', summary:'Erro', detail:'Selecione um endereço de entrega'});

      this.carregandoFinalizar = false;

      return;

    }

    if (this.cartoesSelecionados.length === 0) {

      this.messageService.add({severity:'error', summary:'Erro', detail:'Adicione pelo menos um cartão'});

      this.carregandoFinalizar = false;

      return;

    }

    for (const item of this.carrinho) {

      if (!item.produto.ativo) {

        this.messageService.add({

          severity: 'error',

          summary: 'Produto Inativo',

          detail: `"${item.produto.titulo}" está inativo. Remova-o do carrinho para continuar.`

        });

        this.carregandoFinalizar = false;

        return;

      }

      if (item.produto.estoque <= 0) {

        this.messageService.add({

          severity: 'error',

          summary: 'Produto Esgotado',

          detail: `"${item.produto.titulo}" está esgotado. Remova-o do carrinho para continuar.`

        });

        this.carregandoFinalizar = false;

        return;

      }

      if (item.quantidade > item.produto.estoque) {

        this.messageService.add({

          severity: 'error',

          summary: 'Estoque Insuficiente',

          detail: `Quantidade solicitada de "${item.produto.titulo}" (${item.quantidade}) excede o estoque disponível (${item.produto.estoque}).`

        });

        this.carregandoFinalizar = false;

        return;

      }

    }

    const cartaoInvalido = this.cartoesSelecionados.some(c => (c.valor || 0) < 10);

    if (cartaoInvalido) {

      this.messageService.add({severity:'error', summary:'Erro', detail:'Cada cartão deve ter no mínimo R$ 10,00'});

      this.carregandoFinalizar = false;

      return;

    }

    const totalCartoes = this.cartoesSelecionados.reduce((sum, c) => sum + (c.valor || 0), 0);

    if (Math.round(totalCartoes * 100) !== Math.round(this.total * 100)) {

      const diferenca = Math.abs(totalCartoes - this.total);

      if (totalCartoes < this.total) {

        this.messageService.add({severity:'error', summary:'Erro', detail:'Valor dos cartões insuficiente. Faltam R$ ' + diferenca.toFixed(2) + ' para completar o pagamento'});

      } else {

        this.messageService.add({severity:'error', summary:'Erro', detail:'Valor dos cartões excede o total da compra. Excedente de R$ ' + diferenca.toFixed(2)});

      }

      this.carregandoFinalizar = false;

      return;

    }

    this.loading = true;

    try {

      const token = this.authService.getToken();

      const headers: any = { 'Content-Type': 'application/json' };

      if (token) {

        headers['Authorization'] = 'Bearer ' + token;

      }

      const body = {

        clienteId: clienteCompra,
        carrinhoId: reserva.id,
        carrinhoRevisao: reserva.revisao,
        enderecoId: this.enderecoSelecionado.id,

        pagamentos: this.cartoesSelecionados.map(c => ({

          cartaoId: c.id,

          valor: c.valor

        })),

        itens: this.carrinho.map(item => ({

          livroId: item.id,

          quantidade: item.quantidade,

          precoUnitario: item.produto.precoVenda

        })),

        valorSubtotal: this.subtotal,

        valorDesconto: this.desconto,

        cupons: cuponsCompra.map(c => ({

          codigo: c.codigo,

          porcentagem: c.porcentagem

        }))

      };

      const response = await this.pedidoService.criar({

        method: 'POST',

        headers: headers,

        body: JSON.stringify(body)

      });

      if (!response.ok) {

        const texto = await response.text();
        let mensagem = texto;
        try { const dados = JSON.parse(texto); mensagem = dados.mensagem || dados.message || texto; } catch {}
        throw new Error(mensagem || 'Erro ao finalizar pedido');

      }

      const pedidoCriado = await response.json();

      if (cuponsCompra.length > 0) {

        const user = this.authService.getUser();

        if (user?.id === clienteCompra) {

          const token = this.authService.getToken();

          for (const cupomAplicado of cuponsCompra) {

            try {

              await this.cupomService.utilizar(cupomAplicado.codigo, user?.id, {

                method: 'PUT',

                headers: {

                  'Content-Type': 'application/json',

                  'Authorization': 'Bearer ' + token

                }

              });

            } catch (error) {

              console.error('Erro ao marcar cupom como usado:', error);

            }

          }

        }

      }

      this.messageService.add({severity:'success', summary:'Sucesso', detail:'Pedido realizado!'});

      this.authService.adicionarNotificacao('Pedido', 'Pedido realizado com sucesso!', 'success');

      this.authService.adicionarNotificacao('Pedido', 'Seu pedido de numero ' + pedidoCriado.id + ' está em processamento!', 'success');

      this.displayConfirmacao = false;
      try {
        await this.carrinhoService.sincronizarAposCompra();
      } catch {
        this.carrinhoService.atualizarContador();
      }
      if (!this.destruido && this.authService.getUser()?.id === clienteCompra) {
        void this.router.navigate(['/pedidos']);
      }

    } catch (error: any) {

      console.error('Erro ao finalizar compra:', error);

      this.messageService.add({severity:'error', summary:'Erro', detail: error.message || 'Falha ao finalizar compra'});

      this.authService.adicionarNotificacao('Erro', 'Falha ao finalizar compra', 'error');
      this.displayConfirmacao = false;
      await this.carregarCarrinho();

    } finally {

      this.loading = false;

      this.carregandoFinalizar = false;

      if (!this.destruido) this.cdr.markForCheck();

    }

  }

verDetalhes(livro: any): void {

  if (!livro?.id) return;

  this.router.navigate(['/principal'], {

    queryParams: { livroId: livro.id }

  });

}

  voltar(): void {

    this.router.navigate(['/principal']);

  }

}
