import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BotaoComponent } from '../shared/buttons';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, BotaoComponent],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class FooterComponent implements OnInit {
  constructor(private router: Router) {}

  get paginaInicial(): boolean {
    const rota = this.router.url.split(/[?#]/)[0];
    return rota === '/' || rota === '/principal';
  }
  anoAtual: number = new Date().getFullYear();
  isLoggedIn: boolean = false;

  voltarAoTopo(): void {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    });
  }

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('clienteLogado') || 'null');
    this.isLoggedIn = !!user;
  }
}
