package com.biblioteca.biblioteca_online.service;

import com.biblioteca.biblioteca_online.dto.ItemPedidoDTO;
import com.biblioteca.biblioteca_online.model.*;
import com.biblioteca.biblioteca_online.repository.ClienteRepository;
import com.biblioteca.biblioteca_online.repository.LivroRepository;
import com.biblioteca.biblioteca_online.repository.PedidoRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static java.util.Map.entry;

@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    @Autowired
    private LivroRepository livroRepository;

    private final LivroService livroService;
    private final ClienteService clienteService;
    private final ClienteRepository clienteRepository;

    @Autowired
    private LogService logService;

    @Autowired
    private CarteiraService carteiraService;

    @Autowired
    public PedidoService(PedidoRepository pedidoRepository,
                         LivroService livroService,
                         ClienteService clienteService,
                         ClienteRepository clienteRepository) {
        this.pedidoRepository = pedidoRepository;
        this.livroService = livroService;
        this.clienteService = clienteService;
        this.clienteRepository = clienteRepository;
    }

@Transactional
public Pedido criarPedido(Long clienteId, List<ItemPedidoDTO> itensDTO,
                          Long enderecoId, Long cartaoId,
                          List<Long> cartoesAdicionaisIds,
                          BigDecimal valorDesconto, String codigoCupom,
                          BigDecimal valorSubtotalRecebido) throws Exception {

        Cliente cliente = clienteService.buscarPorId(clienteId)
            .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        Pedido pedido = Pedido.builder()
            .cliente(cliente)
            .status(StatusPedido.EM_PROCESSAMENTO)
            .dataPedido(LocalDateTime.now())
            .valorSubtotal(BigDecimal.ZERO)
            .valorFrete(BigDecimal.ZERO)
            .valorDesconto(BigDecimal.ZERO)
            .reembolsoConfirmado(false)
            .build();

        for (ItemPedidoDTO itemDTO : itensDTO) {
            Livro livro = livroService.buscarPorId(itemDTO.getLivroId())
                .orElseThrow(() -> new RuntimeException("Livro não encontrado: " + itemDTO.getLivroId()));
            
            if (livro.getEstoque() < itemDTO.getQuantidade()) {
                throw new RuntimeException(
                    "Estoque insuficiente para o livro: " + livro.getTitulo() + 
                    " (Disponível: " + livro.getEstoque() + ", Solicitado: " + itemDTO.getQuantidade() + ")"
                );
            }
            
            pedido.adicionarItem(livro, itemDTO.getQuantidade());
        }

Endereco endereco = cliente.getEnderecos().stream()
    .filter(e -> e.getId().equals(enderecoId))
    .findFirst()
    .orElseThrow(() -> new RuntimeException("Endereço não encontrado"));

Cartao cartaoPrincipal = cliente.getCartoes().stream()
    .filter(c -> c.getId().equals(cartaoId))
    .findFirst()
    .orElseThrow(() -> new RuntimeException("Cartão principal não encontrado"));

pedido.setEnderecoEntrega(endereco);
pedido.setCartao(cartaoPrincipal);

    if (cartoesAdicionaisIds != null && !cartoesAdicionaisIds.isEmpty()) {
        List<Cartao> cartoesExtras = cliente.getCartoes().stream()
            .filter(c -> cartoesAdicionaisIds.contains(c.getId()))
            .toList();

        ObjectMapper mapper = new ObjectMapper();
        String jsonCartoesExtras = mapper.writeValueAsString(cartoesExtras);
        pedido.setCartoesAdicionais(jsonCartoesExtras);
    }

    BigDecimal subtotal = valorSubtotalRecebido != null ? valorSubtotalRecebido :
        pedido.getItens().stream()
              .map(item -> item.getPrecoUnitario().multiply(BigDecimal.valueOf(item.getQuantidade())))
              .reduce(BigDecimal.ZERO, BigDecimal::add);

    pedido.setValorSubtotal(subtotal);

    BigDecimal frete = calcularFrete(subtotal, endereco.getEstado());
    pedido.setValorFrete(frete);

    BigDecimal descontoAplicado = valorDesconto != null ? valorDesconto : BigDecimal.ZERO;
    pedido.setValorDesconto(descontoAplicado);
    pedido.setCodigoCupom(codigoCupom);

    BigDecimal totalFinal = subtotal.subtract(descontoAplicado).add(frete);
    pedido.setValorTotal(totalFinal);

    Pedido pedidoSalvo = pedidoRepository.save(pedido);

    Map<Long, Integer> quantidadesPorLivro = new HashMap<>();
    for (ItemPedido item : pedidoSalvo.getItens()) {
        Long livroId = item.getLivro().getId();
        int quantidade = item.getQuantidade();
        quantidadesPorLivro.put(livroId, quantidadesPorLivro.getOrDefault(livroId, 0) + quantidade);
    }

    for (Map.Entry<Long, Integer> entry : quantidadesPorLivro.entrySet()) {
        Long livroId = entry.getKey();
        Integer quantidade = entry.getValue();
        livroRepository.atualizarEstoque(livroId, quantidade);
    }

    String detalhesLog = "Pedido #" + pedidoSalvo.getId() +
        " - R$ " + pedido.getValorTotal() +
        " - " + pedido.getItens().size() + " itens" +
        " - " + endereco.getCidade() + "/" + endereco.getEstado() +
        " - " + cartaoPrincipal.getBandeira();

    try {
        Log log = new Log();
        log.setUserId(cliente.getId());
        log.setUserName(cliente.getNome());
        log.setAction("compra");
        log.setDetails(detalhesLog);
        log.setLevel("success");
        logService.salvarLog(log);
    } catch (Exception e) {
    }

    try {
        carteiraService.registrarCashback(cliente.getId(), pedidoSalvo.getValorTotal());
    } catch (Exception e) {
    }

    return pedidoSalvo;
    }

