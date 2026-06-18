import { input } from "@inquirer/prompts";
import { client } from "./lib/openai.js";
import { spinner } from "./utils/spinner.js";
import { toOpenAITool } from "./utils/func-tool.js";
import * as allTools from "./tools/index.js";
import { initMessage, addMessage, getMessages } from "./db/messages.js";

const toolList = Object.values(allTools);
const tools = toolList.map(toOpenAITool);
const AVAILABLE_TOOLS = Object.fromEntries(toolList.map((t) => [t.name, t.fn]));

// ✅ 改用 getMessages() 來維護消息歷史
let messages = getMessages();

while (true) {
  const userQuestion = (
    await input({ message: "請輸入你的問題：" })
  ).trim();

  if (userQuestion === "") continue;
  if (userQuestion.toLowerCase() === "exit") {
    console.log("再會~");
    break;
  }

  // ✅ 將用戶問題加入消息和數據庫
  await addMessage(userQuestion, "user");
  messages = getMessages(); // ✅ 重新取得更新後的消息

  const spin = spinner("思考中...").start();

  let response = await client.chat.completions.create({
    model: "gpt-5-mini",
    messages,
    tools,
    tool_choice: "auto",
  });

  spin.stop();

  // ✅ 持續處理工具呼叫的迴圈
  while (response.choices[0].finish_reason === "tool_calls") {
    const assistantMessage = response.choices[0].message;

    // ✅ 添加 assistant 的訊息（包含工具呼叫）到消息歷史
    messages.push({
      role: "assistant",
      content: assistantMessage.content || "",
      tool_calls: assistantMessage.tool_calls,
    });

    // ✅ 處理每個工具呼叫
    for (const toolCall of assistantMessage.tool_calls) {
      const fnName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);
      console.log(`\n[呼叫 tool] ${fnName}(${JSON.stringify(args)})`);

      const fn = AVAILABLE_TOOLS[fnName];
      const result = await fn(args);
      
      console.log(`[tool 結果] ${JSON.stringify(result)}`);

      // ✅ 添加工具結果到消息歷史
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    // ✅ 再次調用 API，獲得最終回答
    response = await client.chat.completions.create({
      model: "gpt-5-mini",
      messages,
      tools,
      tool_choice: "auto",
    });
  }

  // ✅ 當不再需要工具呼叫時，取得最終回答
  const finalContent = response.choices[0].message.content;
  console.log(`\n🤖 ${finalContent}`);

  // ✅ 記錄最終回答到數據庫和消息歷史
  await addMessage(finalContent, "assistant");
  messages = getMessages(); // ✅ 重新取得更新後的消息，保持同步
}
