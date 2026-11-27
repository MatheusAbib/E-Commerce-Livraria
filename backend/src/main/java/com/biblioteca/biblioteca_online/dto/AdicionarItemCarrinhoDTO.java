package com.biblioteca.biblioteca_online.dto;

public class AdicionarItemCarrinhoDTO {

    private Long livroId;
    private Integer quantidade;

    public AdicionarItemCarrinhoDTO() {
    }

    public Long getLivroId() {
        return livroId;
    }

    public void setLivroId(Long livroId) {
        this.livroId = livroId;
    }

    public Integer getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(Integer quantidade) {
        this.quantidade = quantidade;
    }
}