@Transactional
public Pedido atualizarStatus(Long pedidoId, StatusPedido novoStatus, String motivoDevolucao,
                              String codigoRastreamentoEnvio, String codigoRastreamentoDevolucao) {
    Pedido pedido = pedidoRepository.findById(pedidoId)
        .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));

    if (novoStatus == StatusPedido.DEVOLUCAO && (motivoDevolucao == null || motivoDevolucao.trim().isEmpty())) {
        throw new IllegalArgumentException("Motivo da devolução é obrigatório");
    }
if (novoStatus == StatusPedido.ENTREGUE) {
    pedido.setDataEntrega(java.time.LocalDate.now());
}
    if (codigoRastreamentoEnvio != null && !codigoRastreamentoEnvio.isEmpty()) {
        pedido.setCodigoRastreamentoEnvio(codigoRastreamentoEnvio);
    }

    if (codigoRastreamentoDevolucao != null && !codigoRastreamentoDevolucao.isEmpty()) {
        pedido.setCodigoRastreamentoDevolucao(codigoRastreamentoDevolucao);
    }

    if (pedido.getStatus() == StatusPedido.ENVIADO_DEVOLUCAO && novoStatus == StatusPedido.DEVOLVIDO) {
        for (ItemPedido item : pedido.getItens()) {
            Livro livro = item.getLivro();
            livro.setEstoque(livro.getEstoque() + item.getQuantidade());
            livroRepository.save(livro);
        }
    }

    if (novoStatus == StatusPedido.CANCELADO) {
        for (ItemPedido item : pedido.getItens()) {
            Livro livro = item.getLivro();
            livro.setEstoque(livro.getEstoque() + item.getQuantidade());
            livroRepository.save(livro);
        }
    }

    pedido.setStatus(novoStatus);

    if (novoStatus == StatusPedido.DEVOLUCAO || novoStatus == StatusPedido.AUTORIZADO_DEVOLUCAO ||
        novoStatus == StatusPedido.ENVIADO_DEVOLUCAO) {
        pedido.setMotivoDevolucao(motivoDevolucao != null ? motivoDevolucao : pedido.getMotivoDevolucao());
    } else if (novoStatus != StatusPedido.DEVOLVIDO) {
        pedido.setMotivoDevolucao(null);
    }

    Pedido pedidoAtualizado = pedidoRepository.save(pedido);

    try {
        Log log = new Log();
        log.setUserId(pedido.getCliente().getId());
        log.setUserName(pedido.getCliente().getNome());
        log.setAction(mapearStatusParaAcao(novoStatus));
        log.setDetails("Status do pedido #" + pedido.getId() + " alterado para " + novoStatus.name());
        log.setLevel("info");
        logService.salvarLog(log);
    } catch (Exception e) {
    }

    return pedidoAtualizado;
}

