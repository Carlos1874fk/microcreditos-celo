export default function SolicitarPrestamo({ monto, plazo, setMonto, setPlazo, solicitarPrestamo }) {
  const handleSubmit = () => {
    const montoNum = parseFloat(monto.trim());
    const plazoNum = parseInt(plazo.trim());

    if (isNaN(montoNum) || montoNum < 0.1) {
      alert("Monto inválido. Debe ser mayor o igual a 0.1 CELO.");
      return;
    }

    if (isNaN(plazoNum) || plazoNum < 1) {
      alert("Plazo inválido. Debe ser de al menos 1 día.");
      return;
    }

    solicitarPrestamo(montoNum, plazoNum);
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <h2>📝 Solicitar un préstamo</h2>

      <input
        type="number"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        placeholder="Monto en CELO"
        min="0.1"
        step="any"
        style={{ marginRight: '0.5rem' }}
      />

      <input
        type="number"
        value={plazo}
        onChange={(e) => setPlazo(e.target.value)}
        placeholder="Plazo en días"
        min="1"
        step="1"
        style={{ marginRight: '0.5rem' }}
      />

      <button onClick={handleSubmit}>
        ✅ Solicitar préstamo
      </button>
    </div>
  );
}
