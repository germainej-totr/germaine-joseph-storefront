# Work Package A16: Fabric Catalogue Platform (`gjm_fabric`)

This package creates a structured fabric system with ingestion, filtering, and category suitability enforcement.

## Purpose

Enable premium fabric discovery and controlled fabric-to-garment mapping.

## Scope

1. Define `gjm_fabric` metaobject schema.
2. Build ingestion pipeline and CSV import spec.
3. Build digital fabric selector UI with filtering.
4. Enforce suitability mapping by garment type/category.

## Deliverables

- `gjm_fabric` schema
- CSV import specification
- Fabric ingestion pipeline
- `FabricSelector.tsx`
- Filters:
  - mill
  - season
  - composition
  - colour family
  - pattern
  - weight
- Fabric-to-category suitability rule mapping

## Acceptance Criteria

- Fabrics are digitally browsable and selectable.
- Suitable fabrics can be filtered by garment/category.
- Chosen fabric is preserved in canonical MTM payload.
- UI supports premium browsing and decision confidence.

## Dependencies

- A14 canonical payload
- A15 category expansion

## Status

Specified and ready for implementation.
