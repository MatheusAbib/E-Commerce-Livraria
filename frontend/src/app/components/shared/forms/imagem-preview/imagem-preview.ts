import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnDestroy,
  booleanAttribute
} from '@angular/core';
import { BotaoIconeComponent } from '../../buttons/botao-icone/botao-icone';

@Component({
  selector: 'app-imagem-preview',
  standalone: true,
  imports: [BotaoIconeComponent],
  templateUrl: './imagem-preview.html',
  styleUrl: './imagem-preview.css'
})
export class ImagemPreviewComponent implements OnChanges, OnDestroy {
  @Input() origem: string | File | null = null;
  @Input() descricao = 'Pré-visualização da imagem';
  @Input() ajuste: 'contain' | 'cover' = 'contain';
  @Input({ transform: booleanAttribute }) removivel = true;
  @Input({ transform: booleanAttribute }) desabilitado = false;

  @Output() remover = new EventEmitter<void>();

  url = '';
  falha = false;

  private urlTemporaria: string | null = null;

  ngOnChanges(): void {
    this.liberarUrl();
    this.falha = false;

    if (this.origem instanceof File) {
      this.urlTemporaria = URL.createObjectURL(this.origem);
      this.url = this.urlTemporaria;
      return;
    }

    this.url = this.origem ?? '';
  }

  ngOnDestroy(): void {
    this.liberarUrl();
  }

  solicitarRemocao(): void {
    if (!this.desabilitado && this.removivel) {
      this.remover.emit();
    }
  }

  private liberarUrl(): void {
    if (this.urlTemporaria) {
      URL.revokeObjectURL(this.urlTemporaria);
      this.urlTemporaria = null;
    }
  }
}
