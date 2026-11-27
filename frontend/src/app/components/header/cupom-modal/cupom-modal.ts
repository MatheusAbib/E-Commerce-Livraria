import { inject } from '@angular/core';
import { CupomService } from '../../../services/cupom.service';
import { ModalBaseComponent, ModalCabecalhoComponent, ModalCorpoComponent } from '../../shared/modals';
import { NotificacaoComponent } from '../../../components/shared/feedback';
import { EstadoVazioComponent } from '../../../components/shared/feedback';
import { CarregamentoComponent } from '../../../components/shared/feedback';
import { BotaoComponent } from '../../shared/buttons/botao/botao';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../services/auth';


@Component({
  selector: 'app-cupom-modal',
  standalone: true,
  imports: [NotificacaoComponent, EstadoVazioComponent, CarregamentoComponent, CommonModule, BotaoComponent, ModalBaseComponent, ModalCabecalhoComponent, ModalCorpoComponent],
  providers: [MessageService],
  templateUrl: './cupom-modal.html',
  styleUrls: ['./cupom-modal.css']
})
export class CupomModalComponent implements OnInit {
  private readonly cupomService = inject(CupomService);

  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  usuario: any = null;
  carregando: boolean = false;
  abaAtiva: string = 'disponiveis';
  cuponsDisponiveis: any[] = [];
  cuponsUsados: any[] = [];

  carregandoCopiar: { [key: string]: boolean } = {};

  constructor(
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUser();
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.carregando = true;
      this.carregarCupons();
    }
  }

  async carregarCupons(): Promise<void> {
    const user = this.authService.getUser();
    if (!user) {
      this.carregando = false;
      return;
    }

    try {
      const token = this.authService.getToken();

      const [disponiveisRes, usadosRes] = await Promise.all([
        this.cupomService.listarDisponiveis(user.id, {
          headers: { 'Authorization': 'Bearer ' + token }
        }),
        this.cupomService.listarUsados(user.id, {
          headers: { 'Authorization': 'Bearer ' + token }
        })
      ]);

      if (disponiveisRes.ok) {
        this.cuponsDisponiveis = await disponiveisRes.json();
      }

      if (usadosRes.ok) {
        this.cuponsUsados = await usadosRes.json();
      }

      this.authService.atualizarCuponsCount(this.cuponsDisponiveis.length);

    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao carregar cupons'
      });
    } finally {
      this.carregando = false;
    }
  }

  copiarCupom(codigo: string): void {
    if (this.carregandoCopiar[codigo]) return;
    this.carregandoCopiar[codigo] = true;

    navigator.clipboard.writeText(codigo).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copiado!',
        detail: `Cupom ${codigo} copiado para a área de transferência`
      });
    }).catch(() => {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Não foi possível copiar o cupom'
      });
    }).finally(() => {
      this.carregandoCopiar[codigo] = false;
    });
  }

  isExpirando(dataExpiracao: string): boolean {
    if (!dataExpiracao) return false;
    const agora = new Date();
    const expiracao = new Date(dataExpiracao);
    const diff = (expiracao.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 3;
  }

  fechar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
