import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { PaginatorModule } from 'primeng/paginator';
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar';
import { BotaoComponent, BotaoIconeComponent, GrupoAcoesComponent } from '../../../components/shared/buttons';
import { CampoDirective, CampoSelecaoComponent, OpcaoSelecao } from '../../../components/shared/forms';
import { CampoArquivoComponent, ErroArquivo } from '../../../components/shared/forms/campo-arquivo/campo-arquivo';
import { ImagemPreviewComponent } from '../../../components/shared/forms/imagem-preview/imagem-preview';
import { CarregamentoComponent, EstadoVazioComponent, NotificacaoComponent } from '../../../components/shared/feedback';
import { ModalBaseComponent } from '../../../components/shared/modals/modal-base/modal-base';
import { ModalCabecalhoComponent } from '../../../components/shared/modals/modal-cabecalho/modal-cabecalho';
import { ModalCorpoComponent } from '../../../components/shared/modals/modal-corpo/modal-corpo';
import { ModalRodapeComponent } from '../../../components/shared/modals/modal-rodape/modal-rodape';
import { ModalConfirmacaoComponent } from '../../../components/shared/modals/modal-confirmacao/modal-confirmacao';
import { AutorService } from '../../../services/autor.service';
import { environment } from '../../../../environments/environment';
import type { Autor, AutorFormulario } from '../../../models/autor.model';

@Component({
  selector: 'app-autores-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginatorModule,
    AdminSidebarComponent,
    BotaoComponent,
    BotaoIconeComponent,
    GrupoAcoesComponent,
    CampoDirective,
    CampoSelecaoComponent,
    CampoArquivoComponent,
    ImagemPreviewComponent,
    CarregamentoComponent,
    EstadoVazioComponent,
    NotificacaoComponent,
    ModalBaseComponent,
    ModalCabecalhoComponent,
    ModalCorpoComponent,
    ModalRodapeComponent,
    ModalConfirmacaoComponent
  ],
  providers: [MessageService],
  templateUrl: './autores.html',
  styleUrls: ['../admin-common.css', './autores.css']
})
export class AutoresComponent implements OnInit {
  autores: Autor[] = [];
  autoresFiltrados: Autor[] = [];
  loading = true;
  erroCarregamento = false;
  importando = false;
  salvando = false;
  confirmando = false;

  busca = '';
  status = '';
  cadastro = '';
  first = 0;
  rows = 10;

  modal: 'cadastro' | 'edicao' | 'detalhes' | null = null;
  selecionado: Autor | null = null;
  arquivo: File | null = null;
  retornarDetalhes = false;
  confirmacao: 'status' | 'exclusao' | null = null;
  alvoConfirmacao: Autor | null = null;

  formulario: AutorFormulario = {
    nome: '',
    biografiaUrl: '',
    ativo: true
  };

  readonly opcoesStatus: OpcaoSelecao<string>[] = [
    { rotulo: 'Todos', valor: '' },
    { rotulo: 'Ativos', valor: 'ativo' },
    { rotulo: 'Inativos', valor: 'inativo' }
  ];

  readonly opcoesCadastro: OpcaoSelecao<string>[] = [
    { rotulo: 'Todos', valor: '' },
    { rotulo: 'Completo', valor: 'completo' },
    { rotulo: 'Incompleto', valor: 'incompleto' }
  ];

  readonly opcoesFormulario: OpcaoSelecao<string>[] = [
    { rotulo: 'Ativo', valor: 'ativo' },
    { rotulo: 'Inativo', valor: 'inativo' }
  ];

  constructor(
    private autorService: AutorService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    void this.carregar();
  }

  get totalAtivos(): number {
    return this.autores.filter(autor => autor.ativo).length;
  }

  get totalInativos(): number {
    return this.autores.length - this.totalAtivos;
  }

  get totalIncompletos(): number {
    return this.autores.filter(autor => !autor.completo).length;
  }

  get autoresPaginados(): Autor[] {
    return this.autoresFiltrados.slice(this.first, this.first + this.rows);
  }

