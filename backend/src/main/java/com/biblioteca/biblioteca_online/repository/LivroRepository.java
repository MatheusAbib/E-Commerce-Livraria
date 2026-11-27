package com.biblioteca.biblioteca_online.repository;

import com.biblioteca.biblioteca_online.model.Livro;
import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface LivroRepository extends JpaRepository<Livro, Long>, JpaSpecificationExecutor<Livro> {

    List<Livro> findByAtivo(boolean ativo);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT l FROM Livro l
        WHERE l.id = :livroId
        """)
    Optional<Livro> buscarPorIdComBloqueio(
        @Param("livroId") Long livroId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT l FROM Livro l
        WHERE l.id IN :ids
        ORDER BY l.id
        """)
    List<Livro> buscarPorIdsComBloqueio(
        @Param("ids") Collection<Long> ids
    );

    @Modifying
    @Transactional
    @Query(value = """
        UPDATE livros
        SET estoque = estoque - :quantidade
        WHERE id = :livroId
        AND :quantidade > 0
        AND estoque >= :quantidade
        """, nativeQuery = true)
    int atualizarEstoque(
        @Param("livroId") Long livroId,
        @Param("quantidade") Integer quantidade
    );

    @Query("""
        SELECT DISTINCT l.categoria
        FROM Livro l
        WHERE l.categoria IS NOT NULL
        AND l.categoria != ''
        ORDER BY l.categoria
        """)
    List<String> findDistinctCategorias();

    @Query("""
        SELECT DISTINCT l.autor
        FROM Livro l
        WHERE l.autor IS NOT NULL
        AND l.autor != ''
        ORDER BY l.autor
        """)
    List<String> findDistinctAutores();

    @Query("""
        SELECT l.autor
        FROM Livro l
        WHERE l.autor IS NOT NULL
        AND l.autor != ''
        """)
    List<String> findNomesAutores();
}