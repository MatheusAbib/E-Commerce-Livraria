
package com.biblioteca.biblioteca_online.controller;

import com.biblioteca.biblioteca_online.model.Cliente;
import com.biblioteca.biblioteca_online.model.Notificacao;
import com.biblioteca.biblioteca_online.service.ClienteService;
import com.biblioteca.biblioteca_online.service.NotificacaoService;
import com.biblioteca.biblioteca_online.service.PedidoAccessService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notificacoes")
public class NotificacaoController {

    private final NotificacaoService notificacaoService;
    private final ClienteService clienteService;
    private final PedidoAccessService pedidoAccessService;

    public NotificacaoController(
            NotificacaoService notificacaoService,
            ClienteService clienteService,
            PedidoAccessService pedidoAccessService
    ) {
        this.notificacaoService = notificacaoService;
        this.clienteService = clienteService;
        this.pedidoAccessService = pedidoAccessService;
    }

    @GetMapping
    public ResponseEntity<List<Notificacao>> listarNotificacoes(
            @RequestParam Long clienteId
    ) {
        validarAcesso(clienteId);

        return ResponseEntity.ok(
                notificacaoService.listarPorCliente(clienteId)
        );
    }

    @GetMapping("/nao-lidas")
    public ResponseEntity<Map<String, Long>> contarNaoLidas(
            @RequestParam Long clienteId
    ) {
        validarAcesso(clienteId);

        return ResponseEntity.ok(
                Map.of(
                        "quantidade",
                        notificacaoService.contarNaoLidas(clienteId)
                )
        );
    }

    @PutMapping("/{id}/lida")
    public ResponseEntity<Notificacao> marcarComoLida(
            @PathVariable Long id,
            @RequestParam Long clienteId
    ) {
        validarAcesso(clienteId);

        return ResponseEntity.ok(
                notificacaoService.marcarComoLida(id, clienteId)
        );
    }

    @PutMapping("/marcar-todas-lidas")
    public ResponseEntity<Map<String, String>> marcarTodasComoLidas(
            @RequestParam Long clienteId
    ) {
        validarAcesso(clienteId);

        notificacaoService.marcarTodasComoLidas(clienteId);

        return ResponseEntity.ok(
                Map.of("mensagem", "Todas as notificações foram marcadas como lidas")
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirNotificacao(
            @PathVariable Long id,
            @RequestParam Long clienteId
    ) {
        validarAcesso(clienteId);

        notificacaoService.excluirNotificacao(id, clienteId);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> excluirTodas(
            @RequestParam Long clienteId
    ) {
        validarAcesso(clienteId);

        notificacaoService.excluirTodas(clienteId);

        return ResponseEntity.ok(
                Map.of("mensagem", "Todas as notificações foram excluídas")
        );
    }

    private void validarAcesso(Long clienteId) {
        String emailAutenticado = pedidoAccessService.obterEmailAutenticado();

        Cliente cliente = clienteService.buscarPorId(clienteId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Cliente não encontrado"
                ));

        if (cliente.getEmail() == null ||
                !cliente.getEmail().equalsIgnoreCase(emailAutenticado)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Você não tem permissão para acessar estas notificações"
            );
        }
    }
}
