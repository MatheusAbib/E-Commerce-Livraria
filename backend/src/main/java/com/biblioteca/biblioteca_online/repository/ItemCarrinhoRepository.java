package com.biblioteca.biblioteca_online.repository;

import com.biblioteca.biblioteca_online.model.ItemCarrinho;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ItemCarrinhoRepository extends JpaRepository<ItemCarrinho, Long> {

    List<ItemCarrinho> findByCarrinhoId(Long carrinhoId);

    Optional<ItemCarrinho> findByCarrinhoIdAndLivroId(
        Long carrinhoId,
        Long livroId
    );

    @Query("""
        SELECT COALESCE(SUM(i.quantidade), 0)
        FROM ItemCarrinho i
        WHERE i.livro.id = :livroId
        AND i.carrinho.expiraEm > :agora
        """)
    Long calcularQuantidadeReservada(
        @Param("livroId") Long livroId,
        @Param("agora") Instant agora
    );

    @Query("""
        SELECT COALESCE(SUM(i.quantidade), 0)
        FROM ItemCarrinho i
        WHERE i.livro.id = :livroId
        AND i.carrinho.id <> :carrinhoId
        AND i.carrinho.expiraEm > :agora
        """)
    Long calcularQuantidadeReservadaPorOutrosCarrinhos(
        @Param("livroId") Long livroId,
        @Param("carrinhoId") Long carrinhoId,
        @Param("agora") Instant agora
    );

    @Query("""
        SELECT i.livro.id, SUM(i.quantidade)
        FROM ItemCarrinho i
        WHERE i.carrinho.expiraEm > :agora
        GROUP BY i.livro.id
        """)
    List<Object[]> calcularQuantidadesReservadasPorLivro(
        @Param("agora") Instant agora
    );

    @Query("""
        SELECT i.livro.id
        FROM ItemCarrinho i
        WHERE i.carrinho.id = :carrinhoId
        ORDER BY i.livro.id
        """)
    List<Long> buscarIdsLivrosDoCarrinho(
        @Param("carrinhoId") Long carrinhoId
    );
}