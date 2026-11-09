
package com.biblioteca.biblioteca_online.dto;

import com.biblioteca.biblioteca_online.model.Cartao;
import com.biblioteca.biblioteca_online.model.DevolucaoFoto;
import com.biblioteca.biblioteca_online.model.Endereco;
import com.biblioteca.biblioteca_online.model.ItemPedido;
import com.biblioteca.biblioteca_online.model.Livro;
import com.biblioteca.biblioteca_online.model.PagamentoPedido;
import com.biblioteca.biblioteca_online.model.Pedido;
import com.biblioteca.biblioteca_online.model.StatusPedido;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoResponseDTO(
        Long id,
        Long clienteId,
        List<ItemResponseDTO> itens,
        List<PagamentoResponseDTO> pagamentos,
        CartaoResponseDTO cartao,
        EnderecoResponseDTO enderecoEntrega,
        BigDecimal valorSubtotal,
        BigDecimal valorFrete,
        BigDecimal valorDesconto,
        BigDecimal valorTotal,
        String codigoCupom,
        Long pedidoOriginalId,
        StatusPedido status,
        LocalDateTime dataPedido,
        LocalDate dataEntrega,
        String motivoDevolucao,
        String codigoRastreamentoEnvio,
        String codigoRastreamentoDevolucao,
        Boolean reembolsoConfirmado,
        String fotoDevolucao,
        List<FotoDevolucaoResponseDTO> fotosDevolucao
) {

    public static PedidoResponseDTO from(Pedido pedido) {
        return from(pedido, List.of());
    }

    public static PedidoResponseDTO from(Pedido pedido, List<DevolucaoFoto> fotos) {
        List<PagamentoResponseDTO> pagamentos = pedido.getPagamentos() == null
                ? List.of()
                : pedido.getPagamentos().stream()
                        .map(PagamentoResponseDTO::from)
                        .toList();

        List<FotoDevolucaoResponseDTO> fotosNormalizadas = fotos == null
                ? List.of()
                : fotos.stream()
                        .map(FotoDevolucaoResponseDTO::from)
                        .toList();

        return new PedidoResponseDTO(
                pedido.getId(),
                pedido.getCliente() != null
                        ? pedido.getCliente().getId()
                        : null,
                pedido.getItens() == null
                        ? List.of()
                        : pedido.getItens().stream()
                                .map(ItemResponseDTO::from)
                                .toList(),
                pagamentos,
                pedido.getCartao() != null
                        ? CartaoResponseDTO.from(pedido.getCartao())
                        : null,
                pedido.getEnderecoEntrega() != null
                        ? EnderecoResponseDTO.from(pedido.getEnderecoEntrega())
                        : null,
                pedido.getValorSubtotal(),
                pedido.getValorFrete(),
                pedido.getValorDesconto(),
                pedido.getValorTotal(),
                pedido.getCodigoCupom(),
                pedido.getPedidoOriginalId(),
                pedido.getStatus(),
                pedido.getDataPedido(),
                pedido.getDataEntrega(),
                pedido.getMotivoDevolucao(),
                pedido.getCodigoRastreamentoEnvio(),
                pedido.getCodigoRastreamentoDevolucao(),
                pedido.getReembolsoConfirmado(),
                pedido.getFotoDevolucao(),
                fotosNormalizadas
        );
    }

    public record FotoDevolucaoResponseDTO(
            Long id,
            String nomeArquivo,
            String caminho,
            LocalDateTime dataUpload
    ) {

        public static FotoDevolucaoResponseDTO from(DevolucaoFoto foto) {
            return new FotoDevolucaoResponseDTO(
                    foto.getId(),
                    foto.getNomeArquivo(),
                    foto.getCaminho(),
                    foto.getDataUpload()
            );
        }
    }

    public record ItemResponseDTO(
            Long id,
            LivroResponseDTO livro,
            Integer quantidade,
            BigDecimal precoUnitario,
            StatusPedido status,
            Integer quantidadeDevolucao
    ) {

        public static ItemResponseDTO from(ItemPedido item) {
            return new ItemResponseDTO(
                    item.getId(),
                    item.getLivro() != null
                            ? LivroResponseDTO.from(item.getLivro())
                            : null,
                    item.getQuantidade(),
                    item.getPrecoUnitario(),
                    item.getStatus(),
                    item.getQuantidadeDevolucao()
            );
        }
    }

    public record LivroResponseDTO(
            Long id,
            String titulo,
            String autor,
            String editora,
            String categoria,
            Integer edicao,
            String isbn,
            Integer paginas,
            String sinopse,
            BigDecimal precoVenda,
            String imagemUrl
    ) {

        public static LivroResponseDTO from(Livro livro) {
            return new LivroResponseDTO(
                    livro.getId(),
                    livro.getTitulo(),
                    livro.getAutor(),
                    livro.getEditora(),
                    livro.getCategoria(),
                    livro.getEdicao(),
                    livro.getIsbn(),
                    livro.getPaginas(),
                    livro.getSinopse(),
                    livro.getPrecoVenda(),
                    livro.getImagemUrl()
            );
        }
    }

    public record PagamentoResponseDTO(
            Long id,
            Long cartaoId,
            String bandeira,
            String ultimosDigitos,
            BigDecimal valor
    ) {

        public static PagamentoResponseDTO from(PagamentoPedido pagamento) {
            return new PagamentoResponseDTO(
                    pagamento.getId(),
                    pagamento.getCartaoId(),
                    pagamento.getBandeira(),
                    pagamento.getUltimosDigitos(),
                    pagamento.getValor()
            );
        }
    }

    public record CartaoResponseDTO(
            Long id,
            String bandeira,
            String ultimosDigitos
    ) {

        public static CartaoResponseDTO from(Cartao cartao) {
            String numero = cartao.getNumero();

            String ultimosDigitos = numero == null
                    ? null
                    : numero.length() >= 4
                            ? numero.substring(numero.length() - 4)
                            : numero;

            return new CartaoResponseDTO(
                    cartao.getId(),
                    cartao.getBandeira(),
                    ultimosDigitos
            );
        }
    }

    public record EnderecoResponseDTO(
            Long id,
            String nomeEndereco,
            String cep,
            String rua,
            String numero,
            String complemento,
            String bairro,
            String cidade,
            String estado,
            String pais
    ) {

        public static EnderecoResponseDTO from(Endereco endereco) {
            return new EnderecoResponseDTO(
                    endereco.getId(),
                    endereco.getNomeEndereco(),
                    endereco.getCep(),
                    endereco.getRua(),
                    endereco.getNumero(),
                    endereco.getComplemento(),
                    endereco.getBairro(),
                    endereco.getCidade(),
                    endereco.getEstado(),
                    endereco.getPais()
            );
        }
    }
}
