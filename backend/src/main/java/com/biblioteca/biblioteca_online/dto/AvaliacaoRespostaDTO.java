
package com.biblioteca.biblioteca_online.dto;

import com.biblioteca.biblioteca_online.model.Avaliacao;
import java.time.LocalDateTime;

public class AvaliacaoRespostaDTO {

    private Long id;
    private LivroResumo livro;
    private ClienteResumo cliente;
    private PedidoResumo pedido;
    private Double nota;
    private String comentario;
    private LocalDateTime dataAvaliacao;

    public AvaliacaoRespostaDTO(Avaliacao avaliacao) {
        this.id = avaliacao.getId();
        this.nota = avaliacao.getNota();
        this.comentario = avaliacao.getComentario();
        this.dataAvaliacao = avaliacao.getDataAvaliacao();

        if (avaliacao.getLivro() != null) {
            this.livro = new LivroResumo(
                avaliacao.getLivro().getId(),
                avaliacao.getLivro().getTitulo()
            );
        }

        if (avaliacao.getCliente() != null) {
            this.cliente = new ClienteResumo(
                avaliacao.getCliente().getId(),
                avaliacao.getCliente().getNome()
            );
        }

        if (avaliacao.getPedido() != null) {
            this.pedido = new PedidoResumo(
                avaliacao.getPedido().getId()
            );
        }
    }

    public Long getId() {
        return id;
    }

    public LivroResumo getLivro() {
        return livro;
    }

    public ClienteResumo getCliente() {
        return cliente;
    }

    public PedidoResumo getPedido() {
        return pedido;
    }

    public Double getNota() {
        return nota;
    }

    public String getComentario() {
        return comentario;
    }

    public LocalDateTime getDataAvaliacao() {
        return dataAvaliacao;
    }

    public static class LivroResumo {
        private Long id;
        private String titulo;

        public LivroResumo(Long id, String titulo) {
            this.id = id;
            this.titulo = titulo;
        }

        public Long getId() {
            return id;
        }

        public String getTitulo() {
            return titulo;
        }
    }

    public static class ClienteResumo {
        private Long id;
        private String nome;

        public ClienteResumo(Long id, String nome) {
            this.id = id;
            this.nome = nome;
        }

        public Long getId() {
            return id;
        }

        public String getNome() {
            return nome;
        }
    }

    public static class PedidoResumo {
        private Long id;

        public PedidoResumo(Long id) {
            this.id = id;
        }

        public Long getId() {
            return id;
        }
    }
}
