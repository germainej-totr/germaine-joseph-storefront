import { shopifyFetch } from '@/lib/shopify';

export default async function ShopPage() {
  // fetch first 12 products
  const query = `
    query getProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            handle
            title
            images(first: 1) {
              edges { node { url altText } }
            }
            metafields(namespace: "mtm", first: 5) {
              edges { node { key value } }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch({ query, variables: { first: 12 } });
  const products = data?.data?.products?.edges || [];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Shop</h1>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((edge: any) => {
          const p = edge.node;
          return (
            <a
              key={p.id}
              href={`/product/${p.handle}`}
              className="block border rounded-lg overflow-hidden hover:shadow-lg"
            >
              {p.images.edges[0] && (
                <img
                  src={p.images.edges[0].node.url}
                  alt={p.images.edges[0].node.altText || p.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h2 className="text-lg font-semibold">{p.title}</h2>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}