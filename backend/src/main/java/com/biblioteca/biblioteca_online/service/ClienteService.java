package com.biblioteca.biblioteca_online.service;

import com.biblioteca.biblioteca_online.dto.ClienteRankingDTO;
import com.biblioteca.biblioteca_online.model.Cartao;
import com.biblioteca.biblioteca_online.model.Cliente;
import com.biblioteca.biblioteca_online.model.Endereco;
import com.biblioteca.biblioteca_online.model.Log;
import com.biblioteca.biblioteca_online.model.MensagemChat;
import com.biblioteca.biblioteca_online.repository.CartaoRepository;
import com.biblioteca.biblioteca_online.repository.ClienteRepository;
import com.biblioteca.biblioteca_online.repository.EnderecoRepository;
import com.biblioteca.biblioteca_online.repository.MensagemChatRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.bcrypt.BCrypt;

import org.springframework.stereotype.Service;
import jakarta.persistence.criteria.Predicate;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {

    @Autowired
    private LogService logService;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private CartaoRepository cartaoRepository;

    @Autowired
    private EnderecoRepository enderecoRepository;

    @Autowired
    private MensagemChatRepository mensagemChatRepository;

    @Autowired
    private CarteiraService carteiraService;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public boolean emailJaExiste(String email) {
        return clienteRepository.findByEmail(email) != null;
    }

    public boolean cpfJaExiste(String cpf) {
        if (cpf == null || cpf.isEmpty()) return false;
        return clienteRepository.findByCpf(cpf) != null;
    }

    @Transactional
    public void salvarFavoritos(Cliente cliente) {
        
        Cliente clienteExistente = clienteRepository.findById(cliente.getId())
            .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));
        
        
        clienteExistente.setFavoritos(cliente.getFavoritos());
        
        
        Cliente salvo = clienteRepository.save(clienteExistente);
    }

    public Cliente salvarClienteComEnderecos(Cliente cliente) {
        if (emailJaExiste(cliente.getEmail())) {
            throw new IllegalArgumentException("Este e-mail já está cadastrado");
        }
        if (cliente.getCpf() != null && !cliente.getCpf().isEmpty() && cpfJaExiste(cliente.getCpf())) {
            throw new IllegalArgumentException("Este CPF já está cadastrado");
        }

        Cliente clienteSalvo = salvarCliente(cliente);

        if (cliente.getEnderecos() != null) {
            for (Endereco endereco : cliente.getEnderecos()) {
                endereco.setCliente(clienteSalvo);
                enderecoRepository.save(endereco);
            }
        }

        if (cliente.getCartoes() != null) {
            for (Cartao cartao : cliente.getCartoes()) {
                cartao.setCliente(clienteSalvo);
                cartaoRepository.save(cartao);
            }
        }

        Log log = new Log(clienteSalvo.getId(), clienteSalvo.getNome(), "cadastro", "Cliente cadastrado", "success");
        logService.salvarLog(log);

        carteiraService.criarParaCliente(clienteSalvo);

        return clienteSalvo;
    }

    @Transactional
