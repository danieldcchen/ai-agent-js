import { OPENAI_API_KEY } from './config.js';
import { convertUnit, processToolCall } from './tools/convert-unit-tool.js';
import { input } from '@inquirer/prompts';
import OpenAI from 'openai';
import { JSONFile } from 'lowdb/node';
import { initMessage, addMessage, getMessages } from './db/messages.js';

// 定義工具的 JSON Schema
const tools = [
  {
    type: 'function',
    function: {
      name: 'convert_unit',
      description: '進行單位換算，支援溫度、距離、重量的轉換',
      parameters: {
        type: 'object',
        properties: {
          value: {
            type: 'number',
            description: '要轉換的數值',
          },
          from_unit: {
            type: 'string',
            description: '原始單位 (°C, °F, km, mile, kg, lb)',
          },
          to_unit: {
            type: 'string',
            description: '目標單位 (°C, °F, km, mile, kg, lb)',
          },
        },
        required: ['value', 'from_unit', 'to_unit'],
      },
    },
  },
];

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

try {
  initMessage(
    '你是一位精通全球度量衡的「專業單位換算助手」。你的任務是精確、快速地幫使用者進行各種物理量的單位轉換。'
  );

  while (true) {
    const userQuestion = await input({ message: '請問您要換算的單位：' });
    await addMessage(userQuestion, 'user');

    let response = await client.chat.completions.create({
      model: 'gpt-5-mini', // ✅ 修正：使用正確的模型名稱
      messages: getMessages(),
      tools: tools,
      tool_choice: 'auto',
    });

    // 持續處理工具呼叫的迴圈
    while (response.choices[0].finish_reason === 'tool_calls') {
      const assistantMessage = response.choices[0].message;

      // ✅ 將 assistant 的訊息加入歷史
      await addMessage(assistantMessage.content || '', 'assistant');

      const toolCalls = assistantMessage.tool_calls;

      // 處理每個工具呼叫
      for (const toolCall of toolCalls) {
        console.log(`\n📞 呼叫工具: ${toolCall.function.name}`);
        console.log(`📝 參數: ${toolCall.function.arguments}`);

        const toolInput = JSON.parse(toolCall.function.arguments);
        const toolResult = processToolCall(toolCall.function.name, toolInput);

        console.log(`✅ 結果: ${toolResult}`);

        
      }

      // ✅ 重新構建完整的消息歷史（包括工具呼叫和結果）
      const messagesForSecondCall = getMessages();

      // 添加 assistant 的工具呼叫訊息
      messagesForSecondCall.push({
        role: 'assistant',
        content: assistantMessage.content || '',
        tool_calls: toolCalls,
      });

      // 添加每個工具呼叫的結果
      for (const toolCall of toolCalls) {
        const toolInput = JSON.parse(toolCall.function.arguments);
        const toolResult = processToolCall(toolCall.function.name, toolInput);

        messagesForSecondCall.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResult,
        });
      }

      // 第二次呼叫 API（用工具結果）
      response = await client.chat.completions.create({
        model: 'gpt-5-mini', // ✅ 修正：使用正確的模型名稱
        messages: messagesForSecondCall,
        tools: tools,
        tool_choice: 'auto',
      });
    }

    // ✅ 當不再需要工具呼叫時，取得最終回答
    const finalContent = response.choices[0].message.content;
    console.log(`\n🤖 助手: ${finalContent}`);
    await addMessage(finalContent, 'assistant');
  }
} catch (err) {
  if (err.name === 'ExitPromptError') {
    console.log('\n再會~');
  } else {
    console.error('❌ 錯誤:', err.message);
    throw err;
  }
}
