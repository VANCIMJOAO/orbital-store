import { describe, it, expect, beforeEach } from 'vitest';
import { useCart } from '@/hooks/useCart';
import { createMockCartItem } from '@/__tests__/factories';

describe('useCart', () => {
  beforeEach(() => {
    // Reset store state between tests
    useCart.setState({ items: [], isOpen: false });
  });

  // ============================================================
  // addItem
  // ============================================================
  describe('addItem', () => {
    it('should add a new item with quantity 1', () => {
      const item = createMockCartItem();
      useCart.getState().addItem(item);

      const items = useCart.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(1);
      expect(items[0].name).toBe('Camiseta Orbital');
    });

    it('should increment quantity for existing item', () => {
      const item = createMockCartItem();
      useCart.getState().addItem(item);
      useCart.getState().addItem(item);

      const items = useCart.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it('should not exceed maxStock', () => {
      const item = createMockCartItem({ maxStock: 2 });
      useCart.getState().addItem(item);
      useCart.getState().addItem(item);
      useCart.getState().addItem(item); // third add should be capped

      const items = useCart.getState().items;
      expect(items[0].quantity).toBe(2);
    });

    it('should handle multiple different items', () => {
      const item1 = createMockCartItem({ id: 'v1', name: 'Camiseta P' });
      const item2 = createMockCartItem({ id: 'v2', name: 'Camiseta G' });

      useCart.getState().addItem(item1);
      useCart.getState().addItem(item2);

      expect(useCart.getState().items).toHaveLength(2);
    });
  });

  // ============================================================
  // removeItem
  // ============================================================
  describe('removeItem', () => {
    it('should remove item by id', () => {
      const item = createMockCartItem({ id: 'to-remove' });
      useCart.getState().addItem(item);
      expect(useCart.getState().items).toHaveLength(1);

      useCart.getState().removeItem('to-remove');
      expect(useCart.getState().items).toHaveLength(0);
    });

    it('should not affect other items', () => {
      const item1 = createMockCartItem({ id: 'keep' });
      const item2 = createMockCartItem({ id: 'remove' });
      useCart.getState().addItem(item1);
      useCart.getState().addItem(item2);

      useCart.getState().removeItem('remove');
      expect(useCart.getState().items).toHaveLength(1);
      expect(useCart.getState().items[0].id).toBe('keep');
    });

    it('should do nothing if item not found', () => {
      const item = createMockCartItem();
      useCart.getState().addItem(item);

      useCart.getState().removeItem('nonexistent');
      expect(useCart.getState().items).toHaveLength(1);
    });
  });

  // ============================================================
  // updateQuantity
  // ============================================================
  describe('updateQuantity', () => {
    it('should update quantity to specified value', () => {
      const item = createMockCartItem({ maxStock: 10 });
      useCart.getState().addItem(item);

      useCart.getState().updateQuantity(item.id, 5);
      expect(useCart.getState().items[0].quantity).toBe(5);
    });

    it('should remove item if quantity is 0', () => {
      const item = createMockCartItem();
      useCart.getState().addItem(item);

      useCart.getState().updateQuantity(item.id, 0);
      expect(useCart.getState().items).toHaveLength(0);
    });

    it('should remove item if quantity is negative', () => {
      const item = createMockCartItem();
      useCart.getState().addItem(item);

      useCart.getState().updateQuantity(item.id, -1);
      expect(useCart.getState().items).toHaveLength(0);
    });

    it('should cap quantity at maxStock', () => {
      const item = createMockCartItem({ maxStock: 3 });
      useCart.getState().addItem(item);

      useCart.getState().updateQuantity(item.id, 10);
      expect(useCart.getState().items[0].quantity).toBe(3);
    });
  });

  // ============================================================
  // clearCart
  // ============================================================
  describe('clearCart', () => {
    it('should remove all items', () => {
      useCart.getState().addItem(createMockCartItem({ id: 'a' }));
      useCart.getState().addItem(createMockCartItem({ id: 'b' }));
      expect(useCart.getState().items).toHaveLength(2);

      useCart.getState().clearCart();
      expect(useCart.getState().items).toHaveLength(0);
    });
  });

  // ============================================================
  // Cart UI state
  // ============================================================
  describe('cart open/close/toggle', () => {
    it('openCart should set isOpen to true', () => {
      useCart.getState().openCart();
      expect(useCart.getState().isOpen).toBe(true);
    });

    it('closeCart should set isOpen to false', () => {
      useCart.setState({ isOpen: true });
      useCart.getState().closeCart();
      expect(useCart.getState().isOpen).toBe(false);
    });

    it('toggleCart should flip isOpen', () => {
      expect(useCart.getState().isOpen).toBe(false);
      useCart.getState().toggleCart();
      expect(useCart.getState().isOpen).toBe(true);
      useCart.getState().toggleCart();
      expect(useCart.getState().isOpen).toBe(false);
    });
  });
});
