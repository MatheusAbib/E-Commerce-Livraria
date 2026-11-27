package com.biblioteca.biblioteca_online.service;

import com.biblioteca.biblioteca_online.dto.AdicionarItemCarrinhoDTO;
import com.biblioteca.biblioteca_online.dto.AtualizarItemCarrinhoDTO;
import com.biblioteca.biblioteca_online.dto.CarrinhoResponseDTO;
import com.biblioteca.biblioteca_online.dto.ItemCarrinhoDTO;

import com.biblioteca.biblioteca_online.model.Carrinho;
import com.biblioteca.biblioteca_online.model.Cliente;
import com.biblioteca.biblioteca_online.model.ItemCarrinho;
import com.biblioteca.biblioteca_online.model.Livro;

import com.biblioteca.biblioteca_online.repository.CarrinhoRepository;
import com.biblioteca.biblioteca_online.repository.ClienteRepository;
import com.biblioteca.biblioteca_online.repository.LivroRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@Transactional(isolation = Isolation.READ_COMMITTED)
public class CarrinhoService {

    private static final int TEMPO_LIMITE_MINUTOS = 10;
    private static final int LIMITE_QUANTIDADE_POR_LIVRO = 3;

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;
    private final CarrinhoRepository carrinhoRepository;
    private final ClienteRepository clienteRepository;
    private final LivroRepository livroRepository;
    private final EstoqueReservaService estoqueReservaService;
    private final PedidoAccessService pedidoAccessService;

    public CarrinhoService(
        CarrinhoRepository carrinhoRepository,
        ClienteRepository clienteRepository,
        LivroRepository livroRepository,
        EstoqueReservaService estoqueReservaService,
        PedidoAccessService pedidoAccessService
    ) {
        this.carrinhoRepository = carrinhoRepository;
        this.clienteRepository = clienteRepository;
        this.livroRepository = livroRepository;
        this.estoqueReservaService = estoqueReservaService;
        this.pedidoAccessService = pedidoAccessService;
    }

    public CarrinhoResponseDTO obterCarrinho() {
        Cliente cliente = obterClienteAutenticadoComBloqueio();

        Carrinho carrinho = buscarCarrinhoComBloqueio(cliente.getId());

        Instant agora = Instant.now();

        if (carrinho == null) {
            return CarrinhoResponseDTO.vazio(agora, false);
        }

        if (carrinho.estaExpirado(agora)) {
            excluirCarrinho(carrinho);
            return CarrinhoResponseDTO.vazio(agora, true);
        }

        if (carrinho.estaVazio()) {
            excluirCarrinho(carrinho);
            return CarrinhoResponseDTO.vazio(agora, false);
        }

        return converterParaDTO(carrinho, agora);
    }

    public CarrinhoResponseDTO adicionarItem(
        AdicionarItemCarrinhoDTO dto
    ) {
        if (dto == null || dto.getLivroId() == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Informe o livro que deseja adicionar."
            );
        }

        validarQuantidade(dto.getQuantidade());

        Cliente cliente = obterClienteAutenticadoComBloqueio();

        Carrinho carrinho = buscarCarrinhoComBloqueio(cliente.getId());

        Livro livro = estoqueReservaService.bloquearLivro(
            dto.getLivroId()
        );

        Instant agora = Instant.now();

        if (carrinho != null && carrinho.estaExpirado(agora)) {
            excluirCarrinho(carrinho);
            carrinho = null;
        }

        ItemCarrinho itemExistente = carrinho == null
            ? null
            : buscarItem(carrinho, livro.getId());

        int quantidadeAtual = itemExistente == null
            ? 0
            : itemExistente.getQuantidade();

        int novaQuantidade = quantidadeAtual + dto.getQuantidade();

        validarQuantidade(novaQuantidade);

        estoqueReservaService.validarDisponibilidade(
            livro,
            carrinho == null ? null : carrinho.getId(),
            novaQuantidade,
            agora
        );

        if (carrinho == null) {
            carrinho = new Carrinho(
                cliente,
                agora,
                agora.plus(Duration.ofMinutes(TEMPO_LIMITE_MINUTOS))
            );
        }

        if (itemExistente == null) {
            ItemCarrinho novoItem = new ItemCarrinho(
                carrinho,
                livro,
                dto.getQuantidade(),
                agora
            );

            carrinho.adicionarItem(novoItem);
        } else {
            itemExistente.setQuantidade(novaQuantidade);
        }

        carrinho.incrementarRevisao();

        Carrinho carrinhoSalvo = carrinhoRepository.saveAndFlush(
            carrinho
        );

