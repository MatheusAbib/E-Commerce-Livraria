import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  enviarMensagem(opcoes?: RequestInit): Promise<Response> {
    return fetch(`${environment.apiUrl}/chatbot`, opcoes);
  }
}
