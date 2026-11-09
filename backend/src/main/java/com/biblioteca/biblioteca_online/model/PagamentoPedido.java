
package com.biblioteca.biblioteca_online.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
    name = "pagamentos_pedido",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_pagamento_pedido_cartao",
            columnNames = {"pedido_id", "cartao_id"}
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PagamentoPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pedido_id", nullable = false)
    @JsonIgnore
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cartao_id", nullable = false)
    @JsonIgnore
    private Cartao cartao;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @JsonProperty("cartaoId")
    public Long getCartaoId() {
        return cartao != null ? cartao.getId() : null;
    }

    @JsonProperty("bandeira")
    public String getBandeira() {
        return cartao != null ? cartao.getBandeira() : null;
    }

    @JsonProperty("ultimosDigitos")
    public String getUltimosDigitos() {
        if (cartao == null || cartao.getNumero() == null) {
            return null;
        }

        String numero = cartao.getNumero();

        return numero.length() >= 4
            ? numero.substring(numero.length() - 4)
            : numero;
    }
}
