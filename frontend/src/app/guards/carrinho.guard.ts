import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const CarrinhoGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const resultado = await authService.verificarAcessoCarrinho();

  return resultado.permitido
    ? true
    : router.createUrlTree(['/principal']);
};
