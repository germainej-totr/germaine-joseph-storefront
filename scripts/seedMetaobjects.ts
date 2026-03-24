/**
 * scripts/seedMetaobjects.ts
 *
 * Seeds baseline metaobject records into Shopify.
 * Run after setupShopifyMetafields.ts has defined the types.
 *
 * Execution order matters due to reference chains:
 *   gjm_choice → gjm_option → gjm_option_set
 *
 * Usage:
 *   node scripts/seedMetaobjects.ts
 */
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

async function main() {
  const { shopifyAdminGraphQL } = await import('../lib/shopify');

  const UPSERT = `
    mutation MetaobjectUpsert($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        metaobject { id handle type }
        userErrors { field message code }
      }
    }
  `;

  async function upsert(
    type: string,
    handle: string,
    fields: { key: string; value: string }[]
  ): Promise<string> {
    const res = await shopifyAdminGraphQL(UPSERT, {
      handle: { type, handle },
      metaobject: {
        capabilities: {
          publishable: {
            status: 'ACTIVE',
          },
        },
        fields,
      },
    });
    const mo = res?.data?.metaobjectUpsert?.metaobject;
    const errs = res?.data?.metaobjectUpsert?.userErrors;
    if (errs?.length) {
      console.error(`  ✗ ${type}/${handle}`, JSON.stringify(errs));
      return '';
    }
    console.log(`  ✓ ${type}/${handle}  →  ${mo.id}`);
    return mo.id as string;
  }

  // Serialise a list of GIDs for list.metaobject_reference fields (empty strings filtered out)
  function gids(...ids: string[]): string {
    return JSON.stringify(ids.filter(Boolean));
  }

  // ── 1. CHOICES ──────────────────────────────────────────────────────────────
  console.log('\n── gjm_choice ──');

  // Lapel style
  const cLapelNotch  = await upsert('gjm_choice', 'choice-lapel-notch',  [{ key: 'value', value: 'notch'  }, { key: 'label', value: 'Notch Lapel'  }, { key: 'price_delta', value: '0'   }]);
  const cLapelPeak   = await upsert('gjm_choice', 'choice-lapel-peak',   [{ key: 'value', value: 'peak'   }, { key: 'label', value: 'Peak Lapel'   }, { key: 'price_delta', value: '0'   }]);
  const cLapelShawl  = await upsert('gjm_choice', 'choice-lapel-shawl',  [{ key: 'value', value: 'shawl'  }, { key: 'label', value: 'Shawl Lapel'  }, { key: 'price_delta', value: '25'  }]);

  // Button count
  const cButtons1    = await upsert('gjm_choice', 'choice-buttons-1',    [{ key: 'value', value: '1'   }, { key: 'label', value: 'One Button'          }, { key: 'price_delta', value: '0'  }]);
  const cButtons2    = await upsert('gjm_choice', 'choice-buttons-2',    [{ key: 'value', value: '2'   }, { key: 'label', value: 'Two Button'          }, { key: 'price_delta', value: '0'  }]);
  const cButtonsDB6  = await upsert('gjm_choice', 'choice-buttons-db6',  [{ key: 'value', value: 'db6' }, { key: 'label', value: 'Double Breasted 6×2' }, { key: 'price_delta', value: '50' }]);
  const cButtons5    = await upsert('gjm_choice', 'choice-buttons-5',    [{ key: 'value', value: '5'   }, { key: 'label', value: 'Five Button'         }, { key: 'price_delta', value: '0'  }]);

  // Vent style
  const cVentSingle  = await upsert('gjm_choice', 'choice-vent-single',  [{ key: 'value', value: 'single' }, { key: 'label', value: 'Single Vent' }, { key: 'price_delta', value: '0'  }]);
  const cVentDouble  = await upsert('gjm_choice', 'choice-vent-double',  [{ key: 'value', value: 'double' }, { key: 'label', value: 'Double Vent' }, { key: 'price_delta', value: '15' }]);
  const cVentNone    = await upsert('gjm_choice', 'choice-vent-none',    [{ key: 'value', value: 'none'   }, { key: 'label', value: 'No Vent'     }, { key: 'price_delta', value: '0'  }]);

  // Lining style
  const cLiningFull    = await upsert('gjm_choice', 'choice-lining-full',    [{ key: 'value', value: 'full'    }, { key: 'label', value: 'Full Lining'    }, { key: 'price_delta', value: '0'   }]);
  const cLiningHalf    = await upsert('gjm_choice', 'choice-lining-half',    [{ key: 'value', value: 'half'    }, { key: 'label', value: 'Half Lining'    }, { key: 'price_delta', value: '-15' }]);
  const cLiningQuarter = await upsert('gjm_choice', 'choice-lining-quarter', [{ key: 'value', value: 'quarter' }, { key: 'label', value: 'Quarter Lining' }, { key: 'price_delta', value: '-25' }]);

  // Fit silhouette (shared across all categories)
  const cFitSlim     = await upsert('gjm_choice', 'choice-fit-slim',     [{ key: 'value', value: 'slim'    }, { key: 'label', value: 'Slim'    }, { key: 'price_delta', value: '0' }]);
  const cFitClassic  = await upsert('gjm_choice', 'choice-fit-classic',  [{ key: 'value', value: 'classic' }, { key: 'label', value: 'Classic' }, { key: 'price_delta', value: '0' }]);
  const cFitRelaxed  = await upsert('gjm_choice', 'choice-fit-relaxed',  [{ key: 'value', value: 'relaxed' }, { key: 'label', value: 'Relaxed' }, { key: 'price_delta', value: '0' }]);

  // Trouser pleat
  const cPleatFlat   = await upsert('gjm_choice', 'choice-pleat-flat',   [{ key: 'value', value: 'flat'   }, { key: 'label', value: 'Flat Front'   }, { key: 'price_delta', value: '0' }]);
  const cPleatSingle = await upsert('gjm_choice', 'choice-pleat-single', [{ key: 'value', value: 'single' }, { key: 'label', value: 'Single Pleat' }, { key: 'price_delta', value: '0' }]);
  const cPleatDouble = await upsert('gjm_choice', 'choice-pleat-double', [{ key: 'value', value: 'double' }, { key: 'label', value: 'Double Pleat' }, { key: 'price_delta', value: '0' }]);

  // Turn-up
  const cTurnupNone  = await upsert('gjm_choice', 'choice-turnup-none',  [{ key: 'value', value: 'none' }, { key: 'label', value: 'No Turn-up'  }, { key: 'price_delta', value: '0'  }]);
  const cTurnup4cm   = await upsert('gjm_choice', 'choice-turnup-4cm',   [{ key: 'value', value: '4cm'  }, { key: 'label', value: '4cm Turn-up' }, { key: 'price_delta', value: '10' }]);
  const cTurnup5cm   = await upsert('gjm_choice', 'choice-turnup-5cm',   [{ key: 'value', value: '5cm'  }, { key: 'label', value: '5cm Turn-up' }, { key: 'price_delta', value: '10' }]);

  // Shirt collar
  const cCollarClassic    = await upsert('gjm_choice', 'choice-collar-classic',     [{ key: 'value', value: 'classic'     }, { key: 'label', value: 'Classic Spread' }, { key: 'price_delta', value: '0' }]);
  const cCollarCutaway    = await upsert('gjm_choice', 'choice-collar-cutaway',     [{ key: 'value', value: 'cutaway'     }, { key: 'label', value: 'Cutaway'        }, { key: 'price_delta', value: '0' }]);
  const cCollarButtonDown = await upsert('gjm_choice', 'choice-collar-button-down', [{ key: 'value', value: 'button_down' }, { key: 'label', value: 'Button Down'    }, { key: 'price_delta', value: '0' }]);

  // Shirt cuff
  const cCuffSingle  = await upsert('gjm_choice', 'choice-cuff-single',  [{ key: 'value', value: 'single' }, { key: 'label', value: 'Single Button'       }, { key: 'price_delta', value: '0'  }]);
  const cCuffDouble  = await upsert('gjm_choice', 'choice-cuff-double',  [{ key: 'value', value: 'double' }, { key: 'label', value: 'Double / French Cuff' }, { key: 'price_delta', value: '20' }]);

  // Vest back
  const cVestBackFabric = await upsert('gjm_choice', 'choice-vest-back-fabric', [{ key: 'value', value: 'fabric' }, { key: 'label', value: 'Fabric Back' }, { key: 'price_delta', value: '0'  }]);
  const cVestBackSilk   = await upsert('gjm_choice', 'choice-vest-back-silk',   [{ key: 'value', value: 'silk'   }, { key: 'label', value: 'Silk Back'   }, { key: 'price_delta', value: '15' }]);

  // ── 2. OPTIONS ──────────────────────────────────────────────────────────────
  console.log('\n── gjm_option ──');

  const oLapelStyle = await upsert('gjm_option', 'option-lapel-style', [
    { key: 'key',     value: 'lapel_style'  },
    { key: 'label',   value: 'Lapel Style'  },
    { key: 'type',    value: 'select'        },
    { key: 'choices', value: gids(cLapelNotch, cLapelPeak, cLapelShawl) },
  ]);

  const oButtonCount = await upsert('gjm_option', 'option-button-count', [
    { key: 'key',     value: 'button_count'  },
    { key: 'label',   value: 'Button Count'  },
    { key: 'type',    value: 'select'         },
    { key: 'choices', value: gids(cButtons1, cButtons2, cButtonsDB6) },
  ]);

  const oVestButtons = await upsert('gjm_option', 'option-vest-buttons', [
    { key: 'key',     value: 'button_count'  },
    { key: 'label',   value: 'Button Count'  },
    { key: 'type',    value: 'select'         },
    { key: 'choices', value: gids(cButtons5, cButtons1) },
    { key: 'ui_hint', value: 'vest_buttons'   },
  ]);

  const oVentStyle = await upsert('gjm_option', 'option-vent-style', [
    { key: 'key',     value: 'vent_style' },
    { key: 'label',   value: 'Vent Style' },
    { key: 'type',    value: 'select'      },
    { key: 'choices', value: gids(cVentSingle, cVentDouble, cVentNone) },
  ]);

  const oLiningStyle = await upsert('gjm_option', 'option-lining-style', [
    { key: 'key',     value: 'lining_style' },
    { key: 'label',   value: 'Lining Style' },
    { key: 'type',    value: 'select'        },
    { key: 'choices', value: gids(cLiningFull, cLiningHalf, cLiningQuarter) },
  ]);

  const oFitSilhouette = await upsert('gjm_option', 'option-fit-silhouette', [
    { key: 'key',     value: 'fit_silhouette' },
    { key: 'label',   value: 'Fit Silhouette' },
    { key: 'type',    value: 'radio'           },
    { key: 'choices', value: gids(cFitSlim, cFitClassic, cFitRelaxed) },
  ]);

  const oPleatStyle = await upsert('gjm_option', 'option-pleat-style', [
    { key: 'key',     value: 'pleat_style' },
    { key: 'label',   value: 'Pleat Style' },
    { key: 'type',    value: 'select'       },
    { key: 'choices', value: gids(cPleatFlat, cPleatSingle, cPleatDouble) },
  ]);

  const oTurnUp = await upsert('gjm_option', 'option-turn-up', [
    { key: 'key',     value: 'turn_up' },
    { key: 'label',   value: 'Turn-up' },
    { key: 'type',    value: 'select'   },
    { key: 'choices', value: gids(cTurnupNone, cTurnup4cm, cTurnup5cm) },
  ]);

  const oCollarStyle = await upsert('gjm_option', 'option-collar-style', [
    { key: 'key',     value: 'collar_style' },
    { key: 'label',   value: 'Collar Style' },
    { key: 'type',    value: 'select'        },
    { key: 'choices', value: gids(cCollarClassic, cCollarCutaway, cCollarButtonDown) },
  ]);

  const oCuffStyle = await upsert('gjm_option', 'option-cuff-style', [
    { key: 'key',     value: 'cuff_style' },
    { key: 'label',   value: 'Cuff Style' },
    { key: 'type',    value: 'select'      },
    { key: 'choices', value: gids(cCuffSingle, cCuffDouble) },
  ]);

  const oVestBack = await upsert('gjm_option', 'option-vest-back', [
    { key: 'key',     value: 'back_style' },
    { key: 'label',   value: 'Back Style' },
    { key: 'type',    value: 'select'      },
    { key: 'choices', value: gids(cVestBackFabric, cVestBackSilk) },
  ]);

  // ── 3. OPTION SETS ──────────────────────────────────────────────────────────
  console.log('\n── gjm_option_set ──');

  await upsert('gjm_option_set', 'suit-standard-v1', [
    { key: 'title',          value: 'Suit – Standard' },
    { key: 'category',       value: 'suit'             },
    { key: 'version',        value: '1.0'              },
    { key: 'options',        value: gids(oLapelStyle, oButtonCount, oVentStyle, oLiningStyle, oFitSilhouette) },
    { key: 'default_config', value: JSON.stringify({ lapel_style: 'notch', button_count: '2', vent_style: 'double', lining_style: 'full', fit_silhouette: 'classic' }) },
  ]);

  await upsert('gjm_option_set', 'shirt-standard-v1', [
    { key: 'title',          value: 'Shirt – Standard' },
    { key: 'category',       value: 'shirt'             },
    { key: 'version',        value: '1.0'               },
    { key: 'options',        value: gids(oCollarStyle, oCuffStyle, oFitSilhouette) },
    { key: 'default_config', value: JSON.stringify({ collar_style: 'classic', cuff_style: 'single', fit_silhouette: 'classic' }) },
  ]);

  await upsert('gjm_option_set', 'trouser-standard-v1', [
    { key: 'title',          value: 'Trouser – Standard' },
    { key: 'category',       value: 'trouser'             },
    { key: 'version',        value: '1.0'                 },
    { key: 'options',        value: gids(oPleatStyle, oTurnUp, oFitSilhouette) },
    { key: 'default_config', value: JSON.stringify({ pleat_style: 'flat', turn_up: 'none', fit_silhouette: 'classic' }) },
  ]);

  await upsert('gjm_option_set', 'overcoat-standard-v1', [
    { key: 'title',          value: 'Overcoat – Standard' },
    { key: 'category',       value: 'overcoat'             },
    { key: 'version',        value: '1.0'                  },
    { key: 'options',        value: gids(oLapelStyle, oButtonCount, oLiningStyle, oFitSilhouette) },
    { key: 'default_config', value: JSON.stringify({ lapel_style: 'notch', button_count: '2', lining_style: 'full', fit_silhouette: 'classic' }) },
  ]);

  await upsert('gjm_option_set', 'blazer-standard-v1', [
    { key: 'title',          value: 'Blazer – Standard'    },
    { key: 'category',       value: 'blazer'                },
    { key: 'version',        value: '1.0'                   },
    { key: 'options',        value: gids(oLapelStyle, oButtonCount, oVentStyle, oFitSilhouette) },
    { key: 'default_config', value: JSON.stringify({ lapel_style: 'notch', button_count: '2', vent_style: 'single', fit_silhouette: 'classic' }) },
  ]);

  await upsert('gjm_option_set', 'vest-standard-v1', [
    { key: 'title',          value: 'Vest – Standard'  },
    { key: 'category',       value: 'vest'              },
    { key: 'version',        value: '1.0'               },
    { key: 'options',        value: gids(oVestButtons, oVestBack, oFitSilhouette) },
    { key: 'default_config', value: JSON.stringify({ button_count: '5', back_style: 'fabric', fit_silhouette: 'classic' }) },
  ]);

  // ── 4. SERVICE TYPES ────────────────────────────────────────────────────────
  console.log('\n── gjm_service_type ──');

  await upsert('gjm_service_type', 'home-office', [
    { key: 'name',            value: 'Home / Office Visit' },
    { key: 'duration_min',    value: '90'                  },
    { key: 'deposit_amount',  value: '50'                  },
    { key: 'lead_time_hours', value: '48'                  },
    { key: 'travel_required', value: 'true'                },
    { key: 'zones',           value: JSON.stringify({ radius_km: 30, flat_fee: 0 }) },
  ]);

  await upsert('gjm_service_type', 'showroom', [
    { key: 'name',            value: 'Showroom Fitting' },
    { key: 'duration_min',    value: '60'               },
    { key: 'deposit_amount',  value: '50'               },
    { key: 'lead_time_hours', value: '24'               },
    { key: 'travel_required', value: 'false'            },
    { key: 'zones',           value: JSON.stringify({}) },
  ]);

  await upsert('gjm_service_type', 'virtual', [
    { key: 'name',            value: 'Virtual Consultation' },
    { key: 'duration_min',    value: '30'                   },
    { key: 'deposit_amount',  value: '0'                    },
    { key: 'lead_time_hours', value: '24'                   },
    { key: 'travel_required', value: 'false'                },
    { key: 'zones',           value: JSON.stringify({}) },
  ]);

  await upsert('gjm_service_type', 'video-consult', [
    { key: 'name',            value: 'Video Consultation' },
    { key: 'duration_min',    value: '45'                 },
    { key: 'deposit_amount',  value: '0'                  },
    { key: 'lead_time_hours', value: '24'                 },
    { key: 'travel_required', value: 'false'              },
    { key: 'zones',           value: JSON.stringify({}) },
  ]);

  await upsert('gjm_service_type', 'tailor-fitting', [
    { key: 'name',            value: 'Tailor Fitting Session' },
    { key: 'duration_min',    value: '120'                    },
    { key: 'deposit_amount',  value: '75'                     },
    { key: 'lead_time_hours', value: '48'                     },
    { key: 'travel_required', value: 'true'                   },
    { key: 'zones',           value: JSON.stringify({ radius_km: 30, flat_fee: 25 }) },
  ]);

  // ── 5. FABRICS ──────────────────────────────────────────────────────────────
  console.log('\n── gjm_fabric ──');

  await upsert('gjm_fabric', 'gjm-f001-navy-twill', [
    { key: 'fabric_code',         value: 'GJM-F001'        },
    { key: 'mill',                value: 'Holland & Sherry' },
    { key: 'composition',         value: '100% Wool'        },
    { key: 'weight_gsm',          value: '280'              },
    { key: 'season',              value: 'four-season'      },
    { key: 'weave',               value: 'twill'            },
    { key: 'colour',              value: 'Navy'             },
    { key: 'price_tier',          value: 'entry'            },
    { key: 'availability_status', value: 'in_stock'         },
  ]);

  await upsert('gjm_fabric', 'gjm-f002-charcoal-flannel', [
    { key: 'fabric_code',         value: 'GJM-F002'  },
    { key: 'mill',                value: 'Scabal'    },
    { key: 'composition',         value: '100% Wool' },
    { key: 'weight_gsm',          value: '340'       },
    { key: 'season',              value: 'winter'    },
    { key: 'weave',               value: 'flannel'   },
    { key: 'colour',              value: 'Charcoal'  },
    { key: 'price_tier',          value: 'premium'   },
    { key: 'availability_status', value: 'in_stock'  },
  ]);

  await upsert('gjm_fabric', 'gjm-f003-mid-grey-hopsack', [
    { key: 'fabric_code',         value: 'GJM-F003'      },
    { key: 'mill',                value: 'Dormeuil'       },
    { key: 'composition',         value: '100% Wool'      },
    { key: 'weight_gsm',          value: '260'            },
    { key: 'season',              value: 'spring-summer'  },
    { key: 'weave',               value: 'hopsack'        },
    { key: 'colour',              value: 'Mid Grey'       },
    { key: 'price_tier',          value: 'premium'        },
    { key: 'availability_status', value: 'in_stock'       },
  ]);

  await upsert('gjm_fabric', 'gjm-f004-black-barathea', [
    { key: 'fabric_code',         value: 'GJM-F004'    },
    { key: 'mill',                value: 'Loro Piana'  },
    { key: 'composition',         value: '100% Wool'   },
    { key: 'weight_gsm',          value: '300'         },
    { key: 'season',              value: 'four-season' },
    { key: 'weave',               value: 'barathea'    },
    { key: 'colour',              value: 'Black'       },
    { key: 'price_tier',          value: 'luxury'      },
    { key: 'availability_status', value: 'in_stock'    },
  ]);

  await upsert('gjm_fabric', 'gjm-f005-ivory-linen', [
    { key: 'fabric_code',         value: 'GJM-F005'  },
    { key: 'mill',                value: 'Solbiati'  },
    { key: 'composition',         value: '100% Linen' },
    { key: 'weight_gsm',          value: '220'       },
    { key: 'season',              value: 'summer'    },
    { key: 'weave',               value: 'plain'     },
    { key: 'colour',              value: 'Ivory'     },
    { key: 'price_tier',          value: 'entry'     },
    { key: 'availability_status', value: 'in_stock'  },
  ]);

  console.log('\n✅ Seed complete.');
}

main().catch(console.error);