public void reativarAtendimento(Long pedidoId) {
    List<MensagemChat> mensagens = mensagemChatRepository.findByPedidoIdOrderByDataEnvioAsc(pedidoId);
    for (MensagemChat msg : mensagens) {
        msg.setAtendimentoAtivo(true);
    }
    mensagemChatRepository.saveAll(mensagens);
}

    @Transactional
    public Cliente atualizarClienteComEnderecos(Long id, Cliente clienteAtualizado) {
        return clienteRepository.findById(id).map(cliente -> {
            Cliente clienteAntigo = new Cliente();
            clienteAntigo.setNome(cliente.getNome());
            clienteAntigo.setEmail(cliente.getEmail());
            clienteAntigo.setTelefone(cliente.getTelefone());
            clienteAntigo.setTipotelefone(cliente.getTipotelefone());
            clienteAntigo.setCpf(cliente.getCpf());
            clienteAntigo.setNascimento(cliente.getNascimento());
            clienteAntigo.setGenero(cliente.getGenero());

            List<Endereco> enderecosAntigos = cliente.getEnderecos();
            List<Cartao> cartoesAntigos = cliente.getCartoes();

            cliente.setNome(clienteAtualizado.getNome());
            cliente.setEmail(clienteAtualizado.getEmail());
            cliente.setTelefone(clienteAtualizado.getTelefone());
            cliente.setTipotelefone(clienteAtualizado.getTipotelefone());
            cliente.setCpf(clienteAtualizado.getCpf());
            cliente.setNascimento(clienteAtualizado.getNascimento());
            cliente.setGenero(clienteAtualizado.getGenero());

            cliente.getEnderecos().clear();
            clienteRepository.save(cliente);

            cliente.getCartoes().clear();
            cartaoRepository.deleteByClienteId(id);

            if (clienteAtualizado.getCartoes() != null) {
                for (Cartao c : clienteAtualizado.getCartoes()) {
                    Cartao novo = new Cartao();
                    novo.setNumero(c.getNumero());
                    novo.setNomeTitular(c.getNomeTitular());
                    novo.setBandeira(c.getBandeira());
                    novo.setCvv(c.getCvv());
                    novo.setDataValidade(c.getDataValidade());
                    novo.setPreferencial(c.isPreferencial());
                    novo.setCliente(cliente);
                    cartaoRepository.save(novo);
                }
            }

            enderecoRepository.deleteByClienteId(id);

            for (Endereco e : clienteAtualizado.getEnderecos()) {
                Endereco novo = new Endereco();
                novo.setCep(e.getCep());
                novo.setRua(e.getRua());
                novo.setNumero(e.getNumero());
                novo.setComplemento(e.getComplemento());
                novo.setBairro(e.getBairro());
                novo.setCidade(e.getCidade());
                novo.setEstado(e.getEstado());
                novo.setPais(e.getPais());
                novo.setNomeEndereco(e.getNomeEndereco());
                novo.setTipo(e.getTipo());
                novo.setCliente(cliente);
                enderecoRepository.save(novo);
            }

            StringBuilder detalhes = new StringBuilder();
            boolean houveAlteracao = false;

            if (!clienteAntigo.getNome().equals(cliente.getNome())) {
                detalhes.append("Nome: ").append(clienteAntigo.getNome()).append(" → ").append(cliente.getNome()).append("; ");
                houveAlteracao = true;
            }
            if (!clienteAntigo.getEmail().equals(cliente.getEmail())) {
                detalhes.append("Email: ").append(clienteAntigo.getEmail()).append(" → ").append(cliente.getEmail()).append("; ");
                houveAlteracao = true;
            }
            if (clienteAntigo.getTelefone() != null && !clienteAntigo.getTelefone().equals(cliente.getTelefone())) {
                detalhes.append("Telefone: ").append(clienteAntigo.getTelefone()).append(" → ").append(cliente.getTelefone()).append("; ");
                houveAlteracao = true;
            }
            if (clienteAntigo.getCpf() != null && !clienteAntigo.getCpf().equals(cliente.getCpf())) {
                detalhes.append("CPF: ").append(clienteAntigo.getCpf()).append(" → ").append(cliente.getCpf()).append("; ");
                houveAlteracao = true;
            }

            if (houveAlteracao) {
                logService.salvarLog(new Log(id, cliente.getNome(), "edicao_dados", 
                    "Dados pessoais alterados: " + detalhes.toString(), "info"));
            }

            if (!enderecosAntigos.isEmpty() || !cliente.getEnderecos().isEmpty()) {
                StringBuilder enderecoLog = new StringBuilder();
                
                for (Endereco antigo : enderecosAntigos) {
                    boolean encontrado = cliente.getEnderecos().stream()
                        .anyMatch(novo -> novo.getId() != null && novo.getId().equals(antigo.getId()));
                    if (!encontrado && antigo.getId() != null) {
                        enderecoLog.append("Endereço \"").append(antigo.getNomeEndereco()).append("\" removido; ");
                    }
                }

                for (Endereco novo : cliente.getEnderecos()) {
                    if (novo.getId() == null) {
                        enderecoLog.append("Endereço \"").append(novo.getNomeEndereco()).append("\" adicionado: ")
                            .append(novo.getRua()).append(", ").append(novo.getNumero())
                            .append(" - ").append(novo.getCidade()).append("/").append(novo.getEstado()).append("; ");
                    }
                }

                if (enderecoLog.length() > 0) {
                    logService.salvarLog(new Log(id, cliente.getNome(), "edicao_enderecos",
                        "Alterações em endereços: " + enderecoLog.toString(), "info"));
                }
            }

            if (!cartoesAntigos.isEmpty() || !cliente.getCartoes().isEmpty()) {
                StringBuilder cartaoLog = new StringBuilder();

                for (Cartao antigo : cartoesAntigos) {
                    boolean encontrado = cliente.getCartoes().stream()
                        .anyMatch(novo -> novo.getId() != null && novo.getId().equals(antigo.getId()));
                    if (!encontrado && antigo.getId() != null) {
                        cartaoLog.append("Cartão ").append(antigo.getBandeira())
                            .append(" ****").append(antigo.getNumero().substring(Math.max(0, antigo.getNumero().length() - 4)))
                            .append(" removido; ");
                    }
                }

                for (Cartao novo : cliente.getCartoes()) {
                    if (novo.getId() == null) {
                        cartaoLog.append("Cartão ").append(novo.getBandeira())
                            .append(" ****").append(novo.getNumero().substring(Math.max(0, novo.getNumero().length() - 4)))
                            .append(" adicionado; ");
                    }
                }

                if (cartaoLog.length() > 0) {
                    logService.salvarLog(new Log(id, cliente.getNome(), "edicao_cartoes",
                        "Alterações em cartões: " + cartaoLog.toString(), "info"));
                }
            }

            return cliente;
        }).orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));
    }

    public void mudarStatusCliente(Long id, Boolean ativo, String motivo) {
        Cliente cliente = clienteRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));

        String statusAntigo = cliente.isAtivo() ? "Ativo" : "Inativo";
        cliente.setAtivo(ativo);
        if (ativo) {
            cliente.setMotivoAtivacao(motivo);
            cliente.setMotivoInativacao(null);
        } else {
            cliente.setMotivoInativacao(motivo);
            cliente.setMotivoAtivacao(null);
        }

        clienteRepository.save(cliente);

        String statusNovo = cliente.isAtivo() ? "Ativo" : "Inativo";
        logService.salvarLog(new Log(id, cliente.getNome(), "status_cliente",
            "Status alterado: " + statusAntigo + " → " + statusNovo + ". Motivo: " + motivo, "info"));
    }

    public Cliente salvarCliente(Cliente cliente) {
        if (cliente.getSenha() != null && !cliente.getSenha().isEmpty()) {
            validarSenhaForte(cliente.getSenha());
            String senhaCriptografada = passwordEncoder.encode(cliente.getSenha());
            cliente.setSenha(senhaCriptografada);
        } else if (cliente.getId() != null) {
            Cliente clienteExistente = clienteRepository.findById(cliente.getId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado."));
            cliente.setSenha(clienteExistente.getSenha());
        }

        if (cliente.getDataCadastro() == null) {
            cliente.setDataCadastro(LocalDate.now());
        }

        return clienteRepository.save(cliente);
    }

    public List<Cliente> listarClientes() {
        return clienteRepository.findAll();
    }

    public Optional<Cliente> buscarPorId(Long id) {
        return clienteRepository.findById(id);  
    }

    public void alterarSenha(Long id, String senha, String confirmacaoSenha) {
        if (senha == null || confirmacaoSenha == null) {
            throw new IllegalArgumentException("Senha e confirmação não podem ser nulas.");
        }
        if (!senha.equals(confirmacaoSenha)) {
            throw new IllegalArgumentException("Senhas não coincidem.");
        }
        validarSenhaForte(senha);

        Cliente cliente = clienteRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado."));

        String senhaCriptografada = passwordEncoder.encode(senha);
        cliente.setSenha(senhaCriptografada);
        clienteRepository.save(cliente);

        logService.salvarLog(new Log(id, cliente.getNome(), "alteracao_senha",
            "Senha alterada com sucesso", "success"));
    }

    private void validarSenhaForte(String senha) {
        if (senha == null || senha.length() < 8) {
            throw new IllegalArgumentException("A senha deve ter no mínimo 8 caracteres.");
        }
        if (!senha.matches(".*[A-Z].*")) {
            throw new IllegalArgumentException("A senha deve conter pelo menos uma letra maiúscula.");
        }
        if (!senha.matches(".*[a-z].*")) {
            throw new IllegalArgumentException("A senha deve conter pelo menos uma letra minúscula.");
        }
        if (!senha.matches(".*\\d.*")) {
            throw new IllegalArgumentException("A senha deve conter pelo menos um número.");
        }
        if (!senha.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
            throw new IllegalArgumentException("A senha deve conter pelo menos um caractere especial.");
        }
    }

    public List<Cliente> filtrarClientes(String nome, String email, String cpf, String telefone,
                                       String tipoTelefone, String genero, Boolean ativo) {
        return clienteRepository.findAll((root, query, cb) -> {
            Predicate predicate = cb.conjunction();

            if (nome != null && !nome.isBlank()) {
                predicate = cb.and(predicate,
                    cb.like(cb.lower(root.get("nome")), "%" + nome.toLowerCase() + "%"));
            }
            if (email != null && !email.isBlank()) {
                predicate = cb.and(predicate,
                    cb.like(cb.lower(root.get("email")), "%" + email.toLowerCase() + "%"));
            }
            if (cpf != null && !cpf.isBlank()) {
                predicate = cb.and(predicate,
                    cb.like(root.get("cpf"), "%" + cpf + "%"));
            }
            if (telefone != null && !telefone.isBlank()) {
                predicate = cb.and(predicate,
                    cb.like(root.get("telefone"), "%" + telefone + "%"));
            }
            if (tipoTelefone != null && !tipoTelefone.isBlank()) {
                predicate = cb.and(predicate,
                    cb.equal(root.get("tipoTelefone"), tipoTelefone));
            }
            if (genero != null && !genero.isBlank()) {
                predicate = cb.and(predicate,
                    cb.equal(root.get("genero"), genero));
            }
            if (ativo != null) {
                predicate = cb.and(predicate,
                    cb.equal(root.get("ativo"), ativo));
            }

            return predicate;
        });
    }

    @Transactional
    public void excluirCliente(Long id) {
        Cliente cliente = clienteRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));

        logService.salvarLog(new Log(cliente.getId(), cliente.getNome(), "exclusao", "Cliente excluído", "info"));
        clienteRepository.delete(cliente);
    }

   public Cliente login(String email, String senha) {
    Cliente cliente = clienteRepository.findByEmail(email);

    if (cliente != null && BCrypt.checkpw(senha, cliente.getSenha())) {
        Log log = new Log(cliente.getId(), cliente.getNome(), "login", "Login realizado com sucesso", "success");
        logService.salvarLog(log);
        
        Cliente clienteResponse = new Cliente();
        clienteResponse.setId(cliente.getId());
        clienteResponse.setNome(cliente.getNome());
        clienteResponse.setEmail(cliente.getEmail());
        clienteResponse.setPerfil(cliente.getPerfil());
        clienteResponse.setAtivo(cliente.isAtivo());
        clienteResponse.setDataCadastro(cliente.getDataCadastro());
        clienteResponse.setCpf(cliente.getCpf());
        clienteResponse.setTelefone(cliente.getTelefone());
        clienteResponse.setTipotelefone(cliente.getTipotelefone());
        clienteResponse.setGenero(cliente.getGenero());
        clienteResponse.setNascimento(cliente.getNascimento());
        clienteResponse.setFavoritos(cliente.getFavoritos());
        
        return clienteResponse;
    }

    return null;
}

    @Transactional
    public Cliente atualizarDadosPessoais(Long id, Cliente clienteAtualizado) {
        Cliente clienteAtual = clienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));

        String nomeAntigo = clienteAtual.getNome();
        String emailAntigo = clienteAtual.getEmail();
        String telefoneAntigo = clienteAtual.getTelefone();
        String tipotelefoneAntigo = clienteAtual.getTipotelefone();
        String cpfAntigo = clienteAtual.getCpf();

        clienteAtual.setNome(clienteAtualizado.getNome());
        clienteAtual.setEmail(clienteAtualizado.getEmail());
        clienteAtual.setTelefone(clienteAtualizado.getTelefone());
        clienteAtual.setTipotelefone(clienteAtualizado.getTipotelefone());
        clienteAtual.setCpf(clienteAtualizado.getCpf());
        clienteAtual.setNascimento(clienteAtualizado.getNascimento());
        clienteAtual.setGenero(clienteAtualizado.getGenero());

        if (clienteAtualizado.getSenha() != null && !clienteAtualizado.getSenha().isEmpty()) {
            validarSenhaForte(clienteAtualizado.getSenha());
            String senhaCriptografada = passwordEncoder.encode(clienteAtualizado.getSenha());
            clienteAtual.setSenha(senhaCriptografada);
        }

        Cliente atualizado = clienteRepository.save(clienteAtual);

        StringBuilder detalhes = new StringBuilder();
        boolean houveAlteracao = false;

        if (!nomeAntigo.equals(atualizado.getNome())) {
            detalhes.append("Nome: ").append(nomeAntigo).append(" → ").append(atualizado.getNome()).append("; ");
            houveAlteracao = true;
        }
        if (!emailAntigo.equals(atualizado.getEmail())) {
            detalhes.append("Email: ").append(emailAntigo).append(" → ").append(atualizado.getEmail()).append("; ");
            houveAlteracao = true;
        }
        if (telefoneAntigo != null && !telefoneAntigo.equals(atualizado.getTelefone())) {
            detalhes.append("Telefone: ").append(telefoneAntigo).append(" → ").append(atualizado.getTelefone()).append("; ");
            houveAlteracao = true;
        }
        if (cpfAntigo != null && !cpfAntigo.equals(atualizado.getCpf())) {
            detalhes.append("CPF: ").append(cpfAntigo).append(" → ").append(atualizado.getCpf()).append("; ");
            houveAlteracao = true;
        }

        if (houveAlteracao) {
            Log log = new Log(id, atualizado.getNome(), "edicao_dados",
                "Dados pessoais alterados: " + detalhes.toString(), "info");
            logService.salvarLog(log);
        }

        return atualizado;
    }

    public void deletarCliente(Long id) {
        Optional<Cliente> clienteOpt = clienteRepository.findById(id);
        if (clienteOpt.isPresent()) {
            Cliente cliente = clienteOpt.get();

            cliente.getEnderecos().clear();
            cliente.getCartoes().clear();

            clienteRepository.delete(cliente);
        }
    }

    public List<ClienteRankingDTO> obterRankingClientes() {
        return clienteRepository.buscarRankingClientes();
    }
}
