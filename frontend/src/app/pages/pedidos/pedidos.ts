import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService } from '../../services/auth';
import { RatingModule } from 'primeng/rating';
import { Router, ActivatedRoute } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    RatingModule,
    DialogModule,
    InputTextareaModule,
    CheckboxModule,
    InputNumberModule,
    ToastModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './pedidos.html',
  styleUrls: ['./pedidos.css']
})
export class PedidosComponent implements OnInit, OnDestroy {
  pedidos: any[] = [];
  filteredPedidos: any[] = [];
  loading: boolean = true;
  statusAtivo: string = 'EM_PROCESSAMENTO';

  statusOptions = [
    { label: 'Em Processamento', value: 'EM_PROCESSAMENTO' },
    { label: 'Em Trânsito', value: 'EM_TRANSITO' },
    { label: 'Entregues', value: 'ENTREGUE' },
    { label: 'Devolução Solicitada', value: 'DEVOLUCAO' },
    { label: 'Devolução Autorizada', value: 'AUTORIZADO_DEVOLUCAO' },
    { label: 'Devolução Enviada', value: 'ENVIADO_DEVOLUCAO' },
    { label: 'Devolvidos', value: 'DEVOLVIDO' }
  ];

  displayDevolucaoModal: boolean = false;
  pedidoDevolucaoId: number = 0;
  motivoDevolucao: string = '';
  itensDevolucao: any[] = [];
  itensSelecionados: any[] = [];

  displayInstrucoesEnvio: boolean = false;
  pedidoEnvioId: number = 0;
  codigoRastreamento: string = '';

  displayCancelamentoModal: boolean = false;
  pedidoCancelamentoId: number = 0;
  rastreamentoSalvo: boolean = false;

  displayConfirmarReembolso: boolean = false;
  pedidoReembolso: any = null;
  reembolsoConfirmado: boolean = false;

  displayConfirmarEntrega: boolean = false;
  pedidoEntrega: any = null;

  fotosDevolucao: File[] = [];
  fotosDevolucaoPreview: string[] = [];

  displayAvaliacaoModal: boolean = false;
  pedidoAvaliacao: any = null;
  avaliacoes: any[] = [];

  avaliacaoAtual: any = {
    nota: 0,
    comentario: ''
  };

  notaSelecionada: number = 0;
  codigoRastreamentoValido: boolean = false;

  displayFotosModal: boolean = false;
  fotosDevolucaoList: string[] = [];
  fotoIndexAtual: number = 0;
  fotoAtual: string = '';

  carregandoCancelar: boolean = false;
  carregandoDevolucao: boolean = false;
  carregandoReembolso: boolean = false;
  carregandoEntrega: boolean = false;
  carregandoRastreamento: boolean = false;
  carregandoAvaliacao: { [key: number]: boolean } = {};

  displayAlterarEnderecoModal: boolean = false;
  pedidoAlterarEndereco: any = null;
  enderecosDisponiveis: any[] = [];
  enderecoSelecionadoId: number | null = null;
  carregandoEnderecos: boolean = false;
  salvandoEndereco: boolean = false;

  private intervalId: any = null;

  normalizarPedido(pedido: any): any {
    const pagamentos = Array.isArray(pedido.pagamentos)
      ? pedido.pagamentos
      : [];

    const pagamentosValidos = pagamentos.filter(
      (pagamento: any) => pagamento && pagamento.valor != null
    );

    const cartaoLegado = pedido.cartao;

    const pagamentosNormalizados = pagamentosValidos.length > 0
      ? pagamentosValidos.map((pagamento: any) => ({
          id: pagamento.id ?? null,
          cartaoId: pagamento.cartaoId ?? null,
          bandeira: pagamento.bandeira || 'Cartão',
          ultimosDigitos: String(pagamento.ultimosDigitos || '').slice(-4),
          valor: Number(pagamento.valor) || 0
        }))
      : cartaoLegado
        ? [{
            id: null,
            cartaoId: cartaoLegado.id ?? null,
            bandeira: cartaoLegado.bandeira || 'Cartão',
            ultimosDigitos: String(cartaoLegado.ultimosDigitos || '').slice(-4),
            valor: Number(pedido.valorTotal) || 0
          }]
        : [];

    return {
      ...pedido,
      itens: Array.isArray(pedido.itens) ? pedido.itens : [],
      pagamentos: pagamentosNormalizados,
      enderecoEntrega: pedido.enderecoEntrega || null,
      reembolsoConfirmado: pedido.reembolsoConfirmado ?? false
    };
  }

  obterPagamentos(pedido: any): any[] {
    return Array.isArray(pedido?.pagamentos) ? pedido.pagamentos : [];
  }

  obterEnderecoEntrega(pedido: any): any | null {
    return pedido?.enderecoEntrega || null;
  }

  podeAlterarEndereco(pedido: any): boolean {
    return pedido?.status === 'EM_PROCESSAMENTO' &&
      !pedido?.pedidoOriginalId;
  }

  formatarEnderecoEntrega(pedido: any): string {
    const endereco = this.obterEnderecoEntrega(pedido);

    if (!endereco) {
      return 'Endereço de entrega não disponível';
    }

    const linha = [endereco.rua, endereco.numero]
      .filter(Boolean)
      .join(', ');

    const local = [endereco.bairro, endereco.cidade, endereco.estado]
      .filter(Boolean)
      .join(' - ');

    return [
      endereco.nomeEndereco,
      linha,
      endereco.complemento,
      local,
      endereco.cep ? `CEP ${endereco.cep}` : ''
    ].filter(Boolean).join(' | ');
  }

