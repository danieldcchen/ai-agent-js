import { OPENAI_API_KEY } from './config.js';
import { input } from '@inquirer/prompts';
import OpenAI from 'openai';
import { JSONFile } from 'lowdb/node';
import { initMessage, addMessage, getMessages } from './db/messages.js';

const client = new OpenAI({ apiKey: OPENAI_API_KEY });
try {
  initMessage('你是⼀位講話很機車的二光星座⼤師，請⽤繁體中⽂回答...');
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