package com.biblioteca.biblioteca_online.factory;

import com.biblioteca.biblioteca_online.model.Cliente;
import com.biblioteca.biblioteca_online.model.Cupom;
import com.biblioteca.biblioteca_online.model.Pedido;
import com.biblioteca.biblioteca_online.model.TipoCupom;

import java.math.BigDecimal;

public interface CupomFactory {

    Cupom criar(Pedido pedidoOrigem, Cliente cliente, BigDecimal porcentagem);

    TipoCupom getTipo();
}