import { Component, Input, forwardRef, booleanAttribute } from '@angular/core';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CampoDirective, CampoAparencia } from '../campo/campo';

export interface OpcaoSelecao<T = unknown> {
  rotulo: string;
  valor: T;
  desabilitado?: boolean;
}

@Component({
  selector: 'app-campo-selecao',
  standalone: true,
  imports: [FormsModule, CampoDirective],
  templateUrl: './campo-selecao.html',
  styleUrl: './campo-selecao.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CampoSelecaoComponent),
      multi: true
    }
  ]
})
export class CampoSelecaoComponent implements ControlValueAccessor {
  @Input() campoId = '';
  @Input() rotulo = 'Selecione uma opção';
  @Input() placeholder = 'Selecione';
  @Input() descricaoId = '';
  @Input() aparencia: CampoAparencia = 'padrao';
  @Input() opcoes: readonly OpcaoSelecao[] = [];
  @Input() valorVazio: unknown = null;
  @Input() comparar: (a: unknown, b: unknown) => boolean = Object.is;
  @Input({ transform: booleanAttribute }) invalido = false;
  @Input({ transform: booleanAttribute }) obrigatorio = false;
  @Input({ transform: booleanAttribute }) exibirPlaceholder = true;

  valor: unknown = null;
  desabilitado = false;

  private onChange: (valor: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(valor: unknown): void {
    this.valor = valor;
  }

  registerOnChange(fn: (valor: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.desabilitado = desabilitado;
  }

  atualizarValor(valor: unknown): void {
    if (this.desabilitado) {
      return;
    }

    this.valor = valor;
    this.onChange(valor);
  }

  marcarTocado(): void {
    this.onTouched();
  }
}
