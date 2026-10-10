import { BadRequestException } from '@nestjs/common';
import { Decision } from './decision.js';
export class ProductDecision extends Decision {
    data;
    productRepository;
    productPriceRepository;
    brandRepository;
    type = 'product';
    summary;
    actions = [
        {
            id: 'match-product',
            label: 'Match to an existing product',
            payload: { productId: 'number' },
        },
        {
            id: 'create-product',
            label: 'Create a new product',
            payload: { name: 'string', brandId: 'number' },
        },
        { id: 'discard', label: 'Discard this row' },
    ];
    constructor(data, productRepository, productPriceRepository, brandRepository) {
        super();
        this.data = data;
        this.productRepository = productRepository;
        this.productPriceRepository = productPriceRepository;
        this.brandRepository = brandRepository;
        this.summary =
            `Pricing row #${data.rowIndex} (${data.productName}, ${(data.amountCents / 100).toFixed(2)}) ` +
                `could not be confidently matched to a product`;
    }
    async apply(actionId, payload) {
        switch (actionId) {
            case 'match-product':
                return this.matchProduct(this.payloadNumber(payload, 'productId'));
            case 'create-product':
                return this.createProduct(payload);
            case 'discard':
                return { discarded: true };
            default:
                throw new BadRequestException(`Unknown action '${actionId}' for a product decision`);
        }
    }
    async matchProduct(productId) {
        const product = await this.productRepository.findOne({ id: productId });
        if (!product)
            throw new BadRequestException(`Product #${productId} does not exist`);
        return this.persistPrice(product);
    }
    async createProduct(payload) {
        const name = payload?.name !== undefined
            ? this.payloadString(payload, 'name')
            : this.data.productName;
        const brandId = this.payloadNumber(payload, 'brandId');
        const brand = await this.brandRepository.findOne({ id: brandId });
        if (!brand)
            throw new BadRequestException(`Brand #${brandId} does not exist`);
        const product = this.productRepository.create({ name, brand });
        await this.productRepository.getEntityManager().persist(product).flush();
        return this.persistPrice(product);
    }
    async persistPrice(product) {
        const price = this.productPriceRepository.create({
            amount: this.data.amountCents,
            setAt: this.data.setAt,
            product,
        });
        await this.productPriceRepository.getEntityManager().persist(price).flush();
        return price;
    }
}
//# sourceMappingURL=product-decision.js.map