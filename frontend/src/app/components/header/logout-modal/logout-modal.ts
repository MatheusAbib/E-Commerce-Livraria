import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalConfirmacaoComponent } from '../../shared/modals';

@Component({
  selector: 'app-logout-modal',
  standalone: true,
  imports: [ModalConfirmacaoComponent],
  templateUrl: './logout-modal.html',
  styleUrls: ['./logout-modal.css']
})
export class LogoutModalComponent {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmar = new EventEmitter<void>();

  loading: boolean = false;

  fechar(): void {
    if (this.loading) return;

    this.visible = false;
    this.visibleChange.emit(false);
  }

  confirmarLogout(): void {
    if (this.loading) return;

    this.fechar();
    this.confirmar.emit();
  }
}