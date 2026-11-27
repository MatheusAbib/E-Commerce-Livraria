export interface ItemCarrinho {
  id: number;
  livroId: number;
  titulo: string;
  autor: string;
  editora: string;
  categoria: string;
  imagemUrl: string | null;
  precoVenda: number;
  quantidade: number;
  estoqueFisico: number;
  estoqueReservado: number;
  estoqueDisponivel: number;
  quantidadeMaximaPermitida: number;
  ativo: boolean;
  adicionadoEm: string;
  subtotal: number;
}

export interface CarrinhoResponse {
  id: number | null;
  revisao: number | null;
  criadoEm: string | null;
  expiraEm: string | null;
  horarioServidor: string;
  segundosRestantes: number;
  quantidadeTotal: number;
  subtotal: number;
  vazio: boolean;
  expirado: boolean;
  itens: ItemCarrinho[];
}
