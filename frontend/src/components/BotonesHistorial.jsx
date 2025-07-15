export default function BotonesHistorial({ verFormulario, verSolicitado, verFinanciado }) {
  return (
    <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>

      <button onClick={verSolicitado}>📘 Ver mis préstamos solicitados</button>
      <button onClick={verFinanciado}>💰 Ver mis préstamos financiados</button>
    </div>
  );
}
