import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BotaoComponent } from '../../../components/shared/buttons';

interface LivroAbertura {
  ativo?: boolean;
  id?: number;
  titulo?: string;
  imagemUrl?: string;
  autor?: string;
  categoria?: string;
}

interface EstrelaAbertura {
  x: number;
  y: number;
  escala: number;
}

interface PontoAbertura {
  x: number;
  y: number;
  r: number;
}

@Component({
  selector: 'app-principal-abertura',
  standalone: true,
  imports: [CommonModule, BotaoComponent],
  templateUrl: './abertura.html',
  styleUrls: ['./abertura.css']
})
export class AberturaComponent implements OnInit, OnDestroy {
  private diaAtual = '';
  private intervaloRotacao?: ReturnType<typeof setInterval>;

  constructor(private cdr: ChangeDetectorRef) {}
  @Output() livroSelecionado = new EventEmitter<LivroAbertura>();
  private acervo: LivroAbertura[] = [];

  capas: LivroAbertura[] = [];
  totalLivros = 0;
  totalAutores = 0;
  totalGeneros = 0;

readonly estrelas: EstrelaAbertura[] = [
    { x: 110, y: 85, escala: .75 },
    { x: 245, y: 145, escala: .45 },
    { x: 390, y: 65, escala: .8 },
    { x: 535, y: 160, escala: .45 },
    { x: 680, y: 85, escala: .65 },
    { x: 820, y: 175, escala: .45 },
    { x: 970, y: 60, escala: .85 },
    { x: 1130, y: 135, escala: .45 },
    { x: 1300, y: 55, escala: .7 },
    { x: 125, y: 370, escala: .6 },
    { x: 280, y: 460, escala: .45 },
    { x: 435, y: 320, escala: .8 },
    { x: 590, y: 435, escala: .5 },
    { x: 745, y: 300, escala: .7 },
    { x: 920, y: 410, escala: .5 },
    { x: 1080, y: 270, escala: .65 },
    { x: 1240, y: 390, escala: .85 },
    { x: 160, y: 570, escala: .65 },
    { x: 320, y: 690, escala: .4 },
    { x: 490, y: 555, escala: .7 },
    { x: 660, y: 675, escala: .5 },
    { x: 830, y: 545, escala: .7 },
    { x: 1010, y: 650, escala: .45 },
    { x: 1190, y: 525, escala: .75 }
  ];

  readonly pontos: PontoAbertura[] = Array.from(
    { length: 76 },
    (_, i) => ({
      x: (i * 173 + 41) % 1440,
      y: (i * 127 + 29) % 760,
      r: i % 7 === 0 ? 1.8 : i % 3 === 0 ? 1.2 : .65
    })
  );

  @Input()
  set livros(valor: LivroAbertura[] | null | undefined) {
    this.acervo = Array.isArray(valor) ? valor : [];

    this.totalLivros = this.acervo.length;

    this.totalAutores = this.contarDistintos(
      this.acervo.map(livro => livro.autor)
    );

    this.totalGeneros = this.contarDistintos(
      this.acervo.map(livro => livro.categoria)
    );

    this.atualizarCapas();
  }

  get livros(): LivroAbertura[] {
    return this.acervo;
  }

  private contarDistintos(valores: (string | undefined)[]): number {
    return new Set(
      valores
        .filter(valor => typeof valor === 'string' && valor.trim())
        .map(valor => valor!.trim().toLocaleLowerCase('pt-BR'))
    ).size;
  }

  private obterDiaAtual(): string {
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  }

  private gerarSemente(valor: string): number {
    let hash = 2166136261;

    for (let i = 0; i < valor.length; i++) {
      hash ^= valor.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  private embaralharLivros(
    livros: LivroAbertura[],
    dia: string
  ): LivroAbertura[] {
    const resultado = [...livros].sort((a, b) =>
      (a.id ?? 0) - (b.id ?? 0)
    );

    let semente = this.gerarSemente(dia);

    for (let i = resultado.length - 1; i > 0; i--) {
      semente = (Math.imul(semente, 1664525) + 1013904223) >>> 0;

      const j = Math.floor(
        (semente / 4294967296) * (i + 1)
      );

      [resultado[i], resultado[j]] = [
        resultado[j],
        resultado[i]
      ];
    }

    return resultado;
  }

  private atualizarCapas(): void {
    const dia = this.obterDiaAtual();
    const imagens = new Set<string>();

    const livrosAtivos = this.acervo.filter(
      livro => livro.ativo === true
    );

    const livrosEmbaralhados = this.embaralharLivros(
      livrosAtivos,
      dia
    );

    this.capas = livrosEmbaralhados.filter(livro => {
      if (!livro.imagemUrl || imagens.has(livro.imagemUrl)) {
        return false;
      }

      imagens.add(livro.imagemUrl);
      return true;
    }).slice(0, 12);

    if (!this.capas.length && livrosAtivos.length) {
      this.capas = livrosEmbaralhados.slice(0, 1);
    }

    this.diaAtual = dia;
  }

  ngOnInit(): void {
    this.intervaloRotacao = setInterval(() => {
      if (this.obterDiaAtual() !== this.diaAtual) {
        this.atualizarCapas();
        this.cdr.markForCheck();
      }
    }, 15000);
  }

  ngOnDestroy(): void {
    if (this.intervaloRotacao !== undefined) {
      clearInterval(this.intervaloRotacao);
    }
  }

  private progresso(indice: number): number {
    if (this.capas.length <= 1) {
      return .45;
    }

    return indice / (this.capas.length - 1);
  }

  posicaoX(indice: number): number {
    const progresso = this.progresso(indice);
    return 65 - progresso * 62;
  }

  posicaoY(indice: number): number {
    const progresso = this.progresso(indice);
    return 3 + progresso * 52;
  }

  larguraLivro(indice: number): number {
    const progresso = this.progresso(indice);
    return 34 - progresso * 14;
  }

  numeroLivro(indice: number): string {
    return String(Math.max(0, indice + 1)).padStart(2, '0');
  }

  identificarLivro(indice: number, livro: LivroAbertura): number | string {
    return livro.id ?? livro.imagemUrl ?? indice;
  }

  verCatalogo(): void {
    document.getElementById('produtos')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start'
    });
  }

  corrigirImagem(evento: Event): void {
    const imagem = evento.target as HTMLImageElement;

    if (!imagem.src.endsWith('/images/livro.png')) {
      imagem.src = '/images/livro.png';
    }
  }

}
