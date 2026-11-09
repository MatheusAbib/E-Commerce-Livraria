
package com.biblioteca.biblioteca_online.service;

import com.biblioteca.biblioteca_online.model.Cliente;
import com.biblioteca.biblioteca_online.model.Notificacao;
import com.biblioteca.biblioteca_online.repository.NotificacaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificacaoService {

    private final NotificacaoRepository notificacaoRepository;

    public NotificacaoService(NotificacaoRepository notificacaoRepository) {
        this.notificacaoRepository = notificacaoRepository;
    }

    @Transactional
    public Notificacao criarNotificacao(
            Cliente cliente,
            String titulo,
            String mensagem,
            String tipo,
            Long pedidoId
    ) {
        if (cliente == null || cliente.getId() == null) {
            throw new IllegalArgumentException("Cliente inválido");
        }

        if (titulo == null || titulo.isBlank()) {
            throw new IllegalArgumentException("Título da notificação é obrigatório");
        }

        if (mensagem == null || mensagem.isBlank()) {
            throw new IllegalArgumentException("Mensagem da notificação é obrigatória");
        }

        Notificacao notificacao = new Notificacao(
                cliente,
                titulo,
                mensagem,
                tipo == null || tipo.isBlank() ? "info" : tipo,
                pedidoId
        );

        return notificacaoRepository.save(notificacao);
    }

    @Transactional(readOnly = true)
    public List<Notificacao> listarPorCliente(Long clienteId) {
        return notificacaoRepository.findByClienteIdOrderByDataDesc(clienteId);
    }

    @Transactional(readOnly = true)
    public long contarNaoLidas(Long clienteId) {
        return notificacaoRepository.countByClienteIdAndLidaFalse(clienteId);
    }

    @Transactional
    public Notificacao marcarComoLida(Long notificacaoId, Long clienteId) {
        Notificacao notificacao = notificacaoRepository
                .findByIdAndClienteId(notificacaoId, clienteId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Notificação não encontrada para este cliente"
                ));

        notificacao.setLida(true);

        return notificacaoRepository.save(notificacao);
    }

    @Transactional
    public void marcarTodasComoLidas(Long clienteId) {
        List<Notificacao> notificacoes = notificacaoRepository
                .findByClienteIdOrderByDataDesc(clienteId);

        for (Notificacao notificacao : notificacoes) {
            if (!Boolean.TRUE.equals(notificacao.getLida())) {
                notificacao.setLida(true);
            }
        }

        notificacaoRepository.saveAll(notificacoes);
    }

    @Transactional
    public void excluirNotificacao(Long notificacaoId, Long clienteId) {
        Notificacao notificacao = notificacaoRepository
                .findByIdAndClienteId(notificacaoId, clienteId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Notificação não encontrada para este cliente"
                ));

        notificacaoRepository.delete(notificacao);
    }

    @Transactional
    public void excluirTodas(Long clienteId) {
        notificacaoRepository.deleteByClienteId(clienteId);
    }
}
