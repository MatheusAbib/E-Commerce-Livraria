import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  TemplateRef,
  DestroyRef,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  NgZone,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BotaoIconeComponent } from '../../../components/shared/buttons';
import { AutorService } from '../../../services/autor.service';
import type { Autor } from '../../../models/autor.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-principal-autores',
  standalone: true,
  imports: [CommonModule, BotaoIconeComponent],
  templateUrl: './autores.html',
  styleUrls: ['./autores.css']
})
export class AutoresComponent implements OnInit, OnDestroy {
  @Input({ required: true }) cabecalhoSecao!: TemplateRef<any>;
  @ViewChild('trilho') trilho?: ElementRef<HTMLElement>;

  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  private readonly velocidade = 35;

  private frame = 0;
  private ultimoTempo = 0;
  private fracao = 0;
  private larguraCiclo = 0;
  private visivel = false;
  private mouseSobre = false;
  private interagindo = false;
  private retomarEm = 0;
  private observador?: IntersectionObserver;
  private observadorTamanho?: ResizeObserver;
  private movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)');

  autores: Autor[] = [];
  autoresExibidos: Autor[] = [];
  carregando = true;
  podeVoltar = false;
  podeAvancar = false;
  loopAtivo = false;
  pausado = this.movimentoReduzido.matches;

  constructor(
    private autorService: AutorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.autorService.listarPublicos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: autores => {
          this.autores = autores.filter(autor =>
            autor.ativo &&
            autor.completo &&
            autor.temImagem &&
            this.linkValido(autor.biografiaUrl)
          );

          this.autoresExibidos = [...this.autores];
          this.carregando = false;
          this.cdr.detectChanges();
          this.inicializarCarrossel();
        },
        error: () => {
          this.carregando = false;
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    this.observador?.disconnect();
    this.observadorTamanho?.disconnect();
  }

  private inicializarCarrossel(): void {
    const elemento = this.trilho?.nativeElement;

    if (!elemento) return;

    this.atualizarNavegacao();

    this.zone.runOutsideAngular(() => {
      this.observador = new IntersectionObserver(entradas => {
        this.visivel = entradas.some(entrada => entrada.isIntersecting);
      }, { threshold: 0.1 });

      this.observador.observe(elemento);

      this.observadorTamanho = new ResizeObserver(() => {
        this.zone.run(() => this.atualizarNavegacao());
      });

      this.observadorTamanho.observe(elemento);
      this.frame = requestAnimationFrame(this.animar);
    });
  }

  private animar = (tempo: number): void => {
    const elemento = this.trilho?.nativeElement;
    const intervalo = this.ultimoTempo
      ? Math.min(tempo - this.ultimoTempo, 50)
      : 0;

    this.ultimoTempo = tempo;

    if (
      elemento &&
      this.loopAtivo &&
      this.visivel &&
      !this.pausado &&
      !this.mouseSobre &&
      !this.interagindo &&
      !document.hidden &&
      !this.movimentoReduzido.matches &&
      !elemento.contains(document.activeElement) &&
      tempo >= this.retomarEm
    ) {
      this.fracao += this.velocidade * intervalo / 1000;

      const deslocamento = Math.floor(this.fracao);

      if (deslocamento > 0) {
        this.fracao -= deslocamento;
        elemento.scrollLeft += deslocamento;
        this.normalizarPosicao();
      }
    } else {
      this.fracao = 0;
    }

    this.frame = requestAnimationFrame(this.animar);
  };

  atualizarNavegacao(): void {
    const elemento = this.trilho?.nativeElement;
    const primeiro = elemento?.firstElementChild as HTMLElement | null;

    if (!elemento || !primeiro || !this.autores.length) return;

    const larguraCard = primeiro.getBoundingClientRect().width;
    const novoCiclo = larguraCard * this.autores.length;
    const novoLoop = novoCiclo > elemento.clientWidth + 2;
    const alterouLoop = novoLoop !== this.loopAtivo;
    const alterouLargura = Math.abs(novoCiclo - this.larguraCiclo) > 1;

    this.larguraCiclo = novoCiclo;

    if (alterouLoop) {
      this.loopAtivo = novoLoop;

      this.autoresExibidos = novoLoop
        ? [...this.autores, ...this.autores, ...this.autores]
        : [...this.autores];

      this.cdr.detectChanges();
    }

    if (alterouLoop || alterouLargura) {
      elemento.scrollLeft = this.loopAtivo ? this.larguraCiclo : 0;
    }

    this.podeVoltar = this.loopAtivo;
    this.podeAvancar = this.loopAtivo;
    this.cdr.markForCheck();
  }

  normalizarPosicao(): void {
    const elemento = this.trilho?.nativeElement;

    if (!elemento || !this.loopAtivo || !this.larguraCiclo) return;

    if (elemento.scrollLeft >= this.larguraCiclo * 2) {
      elemento.scrollLeft -= this.larguraCiclo;
    } else if (elemento.scrollLeft < this.larguraCiclo) {
      elemento.scrollLeft += this.larguraCiclo;
    }
  }

  navegar(direcao: number): void {
    const elemento = this.trilho?.nativeElement;

    if (!elemento || !this.loopAtivo) return;

    this.retomarEm = performance.now() + 2500;

    elemento.scrollBy({
      left: elemento.clientWidth * direcao,
      behavior: this.movimentoReduzido.matches ? 'auto' : 'smooth'
    });
  }

  alternarReproducao(): void {
    this.pausado = !this.pausado;
    this.retomarEm = performance.now() + 500;
  }

  definirMouseSobre(valor: boolean): void {
    this.mouseSobre = valor;
  }

  iniciarInteracao(): void {
    this.interagindo = true;
  }

  finalizarInteracao(): void {
    this.interagindo = false;
    this.retomarEm = performance.now() + 2000;
  }

  aoRolar(): void {
    if (!this.interagindo && performance.now() >= this.retomarEm) {
      this.normalizarPosicao();
    }
  }

  numeroAutor(indice: number): number {
    return indice % this.autores.length + 1;
  }

  urlImagem(autor: Autor): string {
    return autor?.id ? `${environment.apiUrl}/autores/${autor.id}/imagem` : '';
  }

  iniciais(nome: string): string {
    const partes = nome.trim().split(/\s+/);

    return (
      (partes[0]?.charAt(0) || '') +
      (partes.length > 1 ? partes[partes.length - 1].charAt(0) : '')
    ).toUpperCase();
  }

  corrigirImagem(evento: Event): void {
    (evento.target as HTMLImageElement).style.display = 'none';
  }

  identificarAutor(indice: number, autor: Autor): string {
    return `${autor.id}-${indice}`;
  }

  private linkValido(valor: string | null): boolean {
    if (!valor) return false;

    try {
      const url = new URL(valor);

      return ['http:', 'https:'].includes(url.protocol)
        && !url.username
        && !url.password;
    } catch {
      return false;
    }
  }
}