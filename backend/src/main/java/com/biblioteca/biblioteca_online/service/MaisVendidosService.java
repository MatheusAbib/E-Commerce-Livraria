
package com.biblioteca.biblioteca_online.service;

import com.biblioteca.biblioteca_online.model.Livro;
import com.biblioteca.biblioteca_online.repository.PedidoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class MaisVendidosService {

    private final PedidoRepository pedidoRepository;
    private final LivroService livroService;

    public MaisVendidosService(
            PedidoRepository pedidoRepository,
            LivroService livroService) {
        this.pedidoRepository = pedidoRepository;
        this.livroService = livroService;
    }

    @Transactional(readOnly = true)
    public Map<Long, Long> buscarQuantidadesVendidas() {
        Map<Long, Long> quantidadesVendidas = new HashMap<>();

        for (Object[] resultado : pedidoRepository.calcularQuantidadesVendidasPorLivro()) {
            Long livroId = ((Number) resultado[0]).longValue();
            Long quantidade = ((Number) resultado[1]).longValue();

            quantidadesVendidas.put(livroId, quantidade);
        }

        for (Object[] resultado : pedidoRepository.calcularQuantidadesDevolvidasPorLivro()) {
            Long livroId = ((Number) resultado[0]).longValue();
            Long quantidade = ((Number) resultado[1]).longValue();

            quantidadesVendidas.computeIfPresent(
                    livroId,
                    (id, total) -> Math.max(0L, total - quantidade)
            );
        }

        return quantidadesVendidas;
    }

    @Transactional(readOnly = true)
    public List<Long> buscarIdsMaisVendidos() {
        Map<Long, Long> quantidadesVendidas = buscarQuantidadesVendidas();

        Map<Long, Livro> livrosDisponiveis = new HashMap<>();

        for (Livro livro : livroService.listarAtivos()) {
            if (livro.getEstoque() != null && livro.getEstoque() > 0) {
                livrosDisponiveis.put(livro.getId(), livro);
            }
        }

        return quantidadesVendidas.entrySet()
                .stream()
                .filter(entrada -> entrada.getValue() > 0)
                .filter(entrada -> livrosDisponiveis.containsKey(entrada.getKey()))
                .sorted(
                        Map.Entry.<Long, Long>comparingByValue()
                                .reversed()
                                .thenComparing(Map.Entry.comparingByKey())
                )
                .limit(3)
                .map(Map.Entry::getKey)
                .toList();
    }
}
