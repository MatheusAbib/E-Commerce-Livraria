import { inject } from '@angular/core';
import { AvaliacaoService } from '../../../services/avaliacao.service';
import { ModalConfirmacaoComponent } from '../../../components/shared/modals';
import { CampoAvaliacaoComponent } from '../../../components/shared/forms';
import { NotificacaoComponent } from '../../../components/shared/feedback';
import { EstadoVazioComponent } from '../../../components/shared/feedback';
import { CarregamentoComponent } from '../../../components/shared/feedback';
import { CampoSelecaoComponent } from '../../../components/shared/forms';
import { CampoDirective } from '../../../components/shared/forms';
import { BotaoComponent } from '../../../components/shared/buttons/botao/botao';
import { BotaoIconeComponent } from '../../../components/shared/buttons/botao-icone/botao-icone';
import { GrupoAcoesComponent } from '../../../components/shared/buttons/grupo-acoes/grupo-acoes';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PaginatorModule } from 'primeng/paginator';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../services/auth';
import { AdminSidebarComponent } from "../../../components/admin-sidebar/admin-sidebar";


@Component({
  selector: 'app-admin-avaliacoes',
  standalone: true,
  imports: [ModalConfirmacaoComponent, CampoAvaliacaoComponent, NotificacaoComponent, EstadoVazioComponent, CarregamentoComponent, CampoSelecaoComponent, CampoDirective, 
    CommonModule,
    FormsModule,
    RouterModule,
    PaginatorModule,
    AdminSidebarComponent,
    BotaoComponent,
    BotaoIconeComponent,
    GrupoAcoesComponent
],
  providers: [MessageService],
  templateUrl: './avaliacoes.html',
  styleUrls: ['./avaliacoes.css', './../admin-common.css']
})
export class AdminAvaliacoesComponent implements OnInit {
  private readonly avaliacaoService = inject(AvaliacaoService);

  readonly opcoesNotasFiltro = [
    { rotulo: 'Todas', valor: '' },
    { rotulo: '1 ★', valor: '1' },
    { rotulo: '2 ★', valor: '2' },
    { rotulo: '3 ★', valor: '3' },
    { rotulo: '4 ★', valor: '4' },
    { rotulo: '5 ★', valor: '5' }
  ];

  avaliacoes: any[] = [];
  filteredAvaliacoes: any[] = [];
  loading: boolean = true;
  filtrando: boolean = false;

  filtroLivro: string = '';
  filtroCliente: string = '';
  filtroNota: string = '';

  displayExcluirModal: boolean = false;
  avaliacaoSelecionada: any = null;

  first: number = 0;
  rows: number = 10;
  totalRecords: number = 0;

  constructor(
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.carregarAvaliacoes();
  }

  async carregarAvaliacoes(): Promise<void> {
    this.loading = true;
    try {
      const token = this.authService.getToken();
      const response = await this.avaliacaoService.listarTodas({
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (response.ok) {
        this.avaliacoes = await response.json();
        this.filteredAvaliacoes = [...this.avaliacoes];
        this.totalRecords = this.filteredAvaliacoes.length;
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar avaliações'
        });
      }
    } catch (error) {
      console.error('Erro:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao carregar avaliações'
      });
    } finally {
      this.loading = false;
    }
  }

async aplicarFiltros(): Promise<void> {
  this.filtrando = true;
  this.loading = true;

  const inicio = Date.now();

  this.filteredAvaliacoes = this.avaliacoes.filter(a => {
    let match = true;

    if (this.filtroLivro) {
      match = match && a.livro?.titulo?.toLowerCase().includes(this.filtroLivro.toLowerCase());
    }

    if (this.filtroCliente) {
      match = match && a.cliente?.nome?.toLowerCase().includes(this.filtroCliente.toLowerCase());
    }

    if (this.filtroNota) {
      match = match && a.nota === parseInt(this.filtroNota);
    }

    return match;
  });

  this.totalRecords = this.filteredAvaliacoes.length;
  this.first = 0;

  const decorrido = Date.now() - inicio;
  const restante = Math.max(0, 500 - decorrido);

  setTimeout(() => {
    this.loading = false;
    this.filtrando = false;
  }, restante);
}

async limparFiltros(): Promise<void> {
  this.filtrando = true;
  this.loading = true;

  const inicio = Date.now();

  this.filtroLivro = '';
  this.filtroCliente = '';
  this.filtroNota = '';
  this.filteredAvaliacoes = [...this.avaliacoes];
  this.totalRecords = this.filteredAvaliacoes.length;
  this.first = 0;

  const decorrido = Date.now() - inicio;
  const restante = Math.max(0, 500 - decorrido);

  setTimeout(() => {
    this.loading = false;
    this.filtrando = false;
  }, restante);
}

  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
  }

  get avaliacoesPaginadas(): any[] {
    return this.filteredAvaliacoes.slice(this.first, this.first + this.rows);
  }

  abrirExcluir(avaliacao: any): void {
    this.avaliacaoSelecionada = avaliacao;
    this.displayExcluirModal = true;
  }

async confirmarExcluir(): Promise<void> {
  if (!this.avaliacaoSelecionada) return;

  try {
    const token = this.authService.getToken();
    const response = await this.avaliacaoService.removerComentario(this.avaliacaoSelecionada.id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    });

    if (response.ok) {
      const avaliacaoAtualizada = await response.json();

      const index = this.avaliacoes.findIndex(a => a.id === avaliacaoAtualizada.id);
      if (index !== -1) {
        this.avaliacoes[index] = avaliacaoAtualizada;
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Comentário removido com sucesso'
      });

      const user = this.authService.getUser();
      if (user) {
        const notificacoesPorUsuario = JSON.parse(localStorage.getItem('notificacoesPorUsuario') || '{}');
        const notificacoes = notificacoesPorUsuario[user.id] || [];

        notificacoes.push({
          id: Date.now(),
          titulo: 'Comentário Removido',
          mensagem: `Seu comentário sobre o livro "${avaliacaoAtualizada.livro?.titulo || 'Livro'}" foi removido pelo administrador.`,
          tipo: 'warning',
          lida: false,
          data: new Date().toISOString()
        });

        notificacoesPorUsuario[user.id] = notificacoes;
        localStorage.setItem('notificacoesPorUsuario', JSON.stringify(notificacoesPorUsuario));

        this.authService.adicionarNotificacao(
          'Comentário Removido',
          `Seu comentário sobre o livro "${avaliacaoAtualizada.livro?.titulo || 'Livro'}" foi removido pelo administrador.`,
          'warning'
        );
      }

      this.aplicarFiltros();
      this.displayExcluirModal = false;
      this.avaliacaoSelecionada = null;
    } else {
      const error = await response.json();
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: error.mensagem || 'Erro ao remover comentário'
      });
    }
  } catch (error) {
    console.error('Erro:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Erro ao remover comentário'
    });
  }
}

getTipoEstrelaAdmin(nota: number, estrelaIndex: number): string {
  if (!nota) return 'vazia';
  if (nota >= estrelaIndex + 1) {
    return 'cheia';
  } else if (nota > estrelaIndex && nota < estrelaIndex + 1) {
    return 'meia';
  } else {
    return 'vazia';
  }
}

  formatarData(data: string): string {
    if (!data) return '-';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
  }
}
