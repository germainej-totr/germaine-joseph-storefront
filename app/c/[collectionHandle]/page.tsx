import CollectionPage from '@/app/shop/[collection]/page';

export const dynamic = 'force-dynamic';

export default async function CollectionAliasPage(props: { params: Promise<{ collectionHandle: string }> }) {
  const { collectionHandle } = await props.params;
  return <CollectionPage params={Promise.resolve({ collection: collectionHandle })} />;
}