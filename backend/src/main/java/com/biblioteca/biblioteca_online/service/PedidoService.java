package com.biblioteca.biblioteca_online.service;
import com.biblioteca.biblioteca_online.dto.ItemPedidoDTO;
import com.biblioteca.biblioteca_online.dto.PagamentoDTO;
import com.biblioteca.biblioteca_online.model.*;
import com.biblioteca.biblioteca_online.repository.ClienteRepository;
import com.biblioteca.biblioteca_online.repository.LivroRepository;
import com.biblioteca.biblioteca_online.repository.PedidoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import static java.util.Map.entry;
@Service
public class PedidoService {
    private static final Logger log = LoggerFactory.getLogger(PedidoService.class);
    private final PedidoRepository pedidoRepository;
    private final LivroService livroService;
    private final ClienteService clienteService;
    private final ClienteRepository clienteRepository;
    private final PedidoAccessService pedidoAccessService;
    private final NotificacaoService notificacaoService;
    @Autowired
    private LivroRepository livroRepository;
    @Autowired
    private LogService logService;
    @Autowired
    private CarteiraService carteiraService;
    @Autowired
    public PedidoService(
            PedidoRepository pedidoRepository,
            LivroService livroService,
            ClienteService clienteService,
            ClienteRepository clienteRepository,
            PedidoAccessService pedidoAccessService,
            NotificacaoService notificacaoService) {
        this.pedidoRepository = pedidoRepository;
        this.livroService = livroService;
        this.clienteService = clienteService;
        this.clienteRepository = clienteRepository;
        this.pedidoAccessService = pedidoAccessService;
        this.notificacaoService = notificacaoService;
    }
    @Transactional
    public Pedido criarPedido(
            Long clienteId,
            List<ItemPedidoDTO> itensDTO,
            Long enderecoId,
            List<PagamentoDTO> pagamentosDTO,
            BigDecimal valorDesconto,
            String codigoCupom,
            BigDecimal valorSubtotalRecebido) {
        if (clienteId == null) {
            throw new IllegalArgumentException("Cliente não informado");
        }
        if (enderecoId == null) {
            throw new IllegalArgumentException("Endereço não informado");
        }
        if (itensDTO == null || itensDTO.isEmpty()) {
            throw new IllegalArgumentException("O pedido precisa conter pelo menos um livro");
        }
        if (pagamentosDTO == null || pagamentosDTO.isEmpty()) {
            throw new IllegalArgumentException("Selecione pelo menos um cartão");
        }
        Cliente cliente = clienteService.buscarPorId(clienteId)
            .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));
        Pedido pedido = Pedido.builder()
            .cliente(cliente)
            .status(StatusPedido.EM_PROCESSAMENTO)
            .dataPedido(LocalDateTime.now())
            .valorSubtotal(BigDecimal.ZERO)
            .valorFrete(BigDecimal.ZERO)
            .valorDesconto(BigDecimal.ZERO)
            .reembolsoConfirmado(false)
            .build();
        Map<Long, Integer> quantidadesPorLivro = new HashMap<>();
        for (ItemPedidoDTO itemDTO : itensDTO) {
            if (itemDTO == null ||
                    itemDTO.getLivroId() == null ||
                    itemDTO.getQuantidade() == null ||
                    itemDTO.getQuantidade() <= 0) {
                throw new IllegalArgumentException("Item do pedido inválido");
            }
            Livro livro = livroService.buscarPorId(itemDTO.getLivroId())
                .orElseThrow(() -> new IllegalArgumentException(
                    "Livro não encontrado: " + itemDTO.getLivroId()
                ));
            int quantidadeAcumulada = quantidadesPorLivro.getOrDefault(
                livro.getId(),
                0
            ) + itemDTO.getQuantidade();
            if (livro.getEstoque() == null ||
                    livro.getEstoque() < quantidadeAcumulada) {
                throw new IllegalArgumentException(
                    "Estoque insuficiente para o livro: " + livro.getTitulo()
                );
            }
            if (livro.getPrecoVenda() == null ||
                    livro.getPrecoVenda().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException(
                    "Preço inválido para o livro: " + livro.getTitulo()
                );
            }
            quantidadesPorLivro.put(livro.getId(), quantidadeAcumulada);
            pedido.adicionarItem(livro, itemDTO.getQuantidade());
        }
        Endereco endereco = cliente.getEnderecos().stream()
            .filter(e -> e.getId().equals(enderecoId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException(
                "Endereço não encontrado para o cliente"
            ));
        pedido.setEnderecoEntrega(endereco);
        pedido.getItens().forEach(item ->
            log.info(
                "DEBUG PEDIDO - Livro ID: {}, Quantidade: {}, Preço: {}",
                item.getLivro().getId(),
                item.getQuantidade(),
                item.getPrecoUnitario()
            )
        );
        BigDecimal subtotal = pedido.getItens().stream()
            .map(item -> item.getPrecoUnitario().multiply(
                BigDecimal.valueOf(item.getQuantidade())
            ))
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(2, RoundingMode.HALF_UP);
        if (valorSubtotalRecebido != null &&
                valorSubtotalRecebido.setScale(2, RoundingMode.HALF_UP).compareTo(subtotal) != 0) {
            throw new IllegalArgumentException(
                "Subtotal divergente. Angular: R$ " +
                valorSubtotalRecebido.setScale(2, RoundingMode.HALF_UP) +
                " | Spring Boot: R$ " +
                subtotal
            );
        }
        pedido.setValorSubtotal(subtotal);
        BigDecimal frete = calcularFrete(subtotal, endereco.getEstado())
            .setScale(2, RoundingMode.HALF_UP);
        pedido.setValorFrete(frete);
        BigDecimal descontoAplicado = valorDesconto != null
            ? valorDesconto
            : BigDecimal.ZERO;
        if (descontoAplicado.scale() > 2 ||
                descontoAplicado.compareTo(BigDecimal.ZERO) < 0 ||
                descontoAplicado.compareTo(subtotal) > 0) {
            throw new IllegalArgumentException("Valor de desconto inválido");
        }
        pedido.setValorDesconto(descontoAplicado);
        pedido.setCodigoCupom(codigoCupom);
        BigDecimal totalFinal = subtotal
            .subtract(descontoAplicado)
            .add(frete)
            .setScale(2, RoundingMode.HALF_UP);
        if (totalFinal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("O valor total do pedido deve ser positivo");
        }
        pedido.setValorTotal(totalFinal);
        Set<Long> cartoesUtilizados = new HashSet<>();
        BigDecimal somaPagamentos = BigDecimal.ZERO;
        List<Cartao> cartoesValidados = new ArrayList<>();
        for (PagamentoDTO pagamentoDTO : pagamentosDTO) {
            if (pagamentoDTO == null ||
                    pagamentoDTO.getCartaoId() == null ||
                    pagamentoDTO.getValor() == null) {
                throw new IllegalArgumentException("Dados de pagamento incompletos");
            }
            Long cartaoId = pagamentoDTO.getCartaoId();
            BigDecimal valorPagamento = pagamentoDTO.getValor();
            if (!cartoesUtilizados.add(cartaoId)) {
                throw new IllegalArgumentException(
                    "O mesmo cartão não pode ser utilizado mais de uma vez"
                );
            }
            if (valorPagamento.scale() > 2 ||
                    valorPagamento.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException(
                    "O valor de cada pagamento deve ser positivo e possuir no máximo duas casas decimais"
                );
            }
            if (valorPagamento.compareTo(new BigDecimal("10.00")) < 0) {
                throw new IllegalArgumentException(
                    "O valor mínimo por cartão é R$ 10,00"
                );
            }
            Cartao cartao = cliente.getCartoes().stream()
                .filter(c -> c.getId().equals(cartaoId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                    "O cartão " + cartaoId + " não pertence ao cliente"
                ));
            cartoesValidados.add(cartao);
            somaPagamentos = somaPagamentos.add(valorPagamento);
        }
        if (somaPagamentos.compareTo(totalFinal) != 0) {
            throw new IllegalArgumentException(
                "A soma dos pagamentos (R$ " +
                somaPagamentos.setScale(2, RoundingMode.HALF_UP) +
                ") deve corresponder ao total do pedido (R$ " +
                totalFinal + ")"
            );
        }
        Cartao cartaoPrincipal = cartoesValidados.get(0);
        pedido.setCartao(cartaoPrincipal);
        pedido.setCartoesAdicionais(null);
        for (int i = 0; i < pagamentosDTO.size(); i++) {
            pedido.adicionarPagamento(
                cartoesValidados.get(i),
                pagamentosDTO.get(i).getValor()
            );
        }
        Pedido pedidoSalvo = pedidoRepository.saveAndFlush(pedido);
        for (Map.Entry<Long, Integer> entry : quantidadesPorLivro.entrySet()) {
            livroRepository.atualizarEstoque(
                entry.getKey(),
                entry.getValue()
            );
        }
        String detalhesLog = "Pedido #" + pedidoSalvo.getId()
            + " - R$ " + pedidoSalvo.getValorTotal()
            + " - " + pedidoSalvo.getItens().size() + " itens"
            + " - " + endereco.getCidade() + "/" + endereco.getEstado()
            + " - " + pagamentosDTO.size() + " cartão(ões)";
        try {
            Log registro = new Log();
            registro.setUserId(cliente.getId());
            registro.setUserName(cliente.getNome());
            registro.setAction("compra");
            registro.setDetails(detalhesLog);
            registro.setLevel("success");
            logService.salvarLog(registro);
        } catch (Exception e) {
            log.error("Erro ao registrar log do pedido {}", pedidoSalvo.getId(), e);
        }
        try {
            carteiraService.registrarCashback(
                cliente.getId(),
                pedidoSalvo.getValorTotal()
            );
        } catch (Exception e) {
            log.error(
                "Erro ao registrar cashback do pedido {}",
                pedidoSalvo.getId(),
                e
            );
        }
        return pedidoSalvo;
    }
    @Transactional
    public Pedido atualizarEnderecoEntrega(Long pedidoId, Long enderecoId) {
        if (enderecoId == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST,
                "Selecione um endereço de entrega"
            );
        }
        Pedido pedido = pedidoRepository.findById(pedidoId)
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.NOT_FOUND,
                "Pedido não encontrado"
            ));
        pedidoAccessService.validarProprietario(pedido);
        if (pedido.getStatus() != StatusPedido.EM_PROCESSAMENTO) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.CONFLICT,
                "O endereço só pode ser alterado enquanto o pedido estiver em processamento"
            );
        }
        Endereco novoEndereco = pedido.getCliente().getEnderecos().stream()
            .filter(endereco -> enderecoId.equals(endereco.getId()))
            .findFirst()
            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN,
                "Endereço não pertence ao cliente"
            ));
        pedido.setEnderecoEntrega(novoEndereco);
        return pedidoRepository.save(pedido);
    }
    @Transactional
    public Pedido atualizarStatus(
            Long pedidoId,
            StatusPedido novoStatus,
            String motivoDevolucao,
            String codigoRastreamentoEnvio,
            String codigoRastreamentoDevolucao) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
            .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));
        StatusPedido statusAnterior = pedido.getStatus();
        if (novoStatus == StatusPedido.DEVOLUCAO &&
                (motivoDevolucao == null || motivoDevolucao.trim().isEmpty())) {
            throw new IllegalArgumentException("Motivo da devolução é obrigatório");
        }
        if (novoStatus == StatusPedido.ENTREGUE) {
            pedido.setDataEntrega(java.time.LocalDate.now());
        }
        if (codigoRastreamentoEnvio != null &&
                !codigoRastreamentoEnvio.isEmpty()) {
            pedido.setCodigoRastreamentoEnvio(codigoRastreamentoEnvio);
        }
        if (codigoRastreamentoDevolucao != null &&
                !codigoRastreamentoDevolucao.isEmpty()) {
            pedido.setCodigoRastreamentoDevolucao(codigoRastreamentoDevolucao);
        }
        if (pedido.getStatus() == StatusPedido.ENVIADO_DEVOLUCAO &&
                novoStatus == StatusPedido.DEVOLVIDO) {
            for (ItemPedido item : pedido.getItens()) {
                Livro livro = item.getLivro();
                livro.setEstoque(livro.getEstoque() + item.getQuantidade());
                livroRepository.save(livro);
            }
        }
        if (novoStatus == StatusPedido.CANCELADO && statusAnterior != StatusPedido.CANCELADO) {
            for (ItemPedido item : pedido.getItens()) {
                Livro livro = item.getLivro();
                livro.setEstoque(livro.getEstoque() + item.getQuantidade());
                livroRepository.save(livro);
            }
        }
        pedido.setStatus(novoStatus);
        if (novoStatus == StatusPedido.DEVOLUCAO ||
                novoStatus == StatusPedido.AUTORIZADO_DEVOLUCAO ||
                novoStatus == StatusPedido.ENVIADO_DEVOLUCAO) {
            pedido.setMotivoDevolucao(
                motivoDevolucao != null
                    ? motivoDevolucao
                    : pedido.getMotivoDevolucao()
            );
        } else if (novoStatus != StatusPedido.DEVOLVIDO) {
            pedido.setMotivoDevolucao(null);
        }
        Pedido pedidoAtualizado = pedidoRepository.save(pedido);
        if (statusAnterior != novoStatus) {
            registrarNotificacaoStatus(pedidoAtualizado, novoStatus);
        }
        try {
            Log registro = new Log();
            registro.setUserId(pedido.getCliente().getId());
            registro.setUserName(pedido.getCliente().getNome());
            registro.setAction(mapearStatusParaAcao(novoStatus));
            registro.setDetails(
                "Status do pedido #" + pedido.getId()
                + " alterado para " + novoStatus.name()
            );
            registro.setLevel("info");
            logService.salvarLog(registro);
        } catch (Exception e) {
            log.error("Erro ao registrar alteração do pedido {}", pedidoId, e);
        }
        return pedidoAtualizado;
    }
    private void registrarNotificacaoStatus(Pedido pedido, StatusPedido status) {
        String mensagem = switch (status) {
            case EM_TRANSITO -> "Seu pedido está em trânsito e a caminho do endereço de entrega.";
            case ENTREGUE -> "Seu pedido foi entregue.";
            case DEVOLUCAO -> "A devolução do seu pedido foi solicitada.";
            case AUTORIZADO_DEVOLUCAO -> "A devolução do seu pedido foi autorizada.";
            case ENVIADO_DEVOLUCAO -> "A devolução do seu pedido está em trânsito.";
            case DEVOLVIDO -> "A devolução do seu pedido foi concluída.";
            case CANCELADO -> "Seu pedido foi cancelado.";
            case EM_PROCESSAMENTO -> "Seu pedido está em processamento.";
            default -> "O status do seu pedido foi atualizado para " + status.name().replace('_', ' ').toLowerCase() + ".";
        };
        String tipo = status == StatusPedido.CANCELADO ? "warning" : "info";
        notificacaoService.criarNotificacao(pedido.getCliente(), "Atualização do pedido #" + pedido.getId(), mensagem, tipo, pedido.getId());
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
            Log registro = new Log();
            registro.setUserId(pedido.getCliente().getId());
            registro.setUserName(pedido.getCliente().getNome());
            registro.setAction("Reembolso Confirmado");
            registro.setDetails("Reembolso confirmado para o pedido #" + pedidoId);
            registro.setLevel("success");
            logService.salvarLog(registro);
        } catch (Exception e) {
            log.error("Erro ao registrar confirmação de reembolso {}", pedidoId, e);
        }
        return pedidoRepository.save(pedido);
    }
    @Transactional
    public void excluirClienteComPedidos(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
            .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));
        notificacaoService.excluirTodas(clienteId);
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
        BigDecimal adicional = new BigDecimal(
            subtotal.divide(
                new BigDecimal("70"),
                0,
                RoundingMode.DOWN
            ).intValue() * 7
        );
        freteBase = freteBase.add(adicional);
        BigDecimal acrescimoEstado = acrescimosPorEstado.getOrDefault(
            estado.toUpperCase(),
            BigDecimal.ZERO
        );
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
            throw new RuntimeException(
                "Apenas pedidos em processamento podem ser cancelados."
            );
        }
        for (ItemPedido item : pedido.getItens()) {
            Livro livro = livroRepository.findById(item.getLivro().getId())
                .orElseThrow(() -> new RuntimeException(
                    "Livro não encontrado ao cancelar pedido"
                ));
            livro.setEstoque(livro.getEstoque() + item.getQuantidade());
            livroRepository.save(livro);
            item.setStatus(StatusPedido.CANCELADO);
        }
        pedido.setStatus(StatusPedido.CANCELADO);
        pedidoRepository.save(pedido);
        registrarNotificacaoStatus(pedido, StatusPedido.CANCELADO);
        try {
            Log registro = new Log();
            registro.setUserId(pedido.getCliente().getId());
            registro.setUserName(pedido.getCliente().getNome());
            registro.setAction("Cancelado");
            registro.setDetails("Pedido #" + pedido.getId() + " cancelado");
            registro.setLevel("warning");
            logService.salvarLog(registro);
        } catch (Exception e) {
            log.error("Erro ao registrar cancelamento do pedido {}", id, e);
        }
    }
    @Transactional
    public void excluirPedido(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));
        if (pedido.getStatus() != StatusPedido.CANCELADO) {
            throw new RuntimeException(
                "Apenas pedidos cancelados podem ser excluídos"
            );
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
    public Pedido solicitarDevolucao(
            Long pedidoId,
            String motivo,
            List<ItemDevolucao> itensDevolucao) {
        Pedido pedidoOriginal = pedidoRepository.findById(pedidoId)
            .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));
        if (pedidoOriginal.getStatus() != StatusPedido.ENTREGUE) {
            throw new RuntimeException("Só é possível devolver pedidos entregues");
        }
        List<Pedido> devolucoes = pedidoRepository.findByPedidoOriginalId(pedidoId);
        for (ItemDevolucao itemDevolucao : itensDevolucao) {
            boolean itemExisteNoPedido = pedidoOriginal.getItens().stream()
                .anyMatch(item -> item.getId().equals(
                    itemDevolucao.getItemPedidoId()
                ));
            if (!itemExisteNoPedido) {
                throw new RuntimeException("Item não pertence ao pedido");
            }
            for (Pedido devolucao : devolucoes) {
                if (devolucao.getStatus() == StatusPedido.DEVOLVIDO) {
                    for (ItemPedido itemDev : devolucao.getItens()) {
                        if (itemDev.getLivro().getId().equals(
                            pedidoOriginal.getItens().stream()
                                .filter(item -> item.getId().equals(
                                    itemDevolucao.getItemPedidoId()
                                ))
                                .findFirst()
                                .get()
                                .getLivro()
                                .getId()
                        )) {
                            throw new RuntimeException(
                                "Este item já foi devolvido anteriormente"
                            );
                        }
                    }
                }
            }
        }
        try {
            Log registro = new Log();
            registro.setUserId(pedidoOriginal.getCliente().getId());
            registro.setUserName(pedidoOriginal.getCliente().getNome());
            registro.setAction("Solicitou Devolução");
            registro.setDetails(
                "Devolução solicitada para o pedido #"
                + pedidoOriginal.getId() + ". Motivo: " + motivo
            );
            registro.setLevel("info");
            logService.salvarLog(registro);
        } catch (Exception e) {
            log.error("Erro ao registrar solicitação de devolução {}", pedidoId, e);
        }
        return pedidoOriginal;
    }
    @Transactional
    public Pedido criarPedidoDevolucao(
            Long pedidoOriginalId,
            String motivo,
            List<ItemDevolucao> itensDevolucao) {
        Pedido pedidoOriginal = pedidoRepository.findById(pedidoOriginalId)
            .orElseThrow(() -> new RuntimeException(
                "Pedido original não encontrado"
            ));
        Pedido pedidoDevolucao = new Pedido();
        pedidoDevolucao.setCliente(pedidoOriginal.getCliente());
        pedidoDevolucao.setEnderecoEntrega(pedidoOriginal.getEnderecoEntrega());
        pedidoDevolucao.setCartao(pedidoOriginal.getCartao());
        pedidoDevolucao.setStatus(StatusPedido.DEVOLUCAO);
        pedidoDevolucao.setDataPedido(LocalDateTime.now());
        pedidoDevolucao.setPedidoOriginalId(pedidoOriginalId);
        pedidoDevolucao.setMotivoDevolucao(motivo);
        BigDecimal valorSubtotalDevolucao = BigDecimal.ZERO;
        for (ItemDevolucao itemDev : itensDevolucao) {
            ItemPedido itemOriginal = pedidoOriginal.getItens().stream()
                .filter(item -> item.getId().equals(
                    itemDev.getItemPedidoId()
                ))
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
            Log registro = new Log();
            registro.setUserId(pedidoOriginal.getCliente().getId());
            registro.setUserName(pedidoOriginal.getCliente().getNome());
            registro.setAction("Devolução Parcial");
            registro.setDetails(
                "Pedido de devolução #" + pedidoDevolucao.getId()
                + " criado para o pedido #" + pedidoOriginalId
                + ". Valor: R$ " + valorSubtotalDevolucao
            );
            registro.setLevel("info");
            logService.salvarLog(registro);
        } catch (Exception e) {
            log.error("Erro ao registrar devolução do pedido {}", pedidoOriginalId, e);
        }
        return pedidoRepository.save(pedidoDevolucao);
    }
}