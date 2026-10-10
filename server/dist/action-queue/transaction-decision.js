import { BadRequestException } from '@nestjs/common';
import { Decision } from './decision.js';
export class TransactionDecision extends Decision {
    data;
    transactionRepository;
    categoryRepository;
    groupRepository;
    type = 'transaction';
    summary;
    actions = [
        {
            id: 'categorize',
            label: 'File under an existing category',
            payload: { categoryId: 'number' },
        },
        {
            id: 'categorize-new',
            label: 'Create a new category and file it',
            payload: { name: 'string' },
        },
        { id: 'discard', label: 'Discard this row' },
    ];
    constructor(data, transactionRepository, categoryRepository, groupRepository) {
        super();
        this.data = data;
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.groupRepository = groupRepository;
        this.summary =
            `Transaction row #${data.rowIndex} (${(data.amountCents / 100).toFixed(2)} on ${data.date}) ` +
                `could not be confidently categorized`;
    }
    async apply(actionId, payload) {
        switch (actionId) {
            case 'categorize':
                return this.categorize(this.payloadNumber(payload, 'categoryId'));
            case 'categorize-new':
                return this.categorizeNew(this.payloadString(payload, 'name'));
            case 'discard':
                return { discarded: true };
            default:
                throw new BadRequestException(`Unknown action '${actionId}' for a transaction decision`);
        }
    }
    async categorize(categoryId) {
        const category = await this.categoryRepository.findOne({ id: categoryId });
        if (!category)
            throw new BadRequestException(`Transaction category #${categoryId} does not exist`);
        return this.persistTransaction(category);
    }
    async categorizeNew(name) {
        const category = this.categoryRepository.create({ name });
        await this.categoryRepository.getEntityManager().persist(category).flush();
        return this.persistTransaction(category);
    }
    async persistTransaction(category) {
        const group = await this.groupRepository.findOne({ id: this.data.groupId });
        if (!group) {
            throw new BadRequestException(`Transaction group #${this.data.groupId} does not exist`);
        }
        const transaction = this.transactionRepository.create({
            amount: this.data.amountCents,
            date: this.data.date,
            category,
            group,
        });
        await this.transactionRepository
            .getEntityManager()
            .persist(transaction)
            .flush();
        return transaction;
    }
}
//# sourceMappingURL=transaction-decision.js.map