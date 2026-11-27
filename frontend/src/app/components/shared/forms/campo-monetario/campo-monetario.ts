import { Component, Input, forwardRef, booleanAttribute, numberAttribute } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CampoDirective, CampoAparencia } from '../campo/campo';

@Component({
  selector: 'app-campo-monetario',
  standalone: true,
  imports: [CampoDirective],
  templateUrl: './campo-monetario.html',
  styleUrl: './campo-monetario.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CampoMonetarioComponent),
      multi: true
    }
  ]
})
export class CampoMonetarioComponent implements ControlValueAccessor {
  @Input() campoId = '';
  @Input() rotulo = 'Valor monetário';
  @Input() placeholder = '0,00';
  @Input() descricaoId = '';
  @Input() aparencia: CampoAparencia = 'padrao';
  @Input({ transform: numberAttribute }) maximo = 999999999.99;
  @Input({ transform: booleanAttribute }) invalido = false;
  @Input({ transform: booleanAttribute }) obrigatorio = false;
  @Input({ transform: booleanAttribute }) somenteLeitura = false;
  @Input({ transform: booleanAttribute }) exibirSimbolo = true;

  valor: number | null = null;
  texto = '';
  desabilitado = false;

  private readonly formatador = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  private onChange: (valor: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(valor: number | null): void {
    this.valor = typeof valor === 'number' && Number.isFinite(valor)
      ? valor
      : null;

    this.texto = this.valor === null
      ? ''
      : this.formatador.format(this.valor);
  }

  registerOnChange(fn: (valor: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.desabilitado = desabilitado;
  }

  atualizarValor(evento: Event): void {
    if (this.desabilitado || this.somenteLeitura) {
      return;
    }

    const input = evento.target as HTMLInputElement;
    const digitos = input.value.replace(/\D/g, '');

    if (!digitos) {
      this.valor = null;
      this.texto = '';
      input.value = '';
      this.onChange(null);
      return;
    }

    const centavos = Number(digitos);

    if (!Number.isSafeInteger(centavos) || centavos / 100 > this.maximo) {
      input.value = this.texto;
      return;
    }

    this.valor = centavos / 100;
    this.texto = this.formatador.format(this.valor);
    input.value = this.texto;

    this.onChange(this.valor);
  }

  marcarTocado(): void {
    this.onTouched();
  }
}