private String mapearStatusParaAcao(StatusPedido status) {
return switch (status) {
    case EM_TRANSITO -> "Em Trânsito";
    case DEVOLUCAO -> "Devolução Solicitada";
    case AUTORIZADO_DEVOLUCAO -> "Devolução Autorizada";
    case ENVIADO_DEVOLUCAO -> "Devolução Enviada";
    case DEVOLVIDO -> "Devolvido";
    case CANCELADO -> "Cancelado";
    default -> status.name();
};
}

    public List<Pedido> listarPedidosPorCliente(Long clienteId) {
        return pedidoRepository.findPedidosPorClienteOrdenadosPorData(clienteId);
    }

    public Pedido buscarPorId(Long id) {
        return pedidoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));
    }

    @Transactional
    public Pedido confirmarReembolso(Long pedidoId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
            .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));

        pedido.setReembolsoConfirmado(true);

        try {
            Log log = new Log();
            log.setUserId(pedido.getCliente().getId());
            log.setUserName(pedido.getCliente().getNome());
            log.setAction("Reembolso Confirmado");
            log.setDetails("Reembolso confirmado para o pedido #" + pedidoId);
            log.setLevel("success");
            logService.salvarLog(log);
        } catch (Exception e) {
        }

        return pedidoRepository.save(pedido);
    }

    @Transactional
    public void excluirClienteComPedidos(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
            .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));

        pedidoRepository.deleteByCliente(cliente);
        clienteRepository.delete(cliente);
    }

    private BigDecimal calcularFrete(BigDecimal subtotal, String estado) {
        Map<String, BigDecimal> acrescimosPorEstado = Map.ofEntries(
            entry("AC", new BigDecimal("9.75")),
            entry("AL", new BigDecimal("6.45")),
            entry("AP", new BigDecimal("10.00")),
            entry("AM", new BigDecimal("9.85")),
            entry("BA", new BigDecimal("5.30")),
            entry("CE", new BigDecimal("6.10")),
            entry("DF", new BigDecimal("4.25")),
            entry("ES", new BigDecimal("3.15")),
            entry("GO", new BigDecimal("4.55")),
            entry("MA", new BigDecimal("7.60")),
            entry("MT", new BigDecimal("6.90")),
            entry("MS", new BigDecimal("5.40")),
            entry("MG", new BigDecimal("4.75")),
            entry("PA", new BigDecimal("9.05")),
            entry("PB", new BigDecimal("6.85")),
            entry("PR", new BigDecimal("2.50")),
            entry("PE", new BigDecimal("6.30")),
            entry("PI", new BigDecimal("7.20")),
            entry("RJ", new BigDecimal("5.00")),
            entry("RN", new BigDecimal("6.55")),
            entry("RS", new BigDecimal("2.90")),
            entry("RO", new BigDecimal("8.35")),
            entry("RR", new BigDecimal("10.00")),
            entry("SC", new BigDecimal("2.75")),
            entry("SP", new BigDecimal("3.95")),
            entry("SE", new BigDecimal("5.25")),
            entry("TO", new BigDecimal("7.10"))
        );

        BigDecimal freteBase = new BigDecimal("15.00");

        if (subtotal.compareTo(new BigDecimal("300")) >= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal adicional = new BigDecimal(subtotal.divide(new BigDecimal("70"), 0, RoundingMode.DOWN).intValue() * 7);
        freteBase = freteBase.add(adicional);

        BigDecimal acrescimoEstado = acrescimosPorEstado.getOrDefault(estado.toUpperCase(), BigDecimal.ZERO);

        return freteBase.add(acrescimoEstado);
    }

    @Transactional
    public void cancelarPedido(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));

        if (pedido.getStatus() == StatusPedido.CANCELADO) {
            throw new RuntimeException("Pedido já está cancelado.");
        }

        if (pedido.getStatus() != StatusPedido.EM_PROCESSAMENTO) {
            throw new RuntimeException("Apenas pedidos em processamento podem ser cancelados.");
        }

        for (ItemPedido item : pedido.getItens()) {
            Livro livro = livroRepository.findById(item.getLivro().getId())
                .orElseThrow(() -> new RuntimeException("Livro não encontrado ao cancelar pedido"));
            livro.setEstoque(livro.getEstoque() + item.getQuantidade());
            livroRepository.save(livro);
            item.setStatus(StatusPedido.CANCELADO);
        }

        pedido.setStatus(StatusPedido.CANCELADO);
        pedidoRepository.save(pedido);

        try {
            Log log = new Log();
            log.setUserId(pedido.getCliente().getId());
            log.setUserName(pedido.getCliente().getNome());
            log.setAction("Cancelado");
            log.setDetails("Pedido #" + pedido.getId() + " cancelado");
            log.setLevel("warning");
            logService.salvarLog(log);
        } catch (Exception e) {
        }
    }

