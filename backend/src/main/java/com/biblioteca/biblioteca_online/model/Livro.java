
package com.biblioteca.biblioteca_online.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "livros")
public class Livro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    private String autor;

    @Column(nullable = false)
    private Integer edicao;

    private String isbn;

    private Integer paginas;

    @Column(columnDefinition = "TEXT")
    private String sinopse;

    private Double altura;

    private Double largura;

    private Double profundidade;

    private Double peso;

    private String codigoBarras;

    @Column(nullable = false)
    private String editora;

    private String categoria;

    private BigDecimal precoCusto;

    private BigDecimal precoVenda;

    private Integer estoque;

    private boolean ativo = true;

    private String motivoInativacao;

    private String motivoAtivacao;

    private LocalDate dataEntrada;

    private String imagemUrl;

    @Transient
    private Long quantidadeVendida = 0L;

    public Livro() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getAutor() { return autor; }
    public void setAutor(String autor) { this.autor = autor; }

    public String getEditora() { return editora; }
    public void setEditora(String editora) { this.editora = editora; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public BigDecimal getPrecoCusto() { return precoCusto; }
    public void setPrecoCusto(BigDecimal precoCusto) { this.precoCusto = precoCusto; }

    public BigDecimal getPrecoVenda() { return precoVenda; }
    public void setPrecoVenda(BigDecimal precoVenda) { this.precoVenda = precoVenda; }

    public Integer getEstoque() { return estoque; }
    public void setEstoque(Integer estoque) { this.estoque = estoque; }

    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }

    public String getMotivoInativacao() { return motivoInativacao; }
    public void setMotivoInativacao(String motivoInativacao) { this.motivoInativacao = motivoInativacao; }

    public String getMotivoAtivacao() { return motivoAtivacao; }
    public void setMotivoAtivacao(String motivoAtivacao) { this.motivoAtivacao = motivoAtivacao; }

    public LocalDate getDataEntrada() { return dataEntrada; }
    public void setDataEntrada(LocalDate dataEntrada) { this.dataEntrada = dataEntrada; }

    public Integer getEdicao() { return edicao; }
    public void setEdicao(Integer edicao) { this.edicao = edicao; }

    public String getIsbn() { return isbn; }
    public void setIsbn(String isbn) { this.isbn = isbn; }

    public String getSinopse() { return sinopse; }
    public void setSinopse(String sinopse) { this.sinopse = sinopse; }

    public Integer getPaginas() { return paginas; }
    public void setPaginas(Integer paginas) { this.paginas = paginas; }

    public Double getAltura() { return altura; }
    public void setAltura(Double altura) { this.altura = altura; }

    public Double getLargura() { return largura; }
    public void setLargura(Double largura) { this.largura = largura; }

    public Double getProfundidade() { return profundidade; }
    public void setProfundidade(Double profundidade) { this.profundidade = profundidade; }

    public Double getPeso() { return peso; }
    public void setPeso(Double peso) { this.peso = peso; }

    public String getCodigoBarras() { return codigoBarras; }
    public void setCodigoBarras(String codigoBarras) { this.codigoBarras = codigoBarras; }

    public String getImagemUrl() { return imagemUrl; }
    public void setImagemUrl(String imagemUrl) { this.imagemUrl = imagemUrl; }

    public Long getQuantidadeVendida() { return quantidadeVendida; }
    public void setQuantidadeVendida(Long quantidadeVendida) {
        this.quantidadeVendida = quantidadeVendida;
    }
}
