import { NextResponse } from "next/server";
import { getDb } from "@/lib/sqlite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Database helpers matching existing logic in app/api/ev-purchases/route.ts
function findTableName(db: any): string {
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all() as { name: string }[];

  const pref = ["ev_purchases", "purchases", "registrations", "ev_registrations"];
  for (const p of pref) {
    const found = rows.find((r) => r.name.toLowerCase() === p);
    if (found) return found.name;
  }
  return rows[0]?.name;
}

function getColumns(db: any, table: string): string[] {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return cols.map((c) => c.name);
}

function guessColumns(cols: string[]) {
  const lc = (s: string) => s.toLowerCase();
  const find = (names: string[]) =>
    cols.find((c) => names.includes(lc(c))) ??
    cols.find((c) => lc(c) === names[0]);

  return {
    state: find(["state", "state_name"]),
    district: find(["district", "district_name"]),
    count: find(["count", "ev_count", "value", "registrations", "purchases"]),
  };
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content || "";
    let retrievedContext = "";

    // ==========================================
    // RAG ROUTE 1: SQL EV Purchases Data Retrieval
    // ==========================================
    try {
      const db = getDb();
      if (db) {
        const table = findTableName(db);
        const cols = getColumns(db, table);
        const c = guessColumns(cols.map((x) => x.toLowerCase()));

        const stateKey = c.state;
        const districtKey = c.district;
        const countKey = c.count;

        if (stateKey && districtKey && countKey) {
          // Extract distinct states and districts to check for match
          const statesList = db.prepare(`SELECT DISTINCT ${stateKey} FROM ${table}`).all() as any[];
          const districtsList = db.prepare(`SELECT DISTINCT ${districtKey} FROM ${table}`).all() as any[];

          const matchedStateObj = statesList.find(s => 
            new RegExp(`\\b${String(s[stateKey]).toLowerCase()}\\b`, 'i').test(userQuery)
          );
          const matchedDistrictObj = districtsList.find(d => 
            new RegExp(`\\b${String(d[districtKey]).toLowerCase()}\\b`, 'i').test(userQuery)
          );

          if (matchedStateObj) {
            const stateVal = matchedStateObj[stateKey];
            
            if (matchedDistrictObj) {
              const districtVal = matchedDistrictObj[districtKey];
              // Fetch district total
              const districtRow = db.prepare(
                `SELECT SUM(${countKey}) as total FROM ${table} WHERE LOWER(${stateKey}) = ? AND LOWER(${districtKey}) = ?`
              ).get(String(stateVal).toLowerCase(), String(districtVal).toLowerCase()) as { total: number };
              
              retrievedContext += `[Local Database Context] Verified total EV purchases in District: ${districtVal}, State: ${stateVal} is ${districtRow?.total || 0} registered vehicles.\n`;
            } else {
              // Fetch state total
              const stateRow = db.prepare(
                `SELECT SUM(${countKey}) as total FROM ${table} WHERE LOWER(${stateKey}) = ?`
              ).get(String(stateVal).toLowerCase()) as { total: number };
              
              retrievedContext += `[Local Database Context] Verified total EV purchases in State: ${stateVal} is ${stateRow?.total || 0} registered vehicles.\n`;
            }
          }
        }

      }
    } catch (dbErr) {
      console.warn("RAG DB Retrieval bypassed:", dbErr);
    }

    // ==========================================
    // RAG ROUTE 2: Solar Energy & EV Analysis
    // ==========================================
    const solarKeywords = ["solar", "panel", "land", "area", "sqm", "m2", "hectare"];
    const hasSolarRequest = solarKeywords.some(kw => userQuery.toLowerCase().includes(kw));
    
    if (hasSolarRequest) {
      // Simple numeric regex extraction (looks for standard land sizes)
      const numMatch = userQuery.match(/\b\d+(\.\d+)?\b/);
      if (numMatch) {
        const landArea = parseFloat(numMatch[0]);
        const panels = Math.floor(landArea / 2); // 2 sqm per panel
        const energy = panels * 0.4; // 0.4 kW per panel
        const evs = Math.floor(energy / 15); // 15 kWh per EV average need
        
        retrievedContext += `[Local Solar-ML Analysis Context] For a land area of ${landArea} sqm, InfraCharge ML model calculates:\n`;
        retrievedContext += `- Maximum Solar Panels supportable: ${panels} panels\n`;
        retrievedContext += `- Daily energy generation capacity: ${energy.toFixed(2)} kW\n`;
        retrievedContext += `- Daily EV charging capability: Supports ${evs} standard electric vehicles (assuming 15 kWh charge/day).\n`;
      }
    }

    // ==========================================
    // SYSTEM PROMPT CREATION
    // ==========================================
    const systemPrompt = `You are the InfraCharge AI Assistant. Keep your answers extremely short, concise, and straight to the point (maximum 2-3 sentences or a quick bulleted list). Avoid introductory fluff, long essays, or repetitive explanations. Answer instantly and directly.

${retrievedContext ? `Here is the verified platform data for your response:\n${retrievedContext}\nUse it as your single source of truth to state the facts directly.` : ""}

Focus on delivering lightning-fast, highly-actionable responses for EV drivers and planners. Keep total response length under 50 words!`;

    // ==========================================
    // FAILOVER CHAT INVOCATION FLOW
    // ==========================================
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    let responseContent = "";
    let engineUsed = "";

    // 1. TRY GOOGLE GEMINI FIRST
    if (geminiApiKey) {
      try {
        console.log("Attempting generation via Google Gemini...");
        
        // Map messages array to Gemini format
        const contents = messages.map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

        // Insert system instruction context into the prompt
        if (contents.length > 0) {
          contents[contents.length - 1].parts[0].text = `[System Context: ${systemPrompt}]\n\nUser Question: ${userQuery}`;
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.2
              }
            })
          }
        );



        if (response.ok) {
          const data = await response.json();
          responseContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (responseContent) {
            engineUsed = "Google Gemini";
          }
        } else {
          const errData = await response.text();
          console.warn("Gemini API returned error state:", errData);
        }
      } catch (geminiErr) {
        console.error("Gemini invocation failed, falling back...", geminiErr);
      }
    }

    // 2. FAILOVER TO OPENAI IF GEMINI FAILED OR KEY WAS MISSING
    if (!responseContent && openaiApiKey) {
      try {
        console.log("Fallback activated: Attempting generation via OpenAI...");
        
        const openAiMessages = [
          { role: "system", content: systemPrompt },
          ...messages.map((m: any) => ({ role: m.role, content: m.content }))
        ];

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: openAiMessages,
            temperature: 0.2,
            max_tokens: 100
          })
        });


        if (response.ok) {
          const data = await response.json();
          responseContent = data.choices?.[0]?.message?.content || "";
          if (responseContent) {
            engineUsed = "OpenAI GPT-4o-mini";
          }
        } else {
          const errData = await response.text();
          console.error("OpenAI fallback failed:", errData);
        }
      } catch (openaiErr) {
        console.error("OpenAI failover error:", openaiErr);
      }
    }

    if (!responseContent) {
      return NextResponse.json(
        { error: "Both primary (Gemini) and secondary (OpenAI) AI engines failed to generate a response." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content: responseContent,
      engine: engineUsed,
      retrieved: !!retrievedContext
    });

  } catch (err: any) {
    console.error("API error inside chat route:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
