package com.biblioteca.biblioteca_online.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
    name = "itens_carrinho",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_item_carrinho_livro",
            columnNames = {"carrinho_id", "livro_id"}
        )
    },
    indexes = {
        @Index(
            name = "idx_item_carrinho_livro",
            columnList = "livro_id"
        )
    }
)
public class ItemCarrinho {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "carrinho_id", nullable = false)
    private Carrinho carrinho;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "livro_id", nullable = false)
    private Livro livro;

    @Column(nullable = false)
    private Integer quantidade;

    @Column(name = "adicionado_em", nullable = false, updatable = false)
    private Instant adicionadoEm;

    @Version
    private Long versao;

    public ItemCarrinho() {
    }

    public ItemCarrinho(
        Carrinho carrinho,
        Livro livro,
        Integer quantidade,
        Instant adicionadoEm
    ) {
        this.carrinho = carrinho;
        this.livro = livro;
        setQuantidade(quantidade);
        this.adicionadoEm = adicionadoEm;
    }

    public void aumentarQuantidade(int quantidade) {
        if (quantidade <= 0) {
            throw new IllegalArgumentException(
                "A quantidade deve ser positiva."
            );
        }

        setQuantidade(Math.addExact(this.quantidade, quantidade));
    }

    public void diminuirQuantidade(int quantidade) {
        if (quantidade <= 0) {
            throw new IllegalArgumentException(
                "A quantidade deve ser positiva."
            );
        }

        setQuantidade(this.quantidade - quantidade);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Carrinho getCarrinho() {
        return carrinho;
    }

    public void setCarrinho(Carrinho carrinho) {
        this.carrinho = carrinho;
    }

    public Livro getLivro() {
        return livro;
    }

    public void setLivro(Livro livro) {
        this.livro = livro;
    }

    public Integer getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(Integer quantidade) {
        if (quantidade == null || quantidade <= 0) {
            throw new IllegalArgumentException(
                "A quantidade deve ser maior que zero."
            );
        }

        this.quantidade = quantidade;
    }

    public Instant getAdicionadoEm() {
        return adicionadoEm;
    }

    public void setAdicionadoEm(Instant adicionadoEm) {
        this.adicionadoEm = adicionadoEm;
    }

    public Long getVersao() {
        return versao;
    }
}