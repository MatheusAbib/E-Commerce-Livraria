package com.biblioteca.biblioteca_online.repository;

import com.biblioteca.biblioteca_online.model.Autor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AutorRepository extends JpaRepository<Autor, Long> {

    Optional<Autor> findByChaveNome(String chaveNome);

    List<Autor> findAllByOrderByNomeAsc();

    List<Autor> findByAtivoTrueOrderByNomeAsc();
}