  get origemImagem(): File | string | null {
    return this.arquivo || this.urlImagem(this.selecionado);
  }

  get tituloModal(): string {
    if (this.modal === 'detalhes') return 'Detalhes do autor';
    if (this.modal === 'edicao') return 'Editar autor';
    return 'Novo autor';
  }

  get formularioValido(): boolean {
    const nome = this.formulario.nome.trim();
    const link = this.formulario.biografiaUrl.trim();

    return nome.length > 0
      && nome.length <= 255
      && (!link || this.linkValido(link));
  }

  get tituloConfirmacao(): string {
    if (this.confirmacao === 'exclusao') return 'Excluir autor';
    return this.alvoConfirmacao?.ativo ? 'Inativar autor' : 'Ativar autor';
  }

  get mensagemConfirmacao(): string {
    const nome = this.alvoConfirmacao?.nome || '';

    if (this.confirmacao === 'exclusao') {
      return `Deseja excluir definitivamente o cadastro de ${nome}?`;
    }

    return this.alvoConfirmacao?.ativo
      ? `${nome} deixará de aparecer na seção pública de autores.`
      : `${nome} poderá aparecer na seção pública quando seu cadastro estiver completo.`;
  }

  async carregar(): Promise<void> {
    this.loading = true;
    this.erroCarregamento = false;
    this.cdr.markForCheck();

    try {
      this.autores = await firstValueFrom(this.autorService.listar());
      this.aplicarFiltros(false);
    } catch (erro) {
      this.erroCarregamento = true;
      this.notificarErro(erro, 'Não foi possível carregar os autores.');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  aplicarFiltros(reiniciar = true): void {
    const busca = this.normalizar(this.busca);

    this.autoresFiltrados = this.autores.filter(autor => {
      const nomeValido = this.normalizar(autor.nome).includes(busca);
      const statusValido = !this.status || autor.ativo === (this.status === 'ativo');
      const cadastroValido = !this.cadastro || autor.completo === (this.cadastro === 'completo');

      return nomeValido && statusValido && cadastroValido;
    });

    this.first = reiniciar
      ? 0
      : Math.min(this.first, Math.max(0, Math.floor((this.autoresFiltrados.length - 1) / this.rows) * this.rows));
  }

  limparFiltros(): void {
    this.busca = '';
    this.status = '';
    this.cadastro = '';
    this.aplicarFiltros();
  }

  alterarPagina(evento: any): void {
    this.first = evento.first ?? 0;
    this.rows = evento.rows ?? 10;
  }

  async importar(): Promise<void> {
    if (this.importando) return;

    this.importando = true;

    try {
      const resultado = await firstValueFrom(this.autorService.importar());

      this.messageService.add({
        severity: 'success',
        summary: 'Importação concluída',
        detail: resultado.importados === 0
          ? 'Todos os autores do acervo já estão cadastrados.'
          : `${resultado.importados} novo(s) autor(es) importado(s).`
      });

      await this.carregar();
    } catch (erro) {
      this.notificarErro(erro, 'Não foi possível importar os autores.');
    } finally {
      this.importando = false;
      this.cdr.markForCheck();
    }
  }

  abrirCadastro(): void {
    this.selecionado = null;
    this.arquivo = null;
    this.retornarDetalhes = false;
    this.formulario = { nome: '', biografiaUrl: '', ativo: true };
    this.modal = 'cadastro';
  }

  abrirDetalhes(autor: Autor): void {
    this.selecionado = autor;
    this.arquivo = null;
    this.retornarDetalhes = false;
    this.modal = 'detalhes';
  }

  abrirEdicao(autor: Autor): void {
    this.retornarDetalhes = this.modal === 'detalhes';
    this.selecionado = autor;
    this.arquivo = null;

    this.formulario = {
      nome: autor.nome,
      biografiaUrl: autor.biografiaUrl || '',
      ativo: autor.ativo
    };

    this.modal = 'edicao';
  }

  cancelarFormulario(): void {
    if (this.salvando) return;

    if (this.retornarDetalhes && this.selecionado) {
      this.abrirDetalhes(this.selecionado);
      return;
    }

    this.fecharModal();
  }

  fecharModal(): void {
    if (this.salvando) return;

    this.modal = null;
    this.selecionado = null;
    this.arquivo = null;
    this.retornarDetalhes = false;
  }

  selecionarImagem(arquivos: File[]): void {
    this.arquivo = arquivos[0] || null;
  }

  errosImagem(erros: ErroArquivo[]): void {
    if (!erros.length) return;

    this.messageService.add({
      severity: 'warn',
      summary: 'Fotografia inválida',
      detail: erros[0].motivo
    });
  }

  async salvar(): Promise<void> {
    if (this.salvando || !this.formularioValido) return;

    this.salvando = true;
    const voltar = this.retornarDetalhes;

    try {
      const dados = {
        nome: this.formulario.nome.trim(),
        biografiaUrl: this.formulario.biografiaUrl.trim(),
        ativo: this.formulario.ativo
      };

      const autor = await firstValueFrom(
        this.autorService.salvar(dados, this.arquivo, this.selecionado?.id)
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Autor salvo com sucesso.'
      });

      this.salvando = false;

      if (voltar) {
        this.abrirDetalhes(autor);
      } else {
        this.fecharModal();
      }

      await this.carregar();
    } catch (erro) {
      this.notificarErro(erro, 'Não foi possível salvar o autor.');
    } finally {
      this.salvando = false;
      this.cdr.markForCheck();
    }
  }

  abrirConfirmacao(autor: Autor, tipo: 'status' | 'exclusao'): void {
    if (tipo === 'exclusao' && autor.quantidadeLivros > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Exclusão indisponível',
        detail: 'Este autor possui livros associados. Utilize a inativação.'
      });
      return;
    }

