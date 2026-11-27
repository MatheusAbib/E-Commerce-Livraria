import { TemplateRef } from '@angular/core';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';
import { BotaoIconeComponent } from '../../../components/shared/buttons';
import { CampoDirective } from '../../../components/shared/forms';

@Component({
  selector: 'app-principal-exploracao',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BotaoIconeComponent,
    CampoDirective,

  ],
  templateUrl: './exploracao.html',
  styleUrls: ['./exploracao.css']
})
export class ExploracaoComponent {
  @Input({ required: true }) cabecalhoSecao!: TemplateRef<any>;

  @Input() livros: any[] = [];

  @Output() catalogoSelecionado = new EventEmitter<void>();
  @Output() autorSelecionado = new EventEmitter<string>();
  @Output() generoSelecionado = new EventEmitter<string>();

  painelExploracao: 'autores' | 'generos' | null = null;
  buscaExploracaoAutor = '';
  buscaExploracaoGenero = '';

  get autoresDisponiveis(): string[] {
    return [...new Set(
      this.livros.map(livro => String(livro.autor || '').trim()).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  get generosDisponiveis(): string[] {
    return [...new Set(
      this.livros.map(livro => String(livro.categoria || '').trim()).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  get autoresExploracaoFiltrados(): string[] {
    const termo = this.normalizarBusca(this.buscaExploracaoAutor);

    return this.autoresDisponiveis.filter(
      autor => this.normalizarBusca(autor).includes(termo)
    );
  }

  get generosExploracaoFiltrados(): string[] {
    const termo = this.normalizarBusca(this.buscaExploracaoGenero);

    return this.generosDisponiveis.filter(
      genero => this.normalizarBusca(genero).includes(termo)
    );
  }

  private normalizarBusca(valor: string): string {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR')
      .trim();
  }

  quantidadePorAutor(autor: string): number {
    return this.livros.filter(livro => livro.autor === autor).length;
  }

  quantidadePorGenero(genero: string): number {
    return this.livros.filter(livro => livro.categoria === genero).length;
  }

  abrirExploracao(tipo: 'catalogo' | 'autores' | 'generos'): void {
    if (tipo === 'catalogo') {
      this.painelExploracao = null;
      this.catalogoSelecionado.emit();
      return;
    }

    this.painelExploracao = this.painelExploracao === tipo ? null : tipo;
  }

  selecionarAutor(autor: string): void {
    this.painelExploracao = null;
    this.autorSelecionado.emit(autor);
  }

  selecionarGenero(genero: string): void {
    this.painelExploracao = null;
    this.generoSelecionado.emit(genero);
  }
}
