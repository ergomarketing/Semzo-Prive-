import dynamic from 'next/dynamic';
const CartAuthFlow = dynamic(() => import('./CartAuthFlow'), { ssr: false });

export default function CartPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Carrito</h1>
      <CartAuthFlow />
    </main>
  );
}
