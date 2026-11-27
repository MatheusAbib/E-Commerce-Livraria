package com.biblioteca.biblioteca_online.dto;

public class AtualizarItemCarrinhoDTO {

    private Long carrinhoId;
    private Long revisao;
    private Integer quantidade;

    public AtualizarItemCarrinhoDTO() {
    }

    public Long getCarrinhoId() {
        return carrinhoId;
    }

    public void setCarrinhoId(Long carrinhoId) {
        this.carrinhoId = carrinhoId;
    }

    public Long getRevisao() {
        return revisao;
    }

    public void setRevisao(Long revisao) {
        this.revisao = revisao;
    }

    public Integer getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(Integer quantidade) {
        this.quantidade = quantidade;
    }
}