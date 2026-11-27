import { Routes } from '@angular/router';
import { AdminGuard } from './guards/admin.guard';
import { CarrinhoGuard } from './guards/carrinho.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/principal', pathMatch: 'full' },
  { path: 'principal', loadComponent: () => import('./pages/principal/principal').then(m => m.Principal) },
    {
    path: 'carrinho',
    canActivate: [CarrinhoGuard],
    loadComponent: () => import('./pages/carrinho/carrinho').then(m => m.CarrinhoComponent)
  },
  { path: 'transacoes', loadComponent: () => import('./pages/transacoes/transacoes').then(m => m.TransacoesComponent) },
  { path: 'pedidos', loadComponent: () => import('./pages/pedidos/pedidos').then(m => m.PedidosComponent) },
  {
    path: 'admin',
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/admin/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'pedidos', loadComponent: () => import('./pages/admin/pedidosAdmin/pedidosAdmin').then(m => m.PedidosAdminComponent) },
      { path: 'livros', loadComponent: () => import('./pages/admin/livros/livros').then(m => m.LivrosComponent) },
      { path: 'autores', loadComponent: () => import('./pages/admin/autores/autores').then(m => m.AutoresComponent) },
      { path: 'Usuarios', loadComponent: () => import('./pages/admin/Usuarios/Usuarios').then(m => m.UsuariosComponent) },
      { path: 'logCompleto', loadComponent: () => import('./pages/admin/logCompleto/logCompleto').then(m => m.LogCompletoComponent) },
      { path: 'ranking', loadComponent: () => import('./pages/admin/ranking/ranking').then(m => m.RankingAdminComponent) },
      { path: 'avaliacoes', loadComponent: () => import('./pages/admin/avaliacoes/avaliacoes').then(m => m.AdminAvaliacoesComponent) },
      { path: 'chats', loadComponent: () => import('./pages/admin/adminChats/admin-chats').then(m => m.AdminChatsComponent) }
    ]
  },
  { path: '**', redirectTo: '/principal' }
];
