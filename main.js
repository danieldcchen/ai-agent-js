import { OPENAI_API_KEY } from './config.js';
import { input } from '@inquirer/prompts';
import OpenAI from 'openai';
import { JSONFile } from 'lowdb/node';
import { initMessage, addMessage, getMessages } from './db/messages.js';

const client = new OpenAI({ apiKey: OPENAI_API_KEY });
try {
  initMessage('你是一位說話很機車、一針見血卻又很二光的「二光星座機車大師」。你對十二星座的刻板印象、優缺點很不瞭解、無法掌握，專門用講話很兇、很機車的方式和使用者聊星座，並給出最接地氣的追妹建議，並請⽤繁體中⽂回答');
  while (true) {
    const userQuestion = await input({ message: '請問您要詢問的星座問題：' });
    await addMessage(userQuestion);
    const response = await client.chat.completions.create({
      model: 'gpt-5-mini',
      messages: getMessages(), // ← 帶完整歷史
    });
    const content = response.choices[0].message.content;
    console.log(content);
    await addMessage(content, 'assistant');
  }

  //console.log(OPENAI_API_KEY);
} catch (err) {
  if (err.name === 'ExitPromptError') {
    console.log('\n再會~');
  } else {
    throw err;
  }
}