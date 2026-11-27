import { Component, Input, Output, EventEmitter, forwardRef, numberAttribute, booleanAttribute } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BotaoIconeComponent } from '../../buttons/botao-icone/botao-icone';

@Component({
  selector: 'app-campo-quantidade',
  standalone: true,
  imports: [BotaoIconeComponent],
  templateUrl: './campo-quantidade.html',
  styleUrl: './campo-quantidade.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CampoQuantidadeComponent),
      multi: true
    }
  ],
  host: {
    '[attr.data-tamanho]': 'tamanho'
  }
})
export class CampoQuantidadeComponent implements ControlValueAccessor {
  @Input({ transform: numberAttribute }) minimo = 1;
  @Input({ transform: numberAttribute }) maximo = 3;
  @Input({ transform: numberAttribute }) passo = 1;
  @Input() tamanho: 'pequeno' | 'medio' | 'grande' = 'medio';
  @Input() rotulo = 'Quantidade';
  @Input({ transform: booleanAttribute }) carregando = false;
  @Input({ transform: booleanAttribute }) bloquearIncremento = false;
  @Input({ transform: booleanAttribute }) bloquearDecremento = false;

  @Input({ transform: booleanAttribute }) controlado = false;

  @Output() alteracaoSolicitada = new EventEmitter<number>();

  valor = 1;
  desabilitado = false;

  private onChange: (valor: number) => void = () => {};
  private onTouched: () => void = () => {};

  get passoValido(): boolean {
    return Number.isFinite(this.passo) && this.passo > 0;
  }

  get podeIncrementar(): boolean {
    return !this.desabilitado
      && !this.carregando
      && !this.bloquearIncremento
      && this.passoValido
      && this.valor < this.maximo
      && this.maximo >= this.minimo;
  }

  get podeDecrementar(): boolean {
    return !this.desabilitado
      && !this.carregando
      && !this.bloquearDecremento
      && this.passoValido
      && this.valor > this.minimo
      && this.maximo >= this.minimo;
  }

  writeValue(valor: number | null): void {
    this.valor = typeof valor === 'number' && Number.isFinite(valor)
      ? valor
      : this.minimo;
  }

  registerOnChange(fn: (valor: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.desabilitado = desabilitado;
  }

  incrementar(): void {
    if (this.podeIncrementar) {
      this.atualizarValor(Math.min(this.maximo, this.valor + this.passo));
    }
  }

  decrementar(): void {
    if (this.podeDecrementar) {
      this.atualizarValor(Math.max(this.minimo, this.valor - this.passo));
    }
  }

  marcarTocado(): void {
    this.onTouched();
  }

  private atualizarValor(valor: number): void {
    if (valor === this.valor) {
      return;
    }

    if (this.controlado) {
      this.alteracaoSolicitada.emit(valor - this.valor);
      this.onTouched();
      return;
    }

    this.valor = valor;
    this.onChange(valor);
  }
}
