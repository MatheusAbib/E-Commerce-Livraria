package com.biblioteca.biblioteca_online.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "autores")
public class Autor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String nome;

    @Column(nullable = false, unique = true, length = 64)
    private String chaveNome;

    private byte[] imagem;

    private String imagemUrl;

    @Column(length = 2048)
    private String biografiaUrl;

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(nullable = false, columnDefinition = "DATETIME")
    private LocalDateTime dataCadastro;

    @Column(columnDefinition = "DATETIME")
    private LocalDateTime dataAtualizacao;

    @Transient
    private long quantidadeLivros;

    @PrePersist
    public void antesDeCadastrar() {
        dataCadastro = LocalDateTime.now();
        dataAtualizacao = dataCadastro;
    }

    @PreUpdate
    public void antesDeAtualizar() {
        dataAtualizacao = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getChaveNome() { return chaveNome; }
    public void setChaveNome(String chaveNome) { this.chaveNome = chaveNome; }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public byte[] getImagem() { return imagem; }
    public void setImagem(byte[] imagem) { this.imagem = imagem; }

    public String getImagemUrl() { return imagemUrl; }
    public void setImagemUrl(String imagemUrl) { this.imagemUrl = imagemUrl; }

    public String getBiografiaUrl() { return biografiaUrl; }

    @com.fasterxml.jackson.annotation.JsonProperty("temImagem")
    public boolean isTemImagem() { return imagem != null && imagem.length > 0; }
    public void setBiografiaUrl(String biografiaUrl) { this.biografiaUrl = biografiaUrl; }

    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }

    public LocalDateTime getDataCadastro() { return dataCadastro; }
    public LocalDateTime getDataAtualizacao() { return dataAtualizacao; }

    public long getQuantidadeLivros() { return quantidadeLivros; }

    public void setQuantidadeLivros(long quantidadeLivros) {
        this.quantidadeLivros = quantidadeLivros;
    }

    public boolean isCompleto() {
        return imagem != null && imagem.length > 0
            && biografiaUrl != null && !biografiaUrl.isBlank();
    }
}