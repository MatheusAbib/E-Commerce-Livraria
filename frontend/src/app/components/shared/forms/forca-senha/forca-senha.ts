import { Component, Input, booleanAttribute } from '@angular/core';

export interface RequisitoSenha {
  rotulo: string;
  atendido: boolean;
}

@Component({
  selector: 'app-forca-senha',
  standalone: true,
  templateUrl: './forca-senha.html',
  styleUrl: './forca-senha.css'
})
export class ForcaSenhaComponent {
  @Input() nivel = 0;
  @Input() nivelMaximo = 5;
  @Input() rotulo = '';
  @Input() requisitos: RequisitoSenha[] = [];
  @Input({ transform: booleanAttribute }) exibirRequisitos = true;
  @Input({ transform: booleanAttribute }) visivel = true;

  get percentual(): number {
    if (this.nivelMaximo <= 0) {
      return 0;
    }

    return Math.min(100, Math.max(0, this.nivel / this.nivelMaximo * 100));
  }

  get classificacao(): string {
    if (this.percentual <= 40) {
      return 'fraca';
    }

    if (this.percentual <= 60) {
      return 'media';
    }

    if (this.percentual < 100) {
      return 'boa';
    }

    return 'forte';
  }

  get texto(): string {
    if (this.rotulo) {
      return this.rotulo;
    }

    const rotulos: Record<string, string> = {
      fraca: 'Fraca',
      media: 'Média',
      boa: 'Boa',
      forte: 'Forte'
    };

    return rotulos[this.classificacao];
  }
}
