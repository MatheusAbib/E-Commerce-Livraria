import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { RouterModule, Router } from '@angular/router';

import { ToastModule } from 'primeng/toast';

import { MessageService } from 'primeng/api';

import { DialogModule } from 'primeng/dialog';

import { ButtonModule } from 'primeng/button';

import { InputTextModule } from 'primeng/inputtext';

import { DropdownModule } from 'primeng/dropdown';

import { CarrinhoService } from '../../services/carrinho';

import { AuthService } from '../../services/auth';

import { environment } from '../../../environments/environment';

@Component({

  selector: 'app-carrinho',

  standalone: true,

  imports: [

    CommonModule,

    FormsModule,

    RouterModule,

    ToastModule,

    DialogModule,

    ButtonModule,

    InputTextModule,

    DropdownModule

  ],

  providers: [MessageService],

  templateUrl: './carrinho.html',

  styleUrls: ['./carrinho.css']

})

export class CarrinhoComponent implements OnInit, OnDestroy {


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

  timerInterval: any = null;

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

  TEMPO_LIMITE_CARRINHO: number = 600;

  private TIMER_KEY = 'carrinhoTimer';

  carregandoLimpar: boolean = false;

  carregandoFinalizar: boolean = false;

  carregandoAplicarCupom: boolean = false;

  carregandoSalvarEndereco: boolean = false;

  carregandoSalvarCartao: boolean = false;

  carregandoRemoverItem: { [key: number]: boolean } = {};

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

      this.router.navigate(['/principal']);

