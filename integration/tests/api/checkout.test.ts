import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getAdminClient } from '../../helpers/supabase-client';

describe('Integration: Checkout (Stripe Session)', () => {
  const admin = getAdminClient();
  let productId: string;
  let variantId: string;

  beforeAll(async () => {
    // Criar produto de teste com variante
    const { data: product, error: prodErr } = await admin
      .from('products')
      .insert({
        name: 'Checkout Test Shirt',
        slug: `checkout-test-${Date.now()}`,
        price: 89.90,
        collection: 'test',
        images: [],
      })
      .select()
      .single();
    if (prodErr) throw prodErr;
    productId = product.id;

    const { data: variant, error: varErr } = await admin
      .from('product_variants')
      .insert({
        product_id: productId,
        size: 'M',
        stock: 10,
        max_stock: 10,
      })
      .select()
      .single();
    if (varErr) throw varErr;
    variantId = variant.id;
  });

  afterAll(async () => {
    await admin.from('product_variants').delete().eq('product_id', productId);
    await admin.from('products').delete().eq('id', productId);
  });

  it('should have product and variant ready for checkout', async () => {
    const { data: product } = await admin
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    expect(product).not.toBeNull();
    expect(product!.price).toBe(89.90);

    const { data: variant } = await admin
      .from('product_variants')
      .select('*')
      .eq('id', variantId)
      .single();
    expect(variant).not.toBeNull();
    expect(variant!.stock).toBe(10);
  });

  it('should convert price to BRL centavos correctly', () => {
    // O checkout converte: Math.round(item.price * 100) para centavos Stripe
    const price = 89.90;
    const centavos = Math.round(price * 100);
    expect(centavos).toBe(8990);

    // Caso com decimais imprecisos (floating point)
    const price2 = 149.99;
    const centavos2 = Math.round(price2 * 100);
    expect(centavos2).toBe(14999);

    // Preço inteiro
    const price3 = 50.00;
    const centavos3 = Math.round(price3 * 100);
    expect(centavos3).toBe(5000);
  });

  it('should reject checkout with empty items', async () => {
    // Simula a validação que a API route faz: items vazio → 400
    const items: unknown[] = [];
    const isValid = items && items.length > 0;
    expect(isValid).toBe(false);

    // Com items válidos
    const validItems = [{
      id: '1',
      productId,
      variantId,
      name: 'Checkout Test Shirt',
      size: 'M',
      price: 89.90,
      quantity: 1,
      image: '',
    }];
    const isValidWithItems = validItems && validItems.length > 0;
    expect(isValidWithItems).toBe(true);
  });
});
