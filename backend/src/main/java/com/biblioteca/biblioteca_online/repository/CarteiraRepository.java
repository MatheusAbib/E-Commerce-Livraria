package com.biblioteca.biblioteca_online.repository;

import com.biblioteca.biblioteca_online.model.Carteira;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CarteiraRepository extends JpaRepository<Carteira, Long> {

    Optional<Carteira> findByClienteId(Long clienteId);

    boolean existsByClienteId(Long clienteId);
}