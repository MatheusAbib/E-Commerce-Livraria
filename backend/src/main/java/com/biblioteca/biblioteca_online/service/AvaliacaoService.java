package com.biblioteca.biblioteca_online.service;

import com.biblioteca.biblioteca_online.dto.AvaliacaoResumoDTO;
import com.biblioteca.biblioteca_online.dto.CriarAvaliacaoDTO;
import com.biblioteca.biblioteca_online.model.Avaliacao;
import com.biblioteca.biblioteca_online.model.Cliente;
import com.biblioteca.biblioteca_online.model.Livro;
import com.biblioteca.biblioteca_online.model.Pedido;
import com.biblioteca.biblioteca_online.model.Log;
import com.biblioteca.biblioteca_online.repository.AvaliacaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AvaliacaoService {

    @Autowired
    private AvaliacaoRepository avaliacaoRepository;

    @Autowired
    private ClienteService clienteService;

    @Autowired
    private LivroService livroService;

    @Autowired
    private PedidoService pedidoService;

    @Autowired
    private LogService logService;

    @Transactional
    public Avaliacao criarAvaliacao(CriarAvaliacaoDTO dto, Long clienteId) {
        Cliente cliente = clienteService.buscarPorId(clienteId)
            .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        Livro livro = livroService.buscarPorId(dto.getLivroId())
            .orElseThrow(() -> new RuntimeException("Livro não encontrado"));

        Pedido pedido = pedidoService.buscarPorId(dto.getPedidoId());

        if (avaliacaoRepository.existsByClienteIdAndPedidoIdAndLivroId(clienteId, dto.getPedidoId(), dto.getLivroId())) {
            throw new RuntimeException("Você já avaliou este livro neste pedido");
        }

        Avaliacao avaliacao = new Avaliacao();
        avaliacao.setCliente(cliente);
        avaliacao.setLivro(livro);
        avaliacao.setPedido(pedido);
        avaliacao.setNota(dto.getNota());
        avaliacao.setComentario(dto.getComentario());
        avaliacao.setDataAvaliacao(LocalDateTime.now());

        return avaliacaoRepository.save(avaliacao);
    }

    public List<Avaliacao> listarAvaliacoesPorLivro(Long livroId) {
        return avaliacaoRepository.findByLivroId(livroId);
    }

    public List<Avaliacao> listarAvaliacoesPorCliente(Long clienteId) {
        return avaliacaoRepository.findByClienteId(clienteId);
    }

    public AvaliacaoResumoDTO getResumoAvaliacoesPorLivro(Long livroId) {
        Double media = avaliacaoRepository.calcularMediaPorLivro(livroId);
        Long total = avaliacaoRepository.contarAvaliacoesPorLivro(livroId);
        Double notaMaxima = avaliacaoRepository.buscarNotaMaxima(livroId);
        Double notaMinima = avaliacaoRepository.buscarNotaMinima(livroId);

        if (media == null) {
            media = 0.0;
        }

        return new AvaliacaoResumoDTO(media, total, notaMaxima, notaMinima);
    }

    public boolean clienteJaAvaliou(Long clienteId, Long pedidoId, Long livroId) {
        return avaliacaoRepository.existsByClienteIdAndPedidoIdAndLivroId(clienteId, pedidoId, livroId);
    }

    @Transactional
    public void excluirAvaliacao(Long id) {
        Avaliacao avaliacao = avaliacaoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Avaliação não encontrada"));
        avaliacaoRepository.delete(avaliacao);
    }

    public List<Avaliacao> listarTodas() {
        return avaliacaoRepository.findAll();
    }

    @Transactional
    public Avaliacao atualizarAvaliacao(Long id, CriarAvaliacaoDTO dto, Long clienteId) {
        Avaliacao avaliacao = avaliacaoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Avaliação não encontrada"));

        if (!avaliacao.getCliente().getId().equals(clienteId)) {
            throw new RuntimeException("Você só pode editar suas próprias avaliações");
        }

        avaliacao.setNota(dto.getNota());
        avaliacao.setComentario(dto.getComentario());
        avaliacao.setDataAvaliacao(LocalDateTime.now());

        return avaliacaoRepository.save(avaliacao);
    }

    @Transactional
    public Avaliacao removerComentario(Long id) {
        Avaliacao avaliacao = avaliacaoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Avaliação não encontrada"));

        avaliacao.setComentario(null);
        avaliacao.setDataAvaliacao(LocalDateTime.now());

        Avaliacao avaliacaoAtualizada = avaliacaoRepository.save(avaliacao);

        try {
            Log log = new Log();
            log.setUserId(avaliacao.getCliente().getId());
            log.setAction("comentario_removido");
            log.setDetails("Comentário removido pelo admin da avaliação do livro: " +
                          avaliacao.getLivro().getTitulo());
            log.setLevel("info");
            logService.salvarLog(log);
        } catch (Exception e) {
        }

        return avaliacaoAtualizada;
    }
}
