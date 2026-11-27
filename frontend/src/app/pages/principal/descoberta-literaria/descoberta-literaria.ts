import { TemplateRef } from '@angular/core';
import { Component, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BotaoComponent, BotaoIconeComponent, GrupoAcoesComponent } from '../../../components/shared/buttons';

interface LivroDescoberta {
  id: number;
  titulo: string;
  autor?: string;
  categoria?: string;
  paginas?: number;
  precoVenda: number;
  imagemUrl?: string;
  ativo: boolean;
  estoqueDisponivel?: number;
  quantidadeVendida?: number;
}

interface OpcaoDescoberta {
  valor: string;
  titulo: string;
  descricao: string;
  icone: string;
}

@Component({
  selector: 'app-principal-descoberta-literaria',
  standalone: true,
  imports: [CommonModule, BotaoComponent, BotaoIconeComponent, GrupoAcoesComponent],
  templateUrl: './descoberta-literaria.html',
  styleUrls: ['./descoberta-literaria.css']
})
export class DescobertaLiterariaComponent {
  @Input({ required: true }) cabecalhoSecao!: TemplateRef<any>;

  @Input() livros: LivroDescoberta[] = [];
  @Output() livroSelecionado = new EventEmitter<LivroDescoberta>();
  @ViewChild('painelPergunta') painelPergunta?: ElementRef<HTMLElement>;

  etapa = 0;
  genero = '';
  duracao = '';
  orcamento = '';
  paginaResultado = 0;

  readonly duracoes: OpcaoDescoberta[] = [
    {
      valor: 'curta',
      titulo: 'Uma leitura breve',
      descricao: 'Até 150 páginas',
      icone: 'pi pi-clock'
    },
    {
      valor: 'media',
      titulo: 'Alguns capítulos por dia',
      descricao: 'De 151 a 350 páginas',
      icone: 'pi pi-book'
    },
    {
      valor: 'longa',
      titulo: 'Uma longa jornada',
      descricao: 'Mais de 350 páginas',
      icone: 'pi pi-bookmark'
    },
    {
      valor: 'qualquer',
      titulo: 'Sem preferência',
      descricao: 'Qualquer quantidade de páginas',
      icone: 'pi pi-list'
    }
  ];

  readonly orcamentos: OpcaoDescoberta[] = [
    {
      valor: '30',
      titulo: 'Até R$ 30',
      descricao: 'Leituras mais econômicas',
      icone: 'pi pi-wallet'
    },
    {
      valor: '60',
      titulo: 'Até R$ 60',
      descricao: 'Um pouco mais de liberdade',
      icone: 'pi pi-wallet'
    },
    {
      valor: '100',
      titulo: 'Até R$ 100',
      descricao: 'Mais possibilidades de escolha',
      icone: 'pi pi-wallet'
    },
    {
      valor: 'qualquer',
      titulo: 'Sem limite definido',
      descricao: 'Todos os preços disponíveis',
      icone: 'pi pi-wallet'
    }
  ];

  get livrosDisponiveis(): LivroDescoberta[] {
    return this.livros.filter(livro =>
      livro.ativo === true &&
      Number(livro.estoqueDisponivel ?? 0) > 0 &&
      livro.precoVenda != null &&
      Number.isFinite(Number(livro.precoVenda)) &&
      Number(livro.precoVenda) >= 0
    );
  }

  get generos(): OpcaoDescoberta[] {
    const categorias = new Map<string, string>();

    for (const livro of this.livrosDisponiveis) {
      const nome = livro.categoria?.trim();

      if (nome) {
        categorias.set(this.normalizar(nome), nome);
      }
    }

    return [
      ...Array.from(categorias.entries())
        .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
        .map(([valor, titulo]) => ({
          valor,
          titulo,
          descricao: '',
          icone: 'pi pi-book'
        })),
      {
        valor: 'qualquer',
        titulo: 'Qualquer gênero',
        descricao: '',
        icone: 'pi pi-th-large'
      }
    ];
  }

  get opcoes(): OpcaoDescoberta[] {
    if (this.etapa === 1) return this.generos;
    if (this.etapa === 2) return this.duracoes;
    if (this.etapa === 3) return this.orcamentos;
    return [];
  }

  get respostaAtual(): string {
    if (this.etapa === 1) return this.genero;
    if (this.etapa === 2) return this.duracao;
    if (this.etapa === 3) return this.orcamento;
    return '';
  }

