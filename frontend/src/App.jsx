// src/App.jsx
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import MicrocreditoABI from "./Microcredito.json";
import SolicitarPrestamo from "./components/SolicitarPrestamo";
import BotonesHistorial from "./components/BotonesHistorial";
import "./index.css";

const contractAddress = "0x8496b7E39e5e76EeC35409DBb769DcF029434544";

// Manejador centralizado de errores (versión amigable)
const handleTxError = (e, defaultMsg) => {
  console.error(e);
  // Caso: usuario cancela desde la wallet
  if (e.code === 4001 || e?.data?.originalError?.code === 4001) {
    alert("⚠️ Operación cancelada por el usuario");
    return;
  }
  // Caso: error específico de monto insuficiente
  const msg = e?.message || "";
  if (msg.includes("Monto insuficiente")) {
    alert("⚠️ Debes pagar el total (principal + interés) para completar el pago");
    return;
  }
  // Para cualquier otro error, mostrar solo un mensaje genérico
  alert(`${defaultMsg}: Ocurrió un error inesperado. Intenta de nuevo.`);
};

function App() {
  const [vista, setVista] = useState("formulario");
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [prestamos, setPrestamos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [monto, setMonto] = useState("");
  const [plazo, setPlazo] = useState("");
  const [loadingAction, setLoadingAction] = useState({ type: null, id: null });

  // Helper para validar contrato
  const ensureContract = () => {
    if (!contract) {
      alert("Contrato no disponible");
      return false;
    }
    return true;
  };

  // Carga préstamos activos
  const loadPrestamos = async (contrato) => {
    try {
      const activos = await contrato.obtenerPrestamos();
      setPrestamos(activos);
    } catch (e) {
      console.error("Error cargando solicitudes activas", e);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        alert("Instala MetaMask para continuar");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      try {
        const { chainId } = await provider.getNetwork();
        if (chainId !== 44787) {
          alert("🔄 Cambia tu red en MetaMask a Celo Alfajores");
        }
      } catch {}
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const contrato = new ethers.Contract(
        contractAddress,
        MicrocreditoABI.abi,
        signer
      );
      setAccount(address);
      setContract(contrato);
      loadPrestamos(contrato);
    };
    init();
    // eslint-disable-next-line
  }, []);

  // Solicitar préstamo
  const solicitarPrestamo = async (valor, plazoDias) => {
    if (!ensureContract()) return;
    const montoNum = Number(valor);
    const plazoNum = Number(plazoDias);
    if (!montoNum || montoNum < 0.1) {
      alert("Monto mínimo: 0.1 CELO");
      return;
    }
    if (!plazoNum || plazoNum < 1) {
      alert("Plazo inválido");
      return;
    }
    setLoadingAction({ type: "solicitar", id: null });
    try {
      const amount = ethers.parseEther(montoNum.toString());
      const tx = await contract.solicitarPrestamo(amount, plazoNum);
      await tx.wait();
      await loadPrestamos(contract);
      setMonto("");
      setPlazo("");
      alert("✅ Préstamo solicitado con éxito");
    } catch (e) {
      handleTxError(e, "No se pudo solicitar el préstamo");
    } finally {
      setLoadingAction({ type: null, id: null });
    }
  };

  // Financiar préstamo
  const financiarPrestamo = async (id, totalWei) => {
    if (!ensureContract()) return;
    setLoadingAction({ type: "financiar", id });
    try {
      const tx = await contract.financiarPrestamo(id, { value: totalWei });
      await tx.wait();
      await loadPrestamos(contract);
      alert("✅ Préstamo financiado con éxito");
    } catch (e) {
      handleTxError(e, "No se pudo financiar el préstamo");
    } finally {
      setLoadingAction({ type: null, id: null });
    }
  };

  // Pagar préstamo
  const pagarPrestamo = async (id, prestamo) => {
    if (!ensureContract()) return;
    const ahora = Math.floor(Date.now() / 1000);
    const venc = Number(prestamo.tiempoVencimiento);
    const unDia = 24 * 60 * 60;
    if (ahora < venc - unDia) {
      alert("Aún no puedes pagar: no está vencido ni cerca del vencimiento");
      return;
    }
    const totalWei = prestamo.montoPrincipal + prestamo.interes;
    setLoadingAction({ type: "pagar", id });
    try {
      const tx = await contract.pagarPrestamo(id, { value: totalWei });
      await tx.wait();
      alert("✅ Préstamo pagado con éxito");
      verHistorialSolicitado();
    } catch (e) {
      handleTxError(e, "No se pudo pagar el préstamo");
    } finally {
      setLoadingAction({ type: null, id: null });
    }
  };

  // Vistas historial
  const verHistorialSolicitado = async () => {
    if (!ensureContract()) return;
    try {
      const data = await contract.prestamosPorSolicitante(account);
      setHistorial(data);
      setVista("solicitado");
    } catch (e) {
      console.error("Error cargando historial solicitado", e);
    }
  };

  const verHistorialFinanciado = async () => {
    if (!ensureContract()) return;
    try {
      const data = await contract.prestamosFinanciadosPor(account);
      setHistorial(data);
      setVista("financiado");
    } catch (e) {
      console.error("Error cargando historial financiado", e);
    }
  };

  const verFormulario = () => {
    setVista("formulario");
    if (contract) loadPrestamos(contract);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>💡 Microcréditos Comunitarios (CELO)</h1>
      <p>
        🔗 Conectado como: <strong>{account}</strong>
      </p>

      <BotonesHistorial
        verFormulario={verFormulario}
        verSolicitado={verHistorialSolicitado}
        verFinanciado={verHistorialFinanciado}
      />

      {vista === "formulario" && (
        <div>
          <SolicitarPrestamo
            monto={monto}
            plazo={plazo}
            setMonto={setMonto}
            setPlazo={setPlazo}
            solicitarPrestamo={solicitarPrestamo}
            loading={loadingAction.type === "solicitar"}
          />

          <h2>Solicitudes activas</h2>
          {prestamos.length === 0 ? (
            <p>Cargando solicitudes activas...</p>
          ) : (
            <ul>
              {prestamos.map((p) => {
                const status = p.pagado
                  ? "✅ Pagado"
                  : p.financiado
                  ? "💰 Financiado"
                  : "⏳ Pendiente";
                const totalWei = p.montoPrincipal + p.interes;
                const totalCelo = Number(ethers.formatEther(totalWei)).toFixed(2);
                const isLoading =
                  loadingAction.type === "financiar" &&
                  loadingAction.id === p.id;

                return (
                  <li key={p.id} style={{ marginBottom: "1rem" }}>
                    <strong>{p.solicitante}</strong> solicita{" "}
                    <strong>
                      {Number(
                        ethers.formatEther(p.montoPrincipal)
                      ).toFixed(2)}{" "}
                      CELO
                    </strong>{" "}
                    — {status}{" "}
                    {!p.financiado && (
                      <button
                        onClick={() => financiarPrestamo(p.id, totalWei)}
                        disabled={isLoading}
                      >
                        {isLoading ? `Financiando...` : `Financiar ${totalCelo} CELO`}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {vista === "solicitado" && (
        <div>
          <h2>📘 Mis préstamos solicitados</h2>
          <ul>
            {historial.map((p) => {
              const ahora = Math.floor(Date.now() / 1000);
              const venc = Number(p.tiempoVencimiento);
              const unDia = 24 * 60 * 60;
              const canPay = p.financiado && !p.pagado;
                p.financiado &&
                !p.pagado &&
                (ahora >= venc || ahora >= venc - unDia);

              const principal = Number(
                ethers.formatEther(p.montoPrincipal)
              );
              const interes = Number(ethers.formatEther(p.interes));
              const total = principal + interes;

              const status = p.pagado
                ? `📕 Cerrado — Total pagado: ${total.toFixed(2)} CELO`
                : p.financiado
                ? "💰 Financiado"
                : "⏳ No financiado";

              const isLoading =
                loadingAction.type === "pagar" &&
                loadingAction.id === p.id;

              return (
                <li key={p.id} style={{ marginBottom: "0.75rem" }}>
                  {principal.toFixed(2)} CELO — {status}{" "}
                  {canPay && !p.pagado && (
                    <button
                      onClick={() => pagarPrestamo(p.id, p)}
                      disabled={isLoading}
                    >
                      {isLoading
                        ? "Pagando..."
                        : `Pagar ${total.toFixed(2)} CELO`}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <button onClick={verFormulario}>← Volver</button>
        </div>
      )}

      {vista === "financiado" && (
        <div>
          <h2>💰 Préstamos que financio</h2>
          <ul>
            {historial.map((p) => (
              <li key={p.id} style={{ marginBottom: "0.75rem" }}>
                {Number(ethers.formatEther(p.montoPrincipal)).toFixed(2)} CELO a{" "}
                {p.solicitante} — {p.pagado ? "✅ Pagado" : "💰 Financiado"}
              </li>
            ))}
          </ul>
          <button onClick={verFormulario}>← Volver</button>
        </div>
      )}
    </div>
  );
}

export default App;

