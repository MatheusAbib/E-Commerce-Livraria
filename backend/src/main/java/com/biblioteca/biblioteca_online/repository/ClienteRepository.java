package com.biblioteca.biblioteca_online.repository;

import com.biblioteca.biblioteca_online.dto.ClienteRankingDTO;
import com.biblioteca.biblioteca_online.model.Cliente;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long>, JpaSpecificationExecutor<Cliente> {

    Cliente findByEmail(String email);

    Cliente findByCpf(String cpf);

    Optional<Cliente> findByEmailIgnoreCase(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT c FROM Cliente c
        WHERE c.id = :id
        """)
    Optional<Cliente> buscarPorIdComBloqueio(
        @Param("id") Long id
    );

    @Query("SELECT new com.biblioteca.biblioteca_online.dto.ClienteRankingDTO(" +
           "c.id, c.nome, c.email, COUNT(p), COALESCE(SUM(p.valorTotal), 0)) " +
           "FROM Cliente c LEFT JOIN Pedido p ON p.cliente = c AND p.status <> 'cancelado' " +
           "GROUP BY c.id, c.nome, c.email " +
           "ORDER BY SUM(p.valorTotal) DESC")
    List<ClienteRankingDTO> buscarRankingClientes();

    @Query("SELECT COUNT(c) FROM Cliente c " +
           "WHERE REPLACE(REPLACE(c.cpf, '.', ''), '-', '') = :cpf " +
           "AND (:id IS NULL OR c.id <> :id)")
    long contarCpfDuplicado(
        @Param("cpf") String cpf,
        @Param("id") Long id
    );
}