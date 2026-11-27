import { inject } from '@angular/core';
import { FavoritoService } from '../../../services/favorito.service';
import { ModalBaseComponent, ModalCabecalhoComponent, ModalCorpoComponent } from '../../shared/modals';
import { NotificacaoComponent } from '../../../components/shared/feedback';
import { EstadoVazioComponent } from '../../../components/shared/feedback';
import { CarregamentoComponent } from '../../../components/shared/feedback';
import { BotaoIconeComponent } from '../../shared/buttons/botao-icone/botao-icone';
import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { CarrinhoService } from '../../../services/carrinho';
import { AuthService } from '../../../services/auth';
import { Router } from '@angular/router';


@Component({
  selector: 'app-favoritos-modal',
  standalone: true,
  imports: [NotificacaoComponent, EstadoVazioComponent, CarregamentoComponent, CommonModule, BotaoIconeComponent, ModalBaseComponent, ModalCabecalhoComponent, ModalCorpoComponent],
  providers: [MessageService],
  templateUrl: './favoritos-modal.html',
  styleUrls: ['./favoritos-modal.css']
})
export class FavoritosModalComponent implements OnInit {
  private readonly favoritoService = inject(FavoritoService);

  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  favoritos: any[] = [];
  loading: boolean = false;
  usuario: any = null;
  livro: any = null;

  carregandoRemover: { [key: number]: boolean } = {};
  carregandoCarrinho: { [key: number]: boolean } = {};

  constructor(
    private messageService: MessageService,
    public carrinhoService: CarrinhoService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('clienteLogado') || 'null');
    if (user) {
      this.usuario = user;
    }

    this.authService.favoritosAtualizados$.subscribe(() => {
      if (this.visible) {
        this.carregarFavoritos();
      }
    });
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.carregarFavoritos();
    }
  }

  fechar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cdr.detectChanges();
  }

  async carregarFavoritos(): Promise<void> {

    if (!this.usuario) {
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    try {
      const token = this.authService.getToken();
      const response = await this.favoritoService.listar(this.usuario.id, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        }
      });

      if (response.ok) {
        this.favoritos = await response.json();
        this.cdr.detectChanges();
      } else {
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  verDetalhes(livroId: number): void {
    this.router.navigate(['/principal'], { queryParams: { livroId: livroId } });
  }

  async removerFavorito(livroId: number): Promise<void> {
    if (this.carregandoRemover[livroId]) return;
    this.carregandoRemover[livroId] = true;

    if (!this.usuario) {
      this.carregandoRemover[livroId] = false;
      return;
    }

    try {
      const token = this.authService.getToken();
      const response = await this.favoritoService.remover(this.usuario.id, livroId, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (response.ok) {
        const livro = this.favoritos.find(l => l.id === livroId);

        this.favoritos = this.favoritos.filter(l => l.id !== livroId);
        this.cdr.detectChanges();

        this.messageService.add({
          severity: 'success',
          summary: 'Removido',
          detail: `${livro?.titulo || 'Livro'} removido dos favoritos`
        });

        const user = JSON.parse(localStorage.getItem('clienteLogado') || 'null');
        if (user) {
          const tokenCount = this.authService.getToken();
          const responseCount = await this.favoritoService.listar(user.id, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + tokenCount
            }
          });
          if (responseCount.ok) {
            const favoritos = await responseCount.json();
            this.authService.atualizarFavoritosCount(favoritos.length);
          }
        }

        this.authService.notificarFavoritosAtualizados();
      }
    } catch (error) {
      this.messageService.add({severity:'error', summary:'Erro', detail:'Erro ao remover favorito'});
    } finally {
      this.carregandoRemover[livroId] = false;
    }
  }

  estoqueDisponivel(livro: any): number {
    return Math.max(0, Number(livro.estoqueDisponivel ?? livro.estoque ?? 0));
  }

  async adicionarAoCarrinho(livroId: number): Promise<void> {
    if (this.carregandoCarrinho[livroId]) return;
    this.carregandoCarrinho[livroId] = true;
    try {
      if (!this.authService.isAuthenticated()) {
        throw new Error('Faça login para comprar');
      }
      const livro = this.favoritos.find(l => l.id === livroId);
      if (!livro || !livro.ativo) throw new Error('Livro indisponível');
      const acesso = await this.authService.verificarAcessoCarrinho();
      if (!acesso.permitido) throw new Error(acesso.mensagem);
      const carrinho = await this.carrinhoService.adicionarAoCarrinho(livroId, 1);
      const item = carrinho.itens.find(i => i.livroId === livroId);
      if (item) livro.estoqueDisponivel = item.estoqueDisponivel;
      this.messageService.add({severity:'success', summary:'Sucesso', detail:'Adicionado ao carrinho!'});
      this.authService.adicionarNotificacao('Carrinho', 'Produto adicionado ao carrinho', 'success');
    } catch (erro) {
      this.messageService.add({severity:'error', summary:'Erro', detail:this.carrinhoService.obterMensagemErro(erro)});
    } finally {
      this.carregandoCarrinho[livroId] = false;
      this.cdr.detectChanges();
    }
  }
}
