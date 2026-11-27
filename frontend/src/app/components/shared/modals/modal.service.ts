import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { ModalRegistro } from './modal.types';

@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly documento = inject(DOCUMENT);
  private readonly registros = signal<ModalRegistro[]>([]);
  private contador = 0;
  private overflowAnterior = '';
  private paddingAnterior = '';

  readonly pilha = this.registros.asReadonly();

  gerarId(): string {
    return `modal-compartilhado-${++this.contador}`;
  }

  registrar(id: string, elemento: HTMLElement): void {
    if (this.registros().some(item => item.id === id)) return;

    const ativo = this.documento.activeElement;
    const focoAnterior = ativo instanceof HTMLElement ? ativo : null;

    if (this.registros().length === 0) {
      this.bloquearRolagem();
    }

    this.registros.update(itens => [
      ...itens,
      { id, elemento, focoAnterior }
    ]);

    this.documento.defaultView?.requestAnimationFrame(() => {
      if (this.ehSuperior(id)) {
        this.focarInicial(elemento);
      }
    });
  }

  remover(id: string): void {
    const itens = this.registros();
    const registro = itens.find(item => item.id === id);

    if (!registro) return;

    const eraSuperior = this.ehSuperior(id);
    const restantes = itens.filter(item => item.id !== id);

    this.registros.set(restantes);

    if (restantes.length === 0) {
      this.restaurarRolagem();
    }

    if (!eraSuperior) return;

    this.documento.defaultView?.requestAnimationFrame(() => {
      const superior = this.registros().at(-1);
      const anterior = registro.focoAnterior;

      if (superior) {
        if (anterior?.isConnected && superior.elemento.contains(anterior)) {
          anterior.focus({ preventScroll: true });
        } else {
          this.focarInicial(superior.elemento);
        }
      } else if (anterior?.isConnected) {
        anterior.focus({ preventScroll: true });
      }
    });
  }

  ehSuperior(id: string): boolean {
    return this.registros().at(-1)?.id === id;
  }

  obterIndice(id: string): number {
    return Math.max(0, this.registros().findIndex(item => item.id === id));
  }

  obterFocaveis(elemento: HTMLElement): HTMLElement[] {
    const seletor = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[contenteditable="true"]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    return Array.from(elemento.querySelectorAll<HTMLElement>(seletor))
      .filter(item =>
        item.tabIndex >= 0 &&
        !item.closest('[inert]') &&
        item.getClientRects().length > 0 &&
        this.documento.defaultView?.getComputedStyle(item).visibility !== 'hidden'
      );
  }

  focarInicial(elemento: HTMLElement): void {
    const focaveis = this.obterFocaveis(elemento);
    const preferido = focaveis.find(item => item.hasAttribute('data-modal-autofocus'));

    (preferido || elemento).focus({ preventScroll: true });
  }

  controlarTab(evento: KeyboardEvent, elemento: HTMLElement): void {
    const focaveis = this.obterFocaveis(elemento);

    if (focaveis.length === 0) {
      evento.preventDefault();
      elemento.focus();
      return;
    }

    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    const ativo = this.documento.activeElement;

    if (!elemento.contains(ativo) || ativo === elemento) {
      evento.preventDefault();
      (evento.shiftKey ? ultimo : primeiro).focus();
      return;
    }

    if (evento.shiftKey && ativo === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && ativo === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }

  private bloquearRolagem(): void {
    const body = this.documento.body;
    const janela = this.documento.defaultView;

    if (!janela) return;

    this.overflowAnterior = body.style.overflow;
    this.paddingAnterior = body.style.paddingRight;

    const larguraBarra = Math.max(
      0,
      janela.innerWidth - this.documento.documentElement.clientWidth
    );

    if (larguraBarra > 0) {
      const padding = parseFloat(janela.getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${padding + larguraBarra}px`;
    }

    body.style.overflow = 'hidden';
  }

  private restaurarRolagem(): void {
    this.documento.body.style.overflow = this.overflowAnterior;
    this.documento.body.style.paddingRight = this.paddingAnterior;
  }
}
