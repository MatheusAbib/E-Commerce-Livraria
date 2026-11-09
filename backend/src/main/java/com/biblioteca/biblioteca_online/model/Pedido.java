
package com.biblioteca.biblioteca_online.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "pedidos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    @JsonIgnoreProperties(value = {
        "hibernateLazyInitializer",
        "handler",
        "enderecos",
        "cartoes",
        "pedidos",
        "carteira"
    }, allowSetters = true)
    private Cliente cliente;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<ItemPedido> itens = new ArrayList<>();

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"pedido", "cartao"})
    @Builder.Default
    private List<PagamentoPedido> pagamentos = new ArrayList<>();

    @Column(name = "valor_subtotal", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal valorSubtotal = BigDecimal.ZERO;

    @Column(name = "valor_frete", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal valorFrete = BigDecimal.ZERO;

    @Column(name = "valor_desconto", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal valorDesconto = BigDecimal.ZERO;

    @Column(name = "codigo_cupom")
    private String codigoCupom;

    @Column(name = "pedido_original_id")
    private Long pedidoOriginalId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "endereco_id", nullable = true)
    @JsonIgnoreProperties(value = {
        "hibernateLazyInitializer",
        "handler",
        "cliente"
    }, allowSetters = true)
    private Endereco enderecoEntrega;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cartao_id", nullable = true)
    @JsonIgnoreProperties(value = {
        "hibernateLazyInitializer",
        "handler",
        "cliente"
    }, allowSetters = true)
    private Cartao cartao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatusPedido status = StatusPedido.EM_PROCESSAMENTO;

    @Column(name = "data_pedido", nullable = false)
    @Builder.Default
    private LocalDateTime dataPedido = LocalDateTime.now();

    @Column(name = "valor_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorTotal;

    @Column(name = "cartoes_adicionais", columnDefinition = "TEXT")
    private String cartoesAdicionais;

    @Column(name = "motivo_devolucao", columnDefinition = "TEXT")
    private String motivoDevolucao;

    @Column(name = "codigo_rastreamento_envio")
    private String codigoRastreamentoEnvio;

    @Column(name = "codigo_rastreamento_devolucao")
    private String codigoRastreamentoDevolucao;

    @Column(name = "reembolso_confirmado")
    @Builder.Default
    private Boolean reembolsoConfirmado = false;

    @Column(name = "data_entrega")
    private LocalDate dataEntrega;

    @OneToMany(mappedBy = "pedidoDevolucao", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("pedidoDevolucao")
    @Builder.Default
    private List<DevolucaoFoto> fotosDevolucao = new ArrayList<>();

    public void adicionarItem(Livro livro, Integer quantidade) {
        for (ItemPedido itemExistente : this.itens) {
            if (itemExistente.getLivro().getId().equals(livro.getId())) {
                itemExistente.setQuantidade(
                    itemExistente.getQuantidade() + quantidade
                );
                return;
            }
        }

        ItemPedido item = new ItemPedido();
        item.setLivro(livro);
        item.setQuantidade(quantidade);
        item.setPrecoUnitario(livro.getPrecoVenda());
        item.setPedido(this);
        this.itens.add(item);
    }

    public void adicionarPagamento(Cartao cartao, BigDecimal valor) {
        PagamentoPedido pagamento = new PagamentoPedido();
        pagamento.setPedido(this);
        pagamento.setCartao(cartao);
        pagamento.setValor(valor);
        this.pagamentos.add(pagamento);
    }

    public void limparItens() {
        this.itens.forEach(ItemPedido::desvincularPedido);
        this.itens.clear();
    }

    public String getFotoDevolucao() {
        if (fotosDevolucao != null && !fotosDevolucao.isEmpty()) {
            return fotosDevolucao.get(0).getCaminho();
        }
        return null;
    }
}
