import { useRouter } from 'next/navigation';

export default function CollectionPage({ params }: { params: { collection: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Collection: {params.collection}</h1>
      <p className="text-gray-600">Filter view placeholder.</p>
      <p className="text-yellow-600">TODO: implement category filters and product grid</p>
    </div>
  );
}