@Transactional
public void excluirPedido(Long id) {

    Pedido pedido = pedidoRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));


    if (pedido.getStatus() != StatusPedido.CANCELADO) {
        throw new RuntimeException("Apenas pedidos cancelados podem ser excluídos");
    }

    pedido.getItens().clear();
    pedidoRepository.save(pedido);


    pedidoRepository.deleteById(id);

}

    public Optional<Pedido> buscarPorIdOptional(Long id) {
        return pedidoRepository.findById(id);
    }

    public Pedido salvar(Pedido pedido) {
    return pedidoRepository.save(pedido);
}

    public List<Pedido> listarTodosPedidos() {
        List<Pedido> pedidos = pedidoRepository.findAllComCliente();

        pedidos.forEach(pedido -> {
            if (pedido.getEnderecoEntrega() != null) {
                pedido.getEnderecoEntrega().getRua();
                pedido.getEnderecoEntrega().getCidade();
                pedido.getEnderecoEntrega().getEstado();
            }
            if (pedido.getCartao() != null) {
                pedido.getCartao().getBandeira();
                pedido.getCartao().getNumero();
            }
            if (pedido.getItens() != null) {
                pedido.getItens().size();
                pedido.getItens().forEach(item -> {
                    if (item.getLivro() != null) {
                        item.getLivro().getTitulo();
                    }
                });
            }
        });

        return pedidos;
    }

