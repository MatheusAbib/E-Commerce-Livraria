package com.biblioteca.biblioteca_online.service;

import com.biblioteca.biblioteca_online.model.Livro;
import com.biblioteca.biblioteca_online.repository.ItemCarrinhoRepository;
import com.biblioteca.biblioteca_online.repository.LivroRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class EstoqueReservaService {

    private final ItemCarrinhoRepository itemCarrinhoRepository;
    private final LivroRepository livroRepository;

    public EstoqueReservaService(
        ItemCarrinhoRepository itemCarrinhoRepository,
        LivroRepository livroRepository
    ) {
        this.itemCarrinhoRepository = itemCarrinhoRepository;
        this.livroRepository = livroRepository;
    }

    public int obterEstoqueFisico(Livro livro) {
        return livro.getEstoque() == null
            ? 0
            : Math.max(0, livro.getEstoque());
    }

    public int obterEstoqueReservado(Long livroId, Instant agora) {
        Long quantidade = itemCarrinhoRepository
            .calcularQuantidadeReservada(livroId, agora);

        return quantidade == null
            ? 0
            : Math.toIntExact(quantidade);
    }

    public int obterEstoqueDisponivel(Livro livro, Instant agora) {
        int estoqueFisico = obterEstoqueFisico(livro);
        int estoqueReservado = obterEstoqueReservado(
            livro.getId(),
            agora
        );

        return Math.max(0, estoqueFisico - estoqueReservado);
    }

    public int obterEstoqueDisponivelParaCarrinho(
        Livro livro,
        Long carrinhoId,
        Instant agora
    ) {
        int estoqueFisico = obterEstoqueFisico(livro);

        Long quantidadeReservada;

        if (carrinhoId == null) {
            quantidadeReservada = itemCarrinhoRepository
                .calcularQuantidadeReservada(
                    livro.getId(),
                    agora
                );
        } else {
            quantidadeReservada = itemCarrinhoRepository
                .calcularQuantidadeReservadaPorOutrosCarrinhos(
                    livro.getId(),
                    carrinhoId,
                    agora
                );
        }

        int reservadoPorOutros = quantidadeReservada == null
            ? 0
            : Math.toIntExact(quantidadeReservada);

        return Math.max(0, estoqueFisico - reservadoPorOutros);
    }

    public Livro bloquearLivro(Long livroId) {
        return livroRepository.buscarPorIdComBloqueio(livroId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Livro não encontrado."
            ));
    }

    public void validarDisponibilidade(
        Livro livro,
        Long carrinhoId,
        int quantidade,
        Instant agora
    ) {
        if (quantidade <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "A quantidade deve ser maior que zero."
            );
        }

        if (!livro.isAtivo()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Este livro não está disponível."
            );
        }

        int disponivel = obterEstoqueDisponivelParaCarrinho(
            livro,
            carrinhoId,
            agora
        );

        if (quantidade > disponivel) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                disponivel == 0
                    ? "Não há unidades disponíveis deste livro no momento."
                    : "Existem apenas " + disponivel
                        + " unidades disponíveis para o seu carrinho."
            );
        }
    }

    public Map<Long, Integer> obterReservasPorLivro(Instant agora) {
        Map<Long, Integer> reservas = new HashMap<>();

        for (Object[] resultado :
            itemCarrinhoRepository.calcularQuantidadesReservadasPorLivro(agora)) {

            Long livroId = ((Number) resultado[0]).longValue();
            int quantidade = Math.toIntExact(
                ((Number) resultado[1]).longValue()
            );

            reservas.put(livroId, quantidade);
        }

        return reservas;
    }
}