  formatarEndereco(endereco: any): string {
    if (!endereco) {
      return 'Endereço não disponível';
    }

    const linha = [endereco.rua, endereco.numero]
      .filter(Boolean)
      .join(', ');

    const local = [endereco.bairro, endereco.cidade, endereco.estado]
      .filter(Boolean)
      .join(' - ');

    return [
      endereco.nomeEndereco,
      linha,
      endereco.complemento,
      local,
      endereco.cep ? `CEP ${endereco.cep}` : ''
    ].filter(Boolean).join(' | ');
  }

  async abrirAlterarEndereco(pedido: any): Promise<void> {
    if (!this.podeAlterarEndereco(pedido)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'O endereço só pode ser alterado enquanto o pedido está em processamento.'
      });
      return;
    }

    this.pedidoAlterarEndereco = pedido;
    this.enderecoSelecionadoId = pedido.enderecoEntrega?.id ?? null;
    this.enderecosDisponiveis = [];
    this.displayAlterarEnderecoModal = true;
    this.carregandoEnderecos = true;

    try {
      const user = this.authService.getUser();

      if (!user?.id) {
        throw new Error('Faça login para consultar seus endereços.');
      }

      const token = this.authService.getToken();

      const response = await fetch(
        `${environment.apiUrl}/clientes/${user.id}/enderecos`,
        {
          headers: {
            'Authorization': 'Bearer ' + token
          }
        }
      );

      if (!response.ok) {
        throw new Error('Não foi possível carregar os endereços cadastrados.');
      }

      const enderecos = await response.json();

      this.enderecosDisponiveis = Array.isArray(enderecos)
        ? enderecos
        : [];
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: error.message || 'Falha ao buscar endereços.'
      });
    } finally {
      this.carregandoEnderecos = false;
    }
  }

  fecharAlterarEndereco(): void {
    if (this.salvandoEndereco) {
      return;
    }

    this.displayAlterarEnderecoModal = false;
    this.pedidoAlterarEndereco = null;
    this.enderecosDisponiveis = [];
    this.enderecoSelecionadoId = null;
  }

    async salvarAlteracaoEndereco(): Promise<void> {
    if (
      this.salvandoEndereco ||
      !this.pedidoAlterarEndereco ||
      this.enderecoSelecionadoId == null
    ) {
      return;
    }

    if (!this.podeAlterarEndereco(this.pedidoAlterarEndereco)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Este pedido não permite mais alterar o endereço.'
      });
      return;
    }

    const endereco = this.enderecosDisponiveis.find(
      item => Number(item.id) === Number(this.enderecoSelecionadoId)
    );

    if (!endereco) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Selecione um endereço cadastrado.'
      });
      return;
    }

    if (
      Number(this.pedidoAlterarEndereco.enderecoEntrega?.id) ===
      Number(endereco.id)
    ) {
      return;
    }

    this.salvandoEndereco = true;

    try {
      const token = this.authService.getToken();

      const response = await fetch(
        `${environment.apiUrl}/pedidos/${this.pedidoAlterarEndereco.id}/endereco-entrega`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            enderecoId: endereco.id
          })
        }
      );

      if (!response.ok) {
        const erro = await response.json().catch(() => ({}));

        throw new Error(
          erro.mensagem ||
          erro.message ||
          'Não foi possível alterar o endereço de entrega.'
        );
      }

      const atualizado = this.normalizarPedido(await response.json());

      const index = this.pedidos.findIndex(
        p => p.id === atualizado.id
      );

      if (index >= 0) {
        this.pedidos[index] = {
          ...this.pedidos[index],
          ...atualizado
        };
      }

      this.filtrarPorStatus(this.statusAtivo);

      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Endereço de entrega atualizado com sucesso.'
      });

      this.authService.adicionarNotificacao(
        'Endereço de entrega',
        `Endereço do pedido #${atualizado.id} atualizado.`,
        'success'
      );

      this.salvandoEndereco = false;
      this.fecharAlterarEndereco();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: error.message || 'Falha ao alterar endereço.'
      });
    } finally {
      this.salvandoEndereco = false;
    }
  }

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.carregarPedidos();

    this.intervalId = setInterval(
      () => this.carregarPedidosSilenciosamente(),
      5000
    );

    this.route.queryParams.subscribe((params: any) => {
      const pedidoId = params['pedidoId'];
      const abrirChat = params['abrirChat'] === 'true';

      if (pedidoId && abrirChat) {
        setTimeout(() => {
          const pedido = this.pedidos.find(
            p => p.id == pedidoId
          );

          if (pedido) {
            this.abrirChatVendedor(pedido.id);

            this.router.navigate([], {
              queryParams: {},
              replaceUrl: true
            });
          }
        }, 1000);
      }
    });
  }



