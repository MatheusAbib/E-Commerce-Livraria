package com.biblioteca.biblioteca_online.command;

import com.biblioteca.biblioteca_online.model.Pedido;
import com.biblioteca.biblioteca_online.service.PedidoService;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class ConfirmarReembolsoCommand implements Command {

    private final PedidoService pedidoService;
    private final Long pedidoId;

    private Pedido resultado;

    @Override
    public void executar() {
        this.resultado = pedidoService.confirmarReembolso(pedidoId);
    }

    @Override
    public Object getResultado() {
        return resultado;
    }
}