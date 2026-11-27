export interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: string;
  data: string;
  lida: boolean;
  pedidoId?: number | null;
}
