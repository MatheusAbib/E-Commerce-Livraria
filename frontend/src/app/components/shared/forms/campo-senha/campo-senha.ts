import { Component, Input, forwardRef, booleanAttribute } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CampoDirective, CampoAparencia } from '../campo/campo';

@Component({
  selector: 'app-campo-senha',
  standalone: true,
  imports: [CampoDirective],
  templateUrl: './campo-senha.html',
  styleUrl: './campo-senha.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CampoSenhaComponent),
      multi: true
    }
  ]
})
export class CampoSenhaComponent implements ControlValueAccessor {
  @Input() campoId = '';
  @Input() placeholder = 'Digite sua senha';
  @Input() autocomplete = 'current-password';
  @Input() aparencia: CampoAparencia = 'autenticacao';
  @Input() descricaoId = '';
  @Input() rotulo = 'Senha';
  @Input() maxlength: number | null = null;
  @Input({ transform: booleanAttribute }) invalido = false;
  @Input({ transform: booleanAttribute }) obrigatorio = false;
  @Input({ transform: booleanAttribute }) somenteLeitura = false;

  valor = '';
  visivel = false;
  desabilitado = false;

  private onChange: (valor: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(valor: string | null): void {
    this.valor = valor ?? '';

    if (!this.valor) {
      this.visivel = false;
    }
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.desabilitado = desabilitado;

    if (desabilitado) {
      this.visivel = false;
    }
  }

  atualizarValor(evento: Event): void {
    this.valor = (evento.target as HTMLInputElement).value;
    this.onChange(this.valor);
  }

  marcarTocado(): void {
    this.onTouched();
  }

  alternarVisibilidade(): void {
    if (!this.desabilitado) {
      this.visivel = !this.visivel;
    }
  }
}
