package com.biblioteca.biblioteca_online.command;

import com.biblioteca.biblioteca_online.dto.AtualizarStatusDTO;
import com.biblioteca.biblioteca_online.model.Log;
import com.biblioteca.biblioteca_online.model.Pedido;
import com.biblioteca.biblioteca_online.model.StatusPedido;
import com.biblioteca.biblioteca_online.model.TipoCupom;
import com.biblioteca.biblioteca_online.service.CupomService;
import com.biblioteca.biblioteca_online.service.LogService;
import com.biblioteca.biblioteca_online.service.PedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;

@RequiredArgsConstructor
public class AtualizarStatusCommand implements Command {

    private final PedidoService pedidoService;
    private final CupomService cupomService;
    private final LogService logService;
    private final SimpMessagingTemplate messagingTemplate;
    private final Long pedidoId;
    private final AtualizarStatusDTO statusDTO;

    private Pedido resultado;

    @Override
    public void executar() {
        Pedido pedido = pedidoService.atualizarStatus(
            pedidoId,
            statusDTO.getNovoStatus(),
            statusDTO.getMotivoDevolucao(),
            statusDTO.getCodigoRastreamentoEnvio(),
            statusDTO.getCodigoRastreamentoDevolucao()
        );

        if (statusDTO.getNovoStatus() == StatusPedido.ENTREGUE) {
            pedido.setDataEntrega(LocalDate.now());
            pedido = pedidoService.salvar(pedido);
        }

        if (statusDTO.getNovoStatus() == StatusPedido.DEVOLVIDO && statusDTO.getCupom() != null) {
            if (statusDTO.getCupom().getGerarCupom() != null && statusDTO.getCupom().getGerarCupom()) {
                BigDecimal porcentagem = statusDTO.getCupom().getPorcentagem();
                cupomService.gerarCupom(
                    TipoCupom.DEVOLUCAO,
                    pedido.getId(),
                    pedido.getCliente().getId(),
                    porcentagem
                );
            }
        }

        messagingTemplate.convertAndSend("/topic/pedidos", pedido);

        try {
            Log log = new Log();
            log.setUserId(pedido.getCliente().getId());
            log.setUserName(pedido.getCliente().getNome());
            log.setAction("status_pedido");
            log.setDetails("Status do pedido #" + pedidoId + " alterado para " + statusDTO.getNovoStatus().name());
            log.setLevel("info");
            logService.salvarLog(log);
        } catch (Exception e) {
        }

        this.resultado = pedido;
    }

    @Override
    public Object getResultado() {
        return resultado;
    }
}
