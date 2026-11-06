package com.biblioteca.biblioteca_online.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "carteira")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Carteira {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false, unique = true)
    private Cliente cliente;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal saldo = BigDecimal.ZERO;

    @Column(name = "cashback_acumulado", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal cashbackAcumulado = BigDecimal.ZERO;

    @Column(name = "total_gasto", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalGasto = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativa = true;

    @Column(name = "data_criacao", nullable = false, updatable = false, columnDefinition = "datetime")
    private LocalDateTime dataCriacao;

    @Column(name = "ultima_atualizacao", columnDefinition = "datetime")
    private LocalDateTime ultimaAtualizacao;

    @PrePersist
    public void prePersist() {
        this.dataCriacao = LocalDateTime.now();
        this.ultimaAtualizacao = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.ultimaAtualizacao = LocalDateTime.now();
    }

    public void creditar(BigDecimal valor) {
        if (valor == null || valor.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Valor a creditar deve ser positivo");
        }
        this.saldo = this.saldo.add(valor);
        this.ultimaAtualizacao = LocalDateTime.now();
    }

    public void debitar(BigDecimal valor) {
        if (valor == null || valor.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Valor a debitar deve ser positivo");
        }
        if (this.saldo.compareTo(valor) < 0) {
            throw new IllegalStateException("Saldo insuficiente");
        }
        this.saldo = this.saldo.subtract(valor);
        this.ultimaAtualizacao = LocalDateTime.now();
    }

    public void acumularCashback(BigDecimal valorGasto) {
        if (valorGasto == null || valorGasto.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        BigDecimal cashback = valorGasto.multiply(new BigDecimal("0.01"));
        this.cashbackAcumulado = this.cashbackAcumulado.add(cashback);
        this.totalGasto = this.totalGasto.add(valorGasto);
        this.ultimaAtualizacao = LocalDateTime.now();
    }
}