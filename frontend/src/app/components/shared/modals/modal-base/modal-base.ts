import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  HostListener,
  booleanAttribute,
  inject
} from '@angular/core';
import { CarregamentoComponent } from '../../feedback';
import { ModalService } from '../modal.service';
import {
  ModalAparencia,
  ModalTamanho,
  ModalMotivoFechamento
} from '../modal.types';

@Component({
  selector: 'app-modal-base',
  standalone: true,
  imports: [CarregamentoComponent],
  templateUrl: './modal-base.html',
  styleUrls: ['./modal-base.css']
})
export class ModalBaseComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly modalService = inject(ModalService);

  readonly id = this.modalService.gerarId();

  @Input({ transform: booleanAttribute }) visivel = false;
  @Input({ transform: booleanAttribute }) telaInteiraMobile = false;
  @Input({ transform: booleanAttribute }) lateral = false;
  @Input() tamanho: ModalTamanho = 'md';
  @Input() largura = '';
  @Input() altura = '';
  @Input() alturaMaxima = '';
  @Input() larguraMaxima = '100%';
  @Input() aparencia: ModalAparencia = 'padrao';
  @Input() rotulo = 'Janela de diálogo';
  @Input() tituloId = '';
  @Input() descricaoId = '';
  @Input() textoCarregamento = 'Processando...';
  @Input({ transform: booleanAttribute }) fecharAoClicarFora = true;
  @Input({ transform: booleanAttribute }) fecharComEscape = true;
  @Input({ transform: booleanAttribute }) bloqueado = false;
  @Input({ transform: booleanAttribute }) carregando = false;

  @Output() fechar = new EventEmitter<ModalMotivoFechamento>();

  @ViewChild('painel', { static: true })
  private painel!: ElementRef<HTMLElement>;

  private inicializado = false;

  get larguraEfetiva(): string {
    return this.largura || `var(--modal-largura-${this.tamanho})`;
  }

  get superior(): boolean {
    return this.modalService.ehSuperior(this.id);
  }

  get indice(): number {
    return this.modalService.obterIndice(this.id);
  }

  get fechamentoBloqueado(): boolean {
    return this.bloqueado || this.carregando;
  }

  ngAfterViewInit(): void {
    this.inicializado = true;
    this.sincronizar();
  }

  ngOnChanges(): void {
    if (this.inicializado) {
      this.sincronizar();
    }
  }

  ngOnDestroy(): void {
    this.modalService.remover(this.id);
  }

  solicitarFechamento(motivo: ModalMotivoFechamento): void {
    if (!this.visivel || !this.superior || this.fechamentoBloqueado) return;
    if (motivo === 'overlay' && !this.fecharAoClicarFora) return;
    if (motivo === 'escape' && !this.fecharComEscape) return;

    this.fechar.emit(motivo);
  }

  @HostListener('document:keydown', ['$event'])
  aoPressionarTecla(evento: KeyboardEvent): void {
    if (!this.visivel || !this.superior || evento.defaultPrevented) return;

    if (evento.key === 'Escape') {
      if (!this.fecharComEscape || this.fechamentoBloqueado) return;

      evento.preventDefault();
      this.solicitarFechamento('escape');
    }

    if (evento.key === 'Tab') {
      this.modalService.controlarTab(evento, this.painel.nativeElement);
    }
  }

  @HostListener('document:focusin', ['$event'])
  aoMudarFoco(evento: FocusEvent): void {
    if (!this.visivel || !this.superior) return;

    const alvo = evento.target;

    if (alvo instanceof Node && !this.painel.nativeElement.contains(alvo)) {
      this.modalService.focarInicial(this.painel.nativeElement);
    }
  }

  private sincronizar(): void {
    if (this.visivel) {
      this.modalService.registrar(this.id, this.painel.nativeElement);
    } else {
      this.modalService.remover(this.id);
    }
  }
}
