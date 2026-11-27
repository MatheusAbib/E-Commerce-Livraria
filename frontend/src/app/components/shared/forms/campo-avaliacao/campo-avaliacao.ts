import {
  Component,
  Input,
  forwardRef,
  booleanAttribute,
  numberAttribute
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';

@Component({
  selector: 'app-campo-avaliacao',
  standalone: true,
  templateUrl: './campo-avaliacao.html',
  styleUrl: './campo-avaliacao.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CampoAvaliacaoComponent),
      multi: true
    }
  ],
  host: {
    '[attr.data-tamanho]': 'tamanho',
    '[class.somente-leitura]': 'somenteLeitura'
  }
})
export class CampoAvaliacaoComponent implements ControlValueAccessor {
  @Input({ transform: numberAttribute }) maximo = 5;
  @Input() tamanho: 'pequeno' | 'medio' | 'grande' = 'medio';
  @Input() rotulo = 'Avaliação';
  @Input({ transform: booleanAttribute }) somenteLeitura = false;
  @Input({ transform: booleanAttribute }) permitirMeiaEstrela = false;
  @Input({ transform: booleanAttribute }) permitirLimpar = false;
  @Input({ transform: booleanAttribute }) exibirValor = false;

  @Input({ transform: booleanAttribute }) alternanciaProgressiva = false;

  valor = 0;
  valorTemporario: number | null = null;
  desabilitado = false;

  private onChange: (valor: number) => void = () => {};
  private onTouched: () => void = () => {};

  get limite(): number {
    return Number.isFinite(this.maximo)
      ? Math.min(10, Math.max(1, Math.floor(this.maximo)))
      : 5;
  }

  get estrelas(): number[] {
    return Array.from(
      { length: this.limite },
      (_, indice) => indice + 1
    );
  }

  get valorExibido(): number {
    return this.valorTemporario ?? this.valor;
  }

  get bloqueado(): boolean {
    return this.desabilitado || this.somenteLeitura;
  }

  get passo(): number {
    return this.permitirMeiaEstrela ? 0.5 : 1;
  }

  writeValue(valor: number | null): void {
    this.valor = typeof valor === 'number' && Number.isFinite(valor)
      ? Math.min(this.limite, Math.max(0, valor))
      : 0;

    this.valorTemporario = null;
  }

  registerOnChange(fn: (valor: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.desabilitado = desabilitado;

    if (desabilitado) {
      this.valorTemporario = null;
    }
  }

  preenchimento(estrela: number): number {
    return Math.min(
      100,
      Math.max(0, (this.valorExibido - estrela + 1) * 100)
    );
  }

  selecionar(valor: number): void {
    if (this.bloqueado) {
      return;
    }

    const novoValor = this.permitirLimpar && valor === this.valor
      ? 0
      : valor;

    this.atualizarValor(novoValor);
  }

  selecionarEstrela(estrela: number, evento: MouseEvent): void {
    if (this.bloqueado) {
      return;
    }

    if (this.alternanciaProgressiva && this.permitirMeiaEstrela) {
      const indice = estrela - 1;

      if (this.valor === indice + 0.5) {
        this.atualizarValor(indice);
      } else if (this.valor === estrela) {
        this.atualizarValor(indice + 0.5);
      } else if (this.valor <= indice) {
        this.atualizarValor(estrela);
      } else {
        this.atualizarValor(indice + 0.5);
      }

      return;
    }

    this.selecionar(this.calcularValor(estrela, evento));
  }

  visualizar(estrela: number, evento: MouseEvent): void {
    if (!this.bloqueado && !this.alternanciaProgressiva) {
      this.valorTemporario = this.calcularValor(estrela, evento);
    }
  }

  limparVisualizacao(): void {
    this.valorTemporario = null;
  }

  marcarTocado(): void {
    this.onTouched();
  }

  navegar(evento: KeyboardEvent): void {
    if (this.bloqueado) {
      return;
    }

    let novoValor = this.valor;

    switch (evento.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        novoValor += this.passo;
        break;

      case 'ArrowLeft':
      case 'ArrowDown':
        novoValor -= this.passo;
        break;

      case 'Home':
        novoValor = this.permitirLimpar ? 0 : this.passo;
        break;

      case 'End':
        novoValor = this.limite;
        break;

      default:
        return;
    }

    evento.preventDefault();
    this.atualizarValor(novoValor);
  }

  private calcularValor(
    estrela: number,
    evento: MouseEvent
  ): number {
    if (!this.permitirMeiaEstrela) {
      return estrela;
    }

    const elemento = evento.currentTarget as HTMLElement;
    const dimensoes = elemento.getBoundingClientRect();
    const metade = dimensoes.left + dimensoes.width / 2;

    return evento.clientX < metade
      ? estrela - 0.5
      : estrela;
  }

  private atualizarValor(valor: number): void {
    const minimo = this.permitirLimpar ? 0 : this.passo;

    const novoValor = Math.min(
      this.limite,
      Math.max(minimo, valor)
    );

    this.valorTemporario = null;

    if (novoValor !== this.valor) {
      this.valor = novoValor;
      this.onChange(novoValor);
    }

    this.onTouched();
  }
}
