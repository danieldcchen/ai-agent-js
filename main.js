import { input } from "@inquirer/prompts";
import { searchAttractions } from "./lib/qdrant_attractions.js";
import { spinner } from "./utils/spinner.js";

try {
  while (true) {
    const query = (
      await input({ message: "想去的景點：" })
    ).trim();

    if (query === "") continue;
    if (query.toLowerCase() === "exit") {
      console.log("再會~");
      break;
    }

    const spin = spinner("搜尋中...").start();
    const results = await searchAttractions(query, 1);
    spin.stop();

    for (const [i, r] of results.entries()) {
      console.log(`\n${i + 1}. ${r.title} (${r.type}, ${r.release_year})`);
      console.log(`   分數：${r.score.toFixed(3)}`);
      console.log(`   分類：${r.listed_in}`);
      console.log(`   描述：${r.description}`);
    }
    console.log();
  }
} catch (err) {
  if (err.name === "ExitPromptError") {
    console.log("\n再會~");
  } else {
    throw err;
  }
}