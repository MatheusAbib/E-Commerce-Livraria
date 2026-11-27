package com.biblioteca.biblioteca_online.repository;

import com.biblioteca.biblioteca_online.model.Carrinho;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface CarrinhoRepository extends JpaRepository<Carrinho, Long> {

    Optional<Carrinho> findByClienteId(Long clienteId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT c FROM Carrinho c
        WHERE c.cliente.id = :clienteId
        """)
    Optional<Carrinho> buscarPorClienteComBloqueio(
        @Param("clienteId") Long clienteId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT c FROM Carrinho c
        WHERE c.id = :id
        """)
    Optional<Carrinho> buscarPorIdComBloqueio(
        @Param("id") Long id
    );

    @Query("""
        SELECT c.id FROM Carrinho c
        WHERE c.expiraEm <= :agora
        ORDER BY c.id
        """)
    List<Long> buscarIdsExpirados(
        @Param("agora") Instant agora
    );

    @Query("""
        SELECT c.id FROM Carrinho c
        WHERE c.cliente.id = :clienteId
        AND c.expiraEm > :agora
        """)
    Optional<Long> buscarIdCarrinhoAtivo(
        @Param("clienteId") Long clienteId,
        @Param("agora") Instant agora
    );

    boolean existsByClienteId(Long clienteId);
}