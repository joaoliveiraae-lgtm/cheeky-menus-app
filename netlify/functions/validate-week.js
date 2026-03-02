import { jsonResponse, badRequest, callGemini, safeJsonParse } from "./_shared.js";

const SYSTEM = `És um validador e normalizador de ementas semanais (PT-PT) para operação diária.

Objetivo: receber uma semana em texto cru e devolver uma versão limpa e estruturada de segunda a sexta-feira.
Cada dia deve conter: sopa, peixe, carne.

REGRAS OBRIGATÓRIAS:
1) PT-PT.
2) Se faltar informação, usa exatamente "MISSING" (maiúsculas). Nunca uses "Não especificado" ou "N/A".
3) Se um dia não existir, cria-o e preenche com "MISSING".
4) Reporta duplicações, linhas soltas, dias fora de ordem, pratos fora de secção.
5) Em missing_required_fields usa formato "terca.sopa", "quarta.peixe", etc.
6) Responde APENAS com JSON válido. Nada fora do JSON.`;

export default async (req) => {
  try {
    const body = JSON.parse(req.body || "{}");
    const { chef_name, operational_level, week_label = "", raw_week_text } = body;

    if (!chef_name || !operational_level || !raw_week_text) {
      return badRequest("Missing required fields: chef_name, operational_level, raw_week_text");
    }

    const USER = `MODO: weekly_validation
chef_name: ${chef_name}
operational_level: ${operational_level}
week_label (opcional): ${week_label}

INPUT (texto cru):
${raw_week_text}

TAREFA:
1) Extrair e normalizar segunda a sexta.
2) Garantir sopa, peixe e carne para cada dia.
3) Marcar faltas com "MISSING".
4) Criar public_text_week em formato limpo.`;

    const outText = await callGemini({ system: SYSTEM, user: USER });
    const outJson = safeJsonParse(outText);

    return jsonResponse(200, outJson);
  } catch (e) {
    return jsonResponse(500, { error: e.message });
  }
};
