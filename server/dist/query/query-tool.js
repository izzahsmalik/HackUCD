export const QUERY_TOOL_NAME = 'ask_financial_question';
export const QUERY_TOOL_DESCRIPTION = "Answer a natural-language question about the user's recorded financial data " +
    '(transactions, spending by category/date/group, and product prices). ' +
    'Returns { answer, plan, data }.';
export const QUERY_TOOL_INPUT_SCHEMA = {
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
//# sourceMappingURL=query-tool.js.map