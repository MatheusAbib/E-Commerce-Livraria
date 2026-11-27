package com.biblioteca.biblioteca_online.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record ItemCarrinhoDTO(
    Long id,
    Long livroId,
    String titulo,
    String autor,
    String editora,
    String categoria,
    String imagemUrl,
    BigDecimal precoVenda,
    Integer quantidade,
    Integer estoqueFisico,
    Integer estoqueReservado,
    Integer estoqueDisponivel,
    Integer quantidadeMaximaPermitida,
    boolean ativo,
    Instant adicionadoEm,
    BigDecimal subtotal
) {
}