abrirModalFotos(fotos: any[], index: number): void {
  this.fotosDevolucaoList = fotos
    .map((foto: any) => {
      const caminho = typeof foto === 'string'
        ? foto
        : foto?.caminho || foto?.nomeArquivo || '';

      if (!caminho) return '';

      if (/^https?:\/\//i.test(caminho)) {
        return caminho;
      }

      const caminhoLimpo = caminho.replace(/^\/+/, '');

      const caminhoFinal = caminhoLimpo.startsWith('uploads/')
        ? caminhoLimpo
        : `uploads/devolucoes/${caminhoLimpo}`;

      return `http://localhost:8081/${caminhoFinal}`;
    })
    .filter((url: string) => url.length > 0);

  if (this.fotosDevolucaoList.length === 0) return;

  this.fotoIndexAtual = Math.min(index, this.fotosDevolucaoList.length - 1);
  this.fotoAtual = this.fotosDevolucaoList[this.fotoIndexAtual];
  this.displayFotosModal = true;
}



  fecharModalFotos(): void {
    this.displayFotosModal = false;
    this.fotosDevolucaoList = [];
    this.fotoAtual = '';
    this.fotoIndexAtual = 0;
  }

  fotoAnterior(): void {
    if (this.fotoIndexAtual > 0) {
      this.fotoIndexAtual--;
      this.fotoAtual = this.fotosDevolucaoList[this.fotoIndexAtual];
    }
  }

  fotoProxima(): void {
    if (
      this.fotoIndexAtual <
      this.fotosDevolucaoList.length - 1
    ) {
      this.fotoIndexAtual++;
      this.fotoAtual = this.fotosDevolucaoList[this.fotoIndexAtual];
    }
  }

  selecionarFoto(index: number): void {
    this.fotoIndexAtual = index;
    this.fotoAtual = this.fotosDevolucaoList[index];
  }

  validarCodigoRastreamentoInput(codigo: string): void {
    const regex = /^[A-Z]{2}[0-9]{9}[A-Z]{2}$/;
    const codigoUpper = codigo?.toUpperCase() || '';

    this.codigoRastreamentoValido = regex.test(codigoUpper);

    if (this.codigoRastreamentoValido) {
      this.codigoRastreamento = codigoUpper;
    }
  }

  abrirChatVendedor(pedidoId: number): void {
    const pedido = this.pedidos.find(
      p => p.id === pedidoId
    );

    if (pedido) {
      this.chatService.abrirChat(pedidoId, pedido);
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Carregando informações do pedido...'
      });

      setTimeout(() => {
        const pedidoRecarregado = this.pedidos.find(
          p => p.id === pedidoId
        );

        if (pedidoRecarregado) {
          this.chatService.abrirChat(
            pedidoId,
            pedidoRecarregado
          );
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível abrir o chat. Tente novamente.'
          });
        }
      }, 500);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  onRastreamentoChange(): void {
    if (!this.codigoRastreamento) {
      this.rastreamentoSalvo = false;
    }
  }

  editarAvaliacao(index: number): void {
    const avaliacao = this.avaliacoes[index];
    avaliacao.avaliado = false;
  }

  abrirFotoDevolucao(caminho: string): void {
    window.open(
      'http://localhost:8081/' + caminho,
      '_blank'
    );
  }

  async abrirAvaliacao(pedido: any): Promise<void> {
    this.pedidoAvaliacao = pedido;
    this.avaliacoes = [];
    this.displayAvaliacaoModal = true;

    try {
      const user = this.authService.getUser();

      if (!user) {
        return;
      }

      const token = this.authService.getToken();

      const avaliacoesResponse = await fetch(
        `${environment.apiUrl}/avaliacoes/cliente/${user.id}`,
        {
          headers: {
            'Authorization': 'Bearer ' + token
          }
        }
      );

      let avaliacoesExistentes: any[] = [];

      if (avaliacoesResponse.ok) {
        avaliacoesExistentes = await avaliacoesResponse.json();
      }

      for (const item of pedido.itens) {
        const avaliacaoExistente = avaliacoesExistentes.find(
          (a: any) =>
            a.livro.id === item.livro.id &&
            a.pedido.id === pedido.id
        );

        this.avaliacoes.push({
          itemPedidoId: item.id,
          livroId: item.livro.id,
          titulo: item.livro.titulo,
          imagemUrl: item.livro.imagemUrl,
          nota: avaliacaoExistente?.nota || 0,
          comentario: avaliacaoExistente?.comentario || '',
          avaliado: !!avaliacaoExistente,
          avaliacaoId: avaliacaoExistente?.id || null
        });
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    }
  }

  fecharAvaliacao(): void {
    this.displayAvaliacaoModal = false;
    this.pedidoAvaliacao = null;
  }

  selecionarNota(index: number, valor: number): void {
    this.avaliacoes[index].nota = valor;
  }

    async salvarAvaliacao(index: number): Promise<void> {
    if (this.carregandoAvaliacao[index]) return;

    this.carregandoAvaliacao[index] = true;
    const avaliacao = this.avaliacoes[index];

    if (avaliacao.nota === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Selecione uma nota para avaliar'
      });

      this.carregandoAvaliacao[index] = false;
      return;
    }

    try {
      const user = this.authService.getUser();

      if (!user) {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Usuário não encontrado. Faça login novamente.'
        });

        this.carregandoAvaliacao[index] = false;
        return;
      }

      const token = this.authService.getToken();

      const body = {
        livroId: avaliacao.livroId,
        nota: avaliacao.nota,
        comentario: avaliacao.comentario || '',
        pedidoId: this.pedidoAvaliacao.id
      };

      const isEdit =
        avaliacao.avaliacaoId !== null &&
        avaliacao.avaliacaoId !== undefined;

      const url = isEdit
        ? `${environment.apiUrl}/avaliacoes/${avaliacao.avaliacaoId}?clienteId=${user.id}`
        : `${environment.apiUrl}/avaliacoes?clienteId=${user.id}`;

      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.mensagem || 'Erro ao salvar avaliação');
      }

      const data = await response.json();

      avaliacao.avaliado = true;
      avaliacao.avaliacaoId = data.id || avaliacao.avaliacaoId;

      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: `Avaliação do livro "${avaliacao.titulo}" ${isEdit ? 'atualizada' : 'salva'} com sucesso!`
      });

      this.authService.adicionarNotificacao(
        'Avaliação',
        `Você ${isEdit ? 'atualizou' : 'avaliou'} "${avaliacao.titulo}" com ${avaliacao.nota} estrelas`,
        'success'
      );

      await this.carregarPedidos();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: error.message
      });
    } finally {
      this.carregandoAvaliacao[index] = false;
    }
  }

  alternarEstrela(index: number, estrelaIndex: number): void {
    const avaliacao = this.avaliacoes[index];
    const notaAtual = avaliacao.nota;

    if (notaAtual === estrelaIndex + 0.5) {
      avaliacao.nota = estrelaIndex;
      return;
    }

    if (notaAtual === estrelaIndex + 1) {
      avaliacao.nota = estrelaIndex + 0.5;
      return;
    }

    if (notaAtual <= estrelaIndex) {
      avaliacao.nota = estrelaIndex + 1;
      return;
    }

    if (notaAtual > estrelaIndex + 1) {
      avaliacao.nota = estrelaIndex + 0.5;
    }
  }

  getTipoEstrela(avaliacao: any, estrelaIndex: number): string {
    const nota = avaliacao.nota;

    if (nota >= estrelaIndex + 1) {
      return 'cheia';
    } else if (nota > estrelaIndex && nota < estrelaIndex + 1) {
      return 'meia';
    } else {
      return 'vazia';
    }
  }

  async verificarSeJaAvaliou(
    pedidoId: number,
    livroId: number
  ): Promise<boolean> {
    try {
      const user = this.authService.getUser();

      if (!user) {
        return false;
      }

      const token = this.authService.getToken();

      const response = await fetch(
        `${environment.apiUrl}/avaliacoes/verificar?clienteId=${user.id}&pedidoId=${pedidoId}&livroId=${livroId}`,
        {
          headers: {
            'Authorization': 'Bearer ' + token
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.jaAvaliou;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  getTipoEstrelaAvaliacao(
    nota: number,
    estrelaIndex: number
  ): string {
    if (!nota) return 'vazia';

    if (nota >= estrelaIndex + 1) {
      return 'cheia';
    } else if (nota > estrelaIndex && nota < estrelaIndex + 1) {
      return 'meia';
    } else {
      return 'vazia';
    }
  }

  async carregarAvaliacoesDosPedidos(): Promise<void> {
    const user = this.authService.getUser();

    if (!user) return;

    const token = this.authService.getToken();
    let avaliacoesExistentes: any[] = [];

    try {
      const response = await fetch(
        `${environment.apiUrl}/avaliacoes/cliente/${user.id}`,
        {
          headers: {
            'Authorization': 'Bearer ' + token
          }
        }
      );

      if (response.ok) {
        avaliacoesExistentes = await response.json();
      }
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
    }

    for (const pedido of this.pedidos) {
      let pedidoTemAvaliacao = false;

      if (pedido.status === 'ENTREGUE') {
        for (const item of pedido.itens) {
          const avaliacao = avaliacoesExistentes.find(
            (a: any) =>
              a.livro.id === item.livro.id &&
              a.pedido.id === pedido.id
          );

          item.jaAvaliou = !!avaliacao;

          if (avaliacao) {
            item.notaAvaliacao = avaliacao.nota;
            item.comentarioAvaliacao = avaliacao.comentario;
            pedidoTemAvaliacao = true;
          }
        }
      }

      pedido.temAvaliacao = pedidoTemAvaliacao;
    }
  }

  async carregarPedidos(): Promise<void> {
    this.loading = true;

    try {
      const user = JSON.parse(
        localStorage.getItem('clienteLogado') || 'null'
      );

      if (!user) {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Faça login para visualizar seus pedidos'
        });

        this.authService.adicionarNotificacao(
          'Erro',
          'Faça login para visualizar seus pedidos',
          'error'
        );

        return;
      }

      const token = this.authService.getToken();

      const response = await fetch(
        `${environment.apiUrl}/pedidos?clienteId=${user.id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar pedidos');
      }

      this.pedidos = (await response.json()).map(
        (pedido: any) => this.normalizarPedido(pedido)
      );

      const [disponiveisRes, usadosRes] = await Promise.all([
        fetch(
          `${environment.apiUrl}/cupons/cliente/${user.id}/disponiveis`,
          {
            headers: {
              'Authorization': 'Bearer ' + token
            }
          }
        ),
        fetch(
          `${environment.apiUrl}/cupons/cliente/${user.id}/usados`,
          {
            headers: {
              'Authorization': 'Bearer ' + token
            }
          }
        )
      ]);

      let todosCupons: any[] = [];

      if (disponiveisRes.ok) {
        const disponiveis = await disponiveisRes.json();
        todosCupons = [...todosCupons, ...disponiveis];
      }

      if (usadosRes.ok) {
        const usados = await usadosRes.json();
        todosCupons = [...todosCupons, ...usados];
      }

      for (const pedido of this.pedidos) {
        if (pedido.status === 'DEVOLVIDO') {
          const cupom = todosCupons.find(
            (c: any) => c.pedidoId === pedido.id
          );

          if (cupom) {
            pedido.cupomGerado = cupom.codigo;
            pedido.cupomPorcentagem = cupom.porcentagem;
            pedido.cupomDisponivel = !cupom.usado;
            pedido.cupomDataUso = cupom.dataUso;
          }
        }

        const devolucoes = this.pedidos.filter(
          p => p.pedidoOriginalId === pedido.id
        );

        const itensDevolvidos: any = {};

        for (const devolucao of devolucoes) {
          if (
            devolucao.status === 'DEVOLUCAO' ||
            devolucao.status === 'AUTORIZADO_DEVOLUCAO' ||
            devolucao.status === 'ENVIADO_DEVOLUCAO' ||
            devolucao.status === 'DEVOLVIDO'
          ) {
            for (const item of devolucao.itens) {
              const livroId = item.livro.id;

              if (!itensDevolvidos[livroId]) {
                itensDevolvidos[livroId] = 0;
              }

              itensDevolvidos[livroId] += item.quantidade;
            }
          }
        }

        let temItemDisponivel = false;

        for (const item of pedido.itens) {
          const quantidadeDevolvida =
            itensDevolvidos[item.livro.id] || 0;

          if (item.quantidade - quantidadeDevolvida > 0) {
            temItemDisponivel = true;
            break;
          }
        }

        pedido.temItemDisponivelParaDevolucao = temItemDisponivel;
      }

      this.pedidos.forEach((p: any) => {
        if (p.reembolsoConfirmado === undefined) {
          p.reembolsoConfirmado = false;
        }

        p.temAvaliacao = false;
      });

      this.recalcularStatusDevolucao();

      await this.carregarAvaliacoesDosPedidos();

      this.filtrarPorStatus(this.statusAtivo);
    } catch (error) {
      console.error('Erro:', error);

      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Falha ao carregar pedidos'
      });

      this.authService.adicionarNotificacao(
        'Erro',
        'Falha ao carregar pedidos',
        'error'
      );
    } finally {
      this.loading = false;
    }
  }

    onFotosDevolucaoSelected(event: any): void {
    const files = event.target.files;
    const maxFiles = 3;

    if (this.fotosDevolucao.length + files.length > maxFiles) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: `Máximo de ${maxFiles} fotos permitidas`
      });
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > 5 * 1024 * 1024) {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Cada imagem deve ter no máximo 5MB'
        });
        continue;
      }

      this.fotosDevolucao.push(file);

      const reader = new FileReader();

      reader.onload = (e: any) => {
        this.fotosDevolucaoPreview.push(e.target.result);
      };

      reader.readAsDataURL(file);
    }

    event.target.value = '';
  }

  removerFotoDevolucao(index: number): void {
    this.fotosDevolucao.splice(index, 1);
    this.fotosDevolucaoPreview.splice(index, 1);
  }

  async carregarPedidosSilenciosamente(): Promise<void> {
    try {
      const user = JSON.parse(
        localStorage.getItem('clienteLogado') || 'null'
      );

      if (!user) return;

      const token = this.authService.getToken();

      const response = await fetch(
        `${environment.apiUrl}/pedidos?clienteId=${user.id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          }
        }
      );

      if (response.ok) {
        const novosPedidos = await response.json();

        this.pedidos = novosPedidos.map(
          (pedido: any) => this.normalizarPedido(pedido)
        );

        const [disponiveisRes, usadosRes] = await Promise.all([
          fetch(
            `${environment.apiUrl}/cupons/cliente/${user.id}/disponiveis`,
            {
              headers: {
                'Authorization': 'Bearer ' + token
              }
            }
          ),
          fetch(
            `${environment.apiUrl}/cupons/cliente/${user.id}/usados`,
            {
              headers: {
                'Authorization': 'Bearer ' + token
              }
            }
          )
        ]);

        let todosCupons: any[] = [];

        if (disponiveisRes.ok) {
          const disponiveis = await disponiveisRes.json();
          todosCupons = [...todosCupons, ...disponiveis];
        }

        if (usadosRes.ok) {
          const usados = await usadosRes.json();
          todosCupons = [...todosCupons, ...usados];
        }

        for (const pedido of this.pedidos) {
          if (pedido.status === 'DEVOLVIDO') {
            const cupom = todosCupons.find(
              (c: any) => c.pedidoId === pedido.id
            );

            if (cupom) {
              pedido.cupomGerado = cupom.codigo;
              pedido.cupomPorcentagem = cupom.porcentagem;
              pedido.cupomDisponivel = !cupom.usado;
              pedido.cupomDataUso = cupom.dataUso;
            }
          }

          const devolucoes = this.pedidos.filter(
            p => p.pedidoOriginalId === pedido.id
          );

          const itensDevolvidos: any = {};

          for (const devolucao of devolucoes) {
            if (
              devolucao.status === 'DEVOLUCAO' ||
              devolucao.status === 'AUTORIZADO_DEVOLUCAO' ||
              devolucao.status === 'ENVIADO_DEVOLUCAO' ||
              devolucao.status === 'DEVOLVIDO'
            ) {
              for (const item of devolucao.itens) {
                const livroId = item.livro.id;

                if (!itensDevolvidos[livroId]) {
                  itensDevolvidos[livroId] = 0;
                }

                itensDevolvidos[livroId] += item.quantidade;
              }
            }
          }

          let temItemDisponivel = false;

          for (const item of pedido.itens) {
            const quantidadeDevolvida =
              itensDevolvidos[item.livro.id] || 0;

            if (item.quantidade - quantidadeDevolvida > 0) {
              temItemDisponivel = true;
              break;
            }
          }

          pedido.temItemDisponivelParaDevolucao = temItemDisponivel;
        }

        this.pedidos.forEach((p: any) => {
          if (p.reembolsoConfirmado === undefined) {
            p.reembolsoConfirmado = false;
          }

          p.temAvaliacao = false;
        });

        this.recalcularStatusDevolucao();

        await this.carregarAvaliacoesDosPedidos();

        this.filtrarPorStatus(this.statusAtivo);
      }
    } catch (error) {
      console.error('Erro ao monitorar pedidos:', error);
    }
  }

  verificarPrazoDevolucao(dataEntrega: string): boolean {
    if (!dataEntrega) return true;

    const entrega = new Date(dataEntrega);
    const hoje = new Date();

    const diff =
      (hoje.getTime() - entrega.getTime()) /
      (1000 * 60 * 60 * 24);

    return diff > 7;
  }

  calcularDiasRestantes(dataEntrega: string): number {
    if (!dataEntrega) return 0;

    const entrega = new Date(dataEntrega);
    const hoje = new Date();

    const diff =
      (hoje.getTime() - entrega.getTime()) /
      (1000 * 60 * 60 * 24);

    const restantes = Math.max(0, 7 - Math.floor(diff));

    return restantes;
  }

  recalcularStatusDevolucao(): void {
    for (const pedido of this.pedidos) {
      for (const item of pedido.itens) {
        item.statusDevolucao = null;
        item.quantidadeDevolvida = 0;
      }
    }

    const devolucoes = this.pedidos.filter(
      (p: any) => p.pedidoOriginalId
    );

    for (const devolucao of devolucoes) {
      const pedidoOriginal = this.pedidos.find(
        (p: any) => p.id === devolucao.pedidoOriginalId
      );

      if (pedidoOriginal) {
        for (const itemDev of devolucao.itens) {
          const itemOriginal = pedidoOriginal.itens.find(
            (i: any) => i.livro.id === itemDev.livro.id
          );

          if (itemOriginal) {
            itemOriginal.quantidadeDevolvida =
              (itemOriginal.quantidadeDevolvida || 0) +
              itemDev.quantidade;

            if (
              devolucao.status === 'DEVOLUCAO' ||
              devolucao.status === 'AUTORIZADO_DEVOLUCAO' ||
              devolucao.status === 'ENVIADO_DEVOLUCAO'
            ) {
              if (
                itemOriginal.quantidadeDevolvida <
                itemOriginal.quantidade
              ) {
                itemOriginal.statusDevolucao = 'DEVOLUCAO_PARCIAL';
              } else {
                itemOriginal.statusDevolucao = 'DEVOLUCAO';
              }
            } else if (devolucao.status === 'DEVOLVIDO') {
              if (
                itemOriginal.quantidadeDevolvida <
                itemOriginal.quantidade
              ) {
                itemOriginal.statusDevolucao = 'DEVOLUCAO_PARCIAL';
              } else {
                itemOriginal.statusDevolucao = 'DEVOLVIDO';
              }
            }
          }
        }
      }
    }
  }

  abrirInstrucoesEnvio(pedidoId: number): void {
    this.pedidoEnvioId = pedidoId;
    this.codigoRastreamento = '';
    this.rastreamentoSalvo = false;
    this.displayInstrucoesEnvio = true;
  }

  fecharInstrucoesEnvio(): void {
    this.displayInstrucoesEnvio = false;
  }

  salvarRastreamento(): void {
    if (this.carregandoRastreamento) return;

    if (!this.codigoRastreamento) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: 'Digite o código de rastreamento'
      });
      return;
    }

    if (!this.codigoRastreamentoValido) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Código inválido. Formato: AA123456789BR (2 letras + 9 números + 2 letras)'
      });
      return;
    }

    this.carregandoRastreamento = true;
    this.rastreamentoSalvo = true;

    this.messageService.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Código de rastreamento salvo!'
    });

    this.authService.adicionarNotificacao(
      'Rastreamento',
      `Código de rastreamento: ${this.codigoRastreamento}`,
      'info'
    );

    this.carregandoRastreamento = false;
  }

  filtrarPorStatus(status: string): void {
    this.statusAtivo = status;

    const pedidosValidos = this.pedidos.filter(
      p => p.status !== 'CANCELADO'
    );

    this.filteredPedidos = pedidosValidos.filter(
      p => p.status === status
    );
  }

  trocarStatus(status: string): void {
    this.filtrarPorStatus(status);
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

  formatStatus(status: string): string {
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

  formatarMoeda(valor: number): string {
    return 'R$ ' + Number(valor || 0)
      .toFixed(2)
      .replace('.', ',');
  }

  async cancelarPedido(pedidoId: number): Promise<void> {
    this.pedidoCancelamentoId = pedidoId;
    this.displayCancelamentoModal = true;
  }
  async confirmarCancelamento(): Promise<void> {
    if (this.carregandoCancelar) return;

    this.carregandoCancelar = true;

    try {
      const token = this.authService.getToken();

      const response = await fetch(
        `${environment.apiUrl}/pedidos/${this.pedidoCancelamentoId}/cancelar`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          }
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.mensagem || 'Erro ao cancelar pedido');
      }

      const pedido = this.pedidos.find(
        p => p.id === this.pedidoCancelamentoId
      );

      const pedidoLabel = pedido
        ? `Pedido #${pedido.id}`
        : 'Pedido';

      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: `${pedidoLabel} cancelado!`
      });

      this.authService.adicionarNotificacao(
        'Cancelamento',
        `${pedidoLabel} cancelado com sucesso`,
        'success'
      );

      await this.carregarPedidos();

      this.displayCancelamentoModal = false;
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: error.message
      });

      this.authService.adicionarNotificacao(
        'Erro',
        error.message,
        'error'
      );
    } finally {
      this.carregandoCancelar = false;
    }
  }

  async atualizarStatus(
    pedidoId: number,
    novoStatus: string,
    codigoRastreamento?: string
  ): Promise<void> {
    try {
      const token = this.authService.getToken();

      const body: any = { novoStatus };

      if (codigoRastreamento) {
        body.codigoRastreamentoDevolucao = codigoRastreamento;
      }

      const response = await fetch(
        `${environment.apiUrl}/pedidos/${pedidoId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar status');
      }

      const pedidoAtualizado = await response.json();

      const pedido = this.pedidos.find(
        p => p.id === pedidoId
      );

      const pedidoLabel = pedido
        ? `Pedido #${pedido.id}`
        : 'Pedido';

      const statusLabel = this.formatStatus(novoStatus);

      let mensagem = `${pedidoLabel} atualizado para ${statusLabel}!`;

      if (
        novoStatus === 'DEVOLVIDO' &&
        pedidoAtualizado.cupomDisponivel &&
        pedidoAtualizado.cupomGerado
      ) {
        mensagem += ` Cupom ${pedidoAtualizado.cupomGerado} de ${pedidoAtualizado.cupomPorcentagem}% de desconto disponível!`;

        const user = this.authService.getUser();

        if (user) {
          const cuponsPorUsuario = JSON.parse(
            localStorage.getItem('cuponsPorUsuario') || '{}'
          );

          const cuponsUsuario = cuponsPorUsuario[user.id] || [];

          const cupomExistente = cuponsUsuario.find(
            (c: any) => c.codigo === pedidoAtualizado.cupomGerado
          );

          if (!cupomExistente) {
            const dataExpiracao = new Date();

            dataExpiracao.setDate(
              dataExpiracao.getDate() + 30
            );

            cuponsUsuario.push({
              id: Date.now(),
              codigo: pedidoAtualizado.cupomGerado,
              porcentagem: pedidoAtualizado.cupomPorcentagem || 15,
              dataGeracao: new Date().toISOString(),
              dataExpiracao: dataExpiracao.toISOString(),
              usado: false,
              origem: 'devolucao',
              pedidoId: pedidoId,
              zerarFrete: false
            });

            cuponsPorUsuario[user.id] = cuponsUsuario;

            localStorage.setItem(
              'cuponsPorUsuario',
              JSON.stringify(cuponsPorUsuario)
            );
          }
        }
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: mensagem
      });

      this.authService.adicionarNotificacao(
        'Status Atualizado',
        mensagem,
        'success'
      );

      await this.carregarPedidos();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: error.message
      });

      this.authService.adicionarNotificacao(
        'Erro',
        error.message,
        'error'
      );
    }
  }

  validarCodigoRastreamento(): boolean {
    const regex = /^[A-Z]{2}[0-9]{9}[A-Z]{2}$/;
    const codigo = this.codigoRastreamento?.toUpperCase() || '';

    if (!regex.test(codigo)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Código inválido. Formato: AA123456789BR (2 letras + 9 números + 2 letras)'
      });

      return false;
    }

    this.codigoRastreamento = codigo;

    return true;
  }

  copiarCupom(codigo: string): void {
    navigator.clipboard.writeText(codigo).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copiado!',
        detail: `Cupom ${codigo} copiado para a área de transferência`
      });
    }).catch(() => {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Não foi possível copiar o cupom'
      });
    });
  }

  abrirDevolucao(pedidoId: number): void {
    const pedido = this.pedidos.find(
      p => p.id === pedidoId
    );

    if (!pedido) return;

    const devolucoes = this.pedidos.filter(
      p => p.pedidoOriginalId === pedidoId
    );

    const itensDevolvidos: any = {};

    for (const devolucao of devolucoes) {
      if (
        devolucao.status === 'DEVOLVIDO' ||
        devolucao.status === 'DEVOLUCAO'
      ) {
        for (const item of devolucao.itens) {
          const livroId = item.livro.id;

          if (!itensDevolvidos[livroId]) {
            itensDevolvidos[livroId] = 0;
          }

          itensDevolvidos[livroId] += item.quantidade;
        }
      }
    }

    this.pedidoDevolucaoId = pedidoId;
    this.motivoDevolucao = '';
    this.itensSelecionados = [];

    this.itensDevolucao = pedido.itens
      .map((item: any) => {
        const quantidadeJaDevolvida =
          itensDevolvidos[item.livro.id] || 0;

        const quantidadeDisponivel =
          item.quantidade - quantidadeJaDevolvida;

        return {
          ...item,
          quantidadeDisponivel: quantidadeDisponivel,
          quantidadeDevolver: Math.min(quantidadeDisponivel, 1),
          selecionado: false,
          jaDevolvido: quantidadeDisponivel <= 0
        };
      })
      .filter((item: any) => item.quantidadeDisponivel > 0);

    if (this.itensDevolucao.length === 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'Info',
        detail: 'Todos os itens deste pedido já foram solicitados a devolução'
      });

      return;
    }

    this.displayDevolucaoModal = true;
  }

  validarQuantidade(item: any): void {
    if (item.quantidadeDevolver > item.quantidadeDisponivel) {
      item.quantidadeDevolver = item.quantidadeDisponivel;

      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso',
        detail: `Quantidade ajustada para ${item.quantidadeDisponivel} (máximo disponível)`
      });
    }

    if (item.quantidadeDevolver < 1) {
      item.quantidadeDevolver = 1;
    }
  }


  async confirmarDevolucao(): Promise<void> {
    if (this.carregandoDevolucao) return;

    this.carregandoDevolucao = true;

    if (!this.motivoDevolucao.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Informe o motivo da devolução'
      });

      this.carregandoDevolucao = false;
      return;
    }

    const itens = this.itensDevolucao
      .filter(item => item.selecionado)
      .map(item => {
        const quantidade = Math.min(
          item.quantidadeDevolver,
          item.quantidadeDisponivel
        );

        return {
          itemPedidoId: item.id,
          quantidade: quantidade
        };
      });

    if (itens.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Selecione pelo menos um item'
      });

      this.carregandoDevolucao = false;
      return;
    }

    for (let i = 0; i < itens.length; i++) {
      const itemSelecionado = this.itensDevolucao
        .filter(item => item.selecionado)[i];

      if (itens[i].quantidade > itemSelecionado.quantidadeDisponivel) {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Quantidade de devolução excede o disponível'
        });

        this.carregandoDevolucao = false;
        return;
      }
    }

    try {
      const token = this.authService.getToken();
      const formData = new FormData();

      formData.append('motivo', this.motivoDevolucao);
      formData.append('itens', JSON.stringify(itens));

      if (this.fotosDevolucao.length > 0) {
        for (const foto of this.fotosDevolucao) {
          formData.append('fotos', foto);
        }
      }

      const response = await fetch(
        `${environment.apiUrl}/pedidos/${this.pedidoDevolucaoId}/devolucao`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token
          },
          body: formData
        }
      );

      if (!response.ok) {
        const error = await response.json();

        throw new Error(
          error.mensagem || 'Erro ao solicitar devolução'
        );
      }

      const data = await response.json();
      const pedidoLabel = `Pedido #${this.pedidoDevolucaoId}`;

      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: `Devolução do ${pedidoLabel} solicitada!`
      });

      this.authService.adicionarNotificacao(
        'Devolução',
        `Devolução do ${pedidoLabel} solicitada com sucesso`,
        'success'
      );

      this.displayDevolucaoModal = false;
      this.fotosDevolucao = [];
      this.fotosDevolucaoPreview = [];

      await this.carregarPedidos();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: error.message
      });

      this.authService.adicionarNotificacao(
        'Erro',
        error.message,
        'error'
      );
    } finally {
      this.carregandoDevolucao = false;
    }
  }

  abrirConfirmarEntrega(pedidoId: number): void {
    const pedido = this.pedidos.find(
      p => p.id === pedidoId
    );

    if (!pedido) return;

    this.pedidoEntrega = pedido;
    this.displayConfirmarEntrega = true;
  }

  fecharConfirmarEntrega(): void {
    this.displayConfirmarEntrega = false;
    this.pedidoEntrega = null;
  }

  confirmarReembolso(pedidoId: number): void {
    const pedido = this.pedidos.find(
      p => p.id === pedidoId
    );

    if (!pedido) return;

    this.pedidoReembolso = pedido;
    this.displayConfirmarReembolso = true;
  }

  async confirmarReembolsoFinal(): Promise<void> {
    if (this.carregandoReembolso) return;

    this.carregandoReembolso = true;

    if (!this.pedidoReembolso) {
      this.carregandoReembolso = false;
      return;
    }

    try {
      const token = this.authService.getToken();

      const response = await fetch(
        `${environment.apiUrl}/pedidos/${this.pedidoReembolso.id}/confirmar-reembolso`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao confirmar reembolso');
      }

      const pedidoAtualizado = await response.json();

      const index = this.pedidos.findIndex(
        p => p.id === pedidoAtualizado.id
      );

      if (index !== -1) {
        this.pedidos[index] = this.normalizarPedido(
          pedidoAtualizado
        );
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Reembolso confirmado',
        detail: 'Reembolso confirmado para o pedido #' +
          this.pedidoReembolso.id
      });

      this.authService.adicionarNotificacao(
        'Reembolso',
        'Reembolso confirmado para o pedido #' +
          this.pedidoReembolso.id,
        'success'
      );

      this.displayConfirmarReembolso = false;
      this.pedidoReembolso = null;

      this.filtrarPorStatus(this.statusAtivo);
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: error.message || 'Falha ao confirmar reembolso'
      });
    } finally {
      this.carregandoReembolso = false;
    }
  }

  async confirmarEntregaFinal(): Promise<void> {
    if (this.carregandoEntrega) return;

    this.carregandoEntrega = true;

    if (!this.pedidoEntrega) {
      this.carregandoEntrega = false;
      return;
    }

    try {
      const token = this.authService.getToken();

      const response = await fetch(
        `${environment.apiUrl}/pedidos/${this.pedidoEntrega.id}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            novoStatus: 'ENTREGUE'
          })
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao confirmar entrega');
      }

      const pedidoAtualizado = await response.json();

      const index = this.pedidos.findIndex(
        p => p.id === pedidoAtualizado.id
      );

      if (index !== -1) {
        this.pedidos[index] = this.normalizarPedido(
          pedidoAtualizado
        );
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Entrega confirmada',
        detail: 'Pedido #' +
          this.pedidoEntrega.id +
          ' marcado como entregue!'
      });

      this.authService.adicionarNotificacao(
        'Entrega',
        'Pedido #' +
          this.pedidoEntrega.id +
          ' foi entregue com sucesso',
        'success'
      );

      this.fecharConfirmarEntrega();
      this.filtrarPorStatus(this.statusAtivo);
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: error.message || 'Falha ao confirmar entrega'
      });
    } finally {
      this.carregandoEntrega = false;
    }
  }

  getActionIcon(action: string): string {
    const icons: any = {
      login: 'pi pi-sign-in',
      compra: 'pi pi-shopping-cart',
      cadastro: 'pi pi-user-plus',
      exclusao: 'pi pi-trash',
      'Em Trânsito': 'pi pi-truck',
      Devolvido: 'pi pi-undo',
      Cancelado: 'pi pi-times-circle'
    };

    return icons[action] || 'pi pi-info-circle';
  }

  voltar(): void {
    window.history.back();
  }
}
