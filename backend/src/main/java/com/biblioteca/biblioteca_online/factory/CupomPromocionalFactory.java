package com.biblioteca.biblioteca_online.factory;

import com.biblioteca.biblioteca_online.model.Cliente;
import com.biblioteca.biblioteca_online.model.Cupom;
import com.biblioteca.biblioteca_online.model.Pedido;
import com.biblioteca.biblioteca_online.model.TipoCupom;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class CupomPromocionalFactory implements CupomFactory {

    @Override
    public Cupom criar(Pedido pedidoOrigem, Cliente cliente, BigDecimal porcentagem) {
        Cupom cupom = new Cupom();
        cupom.setCodigo("PROMO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        cupom.setCliente(cliente);
        cupom.setPedidoOrigem(pedidoOrigem);
        cupom.setPorcentagem(porcentagem);
        cupom.setUsado(false);
        cupom.setDataGeracao(LocalDateTime.now());
        cupom.setDataExpiracao(LocalDateTime.now().plusDays(15));
        cupom.setOrigem("PROMOCIONAL");
        return cupom;
    }

    @Override
    public TipoCupom getTipo() {
        return TipoCupom.PROMOCIONAL;
    }
}