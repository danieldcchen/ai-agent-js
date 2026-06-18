import { z } from "zod";
import { defineTool } from "../utils/func-tool.js";
import { searchAttractions } from "../lib/qdrant_attractions.js";

async function search({ query, limit = 5 }) {
  return await searchAttractions(query, limit);
}

export const attractionsTool = defineTool({
  name: "search_attraction",
  description:
    "在 Attraction 景點資料庫中以語意搜尋相關景點，可用於找景點特色、如何抵達等",
  fn: search,
  parameters: z.object({
    query: z.string().describe("查詢內容，可以是地點、特色、如何抵達或關鍵字"),
    limit: z.number().default(5).describe("回傳筆數上限，預設 2"),
  }),
});