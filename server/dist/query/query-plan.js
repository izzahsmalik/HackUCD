export const QUERY_PLAN_SCHEMA = {
    type: 'object',
    properties: {
        entity: {
            type: 'string',
            enum: ['transactions', 'productPrices'],
            description: 'transactions = bank/card transactions; productPrices = recorded product prices',
        },
        dateFrom: {
            type: ['string', 'null'],
            description: 'Transaction date lower bound, YYYY-MM-DD, inclusive',
        },
        dateTo: {
            type: ['string', 'null'],
            description: 'Transaction date upper bound, YYYY-MM-DD, inclusive',
        },
        categoryNames: {
            type: ['array', 'null'],
            items: { type: 'string' },
            description: 'Transaction category names to match',
        },
        groupNames: {
            type: ['array', 'null'],
            items: { type: 'string' },
            description: 'Transaction group names or source file names to match',
        },
        setAtFrom: {
            type: ['string', 'null'],
            description: 'Product-price setAt lower bound, ISO datetime, inclusive',
        },
        setAtTo: {
            type: ['string', 'null'],
            description: 'Product-price setAt upper bound, ISO datetime, inclusive',
        },
        productNames: {
            type: ['array', 'null'],
            items: { type: 'string' },
            description: 'Product names to match',
        },
        brandNames: {
            type: ['array', 'null'],
            items: { type: 'string' },
            description: 'Brand names to match',
        },
        aggregation: {
            type: ['string', 'null'],
            enum: ['sum', 'count', 'avg', 'min', 'max', null],
            description: 'Aggregate over all matching rows instead of listing them',
        },
        groupBy: {
            type: ['string', 'null'],
            enum: ['category', 'group', 'product', 'brand', null],
            description: 'Bucket aggregated rows by this field',
        },
        limit: {
            type: ['integer', 'null'],
            minimum: 1,
            maximum: 200,
            description: 'Row limit in list mode; default 20',
        },
        orderByAmount: {
            type: ['string', 'null'],
            enum: ['asc', 'desc', null],
            description: 'Row ordering by amount in list mode',
        },
    },
    required: [
        'entity',
        'dateFrom',
        'dateTo',
        'categoryNames',
        'groupNames',
        'setAtFrom',
        'setAtTo',
        'productNames',
        'brandNames',
        'aggregation',
        'groupBy',
        'limit',
        'orderByAmount',
    ],
    additionalProperties: false,
};
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export function validateQueryPlan(value) {
    const errors = [];
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return { ok: false, errors: ['query plan must be a JSON object'] };
    }
    const raw = value;
    if (raw.entity !== 'transactions' &&
        raw.entity !== 'productPrices') {
        return {
            ok: false,
            errors: ["entity must be 'transactions' or 'productPrices'"],
        };
    }
    const isTransactions = raw.entity === 'transactions';
    if (isTransactions) {
        for (const key of ['setAtFrom', 'setAtTo', 'productNames', 'brandNames']) {
            if (raw[key] !== undefined && raw[key] !== null) {
                errors.push(`${key} is not applicable to a transactions plan`);
            }
        }
    }
    else {
        for (const key of ['dateFrom', 'dateTo', 'categoryNames', 'groupNames']) {
            if (raw[key] !== undefined && raw[key] !== null) {
                errors.push(`${key} is not applicable to a productPrices plan`);
            }
        }
    }
    const plan = { entity: raw.entity };
    if (isTransactions) {
        const from = dateField(raw.dateFrom, 'dateFrom', errors);
        const to = dateField(raw.dateTo, 'dateTo', errors);
        if (from !== undefined && to !== undefined && from > to) {
            errors.push('dateFrom must not be after dateTo');
        }
        plan.dateFrom = from;
        plan.dateTo = to;
        plan.categoryNames = nameField(raw.categoryNames, 'categoryNames', errors);
        plan.groupNames = nameField(raw.groupNames, 'groupNames', errors);
    }
    else {
        const from = timestampField(raw.setAtFrom, 'setAtFrom', errors);
        const to = timestampField(raw.setAtTo, 'setAtTo', errors);
        if (from !== undefined && to !== undefined && from > to) {
            errors.push('setAtFrom must not be after setAtTo');
        }
        plan.setAtFrom = from;
        plan.setAtTo = to;
        plan.productNames = nameField(raw.productNames, 'productNames', errors);
        plan.brandNames = nameField(raw.brandNames, 'brandNames', errors);
    }
    if (raw.aggregation !== undefined &&
        raw.aggregation !== null &&
        !['sum', 'count', 'avg', 'min', 'max'].includes(raw.aggregation)) {
        errors.push('aggregation must be one of sum, count, avg, min, max (or null)');
    }
    if (raw.aggregation !== undefined && raw.aggregation !== null) {
        plan.aggregation = raw.aggregation;
    }
    if (raw.groupBy !== undefined && raw.groupBy !== null) {
        const valid = isTransactions ? ['category', 'group'] : ['product', 'brand'];
        if (!valid.includes(raw.groupBy)) {
            errors.push(`groupBy must be one of ${valid.join(', ')} (or null) for a ${raw.entity} plan`);
        }
        else {
            plan.groupBy = raw.groupBy;
        }
    }
    const limit = raw.limit;
    if (limit !== undefined && limit !== null) {
        if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 200) {
            errors.push('limit must be an integer between 1 and 200');
        }
        else {
            plan.limit = limit;
        }
    }
    if (raw.orderByAmount !== undefined && raw.orderByAmount !== null) {
        if (raw.orderByAmount !== 'asc' && raw.orderByAmount !== 'desc') {
            errors.push("orderByAmount must be 'asc' or 'desc' (or null)");
        }
        else {
            plan.orderByAmount = raw.orderByAmount;
        }
    }
    if (errors.length > 0)
        return { ok: false, errors };
    return { ok: true, plan: plan };
}
function dateField(value, label, errors) {
    if (value === undefined || value === null)
        return undefined;
    if (typeof value !== 'string' ||
        !DATE_PATTERN.test(value) ||
        Number.isNaN(new Date(value).getTime())) {
        errors.push(`${label} must be a valid date in YYYY-MM-DD format`);
        return undefined;
    }
    return value;
}
function timestampField(value, label, errors) {
    if (value === undefined || value === null)
        return undefined;
    if (typeof value !== 'string') {
        errors.push(`${label} must be an ISO datetime string`);
        return undefined;
    }
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) {
        errors.push(`${label} must be a valid datetime`);
        return undefined;
    }
    return new Date(time).toISOString();
}
function nameField(value, label, errors) {
    if (value === undefined || value === null)
        return undefined;
    if (!Array.isArray(value)) {
        errors.push(`${label} must be an array of strings`);
        return undefined;
    }
    if (value.some((item) => typeof item !== 'string')) {
        errors.push(`${label} must be an array of strings`);
        return undefined;
    }
    const names = value
        .map((name) => name.trim())
        .filter((name) => name.length > 0);
    return names.length > 0 ? names : undefined;
}
const AGGREGATION_HINT = 'Aggregations: sum (totals, e.g. "how much did I spend"), count, avg, min, max. ' +
    'groupBy buckets results (transactions: category or group; productPrices: product or brand).';
