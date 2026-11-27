export interface User {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  token?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}