      return;

    }

    this.carregarTimerLocalStorage();

    this.carregarCarrinho();

    this.carregarEnderecos();

    this.carregarCartoes();

    this.carregarNotificacoes();

    this.carrinhoService.carrinhoAtualizado$.subscribe(() => {

      this.carregarCarrinho();

    });

  }

  ngOnDestroy(): void {

    if (this.timerInterval) clearInterval(this.timerInterval);

  }

  obterCarrinhoUsuario(): any[] {

    const carrinhosPorUsuario = JSON.parse(localStorage.getItem('carrinhosPorUsuario') || '{}');

    return carrinhosPorUsuario[this.usuario.id] || [];

  }

  salvarCarrinhoUsuario(carrinho: any[]): void {

    const carrinhosPorUsuario = JSON.parse(localStorage.getItem('carrinhosPorUsuario') || '{}');

    carrinhosPorUsuario[this.usuario.id] = carrinho;

    localStorage.setItem('carrinhosPorUsuario', JSON.stringify(carrinhosPorUsuario));

    this.atualizarContadorGlobal();

  }

  atualizarContadorGlobal(): void {

    const total = this.carrinho.reduce((acc, item) => acc + (item.quantidade || 1), 0);

    const contadores = document.querySelectorAll('.cart-count');

    contadores.forEach(el => {

      el.textContent = total.toString();

      el.classList.toggle('hidden', total === 0);

    });

  }

  async carregarCarrinho(): Promise<void> {

    this.loading = true;

    const carrinhoBruto = this.obterCarrinhoUsuario();

    if (carrinhoBruto.length === 0) {

      this.carrinho = [];

      this.loading = false;

      this.cdr.detectChanges();

      this.iniciarTemporizador();

      return;

    }

    const agora = new Date();

    const carrinhoFiltrado = carrinhoBruto.filter((item: any) => {

      if (!item.dataAdicao) {

        item.dataAdicao = new Date().toISOString();

        return true;

      }

      const dataAdicao = new Date(item.dataAdicao);

      const diff = (agora.getTime() - dataAdicao.getTime()) / (1000 * 60);

      return diff < 30;

    });

    if (carrinhoFiltrado.length !== carrinhoBruto.length) {

      this.salvarCarrinhoUsuario(carrinhoFiltrado);

      this.messageService.add({

        severity: 'warn',

        summary: 'Carrinho atualizado',

        detail: 'Itens antigos foram removidos por expiração.'

      });

    }

    try {

      const itensDetalhados = await Promise.all(

        carrinhoFiltrado.map(async (item) => {

          try {

            const response = await fetch(`${environment.apiUrl}/livros/${item.id}`);

            if (!response.ok) throw new Error('Erro ao buscar produto ' + item.id);

            const produto = await response.json();

            return { ...item, produto };

          } catch {

            return null;

          }

        })

      );

      this.carrinho = itensDetalhados.filter(item => item !== null);

      if (this.carrinho.length !== carrinhoFiltrado.length) {

        this.salvarCarrinhoUsuario(this.carrinho.map(item => ({

          id: item.id,

          quantidade: item.quantidade,

          dataAdicao: item.dataAdicao || new Date().toISOString()

        })));

      }

      this.calcularTotais();

      this.iniciarTemporizador();

    } catch (error) {

      this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao carregar produtos'});

    } finally {

      this.loading = false;

      this.cdr.detectChanges();

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

    console.log('Endereço selecionado:', this.enderecoSelecionado);

    this.calcularTotais();

    this.validarValoresCartoes();

    this.cdr.detectChanges();

  }

  alterarQuantidade(id: number, delta: number): void {

    const item = this.carrinho.find(i => i.id === id);

    if (!item) return;

    const novaQtd = item.quantidade + delta;

    if (novaQtd < 1 || novaQtd > 3) return;

    item.quantidade = novaQtd;

    this.atualizarCarrinho();

  }

  atualizarQuantidade(id: number, valor: string): void {

    const qtd = parseInt(valor);

    if (isNaN(qtd) || qtd < 1 || qtd > 3) return;

    const item = this.carrinho.find(i => i.id === id);

    if (item) {

      item.quantidade = qtd;

      this.atualizarCarrinho();

    }

  }

  removerItem(id: number): void {

    if (this.carregandoRemoverItem[id]) return;

    this.carregandoRemoverItem[id] = true;

    this.carrinho = this.carrinho.filter(i => i.id !== id);

    this.atualizarCarrinho();

    this.messageService.add({severity:'info', summary:'Removido', detail:'Item removido do carrinho'});

    this.carregandoRemoverItem[id] = false;

  }

  atualizarCarrinho(): void {

    const carrinhoSalvar = this.carrinho.map(item => ({

      id: item.id,

      quantidade: item.quantidade

    }));

    this.salvarCarrinhoUsuario(carrinhoSalvar);

    this.calcularTotais();

    this.iniciarTemporizador();

    this.carrinhoService.atualizarContador();

    this.cdr.detectChanges();

  }

  limparCarrinho(): void {

    this.displayConfirmarLimpeza = true;

  }

  confirmarLimpeza(): void {

    if (this.carregandoLimpar) return;

    this.carregandoLimpar = true;

    this.carrinho = [];

    this.atualizarCarrinho();

    this.carrinhoService.limparCarrinho();

    this.limparTimerLocalStorage();

    this.displayConfirmarLimpeza = false;

    this.messageService.add({severity:'success', summary:'Carrinho limpo', detail:'Todos os itens foram removidos'});

    this.authService.adicionarNotificacao('Carrinho', 'Carrinho limpo com sucesso', 'success');

    this.carregandoLimpar = false;

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

      const response = await fetch(`${environment.apiUrl}/clientes/${this.usuario.id}/enderecos`, {

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

      const response = await fetch(`${environment.apiUrl}/clientes/${this.usuario.id}/cartoes`, {

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

  salvarTimerLocalStorage(): void {

    const timerData = {

      inicio: new Date().toISOString(),

      tempoRestante: this.tempoRestante,

      tempoLimite: this.TEMPO_LIMITE_CARRINHO

    };

    localStorage.setItem(this.TIMER_KEY, JSON.stringify(timerData));

  }

  carregarTimerLocalStorage(): void {

    const data = localStorage.getItem(this.TIMER_KEY);

    if (!data) return;

    try {

      const timerData = JSON.parse(data);

      const agora = new Date();

      const inicio = new Date(timerData.inicio);

      const segundosPassados = Math.floor((agora.getTime() - inicio.getTime()) / 1000);

      const tempoRestante = timerData.tempoRestante - segundosPassados;

      if (tempoRestante <= 0) {

        this.esvaziarCarrinhoPorTempo();

        localStorage.removeItem(this.TIMER_KEY);

        this.timerDisplay = 'Tempo esgotado!';

        this.messageService.add({

          severity: 'error',

          summary: 'Carrinho expirou',

          detail: 'O tempo para finalizar a compra expirou e o carrinho foi limpo'

        });

        this.authService.adicionarNotificacao('Carrinho', 'Carrinho expirou!', 'error');

        this.cdr.detectChanges();

        return;

      }

      this.tempoRestante = tempoRestante;

      this.timerDisplay = this.formatarTempo(tempoRestante);

      this.iniciarTemporizador();

    } catch (error) {

      console.error('Erro ao carregar timer:', error);

    }

  }

  limparTimerLocalStorage(): void {

    localStorage.removeItem(this.TIMER_KEY);

  }

  iniciarTemporizador(): void {

    if (this.timerInterval) clearInterval(this.timerInterval);

    const carrinho = this.carrinho.filter(item => item.id);

    if (carrinho.length === 0) {

      this.timerDisplay = '';

      this.limparTimerLocalStorage();

      return;

    }

    if (!this.tempoRestante || this.tempoRestante <= 0) {

      this.tempoRestante = this.TEMPO_LIMITE_CARRINHO;

    }

    this.timerDisplay = this.formatarTempo(this.tempoRestante);

    this.salvarTimerLocalStorage();

    this.timerInterval = setInterval(() => {

      this.tempoRestante--;

      this.timerDisplay = this.formatarTempo(this.tempoRestante);

      this.salvarTimerLocalStorage();

      this.cdr.detectChanges();

      if (this.tempoRestante <= 0) {

        clearInterval(this.timerInterval);

        this.timerDisplay = 'Tempo esgotado!';

        this.limparTimerLocalStorage();

        this.esvaziarCarrinhoPorTempo();

      }

    }, 1000);

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

  esvaziarCarrinhoPorTempo(): void {

    this.carrinho = [];

    this.atualizarCarrinho();

    this.carrinhoService.limparCarrinho();

    this.limparTimerLocalStorage();

    this.messageService.add({severity:'error', summary:'Carrinho expirou', detail:'O tempo para finalizar a compra expirou'});

    this.authService.adicionarNotificacao('Carrinho', 'Carrinho expirou!', 'error');

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

      const response = await fetch(`${environment.apiUrl}/cupons/cliente/${user.id}/disponiveis`, {

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

      await fetch(`${environment.apiUrl}/cupons/${codigo}/usar?clienteId=${user.id}`, {

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

      const response = await fetch(`${environment.apiUrl}/enderecos`, {

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

      const response = await fetch(`${environment.apiUrl}/clientes/${this.usuario.id}`, {

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

      const response = await fetch(`${environment.apiUrl}/clientes/${this.usuario.id}/cartoes`, {

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

  formatarValorCartao(event: Event, cartao: any): void {
    if (this.cartoesSelecionados.length <= 1) return;
    const input = event.target as HTMLInputElement;
    const digitos = input.value.replace(/\D/g, '').slice(0, 12);
    const centavos = digitos ? Number(digitos) : 0;
    cartao.valor = centavos / 100;
    input.value = (centavos / 100).toFixed(2).replace('.', ',');
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

    if (this.carregandoFinalizar) return;

    this.carregandoFinalizar = true;

    console.log('=== DEBUG FINALIZAR COMPRA ===');

    console.log('Subtotal:', this.subtotal);

    console.log('Frete:', this.frete);

    console.log('Desconto:', this.desconto);

    console.log('Total:', this.total);

    console.log('Cartões selecionados:', this.cartoesSelecionados);

    console.log('Soma dos cartões:', this.cartoesSelecionados.reduce((sum, c) => sum + (c.valor || 0), 0));

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

        clienteId: this.usuario.id,

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

        cupons: this.cuponsAplicados.map(c => ({

          codigo: c.codigo,

          porcentagem: c.porcentagem

        }))

      };

      console.log('BODY ENVIADO:', JSON.stringify(body));

      const response = await fetch(`${environment.apiUrl}/pedidos`, {

        method: 'POST',

        headers: headers,

        body: JSON.stringify(body)

      });

      if (!response.ok) {

        const errorData = await response.text();

        throw new Error(errorData || 'Erro ao finalizar pedido');

      }

      const pedidoCriado = await response.json();

      if (this.cuponsAplicados.length > 0) {

        const user = this.authService.getUser();

        if (user) {

          const token = this.authService.getToken();

          for (const cupomAplicado of this.cuponsAplicados) {

            try {

              await fetch(`${environment.apiUrl}/cupons/${cupomAplicado.codigo}/usar?clienteId=${user.id}`, {

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

      this.carrinho = [];

      this.salvarCarrinhoUsuario([]);

      this.carrinhoService.limparCarrinho();

      this.calcularTotais();

      this.displayConfirmacao = false;

      this.limparTimerLocalStorage();

      setTimeout(() => this.router.navigate(['/pedidos']), 1200);

    } catch (error: any) {

      console.error('Erro ao finalizar compra:', error);

      this.messageService.add({severity:'error', summary:'Erro', detail: error.message || 'Falha ao finalizar compra'});

      this.authService.adicionarNotificacao('Erro', 'Falha ao finalizar compra', 'error');

    } finally {

      this.loading = false;

      this.carregandoFinalizar = false;

      this.cdr.detectChanges();

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
