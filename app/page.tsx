"use client";

import { useEffect, useState } from "react";

type Envio = {
  intWhatsAppEnvioId: number;
  intAgendaId: number;
  strTipo: string;
  datWhatsAppEnvio: string;
  bolEnviado: string;
  bolConfirma: string;
  bolMensagemErro: boolean;
  telefone: string;
};

const filtroStyle: React.CSSProperties = {
  backgroundColor: "#111",
  color: "#fff",
  border: "1px solid #555",
  padding: "6px 8px",
  borderRadius: 4,
};

const botaoStyle: React.CSSProperties = {
  backgroundColor: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "6px 14px",
  borderRadius: 4,
  cursor: "pointer",
};

const badgeBase: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: "bold",
};

const badgeEnviado = {
  ...badgeBase,
  backgroundColor: "#166534",
  color: "#dcfce7",
};

const badgeErro = {
  ...badgeBase,
  backgroundColor: "#7f1d1d",
  color: "#fee2e2",
};

const badgePendente = {
  ...badgeBase,
  backgroundColor: "#78350f",
  color: "#fef3c7",
};

// 🔥 CORREÇÃO DEFINITIVA DE HORÁRIO (UTC → BRASIL)
function formatarDataBrasil(data: string) {
  const d = new Date(data);

  // SQL Server envia sem fuso → JS interpreta como UTC
  // Brasil = UTC-3 → somar 3 horas
  d.setHours(d.getHours() + 3);

  return d.toLocaleString("pt-BR");
}

export default function Home() {
  const [dados, setDados] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [inicio, setInicio] = useState("2026-01-30");
  const [fim, setFim] = useState("2026-02-01");
  const [tipo, setTipo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [agendaId, setAgendaId] = useState("");
  const [status, setStatus] = useState("");

  // paginação
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const limite = 50;

  async function carregar() {
    setLoading(true);

    const params = new URLSearchParams({
      inicio,
      fim,
      pagina: pagina.toString(),
      limite: limite.toString(),
    });

    if (tipo) params.append("tipo", tipo);
    if (telefone) params.append("telefone", telefone);
    if (agendaId) params.append("agendaId", agendaId);
    if (status) params.append("status", status);

    const res = await fetch(`/api/envios?${params.toString()}`, {
      headers: {
        Authorization: "8ef9e6c6-d7df-4d54-9916-b761f5967894",
      },
    });

    const json = await res.json();
    setDados(json.dados || []);
    setTotal(json.total || 0);
    setLoading(false);
  }

  // recarrega ao mudar página
  useEffect(() => {
    carregar();
  }, [pagina]);

  // quando filtrar, volta para página 1
  function filtrar() {
    setPagina(1);
    carregar();
  }

  const totalPaginas = Math.max(1, Math.ceil(total / limite));

  return (
    <main
      style={{
        padding: 20,
        background: "#0f172a",
        minHeight: "100vh",
        color: "#fff",
      }}
    >
      <h1 style={{ marginBottom: 20 }}>📊 Painel de Envios WhatsApp</h1>

      {/* FILTROS */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} style={filtroStyle} />
        <input type="date" value={fim} onChange={e => setFim(e.target.value)} style={filtroStyle} />

        <select value={tipo} onChange={e => setTipo(e.target.value)} style={filtroStyle}>
          <option value="">Todos os tipos</option>
          <option value="AgendaInicio">AgendaInicio</option>
          <option value="Cadencia">Cadencia</option>
        </select>

        <input
          placeholder="Telefone"
          value={telefone}
          onChange={e => setTelefone(e.target.value)}
          style={filtroStyle}
        />

        <input
          placeholder="ID Agenda"
          value={agendaId}
          onChange={e => setAgendaId(e.target.value)}
          style={filtroStyle}
        />

        <select value={status} onChange={e => setStatus(e.target.value)} style={filtroStyle}>
          <option value="">Todos os status</option>
          <option value="enviado">Enviado</option>
          <option value="erro">Erro</option>
          <option value="pendente">Pendente</option>
        </select>

        <button onClick={filtrar} style={botaoStyle}>
          Filtrar
        </button>
      </div>

      {loading && <p>Carregando...</p>}

      {/* TABELA */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#020617",
        }}
      >
        <thead>
          <tr>
            {["ID", "Agenda", "Tipo", "Data", "Telefone", "Status"].map(h => (
              <th
                key={h}
                style={{
                  border: "1px solid #334155",
                  padding: 8,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dados.map(d => (
            <tr key={d.intWhatsAppEnvioId}>
              <td style={{ border: "1px solid #334155", padding: 6 }}>{d.intWhatsAppEnvioId}</td>
              <td style={{ border: "1px solid #334155", padding: 6 }}>{d.intAgendaId}</td>
              <td style={{ border: "1px solid #334155", padding: 6 }}>{d.strTipo}</td>
              <td style={{ border: "1px solid #334155", padding: 6 }}>
                {formatarDataBrasil(d.datWhatsAppEnvio)}
              </td>
              <td style={{ border: "1px solid #334155", padding: 6 }}>{d.telefone}</td>
              <td style={{ border: "1px solid #334155", padding: 6 }}>
                {d.bolMensagemErro ? (
                  <span style={badgeErro}>Erro</span>
                ) : d.bolEnviado === "S" ? (
                  <span style={badgeEnviado}>Enviado</span>
                ) : (
                  <span style={badgePendente}>Pendente</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINAÇÃO */}
      <div style={{ marginTop: 20, display: "flex", gap: 12, alignItems: "center" }}>
        <button
          style={botaoStyle}
          disabled={pagina === 1}
          onClick={() => setPagina(p => p - 1)}
        >
          ⬅ Anterior
        </button>

        <span>
          Página {pagina} de {totalPaginas}
        </span>

        <button
          style={botaoStyle}
          disabled={pagina >= totalPaginas}
          onClick={() => setPagina(p => p + 1)}
        >
          Próxima ➡
        </button>
      </div>
    </main>
  );
}