  get tituloPergunta(): string {
    if (this.etapa === 1) return 'O que você gosta de ler?';
    if (this.etapa === 2) return 'Quanto tempo quer dedicar à leitura?';
    if (this.etapa === 3) return 'Quanto pretende investir?';
    return '';
  }

  get descricaoPergunta(): string {
    if (this.etapa === 1) return 'Escolha um gênero do nosso acervo.';
    if (this.etapa === 2) return 'Selecione a extensão da sua próxima leitura.';
    if (this.etapa === 3) return 'Defina o valor máximo para encontrar seu próximo livro.';
    return '';
  }

  get recomendacoes(): LivroDescoberta[] {
    return this.livrosDisponiveis
      .filter(livro =>
        this.genero === 'qualquer' ||
        this.normalizar(livro.categoria ?? '') === this.genero
      )
      .filter(livro =>
        this.orcamento === 'qualquer' ||
        Number(livro.precoVenda) <= Number(this.orcamento)
      )
      .filter(livro => this.correspondeDuracao(livro))
      .sort((a, b) =>
        Number(b.quantidadeVendida ?? 0) -
        Number(a.quantidadeVendida ?? 0) ||
        a.titulo.localeCompare(b.titulo, 'pt-BR') ||
        a.id - b.id
      );
  }

  get totalPaginasResultado(): number {
    return Math.max(1, Math.ceil(this.recomendacoes.length / 3));
  }

  get resultadosVisiveis(): LivroDescoberta[] {
    const pagina = Math.min(
      this.paginaResultado,
      this.totalPaginasResultado - 1
    );

    return this.recomendacoes.slice(pagina * 3, pagina * 3 + 3);
  }

  get generoSelecionado(): string {
    return this.generos.find(opcao => opcao.valor === this.genero)?.titulo
      ?? 'Qualquer gênero';
  }

  get duracaoSelecionada(): string {
    return this.duracoes.find(opcao => opcao.valor === this.duracao)?.descricao
      ?? 'Qualquer quantidade de páginas';
  }

  get orcamentoSelecionado(): string {
    return this.orcamentos.find(opcao => opcao.valor === this.orcamento)?.titulo
      ?? 'Sem limite definido';
  }

  iniciar(): void {
    this.genero = '';
    this.duracao = '';
    this.orcamento = '';
    this.paginaResultado = 0;
    this.etapa = 1;
    this.focarPainel();
  }

  identificarOpcao(_index: number, opcao: OpcaoDescoberta): string {
    return opcao.valor;
  }

  selecionar(valor: string): void {
    if (this.etapa === 1) this.genero = valor;
    if (this.etapa === 2) this.duracao = valor;
    if (this.etapa === 3) this.orcamento = valor;
  }

  avancar(): void {
    if (!this.respostaAtual || this.etapa >= 4) return;

    this.etapa++;
    this.paginaResultado = 0;
    this.focarPainel();
  }

  voltar(): void {
    if (this.etapa <= 0) return;

    this.etapa--;
    this.paginaResultado = 0;
    this.focarPainel();
  }

  reiniciar(): void {
    this.iniciar();
  }

  encerrar(): void {
    this.etapa = 0;
    this.genero = '';
    this.duracao = '';
    this.orcamento = '';
    this.paginaResultado = 0;
    this.focarPainel();
  }

  alterarPagina(direcao: number): void {
    this.paginaResultado = Math.max(
      0,
      Math.min(
        this.totalPaginasResultado - 1,
        this.paginaResultado + direcao
      )
    );
  }

  abrirLivro(livro: LivroDescoberta): void {
    this.livroSelecionado.emit(livro);
  }

  corrigirImagem(evento: Event): void {
    const imagem = evento.target as HTMLImageElement;

    if (!imagem.src.endsWith('/images/livro.png')) {
      imagem.src = '/images/livro.png';
    }
  }

  private correspondeDuracao(livro: LivroDescoberta): boolean {
    if (this.duracao === 'qualquer') return true;

    const paginas = Number(livro.paginas ?? 0);

    if (paginas <= 0) return false;
    if (this.duracao === 'curta') return paginas <= 150;
    if (this.duracao === 'media') return paginas > 150 && paginas <= 350;
    if (this.duracao === 'longa') return paginas > 350;

    return true;
  }

  private normalizar(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private focarPainel(): void {
    setTimeout(() => {
      this.painelPergunta?.nativeElement.focus({ preventScroll: true });
    });
  }
}