    this.alvoConfirmacao = autor;
    this.confirmacao = tipo;
  }

  cancelarConfirmacao(): void {
    if (this.confirmando) return;

    this.confirmacao = null;
    this.alvoConfirmacao = null;
  }

  async confirmar(): Promise<void> {
    if (!this.alvoConfirmacao || !this.confirmacao || this.confirmando) return;

    const autor = this.alvoConfirmacao;
    const tipo = this.confirmacao;

    this.confirmando = true;

    try {
      if (tipo === 'exclusao') {
        await firstValueFrom(this.autorService.excluir(autor.id));
      } else {
        await firstValueFrom(this.autorService.alterarStatus(autor.id, !autor.ativo));
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: tipo === 'exclusao'
          ? 'Autor excluído com sucesso.'
          : 'Status atualizado com sucesso.'
      });

      this.confirmando = false;
      this.cancelarConfirmacao();
      await this.carregar();
    } catch (erro) {
      this.notificarErro(erro, 'Não foi possível concluir a operação.');
    } finally {
      this.confirmando = false;
      this.cdr.markForCheck();
    }
  }

  urlImagem(autor: Autor | null): string | null {
    return autor?.id ? `${environment.apiUrl}/autores/${autor.id}/imagem` : null;
  }

  iniciais(nome: string): string {
    const partes = nome.trim().split(/\s+/);

    return (partes[0]?.charAt(0) || '') +
      (partes.length > 1 ? partes[partes.length - 1].charAt(0) : '');
  }

  corrigirImagem(evento: Event): void {
    (evento.target as HTMLImageElement).style.display = 'none';
  }

  private normalizar(valor: string): string {
    return valor.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private linkValido(valor: string): boolean {
    try {
      const url = new URL(valor);

      return ['http:', 'https:'].includes(url.protocol)
        && !!url.hostname
        && !url.username
        && !url.password
        && valor.length <= 2048;
    } catch {
      return false;
    }
  }

  private notificarErro(erro: any, fallback: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: erro?.error?.mensagem || erro?.error?.message || fallback
    });
  }
}

