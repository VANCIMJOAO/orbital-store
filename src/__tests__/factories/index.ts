import type { CartItem } from '@/hooks/useCart';

export function createMockCartItem(overrides: Partial<CartItem> = {}): Omit<CartItem, 'quantity'> {
  return {
    id: 'variant-1',
    productId: 'prod-1',
    variantId: 'variant-1',
    name: 'Camiseta Orbital',
    size: 'M',
    price: 99.90,
    image: '/test.jpg',
    maxStock: 5,
    ...overrides,
  };
}
