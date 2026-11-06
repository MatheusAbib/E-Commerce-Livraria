package com.biblioteca.biblioteca_online.command;

import com.biblioteca.biblioteca_online.service.PedidoService;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class CancelarPedidoCommand implements Command {

    private final PedidoService pedidoService;
    private final Long pedidoId;

    private String mensagem;

    @Override
    public void executar() {
        pedidoService.cancelarPedido(pedidoId);
        this.mensagem = "Pedido cancelado com sucesso";
    }

    @Override
    public Object getResultado() {
        return mensagem;
    }
}