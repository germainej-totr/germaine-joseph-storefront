export default function ProductPage({ params }: { params: { handle: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Product: {params.handle}</h1>
      <p className="text-gray-600">PDP placeholder with customization UI + fit gate.</p>
      <p className="text-yellow-600">TODO: build configurator component and fit gating logic</p>
    </div>
  );
}