@Transactional
public Pedido solicitarDevolucao(Long pedidoId, String motivo, List<ItemDevolucao> itensDevolucao) {
    Pedido pedidoOriginal = pedidoRepository.findById(pedidoId)
        .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));

    if (pedidoOriginal.getStatus() != StatusPedido.ENTREGUE) {
        throw new RuntimeException("Só é possível devolver pedidos entregues");
    }

    List<Pedido> devolucoes = pedidoRepository.findByPedidoOriginalId(pedidoId);

    for (ItemDevolucao itemDevolucao : itensDevolucao) {
        boolean itemExisteNoPedido = pedidoOriginal.getItens().stream()
            .anyMatch(item -> item.getId().equals(itemDevolucao.getItemPedidoId()));

        if (!itemExisteNoPedido) {
            throw new RuntimeException("Item não pertence ao pedido");
        }

        for (Pedido devolucao : devolucoes) {
            if (devolucao.getStatus() == StatusPedido.DEVOLVIDO) {
                for (ItemPedido itemDev : devolucao.getItens()) {
                    if (itemDev.getLivro().getId().equals(
                        pedidoOriginal.getItens().stream()
                            .filter(item -> item.getId().equals(itemDevolucao.getItemPedidoId()))
                            .findFirst().get().getLivro().getId()
                    )) {
                        throw new RuntimeException("Este item já foi devolvido anteriormente");
                    }
                }
            }
        }
    }

    try {
        Log log = new Log();
        log.setUserId(pedidoOriginal.getCliente().getId());
        log.setUserName(pedidoOriginal.getCliente().getNome());
        log.setAction("Solicitou Devolução");
        log.setDetails("Devolução solicitada para o pedido #" + pedidoOriginal.getId() + ". Motivo: " + motivo);
        log.setLevel("info");
        logService.salvarLog(log);
    } catch (Exception e) {
    }

    return pedidoOriginal;
}
@Transactional
public Pedido criarPedidoDevolucao(Long pedidoOriginalId, String motivo, List<ItemDevolucao> itensDevolucao) {
    Pedido pedidoOriginal = pedidoRepository.findById(pedidoOriginalId)
        .orElseThrow(() -> new RuntimeException("Pedido original não encontrado"));

    Pedido pedidoDevolucao = new Pedido();
    pedidoDevolucao.setCliente(pedidoOriginal.getCliente());
    pedidoDevolucao.setEnderecoEntrega(pedidoOriginal.getEnderecoEntrega());
    pedidoDevolucao.setCartao(pedidoOriginal.getCartao());
    pedidoDevolucao.setStatus(StatusPedido.DEVOLUCAO);
    pedidoDevolucao.setDataPedido(java.time.LocalDateTime.now());
    pedidoDevolucao.setPedidoOriginalId(pedidoOriginalId);
    pedidoDevolucao.setMotivoDevolucao(motivo);

    BigDecimal valorSubtotalDevolucao = BigDecimal.ZERO;

    for (ItemDevolucao itemDev : itensDevolucao) {
        ItemPedido itemOriginal = pedidoOriginal.getItens().stream()
            .filter(item -> item.getId().equals(itemDev.getItemPedidoId()))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Item não encontrado"));

        BigDecimal valorItem = itemOriginal.getPrecoUnitario()
            .multiply(BigDecimal.valueOf(itemDev.getQuantidade()));

        ItemPedido itemDevolucao = new ItemPedido();
        itemDevolucao.setPedido(pedidoDevolucao);
        itemDevolucao.setLivro(itemOriginal.getLivro());
        itemDevolucao.setQuantidade(itemDev.getQuantidade());
        itemDevolucao.setPrecoUnitario(itemOriginal.getPrecoUnitario());
        itemDevolucao.setStatus(StatusPedido.DEVOLVIDO);
        pedidoDevolucao.getItens().add(itemDevolucao);

        valorSubtotalDevolucao = valorSubtotalDevolucao.add(valorItem);
    }

    pedidoDevolucao.setValorSubtotal(valorSubtotalDevolucao);
    pedidoDevolucao.setValorFrete(BigDecimal.ZERO);
    pedidoDevolucao.setValorDesconto(BigDecimal.ZERO);
    pedidoDevolucao.setValorTotal(valorSubtotalDevolucao);

    pedidoOriginal.setStatus(StatusPedido.ENTREGUE);
    pedidoRepository.save(pedidoOriginal);

    try {
        Log log = new Log();
        log.setUserId(pedidoOriginal.getCliente().getId());
        log.setUserName(pedidoOriginal.getCliente().getNome());
        log.setAction("Devolução Parcial");
        log.setDetails("Pedido de devolução #" + pedidoDevolucao.getId() +
                      " criado para o pedido #" + pedidoOriginalId +
                      ". Valor: R$ " + valorSubtotalDevolucao);
        log.setLevel("info");
        logService.salvarLog(log);
    } catch (Exception e) {
    }

    return pedidoRepository.save(pedidoDevolucao);
}
}
