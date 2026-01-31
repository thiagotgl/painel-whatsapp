export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";



// normaliza telefone recebido via query
function normalizarTelefone(valor: string | null) {
  if (!valor) return null;

  let tel = valor.replace(/\D/g, "");

  // remove DDI 55 se existir
  if (tel.startsWith("55")) {
    tel = tel.slice(2);
  }

  return tel;
}

export async function GET(req: NextRequest) {
  try {
    // 🔐 Autorização simples
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${process.env.API_TOKEN}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // parâmetros obrigatórios
    const inicio = searchParams.get("inicio");
    const fim = searchParams.get("fim");

    // paginação
    const pagina = Number(searchParams.get("pagina") || 1);
    const limite = Math.min(Number(searchParams.get("limite") || 20), 50);
    const offset = (pagina - 1) * limite;

    // filtros opcionais
    const tipo = searchParams.get("tipo");
    const telefoneRaw = searchParams.get("telefone");
    const agendaId = searchParams.get("agendaId");
    const status = searchParams.get("status"); // enviado | erro | pendente

    if (!inicio || !fim) {
      return NextResponse.json(
        { error: "Parâmetros inicio e fim são obrigatórios" },
        { status: 400 }
      );
    }

    const telefone = normalizarTelefone(telefoneRaw);

    const pool = await getDb();

    // WHERE base (sempre por data)
    let where = `
      CONVERT(date, w.datWhatsAppEnvio) BETWEEN @inicio AND @fim
    `;

    if (tipo) {
      where += " AND w.strTipo = @tipo";
    }

    if (telefone) {
      where += " AND w.strTelefone LIKE '%' + @telefone + '%'";
    }

    if (agendaId) {
      where += " AND w.intAgendaId = @agendaId";
    }

    if (status === "enviado") {
      where += " AND w.bolEnviado = 'S'";
    }

    if (status === "erro") {
      where += " AND w.bolMensagemErro = 1";
    }

    if (status === "pendente") {
      where += " AND (w.bolEnviado <> 'S' OR w.bolEnviado IS NULL)";
    }

    // request base
    const request = pool
      .request()
      .input("inicio", inicio)
      .input("fim", fim)
      .input("offset", offset)
      .input("limite", limite);

    if (tipo) request.input("tipo", tipo);
    if (telefone) request.input("telefone", telefone);
    if (agendaId) request.input("agendaId", Number(agendaId));

    // 🔢 TOTAL REAL (COUNT)
    const countResult = await request.query(`
      SELECT COUNT(*) AS total
      FROM tblWhatsAppEnvio w
      WHERE ${where}
    `);

    const total = countResult.recordset[0].total;

    // 📄 DADOS PAGINADOS
    const result = await request.query(`
      SELECT
        w.intWhatsAppEnvioId,
        w.intAgendaId,
        w.strTipo,
        w.datWhatsAppEnvio,
        w.bolEnviado,
        w.bolConfirma,
        w.bolMensagemErro,
        '55' + w.strTelefone AS telefone
      FROM tblWhatsAppEnvio w
      WHERE ${where}
      ORDER BY w.datWhatsAppEnvio DESC
      OFFSET @offset ROWS
      FETCH NEXT @limite ROWS ONLY
    `);

    return NextResponse.json({
      pagina,
      limite,
      total,
      dados: result.recordset,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao consultar envios" },
      { status: 500 }
    );
  }
}
