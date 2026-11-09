
package com.biblioteca.biblioteca_online.repository;

import com.biblioteca.biblioteca_online.model.DevolucaoFoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DevolucaoFotoRepository extends JpaRepository<DevolucaoFoto, Long> {

    List<DevolucaoFoto> findByPedidoDevolucaoId(Long pedidoId);

}
