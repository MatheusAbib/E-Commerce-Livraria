import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  forwardRef,
  booleanAttribute
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import {
  aplicarMascara,
  somenteDigitos,
  TipoMascara
} from './mascaras';

@Directive({
  selector: 'input[appMascara]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MascaraDirective),
      multi: true
    }
  ],
  host: {
    '(input)': 'atualizarValor($event)',
    '(blur)': 'marcarTocado()',
    '[attr.inputmode]': '"numeric"'
  }
})
export class MascaraDirective implements ControlValueAccessor, OnChanges {
  @Input({ required: true }) appMascara!: TipoMascara;
  @Input({ transform: booleanAttribute }) valorSemMascara = false;

  private onChange: (valor: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private readonly elemento: ElementRef<HTMLInputElement>
  ) {}

  ngOnChanges(alteracoes: SimpleChanges): void {
    if (alteracoes['appMascara'] && !alteracoes['appMascara'].firstChange) {
      const input = this.elemento.nativeElement;
      input.value = aplicarMascara(input.value, this.appMascara);
    }
  }

  writeValue(valor: string | number | null): void {
    this.elemento.nativeElement.value = aplicarMascara(
      String(valor ?? ''),
      this.appMascara
    );
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.elemento.nativeElement.disabled = desabilitado;
  }

  atualizarValor(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const posicao = input.selectionStart ?? input.value.length;
    const digitosAntes = somenteDigitos(input.value.slice(0, posicao)).length;

    const formatado = aplicarMascara(input.value, this.appMascara);

    input.value = formatado;

    let novaPosicao = 0;
    let encontrados = 0;

    while (
      novaPosicao < formatado.length &&
      encontrados < digitosAntes
    ) {
      if (/\d/.test(formatado[novaPosicao])) {
        encontrados++;
      }

      novaPosicao++;
    }

    if (digitosAntes >= somenteDigitos(formatado).length) {
      novaPosicao = formatado.length;
    }

    try {
      input.setSelectionRange(novaPosicao, novaPosicao);
    } catch {}

    this.onChange(
      this.valorSemMascara
        ? somenteDigitos(formatado)
        : formatado
    );
  }

  marcarTocado(): void {
    this.onTouched();
  }
}
