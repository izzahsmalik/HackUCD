import type { JsonSchema } from '../llm/llm.model.js';

export type QueryAggregation = 'sum' | 'count' | 'avg' | 'min' | 'max';

export interface TransactionQueryPlan {
  entity: 'transactions';
  /** Transaction date range, YYYY-MM-DD, inclusive. */
  dateFrom?: string;
  dateTo?: string;
  /** Case-insensitive match on TransactionCategory.name. */
  categoryNames?: string[];
  /** Case-insensitive match on TransactionGroup.groupName OR originalFileName. */
  groupNames?: string[];
  /** Aggregation over matching rows; absent → return individual rows. */
  aggregation?: QueryAggregation;
  groupBy?: 'category' | 'group';
  /** Row limit in list mode; default 20, max 200. */
  limit?: number;
  orderByAmount?: 'asc' | 'desc';
}

export interface ProductPriceQueryPlan {
  entity: 'productPrices';
  /** setAt range, ISO datetime, inclusive. */
  setAtFrom?: string;
  setAtTo?: string;
  /** Case-insensitive match on Product.name. */
  productNames?: string[];
  /** Case-insensitive match on Brand.name. */
  brandNames?: string[];
  aggregation?: QueryAggregation;
  groupBy?: 'product' | 'brand';
  limit?: number;
  orderByAmount?: 'asc' | 'desc';
}

export type QueryPlan = TransactionQueryPlan | ProductPriceQueryPlan;

/**
 * One flat schema (easier for the model than a JSON-level union); the
 * transactions/productPrices union is enforced by validateQueryPlan. Strict
 * json_schema mode requires every key in `required` with optionality
 * expressed as nullable types.
 */
