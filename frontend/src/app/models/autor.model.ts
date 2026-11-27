export interface Autor {
  id: number;
  nome: string;
  imagemUrl: string | null;
  temImagem: boolean;
  biografiaUrl: string | null;
  ativo: boolean;
  completo: boolean;
  quantidadeLivros: number;
  dataCadastro: string;
  dataAtualizacao: string;
}

export interface AutorFormulario {
  nome: string;
  biografiaUrl: string;
  ativo: boolean;
}