        return converterParaDTO(carrinhoSalvo, agora);
    }

    public CarrinhoResponseDTO atualizarQuantidade(
        Long livroId,
        AtualizarItemCarrinhoDTO dto
    ) {
        if (livroId == null || dto == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Dados do item inválidos."
            );
        }

        validarQuantidade(dto.getQuantidade());

        Cliente cliente = obterClienteAutenticadoComBloqueio();

        Carrinho carrinho = buscarCarrinhoComBloqueio(cliente.getId());

        validarIdentificacaoCarrinho(
            carrinho,
            dto.getCarrinhoId(),
            dto.getRevisao()
        );

        Livro livro = estoqueReservaService.bloquearLivro(livroId);

        Instant agora = Instant.now();

        if (carrinho.estaExpirado(agora)) {
            excluirCarrinho(carrinho);
            return CarrinhoResponseDTO.vazio(agora, true);
        }

        ItemCarrinho item = buscarItem(carrinho, livroId);

        if (item == null) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Livro não encontrado no carrinho."
            );
        }

        int novaQuantidade = dto.getQuantidade();

        if (novaQuantidade > item.getQuantidade()) {
            estoqueReservaService.validarDisponibilidade(
                livro,
                carrinho.getId(),
                novaQuantidade,
                agora
            );
        }

        if (novaQuantidade != item.getQuantidade()) {
            item.setQuantidade(novaQuantidade);
            carrinho.incrementarRevisao();
            carrinhoRepository.saveAndFlush(carrinho);
        }

        return converterParaDTO(carrinho, agora);
    }

    public CarrinhoResponseDTO removerItem(
        Long livroId,
        Long carrinhoId,
        Long revisao
    ) {
        if (livroId == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Informe o livro que deseja remover."
            );
        }

        Cliente cliente = obterClienteAutenticadoComBloqueio();

        Carrinho carrinho = buscarCarrinhoComBloqueio(cliente.getId());

        validarIdentificacaoCarrinho(
            carrinho,
            carrinhoId,
            revisao
        );

        estoqueReservaService.bloquearLivro(livroId);

        Instant agora = Instant.now();

        if (carrinho.estaExpirado(agora)) {
            excluirCarrinho(carrinho);
            return CarrinhoResponseDTO.vazio(agora, true);
        }

        ItemCarrinho item = buscarItem(carrinho, livroId);

        if (item == null) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Livro não encontrado no carrinho."
            );
        }

        carrinho.removerItem(item);

        if (carrinho.estaVazio()) {
            excluirCarrinho(carrinho);
            return CarrinhoResponseDTO.vazio(agora, false);
        }

        carrinho.incrementarRevisao();

        carrinhoRepository.saveAndFlush(carrinho);

        return converterParaDTO(carrinho, agora);
    }

    public CarrinhoResponseDTO limparCarrinho(
        Long carrinhoId,
        Long revisao
    ) {
        Cliente cliente = obterClienteAutenticadoComBloqueio();

        Carrinho carrinho = buscarCarrinhoComBloqueio(cliente.getId());

        Instant agora = Instant.now();

        if (carrinho == null) {
            return CarrinhoResponseDTO.vazio(agora, false);
        }

        validarIdentificacaoCarrinho(
            carrinho,
            carrinhoId,
            revisao
        );

        bloquearLivrosDoCarrinho(carrinho);

        agora = Instant.now();

        boolean expirado = carrinho.estaExpirado(agora);

        excluirCarrinho(carrinho);

        return CarrinhoResponseDTO.vazio(agora, expirado);
    }

    public boolean removerCarrinhoExpirado(Long carrinhoId) {
        Carrinho carrinho = carrinhoRepository
            .buscarPorIdComBloqueio(carrinhoId)
            .orElse(null);

        if (carrinho == null) {
            return false;
        }

        Instant agora = Instant.now();

        if (!carrinho.estaExpirado(agora)) {
            return false;
        }

        excluirCarrinho(carrinho);

        return true;
    }

    public Carrinho validarCarrinhoParaCompra(
        Long clienteId,
        Long carrinhoId,
        Long revisao
    ) {
        Cliente cliente = obterClienteAutenticadoComBloqueio();

        if (!Objects.equals(cliente.getId(), clienteId)) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Você não tem permissão para utilizar este carrinho."
            );
        }

        Carrinho carrinho = buscarCarrinhoComBloqueio(cliente.getId());

        validarIdentificacaoCarrinho(
            carrinho,
            carrinhoId,
            revisao
        );

        bloquearLivrosDoCarrinho(carrinho);

        Instant agora = Instant.now();

        if (carrinho.estaExpirado(agora)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "O tempo de reserva do carrinho expirou."
            );
        }

        if (carrinho.estaVazio()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "O carrinho está vazio."
            );
        }

        for (ItemCarrinho item : carrinho.getItens()) {
            estoqueReservaService.validarDisponibilidade(
                item.getLivro(),
                carrinho.getId(),
                item.getQuantidade(),
                agora
            );
        }

        return carrinho;
    }

    public void consumirCarrinho(Carrinho carrinho) {
        if (carrinho == null || carrinho.getId() == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Carrinho inválido."
            );
        }

        excluirCarrinho(carrinho);
    }

    private Cliente obterClienteAutenticadoComBloqueio() {
        String email = pedidoAccessService.obterEmailAutenticado();

        Cliente cliente = clienteRepository
            .findByEmailIgnoreCase(email)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Cliente não encontrado."
            ));

        Cliente clienteBloqueado = clienteRepository
            .buscarPorIdComBloqueio(cliente.getId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Cliente não encontrado."
            ));

        if (!clienteBloqueado.isAtivo()) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Sua conta está inativa."
            );
        }

        return clienteBloqueado;
    }

    private Carrinho buscarCarrinhoComBloqueio(Long clienteId) {
        return carrinhoRepository
            .buscarPorClienteComBloqueio(clienteId)
            .orElse(null);
    }

    private ItemCarrinho buscarItem(
        Carrinho carrinho,
        Long livroId
    ) {
        return carrinho.getItens()
            .stream()
            .filter(item -> Objects.equals(
                item.getLivro().getId(),
                livroId
            ))
            .findFirst()
            .orElse(null);
    }

    private void validarQuantidade(Integer quantidade) {
        if (quantidade == null || quantidade < 1) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "A quantidade deve ser maior que zero."
            );
        }

        if (quantidade > LIMITE_QUANTIDADE_POR_LIVRO) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "O limite é de "
                    + LIMITE_QUANTIDADE_POR_LIVRO
                    + " unidades por livro."
            );
        }
    }

    private void validarIdentificacaoCarrinho(
        Carrinho carrinho,
        Long carrinhoId,
        Long revisao
    ) {
        if (carrinho == null) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "O carrinho não está mais disponível."
            );
        }

        if (carrinhoId == null
            || !Objects.equals(carrinho.getId(), carrinhoId)) {

            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "O carrinho foi alterado. Atualize a página."
            );
        }

        if (revisao == null
            || !Objects.equals(carrinho.getRevisao(), revisao)) {

            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "O carrinho está desatualizado. Atualize a página."
            );
        }
    }

    private void bloquearLivrosDoCarrinho(Carrinho carrinho) {
        List<Long> ids = carrinho.getItens()
            .stream()
            .map(item -> item.getLivro().getId())
            .distinct()
            .sorted()
            .toList();

        if (!ids.isEmpty()) {
            for (Livro livro : livroRepository.buscarPorIdsComBloqueio(ids)) {
                entityManager.refresh(livro, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
            }
        }
    }

    private void excluirCarrinho(Carrinho carrinho) {
        carrinhoRepository.delete(carrinho);
        carrinhoRepository.flush();
    }

    private CarrinhoResponseDTO converterParaDTO(
        Carrinho carrinho,
        Instant agora
    ) {
        List<ItemCarrinhoDTO> itensDTO = new ArrayList<>();

        BigDecimal subtotalCarrinho = BigDecimal.ZERO;

        for (ItemCarrinho item : carrinho.getItens()) {
            Livro livro = item.getLivro();

            int estoqueFisico = estoqueReservaService
                .obterEstoqueFisico(livro);

            int estoqueReservado = estoqueReservaService
                .obterEstoqueReservado(livro.getId(), agora);

            int estoqueDisponivel = Math.max(
                0,
                estoqueFisico - estoqueReservado
            );

            int quantidadeMaxima = livro.isAtivo()
                ? Math.min(
                    LIMITE_QUANTIDADE_POR_LIVRO,
                    estoqueReservaService
                        .obterEstoqueDisponivelParaCarrinho(
                            livro,
                            carrinho.getId(),
                            agora
                        )
                )
                : 0;

            BigDecimal precoVenda = livro.getPrecoVenda() == null
                ? BigDecimal.ZERO
                : livro.getPrecoVenda();

            BigDecimal subtotalItem = precoVenda.multiply(
                BigDecimal.valueOf(item.getQuantidade())
            );

            subtotalCarrinho = subtotalCarrinho.add(subtotalItem);

            itensDTO.add(new ItemCarrinhoDTO(
                item.getId(),
                livro.getId(),
                livro.getTitulo(),
                livro.getAutor(),
                livro.getEditora(),
                livro.getCategoria(),
                livro.getImagemUrl(),
                precoVenda,
                item.getQuantidade(),
                estoqueFisico,
                estoqueReservado,
                estoqueDisponivel,
                quantidadeMaxima,
                livro.isAtivo(),
                item.getAdicionadoEm(),
                subtotalItem
            ));
        }

        long milissegundosRestantes = Math.max(
            0L,
            Duration.between(
                agora,
                carrinho.getExpiraEm()
            ).toMillis()
        );

        long segundosRestantes =
            (milissegundosRestantes + 999L) / 1000L;

        return new CarrinhoResponseDTO(
            carrinho.getId(),
            carrinho.getRevisao(),
            carrinho.getCriadoEm(),
            carrinho.getExpiraEm(),
            agora,
            segundosRestantes,
            carrinho.getQuantidadeTotal(),
            subtotalCarrinho,
            carrinho.estaVazio(),
            false,
            itensDTO
        );
    }
}
