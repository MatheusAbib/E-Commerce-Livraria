import { TemplateRef } from '@angular/core';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CarregamentoComponent } from '../../../components/shared/feedback';

@Component({
  selector: 'app-principal-mais-vendidos',
  standalone: true,
  imports: [CommonModule, CarregamentoComponent],
  templateUrl: './mais-vendidos.html',
  styleUrls: ['./mais-vendidos.css']
})
export class MaisVendidosComponent {
  @Input({ required: true }) cabecalhoSecao!: TemplateRef<any>;

  @Input() maisVendidos: any[] = [];
  @Input() carregandoMaisVendidos = false;

  @Output() livroSelecionado = new EventEmitter<any>();

  verDetalhes(livro: any): void {
    this.livroSelecionado.emit(livro);
  }
}
