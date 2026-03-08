// lib/shopify/fragments.ts

export const GJ_MTM_FRAGMENT = `
  fragment GJMetafields on Product {
    mtm_required: metafield(namespace: "gj", key: "mtm_required") { value }
    mtm_category: metafield(namespace: "gj", key: "mtm_category") { value }
    option_set_handle: metafield(namespace: "gj", key: "option_set_handle") { value }
  }
`;

export const METAOBJECT_QUERY = `
  query GetGJOptionSet($handle: String!) {
    metaobjectByHandle(handle: { type: "gj_option_set", handle: $handle }) {
      fields {
        key
        value
        reference {
          ... on Metaobject {
            type
            fields { key value }
          }
        }
      }
    }
  }
`;