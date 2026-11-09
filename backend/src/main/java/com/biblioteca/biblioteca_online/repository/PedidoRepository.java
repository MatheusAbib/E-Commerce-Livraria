
package com.biblioteca.biblioteca_online.repository;

import com.biblioteca.biblioteca_online.model.Cliente;
import com.biblioteca.biblioteca_online.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    List<Pedido> findByClienteId(Long clienteId);

    @Query("SELECT p FROM Pedido p WHERE p.cliente.id = :clienteId ORDER BY p.dataPedido DESC")
    List<Pedido> findPedidosPorClienteOrdenadosPorData(@Param("clienteId") Long clienteId);

    @Transactional
    void deleteByCliente(Cliente cliente);

    @Query("""
        SELECT i.livro.id,
               i.livro.titulo,
               SUM(i.quantidade),
               SUM(i.quantidade * (i.precoUnitario - i.livro.precoCusto))
        FROM ItemPedido i
        JOIN i.pedido p
        WHERE p.pedidoOriginalId IS NULL
        AND p.status <> com.biblioteca.biblioteca_online.model.StatusPedido.CANCELADO
        AND i.status <> com.biblioteca.biblioteca_online.model.StatusPedido.CANCELADO
        GROUP BY i.livro.id, i.livro.titulo
        """)
    List<Object[]> calcularLucrosVendasValidas();

    @Query("""
        SELECT i.livro.id,
               i.livro.titulo,
               SUM(i.quantidade),
               SUM(i.quantidade * (i.precoUnitario - i.livro.precoCusto))
        FROM ItemPedido i
        JOIN i.pedido p
        WHERE p.pedidoOriginalId IS NOT NULL
        AND p.status = com.biblioteca.biblioteca_online.model.StatusPedido.DEVOLVIDO
        GROUP BY i.livro.id, i.livro.titulo
        """)
    List<Object[]> calcularLucrosDevolucoes();

    @Query("SELECT DISTINCT p FROM Pedido p " +
           "LEFT JOIN FETCH p.cliente c " +
           "LEFT JOIN FETCH p.enderecoEntrega e " +
           "LEFT JOIN FETCH p.cartao ca " +
           "LEFT JOIN FETCH p.itens i " +
           "LEFT JOIN FETCH i.livro l")
    List<Pedido> findAllComCliente();

    @Query("SELECT p.id FROM Pedido p")
    List<Long> findAllIds();

    List<Pedido> findByPedidoOriginalId(Long pedidoOriginalId);

    @Query("""
        SELECT i.livro.id, SUM(i.quantidade)
        FROM ItemPedido i
        JOIN i.pedido p
        WHERE p.pedidoOriginalId IS NULL
        AND p.status <> com.biblioteca.biblioteca_online.model.StatusPedido.CANCELADO
        AND i.status <> com.biblioteca.biblioteca_online.model.StatusPedido.CANCELADO
        GROUP BY i.livro.id
        """)
    List<Object[]> calcularQuantidadesVendidasPorLivro();

    @Query("""
        SELECT i.livro.id, SUM(i.quantidade)
        FROM ItemPedido i
        JOIN i.pedido p
        WHERE p.pedidoOriginalId IS NOT NULL
        AND p.status = com.biblioteca.biblioteca_online.model.StatusPedido.DEVOLVIDO
        GROUP BY i.livro.id
        """)
    List<Object[]> calcularQuantidadesDevolvidasPorLivro();
}
