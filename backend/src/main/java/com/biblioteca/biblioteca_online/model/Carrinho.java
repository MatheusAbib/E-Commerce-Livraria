package com.biblioteca.biblioteca_online.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "carrinhos",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_carrinho_cliente",
            columnNames = "cliente_id"
        )
    },
    indexes = {
        @Index(
            name = "idx_carrinho_expiracao",
            columnList = "expira_em"
        )
    }
)
public class Carrinho {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm;

    @Column(name = "expira_em", nullable = false)
    private Instant expiraEm;

    @Column(nullable = false)
    private Long revisao = 0L;

    @Version
    private Long versao;

    @OneToMany(
        mappedBy = "carrinho",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<ItemCarrinho> itens = new ArrayList<>();

    public Carrinho() {
    }

    public Carrinho(Cliente cliente, Instant criadoEm, Instant expiraEm) {
        this.cliente = cliente;
        this.criadoEm = criadoEm;
        this.expiraEm = expiraEm;
    }

    public boolean estaExpirado(Instant agora) {
        return !agora.isBefore(expiraEm);
    }

    public boolean estaVazio() {
        return itens.isEmpty();
    }

    public void incrementarRevisao() {
        revisao = Math.addExact(revisao, 1L);
    }

    public void adicionarItem(ItemCarrinho item) {
        item.setCarrinho(this);
        itens.add(item);
    }

    public void removerItem(ItemCarrinho item) {
        if (itens.remove(item)) {
            item.setCarrinho(null);
        }
    }

    public void limparItens() {
        itens.forEach(item -> item.setCarrinho(null));
        itens.clear();
    }

    public int getQuantidadeTotal() {
        return itens.stream()
            .mapToInt(ItemCarrinho::getQuantidade)
            .sum();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(Instant criadoEm) {
        this.criadoEm = criadoEm;
    }

    public Instant getExpiraEm() {
        return expiraEm;
    }

    public void setExpiraEm(Instant expiraEm) {
        this.expiraEm = expiraEm;
    }

    public Long getRevisao() {
        return revisao;
    }

    public Long getVersao() {
        return versao;
    }

    public List<ItemCarrinho> getItens() {
        return itens;
    }
}