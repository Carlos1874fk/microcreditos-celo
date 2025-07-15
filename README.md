# microcreditos-celo

Plataforma de microcréditos comunitarios basada en blockchain usando CELO.

Este proyecto está construido con **Hardhat** y **React**, e incluye:

- 🛠️ Contratos inteligentes para gestionar solicitudes y otorgamientos de préstamos
- ⚙️ Módulo de Ignition para el despliegue automatizado
- 🌐 Frontend interactivo conectado a la blockchain

## Comandos útiles para desarrollo

```bash
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
