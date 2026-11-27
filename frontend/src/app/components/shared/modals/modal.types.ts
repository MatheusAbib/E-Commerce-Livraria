export type ModalTamanho = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ModalAparencia = 'padrao' | 'confirmacao';

export type ModalVariante = 'neutro' | 'perigo' | 'sucesso' | 'aviso';

export type ModalMotivoFechamento = 'overlay' | 'escape' | 'botao';

export interface ModalRegistro {
  id: string;
  elemento: HTMLElement;
  focoAnterior: HTMLElement | null;
}
