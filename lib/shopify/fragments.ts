// lib/shopify/fragments.ts

export const MTM_FRAGMENT = `
  fragment MTMMeta on Product {
    mtm_required: metafield(namespace: "gjm", key: "required_fit_gate") { value }
    mtm_category: metafield(namespace: "gjm", key: "mtm_category") { value }
    option_set_ref: metafield(namespace: "gjm", key: "option_set") {
      reference { ... on Metaobject { id handle type } }
    }
    fabric_ref: metafield(namespace: "gjm", key: "fabric_ref") {
      reference { ... on Metaobject { id handle type } }
    }
    measurement_guide_ref: metafield(namespace: "gjm", key: "measurement_guide") {
      reference { ... on Metaobject { id handle type } }
    }
    lead_time_days: metafield(namespace: "gjm", key: "lead_time_days") { value }
    base_pattern_code: metafield(namespace: "gjm", key: "base_pattern_code") { value }
    price_model: metafield(namespace: "gjm", key: "price_model") { value }
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