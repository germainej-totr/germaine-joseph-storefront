// lib/shopify-admin.ts

export async function getMeasurementGuide(category: string) {
  interface AdminMetaobjectField {
    key: string;
    value: string;
  }

  interface AdminMetaobjectResponse {
    data?: {
      metaobjects?: {
        nodes?: Array<{
          fields?: AdminMetaobjectField[];
        }>;
      };
    };
  }

  const query = `
    query GetMeasurementGuide($type: String!) {
      metaobjects(type: $type, first: 1) {
        nodes {
          fields {
            key
            value
          }
        }
      }
    }
  `;

  const response = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
    },
    body: JSON.stringify({
      query,
      variables: { type: "gjm_measurement_guide" }, // Your Metaobject type
    }),
  });

  const { data } = (await response.json()) as AdminMetaobjectResponse;
  const fields = data?.metaobjects?.nodes?.[0]?.fields ?? [];
  
  // Find the field that matches your category (e.g., 'jacket_rules')
  const guideField = fields.find((field) => field.key === `${category}_rules`);

  return guideField ? JSON.parse(guideField.value) : null;
}