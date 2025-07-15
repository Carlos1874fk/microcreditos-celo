// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract Microcredito {
    struct Prestamo {
        uint256 id;
        address solicitante;
        uint256 montoPrincipal;
        uint256 interes;
        uint256 tiempoInicio;
        uint256 tiempoVencimiento;
        bool financiado;
        bool pagado;
        address financiador;
    }

    Prestamo[] public prestamos;
    mapping(address => uint256) public reputacion;

    event PrestamoSolicitado(
        uint256 id,
        address solicitante,
        uint256 montoPrincipal,
        uint256 interes,
        uint256 tiempoVencimiento
    );
    event PrestamoFinanciado(
        uint256 id,
        address financiador,
        uint256 total,
        uint256 timestamp
    );
    event PrestamoPagado(
        uint256 id,
        address solicitante,
        uint256 totalPagado,
        uint256 timestamp
    );
    event ReputacionActualizada(address usuario, uint256 nuevaReputacion);

    // 1. Solicitar préstamo
    function solicitarPrestamo(uint256 monto, uint256 plazoDias) external {
        require(monto > 0, "Monto debe ser mayor a 0");
        require(plazoDias > 0, "Plazo debe ser positivo");

        uint256 tasaAnual = 10e16; // 10%
        uint256 plazoSegundos = plazoDias * 1 days;
        uint256 interes = (monto * tasaAnual * plazoSegundos) / (365 days * 1e18);
        uint256 inicio = block.timestamp;
        uint256 vencimiento = inicio + plazoSegundos;
        uint256 id = prestamos.length;

        prestamos.push(
            Prestamo(
                id,
                msg.sender,
                monto,
                interes,
                inicio,
                vencimiento,
                false,
                false,
                address(0)
            )
        );

        emit PrestamoSolicitado(id, msg.sender, monto, interes, vencimiento);
    }

    // 2. Financiar préstamo
    function financiarPrestamo(uint256 id) external payable {
        require(id < prestamos.length, "ID invalido");
        Prestamo storage p = prestamos[id];
        require(!p.financiado, "Ya financiado");
        require(msg.value == p.montoPrincipal + p.interes, "Monto incorrecto");

        payable(p.solicitante).transfer(msg.value);
        p.financiado = true;
        p.financiador = msg.sender;

        emit PrestamoFinanciado(id, msg.sender, msg.value, block.timestamp);
    }

    // 3. Pagar préstamo
    function pagarPrestamo(uint256 id) external payable {
        require(id < prestamos.length, "ID invalido");
        Prestamo storage p = prestamos[id];
        require(p.financiado, "Aun no financiado");
        require(msg.sender == p.solicitante, "Solo solicitante");
        require(!p.pagado, "Ya pagado");

        uint256 total = p.montoPrincipal + p.interes;
        require(msg.value >= total, "Monto insuficiente");

        p.pagado = true;
        payable(p.financiador).transfer(total);

        reputacion[p.solicitante] += 10;
        reputacion[p.financiador] += 2;

        emit PrestamoPagado(id, msg.sender, total, block.timestamp);
        emit ReputacionActualizada(p.solicitante, reputacion[p.solicitante]);
        emit ReputacionActualizada(p.financiador, reputacion[p.financiador]);
    }

    // 4. Obtener todos los préstamos
    function obtenerPrestamos() public view returns (Prestamo[] memory) {
        return prestamos;
    }

    // 5. Ver si préstamo está vencido
    function estaVencido(uint256 id) public view returns (bool) {
        require(id < prestamos.length, "ID invalido");
        return block.timestamp >= prestamos[id].tiempoVencimiento;
    }

    // 6. Historial de solicitados
    function prestamosPorSolicitante(address usuario) external view returns (Prestamo[] memory) {
        uint256 total = prestamos.length;
        uint256 count = 0;
        for (uint256 i = 0; i < total; i++) {
            if (prestamos[i].solicitante == usuario) {
                count++;
            }
        }

        Prestamo[] memory resultado = new Prestamo[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < total; i++) {
            if (prestamos[i].solicitante == usuario) {
                resultado[j] = prestamos[i];
                j++;
            }
        }
        return resultado;
    }

    // 7. Historial de financiados
    function prestamosFinanciadosPor(address usuario) external view returns (Prestamo[] memory) {
        uint256 total = prestamos.length;
        uint256 count = 0;
        for (uint256 i = 0; i < total; i++) {
            if (prestamos[i].financiador == usuario) {
                count++;
            }
        }

        Prestamo[] memory resultado = new Prestamo[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < total; i++) {
            if (prestamos[i].financiador == usuario) {
                resultado[j] = prestamos[i];
                j++;
            }
        }
        return resultado;
    }
}
