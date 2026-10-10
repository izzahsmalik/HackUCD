import type { JsonSchema } from '../llm/llm.model.js';

/**
 * MCP handoff for the session building server/src/mcp/: import QueryModule
 * (it exports QueryService and QueryExecutor) and register a tool from these
 * three exports, e.g. `registerTool(QUERY_TOOL_NAME, { description:
 * QUERY_TOOL_DESCRIPTION, inputSchema: QUERY_TOOL_INPUT_SCHEMA }, handler)`
 * where the handler is `({ question }) => queryService.ask(question)`.
 * The response ({ answer, plan, data }) is JSON-serializable as-is. Convert
 * the plain JSON schema to zod on your side if your factory requires it.
 */

export const QUERY_TOOL_NAME = 'ask_financial_question';

export const QUERY_TOOL_DESCRIPTION =
  "Answer a natural-language question about the user's recorded financial data " +
  '(transactions, spending by category/date/group, and product prices). ' +
  'Returns { answer, plan, data }.';

export const QUERY_TOOL_INPUT_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    question: {
      type: 'string',
      description: 'e.g. "How much did I spend on groceries last month?"',
    },
  },
  required: ['question'],
  additionalProperties: false,
};
