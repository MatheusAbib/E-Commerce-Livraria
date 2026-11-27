import { inject } from '@angular/core';
import { LivroService } from '../../../services/livro.service';
import { NotificacaoComponent } from '../../../components/shared/feedback';
import { EstadoVazioComponent } from '../../../components/shared/feedback';
import { CarregamentoComponent } from '../../../components/shared/feedback';
import { OpcaoSelecao } from '../../../components/shared/forms';
import { CampoMonetarioComponent } from '../../../components/shared/forms';
import { CampoSelecaoComponent } from '../../../components/shared/forms';
import { CampoDirective } from '../../../components/shared/forms';
import { BotaoComponent } from '../../../components/shared/buttons/botao/botao';
import { BotaoIconeComponent } from '../../../components/shared/buttons/botao-icone/botao-icone';
import { GrupoAcoesComponent } from '../../../components/shared/buttons/grupo-acoes/grupo-acoes';
import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';

import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CalendarModule } from 'primeng/calendar';
import { FileUploadModule } from 'primeng/fileupload';
import { DropdownModule } from 'primeng/dropdown';
import { PaginatorModule } from 'primeng/paginator';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar';
import { AdminModalsComponent } from '../../../components/admin-modals/admin-modals';
import { AuthService } from '../../../services/auth';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-livros-admin',
  standalone: true,
  imports: [NotificacaoComponent, EstadoVazioComponent, CarregamentoComponent, CampoMonetarioComponent, CampoSelecaoComponent, CampoDirective,
    CommonModule,
    FormsModule,
    RouterModule,
    ToastModule,
    DialogModule,

    InputTextModule,
    InputNumberModule,
    InputTextareaModule,
    CalendarModule,
    FileUploadModule,
    DropdownModule,
    PaginatorModule,
    AdminSidebarComponent,
    AdminModalsComponent,
    BotaoComponent,
    BotaoIconeComponent,
    GrupoAcoesComponent
  ],
  providers: [MessageService],
  templateUrl: './livros.html',
  styleUrls: ['./livros.css', '../admin-common.css']
})
export class LivrosComponent implements OnInit, OnDestroy {
  private readonly livroService = inject(LivroService);

  @ViewChild(AdminModalsComponent) adminModals!: AdminModalsComponent;

  private intervaloEstoque: ReturnType<typeof setInterval> | null = null;
  private destruido = false;
  private atualizandoEstoque = false;
  private geracaoConsulta = 0;
  private filtrosAplicados: any = {};
  livros: any[] = [];
  livrosPaginados: any[] = [];
  loading: boolean = false;
  totalRecords: number = 0;
  first: number = 0;
  rows: number = 10;
  categorias: string[] = [];

  opcoesCategoriasFiltro: OpcaoSelecao<string>[] = [
    { rotulo: 'Todas', valor: '' }
  ];

  readonly opcoesStatusFiltro: OpcaoSelecao<string>[] = [
    { rotulo: 'Todos', valor: '' },
    { rotulo: 'Ativo', valor: 'ativo' },
    { rotulo: 'Inativo', valor: 'inativo' }
  ];


  filtros = {
    titulo: '',
    autor: '',
    editora: '',
    isbn: '',
    categoria: '',
    precoMin: null as number | null,
    precoMax: null as number | null,
    estoqueMin: null as number | null,
    estoqueMax: null as number | null,
    status: ''
  };

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarLivros();
    this.carregarCategorias();
    this.intervaloEstoque = setInterval(() => {
      if (document.visibilityState === 'visible' && !this.loading && !this.filtrando && !this.adminModals?.carregandoSalvarLivro) {
        void this.carregarLivros(this.filtrosAplicados, true);
      }
    }, 10000);
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.geracaoConsulta++;
    if (this.intervaloEstoque !== null) clearInterval(this.intervaloEstoque);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  private async mensagemErro(response: Response, fallback: string): Promise<string> {
    const texto = await response.text();
    try {
      const dados = JSON.parse(texto);
      return dados.mensagem || dados.message || fallback;
    } catch {
      return texto || fallback;
    }
  }

