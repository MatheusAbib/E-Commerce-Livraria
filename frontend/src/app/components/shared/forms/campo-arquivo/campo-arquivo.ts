import {
  Component,
  Input,
  Output,
  EventEmitter,
  booleanAttribute,
  numberAttribute
} from '@angular/core';

export interface ErroArquivo {
  arquivo: string;
  motivo: string;
}

@Component({
  selector: 'app-campo-arquivo',
  standalone: true,
  templateUrl: './campo-arquivo.html',
  styleUrl: './campo-arquivo.css'
})
export class CampoArquivoComponent {
  @Input() rotulo = 'Selecionar arquivo';
  @Input() descricao = '';
  @Input() aceitar = 'image/*';
  @Input({ transform: numberAttribute }) maximoArquivos = 1;
  @Input({ transform: numberAttribute }) tamanhoMaximoMB = 5;
  @Input({ transform: numberAttribute }) quantidadeExistente = 0;
  @Input({ transform: booleanAttribute }) multiplo = false;
  @Input({ transform: booleanAttribute }) desabilitado = false;

  @Output() arquivosSelecionados = new EventEmitter<File[]>();
  @Output() errosSelecao = new EventEmitter<ErroArquivo[]>();

  arrastando = false;

  get limiteDisponivel(): number {
    return Math.max(
      0,
      this.maximoArquivos - this.quantidadeExistente
    );
  }

  get bloqueado(): boolean {
    return this.desabilitado || this.limiteDisponivel <= 0;
  }

  selecionar(evento: Event): void {
    const input = evento.target as HTMLInputElement;

    this.processarArquivos(Array.from(input.files ?? []));

    input.value = '';
  }

  arrastar(evento: DragEvent): void {
    evento.preventDefault();

    if (!this.bloqueado) {
      this.arrastando = true;
    }
  }

  sair(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastando = false;
  }

  soltar(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastando = false;

    this.processarArquivos(
      Array.from(evento.dataTransfer?.files ?? [])
    );
  }

  private processarArquivos(arquivos: File[]): void {
    if (this.bloqueado || !arquivos.length) {
      return;
    }

    const validos: File[] = [];
    const erros: ErroArquivo[] = [];
    const limite = this.multiplo
      ? this.limiteDisponivel
      : Math.min(1, this.limiteDisponivel);

    for (const arquivo of arquivos) {
      if (!this.tipoPermitido(arquivo)) {
        erros.push({
          arquivo: arquivo.name,
          motivo: 'Formato de arquivo não permitido.'
        });

        continue;
      }

      if (arquivo.size > this.tamanhoMaximoMB * 1024 * 1024) {
        erros.push({
          arquivo: arquivo.name,
          motivo: 'O arquivo excede o limite de tamanho.'
        });

        continue;
      }

      if (validos.length >= limite) {
        erros.push({
          arquivo: arquivo.name,
          motivo: 'Limite de arquivos atingido.'
        });

        continue;
      }

      validos.push(arquivo);
    }

    this.errosSelecao.emit(erros);

    if (validos.length) {
      this.arquivosSelecionados.emit(validos);
    }
  }

  private tipoPermitido(arquivo: File): boolean {
    const regras = this.aceitar
      .split(',')
      .map(regra => regra.trim().toLowerCase())
      .filter(Boolean);

    if (!regras.length) {
      return true;
    }

    const tipo = arquivo.type.toLowerCase();
    const nome = arquivo.name.toLowerCase();

    return regras.some(regra => {
      if (regra.startsWith('.')) {
        return nome.endsWith(regra);
      }

      if (regra.endsWith('/*')) {
        return tipo.startsWith(regra.slice(0, -1));
      }

      return tipo === regra;
    });
  }
}
