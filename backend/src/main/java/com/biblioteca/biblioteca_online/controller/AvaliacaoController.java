
package com.biblioteca.biblioteca_online.controller;

import com.biblioteca.biblioteca_online.dto.AvaliacaoRespostaDTO;
import com.biblioteca.biblioteca_online.dto.AvaliacaoResumoDTO;
import com.biblioteca.biblioteca_online.dto.CriarAvaliacaoDTO;
import com.biblioteca.biblioteca_online.model.Avaliacao;
import com.biblioteca.biblioteca_online.model.Log;
import com.biblioteca.biblioteca_online.service.AvaliacaoService;
import com.biblioteca.biblioteca_online.service.LogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/avaliacoes")
public class AvaliacaoController {

    @Autowired
    private AvaliacaoService avaliacaoService;

    @Autowired
    private LogService logService;

    @PostMapping
    public ResponseEntity<?> criarAvaliacao(
        @RequestBody CriarAvaliacaoDTO dto,
        @RequestParam Long clienteId) {
        try {
            Avaliacao avaliacao = avaliacaoService.criarAvaliacao(dto, clienteId);

            try {
                Log log = new Log();
                log.setUserId(clienteId);
                log.setAction("avaliacao");
                log.setDetails("Avaliação criada para o livro ID " + dto.getLivroId() +
                               " - Nota: " + dto.getNota());
                log.setLevel("info");
                logService.salvarLog(log);
            } catch (Exception e) {
            }

            return ResponseEntity.ok(new AvaliacaoRespostaDTO(avaliacao));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                Map.of("mensagem", e.getMessage() != null ? e.getMessage() : "Erro ao criar avaliação")
            );
        }
    }

    @GetMapping("/livro/{livroId}")
    public ResponseEntity<List<AvaliacaoRespostaDTO>> listarAvaliacoesPorLivro(
        @PathVariable Long livroId) {

        List<AvaliacaoRespostaDTO> avaliacoes = avaliacaoService
            .listarAvaliacoesPorLivro(livroId)
            .stream()
            .map(AvaliacaoRespostaDTO::new)
            .toList();

        return ResponseEntity.ok(avaliacoes);
    }

    @GetMapping("/livro/{livroId}/resumo")
    public ResponseEntity<AvaliacaoResumoDTO> getResumoAvaliacoes(
        @PathVariable Long livroId) {

        return ResponseEntity.ok(
            avaliacaoService.getResumoAvaliacoesPorLivro(livroId)
        );
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<AvaliacaoRespostaDTO>> listarAvaliacoesPorCliente(
        @PathVariable Long clienteId) {

        List<AvaliacaoRespostaDTO> avaliacoes = avaliacaoService
            .listarAvaliacoesPorCliente(clienteId)
            .stream()
            .map(AvaliacaoRespostaDTO::new)
            .toList();

        return ResponseEntity.ok(avaliacoes);
    }

    @GetMapping("/verificar")
    public ResponseEntity<Map<String, Boolean>> verificarAvaliacao(
        @RequestParam Long clienteId,
        @RequestParam Long pedidoId,
        @RequestParam Long livroId) {

        boolean jaAvaliou = avaliacaoService.clienteJaAvaliou(
            clienteId,
            pedidoId,
            livroId
        );

        return ResponseEntity.ok(Map.of("jaAvaliou", jaAvaliou));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluirAvaliacao(@PathVariable Long id) {
        try {
            avaliacaoService.excluirAvaliacao(id);

            return ResponseEntity.ok(
                Map.of("mensagem", "Avaliação excluída com sucesso")
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                Map.of("mensagem", e.getMessage() != null ? e.getMessage() : "Erro ao excluir avaliação")
            );
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarAvaliacao(
        @PathVariable Long id,
        @RequestBody CriarAvaliacaoDTO dto,
        @RequestParam Long clienteId) {

        try {
            Avaliacao avaliacao = avaliacaoService.atualizarAvaliacao(
                id,
                dto,
                clienteId
            );

            return ResponseEntity.ok(new AvaliacaoRespostaDTO(avaliacao));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                Map.of("mensagem", e.getMessage() != null ? e.getMessage() : "Erro ao atualizar avaliação")
            );
        }
    }

    @GetMapping("/todas")
    public ResponseEntity<List<AvaliacaoRespostaDTO>> listarTodasAvaliacoes() {

        List<AvaliacaoRespostaDTO> avaliacoes = avaliacaoService
            .listarTodas()
            .stream()
            .map(AvaliacaoRespostaDTO::new)
            .toList();

        return ResponseEntity.ok(avaliacoes);
    }

    @PutMapping("/{id}/remover-comentario")
    public ResponseEntity<?> removerComentario(@PathVariable Long id) {
        try {
            Avaliacao avaliacao = avaliacaoService.removerComentario(id);

            try {
                String mensagem = "Seu comentário sobre o livro \"" +
                    avaliacao.getLivro().getTitulo() +
                    "\" foi removido pelo administrador.";

                logService.adicionarNotificacaoParaCliente(
                    avaliacao.getCliente().getId(),
                    "Comentário Removido",
                    mensagem,
                    "warning"
                );
            } catch (Exception e) {
            }

            return ResponseEntity.ok(new AvaliacaoRespostaDTO(avaliacao));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                Map.of("mensagem", e.getMessage() != null ? e.getMessage() : "Erro ao remover comentário")
            );
        }
    }
}