export function planSystemPrompt(now) {
    const today = now.toISOString().slice(0, 10);
    return ('You convert a user question about their financial data into a JSON query plan. ' +
        'You never answer the question yourself — output only the plan.\n\n' +
        `Today's date is ${today}.\n\n` +
        'Data model:\n' +
        '- transactions: amount in integer cents (NEGATIVE = expense, positive = income — ' +
        'never negate), date as YYYY-MM-DD, category name, group name (an import batch; ' +
        'also matchable by source file name). There is NO merchant or description text field — ' +
        'shopping-category words like "groceries" map to categoryNames.\n' +
        '- productPrices: amount in integer cents, setAt timestamp, product name, brand name.\n\n' +
        'Semantics:\n' +
        '- Spending/expense questions → entity transactions; "how much did I spend on groceries last month" → ' +
        'categoryNames ["groceries"] plus the last-month date range, aggregation sum.\n' +
        '- Relative ranges ("last month", "this week", "this year") must be resolved to concrete ' +
        'dateFrom/dateTo from today\'s date.\n' +
        '- Price-tracking questions ("what does bread cost", "cheapest price for X") → entity productPrices.\n\n' +
        `${AGGREGATION_HINT}\n` +
        'Rules:\n' +
        '- Fill only the fields the question implies; use null for everything else.\n' +
        '- Default limit is 20 when listing rows.\n' +
        '- Month-by-month bucketing is not supported; if asked, use an overall aggregate or groupBy.\n' +
        'Respond with only the JSON object.');
}
export const ANSWER_SYSTEM_PROMPT = 'You answer the user\'s financial question using ONLY the JSON query result provided. ' +
    'Answer in 1–2 sentences. Amounts are integer cents; present them in major units (divide by 100, ' +
    'two decimals). Negative totals are expenses — say "spent". If the result is empty, say no matching ' +
    'records were found. Never invent numbers not present in the result.';
//# sourceMappingURL=query-plan.js.map