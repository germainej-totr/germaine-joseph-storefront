// lib/shopify/fragments.ts

export const MTM_FRAGMENT = `
  fragment MTMMeta on Product {
    mtm_required: metafield(namespace: "gjc", key: "mtm_required") { value }
    mtm_category: metafield(namespace: "gjc", key: "mtm_category") { value }
    option_set_ref: metafield(namespace: "gjc", key: "option_set_ref") {
      reference { ... on Metaobject { id handle type } }
    }
    fabric_ref: metafield(namespace: "gjc", key: "fabric_ref") {
      reference { ... on Metaobject { id handle type } }
    }
  }
`;

export const OPTIONSET_QUERY = `
  query GetOptionSet($handle: String!) {
    metaobjectByHandle(handle: { type: "mtm_option_set", handle: $handle }) {
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