export const QUERY_PLAN_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    entity: {
      type: 'string',
      enum: ['transactions', 'productPrices'],
      description:
        'transactions = bank/card transactions; productPrices = recorded product prices',
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

export type QueryPlanValidation =
  { ok: true; plan: QueryPlan } | { ok: false; errors: string[] };

/** Validates (and normalizes) an LLM-produced value into a QueryPlan. */
export function validateQueryPlan(value: unknown): QueryPlanValidation {
  const errors: string[] = [];
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ok: false, errors: ['query plan must be a JSON object'] };
  }
  const raw = value as Record<string, unknown>;

  if (raw.entity !== 'transactions' && raw.entity !== 'productPrices') {
    return {
      ok: false,
      errors: ["entity must be 'transactions' or 'productPrices'"],
    };
  }

  const isTransactions = raw.entity === 'transactions';

  // Cross-entity fields: a transactions plan must leave product fields null and
  // vice versa, so the union stays clean for the executor.
  if (isTransactions) {
    for (const key of ['setAtFrom', 'setAtTo', 'productNames', 'brandNames']) {
      if (raw[key] !== undefined && raw[key] !== null) {
        errors.push(`${key} is not applicable to a transactions plan`);
      }
    }
  } else {
    for (const key of ['dateFrom', 'dateTo', 'categoryNames', 'groupNames']) {
      if (raw[key] !== undefined && raw[key] !== null) {
        errors.push(`${key} is not applicable to a productPrices plan`);
      }
    }
  }

  const plan: PlanDraft = { entity: raw.entity };

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
  } else {
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

  if (
    raw.aggregation !== undefined &&
    raw.aggregation !== null &&
    !['sum', 'count', 'avg', 'min', 'max'].includes(raw.aggregation as string)
  ) {
    errors.push(
      'aggregation must be one of sum, count, avg, min, max (or null)',
    );
  }
  if (raw.aggregation !== undefined && raw.aggregation !== null) {
    plan.aggregation = raw.aggregation as QueryAggregation;
  }

  if (raw.groupBy !== undefined && raw.groupBy !== null) {
    const valid = isTransactions ? ['category', 'group'] : ['product', 'brand'];
    if (!valid.includes(raw.groupBy as string)) {
      errors.push(
        `groupBy must be one of ${valid.join(', ')} (or null) for a ${raw.entity} plan`,
      );
    } else {
      plan.groupBy = raw.groupBy as PlanDraft['groupBy'];
    }
  }

  const limit = raw.limit;
  if (limit !== undefined && limit !== null) {
    if (
      typeof limit !== 'number' ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 200
    ) {
      errors.push('limit must be an integer between 1 and 200');
    } else {
      plan.limit = limit;
    }
  }

  if (raw.orderByAmount !== undefined && raw.orderByAmount !== null) {
    if (raw.orderByAmount !== 'asc' && raw.orderByAmount !== 'desc') {
      errors.push("orderByAmount must be 'asc' or 'desc' (or null)");
    } else {
      plan.orderByAmount = raw.orderByAmount;
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, plan: plan as QueryPlan };
}

/** All plan fields optional, so validation can assign them incrementally. */
interface PlanDraft {
  entity: 'transactions' | 'productPrices';
  dateFrom?: string;
  dateTo?: string;
  categoryNames?: string[];
  groupNames?: string[];
  setAtFrom?: string;
  setAtTo?: string;
  productNames?: string[];
  brandNames?: string[];
  aggregation?: QueryAggregation;
  groupBy?: 'category' | 'group' | 'product' | 'brand';
  limit?: number;
  orderByAmount?: 'asc' | 'desc';
}

/** YYYY-MM-DD field; returns the normalized string or undefined. */
function dateField(
  value: unknown,
  label: string,
  errors: string[],
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (
    typeof value !== 'string' ||
    !DATE_PATTERN.test(value) ||
    Number.isNaN(new Date(value).getTime())
  ) {
    errors.push(`${label} must be a valid date in YYYY-MM-DD format`);
    return undefined;
  }
  return value;
}

/** Parseable timestamp field (setAt range); normalized to ISO. */
function timestampField(
  value: unknown,
  label: string,
  errors: string[],
): string | undefined {
  if (value === undefined || value === null) return undefined;
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

/** Array of non-empty names, trimmed; rejects entries that are not strings. */
function nameField(
  value: unknown,
  label: string,
  errors: string[],
): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array of strings`);
    return undefined;
  }
  if (value.some((item) => typeof item !== 'string')) {
    errors.push(`${label} must be an array of strings`);
    return undefined;
  }
  const names = (value as string[])
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
  return names.length > 0 ? names : undefined;
}

const AGGREGATION_HINT =
  'Aggregations: sum (totals, e.g. "how much did I spend"), count, avg, min, max. ' +
  'groupBy buckets results (transactions: category or group; productPrices: product or brand).';

/** Builds the plan-generation system prompt; today's date anchors relative ranges. */
export function planSystemPrompt(now: Date): string {
  const today = now.toISOString().slice(0, 10);
  return (
    'You convert a user question about their financial data into a JSON query plan. ' +
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
    "dateFrom/dateTo from today's date.\n" +
    '- Price-tracking questions ("what does bread cost", "cheapest price for X") → entity productPrices.\n\n' +
    `${AGGREGATION_HINT}\n` +
    'Rules:\n' +
    '- Fill only the fields the question implies; use null for everything else.\n' +
    '- Default limit is 20 when listing rows.\n' +
    '- Month-by-month bucketing is not supported; if asked, use an overall aggregate or groupBy.\n' +
    'Respond with only the JSON object.'
  );
}

/** Grounding rules for the answer-phrasing call. */
export const ANSWER_SYSTEM_PROMPT =
  "You answer the user's financial question using ONLY the JSON query result provided. " +
  'Answer in 1–2 sentences. Amounts are integer cents; present them in major units (divide by 100, ' +
  'two decimals). Negative totals are expenses — say "spent". If the result is empty, say no matching ' +
  'records were found. Never invent numbers not present in the result.';