  async carregarCategorias(): Promise<void> {
    try {
      const token = this.authService.getToken();
      const response = await this.livroService.listarCategorias({
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      if (response.ok) {
        this.categorias = await response.json();

        this.opcoesCategoriasFiltro = [
          { rotulo: 'Todas', valor: '' },
          ...this.categorias.map(categoria => ({
            rotulo: categoria,
            valor: categoria
          }))
        ];
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  }

  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    this.atualizarPaginacao();
  }

  atualizarPaginacao(): void {
    this.livrosPaginados = this.livros.slice(this.first, this.first + this.rows);
  }

  async carregarLivros(filtros: any = this.filtrosAplicados, silencioso = false): Promise<void> {
    if (this.destruido || (silencioso && this.atualizandoEstoque)) return;
    const geracao = ++this.geracaoConsulta;
    if (silencioso) {
      this.atualizandoEstoque = true;
    } else {
      this.filtrosAplicados = { ...filtros };
      this.loading = true;
      this.cdr.detectChanges();
    }
    try {
      const params = new URLSearchParams();
      if (filtros.titulo) params.append('titulo', filtros.titulo);
      if (filtros.autor) params.append('autor', filtros.autor);
      if (filtros.editora) params.append('editora', filtros.editora);
      if (filtros.isbn) params.append('isbn', filtros.isbn);
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      if (filtros.precoMin != null) params.append('precoMin', filtros.precoMin.toString());
      if (filtros.precoMax != null) params.append('precoMax', filtros.precoMax.toString());
      if (filtros.estoqueMin != null) params.append('estoqueMin', filtros.estoqueMin.toString());
      if (filtros.estoqueMax != null) params.append('estoqueMax', filtros.estoqueMax.toString());
      if (filtros.status) {
        params.append('status', filtros.status);
      }

      const data = await this.livroService.consultarAdministrativo(`${environment.apiUrl}/livros/consulta?${params.toString()}`).toPromise();
      if (this.destruido || geracao !== this.geracaoConsulta) return;
      this.livros = data?.livros || [];
      this.totalRecords = this.livros.length;
      this.first = silencioso ? Math.min(this.first, Math.max(0, Math.floor((this.totalRecords - 1) / this.rows) * this.rows)) : 0;
      if (this.adminModals) {
        const editando = this.livros.find(l => l.id === this.adminModals.livroEditando?.id);
        if (editando) {
          this.adminModals.livroEditando.estoqueReservado = editando.estoqueReservado;
          this.adminModals.livroEditando.estoqueDisponivel = editando.estoqueDisponivel;
          this.adminModals.livroEditando.estoqueFisicoAtual = editando.estoque;
        }
        const detalhes = this.livros.find(l => l.id === this.adminModals.detalhesItem?.id);
        if (detalhes) this.adminModals.detalhesItem = detalhes;
      }
      this.atualizarPaginacao();
    } catch (error) {
      console.error('Erro ao carregar livros:', error);
      if (!silencioso && !this.destruido && geracao === this.geracaoConsulta) this.messageService.add({severity:'error', summary:'Erro', detail:'Falha ao carregar livros'});
    } finally {
      if (silencioso) this.atualizandoEstoque = false;
      if (!this.destruido && geracao === this.geracaoConsulta) {
        if (!silencioso) this.loading = false;
        this.cdr.detectChanges();
      }
    }
  }


  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly DEBOUNCE_MS = 350;

  onFiltroTextoChange(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    const vazio = !this.filtros.titulo && !this.filtros.autor
      && !this.filtros.editora && !this.filtros.isbn && !this.filtros.categoria
      && this.filtros.precoMin === null && this.filtros.precoMax === null
      && this.filtros.estoqueMin === null && this.filtros.estoqueMax === null
      && !this.filtros.status;
    if (vazio) {
      void this.aplicarFiltros();
      return;
    }
    this.debounceTimer = setTimeout(() => void this.aplicarFiltros(), this.DEBOUNCE_MS);
  }
filtrando: boolean = false;

async aplicarFiltros(): Promise<void> {
  this.filtrando = true;
  this.loading = true;
  this.cdr.detectChanges();

  const inicio = Date.now();

  await this.carregarLivros(this.filtros);

  const decorrido = Date.now() - inicio;
  const restante = Math.max(0, 500 - decorrido);

  setTimeout(() => {
    this.loading = false;
    this.filtrando = false;
    this.cdr.detectChanges();
  }, restante);
}

async limparFiltros(): Promise<void> {
  this.filtrando = true;
  this.loading = true;
  this.cdr.detectChanges();

  const inicio = Date.now();

  this.filtros = {
    titulo: '',
    autor: '',
    editora: '',
    isbn: '',
    categoria: '',
    precoMin: null,
    precoMax: null,
    estoqueMin: null,
    estoqueMax: null,
    status: ''
  };

  await this.carregarLivros({});

  const decorrido = Date.now() - inicio;
  const restante = Math.max(0, 500 - decorrido);

  setTimeout(() => {
    this.loading = false;
    this.filtrando = false;
    this.cdr.detectChanges();
  }, restante);
}

  abrirFormulario(livro?: any): void {
    this.adminModals.abrirFormulario(livro);
    this.adminModals.setSalvarLivroCallback(() => this.salvarLivro());
  }

async salvarLivro(): Promise<void> {
  const livroData = this.adminModals.livroEditando;
  const imagem = this.adminModals.livroEditando.imagem;

  if (!livroData.titulo?.trim() || !livroData.autor?.trim()) {
    this.messageService.add({ severity: 'error', summary: 'Campos obrigatórios', detail: 'Preencha título e autor.' });
    return;
  }

  if (!Number.isInteger(livroData.edicao) || livroData.edicao < 1) {
    this.messageService.add({ severity: 'error', summary: 'Edição inválida', detail: 'Informe a edição do livro (número inteiro maior que zero).' });
    return;
  }

  if (!Number.isInteger(livroData.paginas) || livroData.paginas < 1) {
    this.messageService.add({ severity: 'error', summary: 'Páginas inválidas', detail: 'Informe o número de páginas.' });
    return;
  }

  if (!Number.isInteger(livroData.estoque) || livroData.estoque < (livroData.id ? 0 : 1)) {
    this.messageService.add({ severity: 'error', summary: 'Estoque inválido', detail: 'Informe uma quantidade inteira válida.' });
    return;
  }

  if (livroData.id && livroData.estoque < (livroData.estoqueReservado ?? 0)) {
    this.messageService.add({ severity: 'error', summary: 'Estoque reservado', detail: 'O estoque físico não pode ser inferior às reservas ativas.' });
    return;
  }

  if (livroData.id && livroData.estoqueFisicoAtual !== livroData.estoqueOriginal) {
    this.messageService.add({ severity: 'warn', summary: 'Estoque alterado', detail: 'O estoque mudou durante a edição. Reabra o formulário antes de salvar.' });
    return;
  }

  if (!livroData.altura || livroData.altura <= 0) {
    this.messageService.add({ severity: 'error', summary: 'Altura inválida', detail: 'Informe a altura do livro em cm.' });
    return;
  }

  if (!livroData.largura || livroData.largura <= 0) {
    this.messageService.add({ severity: 'error', summary: 'Largura inválida', detail: 'Informe a largura do livro em cm.' });
    return;
  }

  if (!livroData.profundidade || livroData.profundidade <= 0) {
    this.messageService.add({ severity: 'error', summary: 'Profundidade inválida', detail: 'Informe a profundidade do livro em cm.' });
    return;
  }

  if (!livroData.peso || livroData.peso <= 0) {
    this.messageService.add({ severity: 'error', summary: 'Peso inválido', detail: 'Informe o peso do livro em gramas.' });
    return;
  }

  if (livroData.precoCusto == null || livroData.precoCusto < 0) {
    this.messageService.add({ severity: 'error', summary: 'Preço de custo inválido', detail: 'Informe o preço de custo do livro.' });
    return;
  }

  if (!livroData.dataEntrada) {
    this.messageService.add({ severity: 'error', summary: 'Data de entrada obrigatória', detail: 'Informe a data de entrada do livro.' });
    return;
  }

  if (livroData.categoria) {
    livroData.categoria = livroData.categoria.trim().replace(/\s+/g, ' ');
    livroData.categoria = livroData.categoria.split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  try {
    const formData = new FormData();
    const livro = {
      titulo: livroData.titulo,
      autor: livroData.autor,
      editora: livroData.editora || null,
      categoria: livroData.categoria || null,
      edicao: livroData.edicao,
      isbn: livroData.isbn || null,
      paginas: livroData.paginas,
      sinopse: livroData.sinopse || null,
      altura: livroData.altura,
      largura: livroData.largura,
      profundidade: livroData.profundidade,
      peso: livroData.peso,
      codigoBarras: livroData.codigoBarras || null,
      precoCusto: livroData.precoCusto,
      estoque: livroData.estoque,
      dataEntrada: livroData.dataEntrada
    };
    formData.append('livro', new Blob([JSON.stringify(livro)], { type: 'application/json' }));
    if (imagem) {
      formData.append('imagem', imagem);
    }

    const token = this.authService.getToken();
    const headers: any = {};
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const response = await this.livroService.salvarComImagem(livroData.id, {
      headers: headers,
      body: formData
    });

    if (response.ok) {
      this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Livro salvo com sucesso!' });
      this.adminModals.fecharFormulario();
      this.carregarLivros();
      this.carregarCategorias();
      return;
    }

    const detalhe = await this.mensagemErro(response, 'Não foi possível salvar o livro.');
    this.messageService.add({ severity: 'error', summary: 'Erro', detail: detalhe });
  } catch (error) {
    console.error('Erro ao salvar livro:', error);
    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao conectar ao servidor.' });
  }
}

  abrirExcluir(livro: any): void {
    this.adminModals.abrirExcluir(() => this.confirmarExcluir(livro));
  }

  async confirmarExcluir(livro: any): Promise<void> {
    try {
      const token = this.authService.getToken();
      const response = await this.livroService.excluir(livro.id, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (response.ok) {
        this.messageService.add({severity:'success', summary:'Sucesso', detail:'Livro excluído com sucesso!'});
        this.carregarLivros();
        this.carregarCategorias();
      } else {
        this.messageService.add({severity:'error', summary:'Erro', detail:await this.mensagemErro(response, 'Erro ao excluir livro')});
      }
    } catch (error) {
      this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao conectar ao servidor'});
    }
  }

  abrirStatus(livro: any, ativo: boolean): void {
    this.adminModals.abrirStatus(ativo, () => this.confirmarStatus(livro, ativo));
  }

  async confirmarStatus(livro: any, ativo: boolean): Promise<void> {
    try {
      const token = this.authService.getToken();
      const response = await this.livroService.alterarStatus(livro.id, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          ativo: ativo,
          motivo: this.adminModals.motivoStatus
        })
      });

      if (response.ok) {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: `Livro ${ativo ? 'ativado' : 'inativado'} com sucesso!`
        });
        this.carregarLivros();
      } else {
        this.messageService.add({severity:'error', summary:'Erro', detail:await this.mensagemErro(response, 'Erro ao alterar status')});
      }
    } catch (error) {
      this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao conectar ao servidor'});
    }
  }

  abrirDetalhes(livro: any): void {
    this.adminModals.abrirDetalhes(livro, []);
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
}





