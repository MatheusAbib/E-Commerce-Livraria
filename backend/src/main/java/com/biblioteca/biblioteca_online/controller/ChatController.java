package com.biblioteca.biblioteca_online.controller;

import com.biblioteca.biblioteca_online.model.MensagemChat;
import com.biblioteca.biblioteca_online.model.Log;
import com.biblioteca.biblioteca_online.service.ChatService;
import com.biblioteca.biblioteca_online.service.LogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private LogService logService;

    @PostMapping("/cliente")
    public ResponseEntity<?> enviarMensagemCliente(
            @RequestParam Long pedidoId,
            @RequestParam Long clienteId,
            @RequestBody Map<String, String> body) {
        try {
            String mensagem = body.get("mensagem");
            MensagemChat msg = chatService.enviarMensagemCliente(pedidoId, clienteId, mensagem);
            
            try {
                Log log = new Log();
                log.setUserId(clienteId);
                log.setAction("chat_cliente");
                log.setDetails("Cliente enviou mensagem no pedido #" + pedidoId);
                log.setLevel("info");
                logService.salvarLog(log);
            } catch (Exception e) {
            }
            
            return ResponseEntity.ok(msg);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    @PostMapping("/admin")
    public ResponseEntity<?> enviarMensagemAdmin(
            @RequestParam Long pedidoId,
            @RequestBody Map<String, String> body) {
        try {
            String mensagem = body.get("mensagem");
            MensagemChat msg = chatService.enviarMensagemAdmin(pedidoId, mensagem);
            
            try {
                Log log = new Log();
                log.setAction("chat_admin");
                log.setDetails("Admin enviou mensagem no pedido #" + pedidoId);
                log.setLevel("info");
                logService.salvarLog(log);
            } catch (Exception e) {
            }
            
            return ResponseEntity.ok(msg);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    @GetMapping("/cliente/{pedidoId}")
    public ResponseEntity<List<MensagemChat>> getMensagensCliente(
            @PathVariable Long pedidoId,
            @RequestParam Long clienteId) {
        return ResponseEntity.ok(chatService.buscarMensagensCliente(pedidoId, clienteId));
    }

    @GetMapping("/admin/{pedidoId}")
    public ResponseEntity<List<MensagemChat>> getMensagensAdmin(@PathVariable Long pedidoId) {
        return ResponseEntity.ok(chatService.buscarMensagensPorPedido(pedidoId));
    }

    @GetMapping("/admin/conversas")
    public ResponseEntity<Map<Long, Map<String, Object>>> getConversasAdmin() {
        return ResponseEntity.ok(chatService.getResumoConversas());
    }

    @PutMapping("/cliente/{pedidoId}/ler")
    public ResponseEntity<?> marcarLidasCliente(@PathVariable Long pedidoId) {
        chatService.marcarMensagensClienteComoLidas(pedidoId);
        return ResponseEntity.ok(Map.of("mensagem", "Mensagens marcadas como lidas"));
    }

    @PutMapping("/admin/{pedidoId}/ler")
    public ResponseEntity<?> marcarLidasAdmin(@PathVariable Long pedidoId) {
        chatService.marcarMensagensAdminComoLidas(pedidoId);
        return ResponseEntity.ok(Map.of("mensagem", "Mensagens marcadas como lidas"));
    }

    @GetMapping("/cliente/{pedidoId}/nao-lidas")
    public ResponseEntity<Map<String, Long>> getNaoLidasCliente(@PathVariable Long pedidoId) {
        Long count = chatService.contarNaoLidasCliente(pedidoId);
        return ResponseEntity.ok(Map.of("naoLidas", count));
    }
    @PutMapping("/admin/{pedidoId}/encerrar")
    public ResponseEntity<?> encerrarAtendimento(@PathVariable Long pedidoId) {
        try {
            chatService.encerrarAtendimento(pedidoId);
            return ResponseEntity.ok(Map.of("mensagem", "Atendimento encerrado com sucesso"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
        }
    }

    @GetMapping("/admin/{pedidoId}/atendimento-ativo")
    public ResponseEntity<Map<String, Boolean>> isAtendimentoAtivo(@PathVariable Long pedidoId) {
        return ResponseEntity.ok(Map.of("ativo", chatService.isAtendimentoAtivo(pedidoId)));
    }

        @PutMapping("/cliente/{pedidoId}/encerrar")
        public ResponseEntity<?> encerrarAtendimentoCliente(@PathVariable Long pedidoId) {
            try {
                chatService.encerrarAtendimento(pedidoId);
                return ResponseEntity.ok(Map.of("mensagem", "Atendimento encerrado com sucesso"));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
            }
        }

        @PutMapping("/cliente/{pedidoId}/reativar")
        public ResponseEntity<?> reativarAtendimento(@PathVariable Long pedidoId) {
            try {
                chatService.reativarAtendimento(pedidoId);
                return ResponseEntity.ok(Map.of("mensagem", "Atendimento reativado com sucesso"));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
            }
        }

        @PutMapping("/admin/{pedidoId}/reativar")
public ResponseEntity<?> reativarAtendimentoAdmin(@PathVariable Long pedidoId) {
    try {
        chatService.reativarAtendimento(pedidoId);
        return ResponseEntity.ok(Map.of("mensagem", "Atendimento reativado com sucesso"));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
    }
}

@GetMapping("/admin/{pedidoId}/nao-lidas")
public ResponseEntity<Map<String, Long>> getNaoLidasAdmin(@PathVariable Long pedidoId) {
    Long count = chatService.contarNaoLidasAdmin(pedidoId);
    return ResponseEntity.ok(Map.of("naoLidas", count));
}

    @GetMapping("/admin/total-nao-lidas")
    public ResponseEntity<Map<String, Long>> getTotalNaoLidasAdmin() {
    try {
        Long total = chatService.getTotalNaoLidasAdmin();
        return ResponseEntity.ok(Map.of("total", total));
    } catch (Exception e) {
        return ResponseEntity.badRequest().build();
    }
}

@GetMapping("/cliente/{clienteId}/conversas")
public ResponseEntity<?> getConversasCliente(@PathVariable Long clienteId) {
    try {
        Map<String, List<Map<String, Object>>> resultado = chatService.getConversasCliente(clienteId);
        return ResponseEntity.ok(resultado);
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("mensagem", e.getMessage()));
    }
}
}
