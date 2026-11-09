
package com.biblioteca.biblioteca_online.service;

import com.biblioteca.biblioteca_online.repository.PedidoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RelatorioService {

    private final PedidoRepository pedidoRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public RelatorioService(PedidoRepository pedidoRepository) {
        this.pedidoRepository = pedidoRepository;
    }

    @Transactional(readOnly = true)
    public List<Object[]> calcularLucrosPorLivro() {
        Map<Long, Object[]> resultados = new HashMap<>();

        for (Object[] linha : pedidoRepository.calcularLucrosVendasValidas()) {
            Long livroId = ((Number) linha[0]).longValue();
            String titulo = (String) linha[1];
            long quantidade = ((Number) linha[2]).longValue();
            BigDecimal lucro = new BigDecimal(linha[3].toString());

            resultados.put(
                livroId,
                new Object[]{titulo, quantidade, lucro}
            );
        }

        for (Object[] linha : pedidoRepository.calcularLucrosDevolucoes()) {
            Long livroId = ((Number) linha[0]).longValue();
            long quantidadeDevolvida = ((Number) linha[2]).longValue();
            BigDecimal lucroDevolvido = new BigDecimal(linha[3].toString());

            Object[] resultado = resultados.get(livroId);

            if (resultado != null) {
                long quantidadeAtual = ((Number) resultado[1]).longValue();
                BigDecimal lucroAtual = (BigDecimal) resultado[2];

                resultado[1] = Math.max(
                    0L,
                    quantidadeAtual - quantidadeDevolvida
                );

                resultado[2] = lucroAtual.subtract(lucroDevolvido);
            }
        }

        List<Object[]> lucros = new ArrayList<>(resultados.values());

        lucros.sort(
            Comparator.comparing(
                (Object[] linha) -> (BigDecimal) linha[2]
            ).reversed()
        );

        return lucros;
    }

    public List<Object[]> getVendasPorCategoria(
            LocalDate dataInicio,
            LocalDate dataFim) {

        String sql = "SELECT l.categoria, " +
                     "DATE(p.data_pedido) as dataVenda, " +
                     "SUM(i.quantidade) as totalItens, " +
                     "SUM(i.quantidade * i.preco_unitario) as valorTotal " +
                     "FROM pedidos p " +
                     "JOIN itens_pedido i ON p.id = i.pedido_id " +
                     "JOIN livros l ON i.livro_id = l.id " +
                     "WHERE p.data_pedido BETWEEN :dataInicio AND :dataFim " +
                     "AND p.status IN ('ENTREGUE', 'EM_TRANSITO', 'TROCADO') " +
                     "GROUP BY l.categoria, DATE(p.data_pedido) " +
                     "ORDER BY DATE(p.data_pedido), l.categoria";

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("dataInicio", dataInicio.atStartOfDay());
        query.setParameter("dataFim", dataFim.atTime(23, 59, 59));

        return query.getResultList();
    }
}
