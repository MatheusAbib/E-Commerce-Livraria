package com.biblioteca.biblioteca_online.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record CarrinhoResponseDTO(
    Long id,
    Long revisao,
    Instant criadoEm,
    Instant expiraEm,
    Instant horarioServidor,
    long segundosRestantes,
    int quantidadeTotal,
    BigDecimal subtotal,
    boolean vazio,
    boolean expirado,
    List<ItemCarrinhoDTO> itens
) {

    public static CarrinhoResponseDTO vazio(
        Instant horarioServidor,
        boolean expirado
    ) {
        return new CarrinhoResponseDTO(
            null,
            null,
            null,
            null,
            horarioServidor,
            0L,
            0,
            BigDecimal.ZERO,
            true,
            expirado,
            List.of()
        );
    }
}