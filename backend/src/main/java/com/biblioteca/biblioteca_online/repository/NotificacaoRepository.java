
package com.biblioteca.biblioteca_online.repository;

import com.biblioteca.biblioteca_online.model.Notificacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {

    List<Notificacao> findByClienteIdOrderByDataDesc(Long clienteId);

    Optional<Notificacao> findByIdAndClienteId(Long id, Long clienteId);

    long countByClienteIdAndLidaFalse(Long clienteId);

    void deleteByClienteId(Long clienteId);
}
