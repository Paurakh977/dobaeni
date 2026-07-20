#!/usr/bin/env bun
import { Runner, InMemorySessionService } from "@google/adk";
import { rootAgent } from "../lib/agent/agent";

const APP_NAME = "dobaeni_chat";

async function main() {
  const userId = "debug_user";
  const sessionId = `s_${Date.now()}`;
  const sessionService = new InMemorySessionService();
  const runner = new Runner({ agent: rootAgent, appName: APP_NAME, sessionService });
  const session = await sessionService.createSession({ appName: APP_NAME, userId, sessionId });

  const newMessage = { role: "user" as const, parts: [{ text: "show me kurtas" }] };

  let evNum = 0;
  for await (const event of runner.runAsync({ userId, sessionId, newMessage: newMessage as any, runConfig: { streamingMode: "sse" } as any })) {
    evNum++;
    const content: any = (event as any).content;
    const parts = content?.parts ?? [];
    const flags: string[] = [];
    if ((event as any).partial) flags.push("PARTIAL");
    if ((event as any).turnComplete) flags.push("TURNCOMPLETE");
    if ((event as any).errorMessage) flags.push("ERROR:" + (event as any).errorMessage);
    console.log(`\n--- EVENT #${evNum} author=${(event as any).author} ${flags.join(" ")} ---`);
    for (const p of parts) {
      const keys = Object.keys(p);
      console.log(`  part keys: [${keys.join(",")}]`);
      if (p.thought !== undefined) console.log(`    thought=${p.thought}`);
      if (p.text !== undefined) console.log(`    text=${JSON.stringify(p.text)?.slice(0, 200)}`);
      if (p.functionCall) console.log(`    functionCall=${p.functionCall.name} args=${JSON.stringify(p.functionCall.args)?.slice(0,200)}`);
      if (p.functionResponse) console.log(`    functionResponse=${p.functionResponse.name}`);
    }
  }
  console.log("\nDONE");
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
