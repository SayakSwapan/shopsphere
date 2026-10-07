import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRestockNotificationMessage,
  summarizeRestockDemand,
} from "./restock-demand";

test("restock notification message includes product, size, and CTA", () => {
  const message = buildRestockNotificationMessage({
    productName: "Barcelona Home Jersey",
    variantName: "Fan Version",
    sizeName: "M",
    productUrl: "/products/barcelona-home-jersey",
  });

  assert.match(message, /Barcelona Home Jersey/);
  assert.match(message, /Fan Version/);
  assert.match(message, /M/);
  assert.match(message, /Shop Now/);
  assert.match(message, /barcelona-home-jersey/);
});

test("restock demand summary groups counts by size and variant", () => {
  const summary = summarizeRestockDemand([
    {
      productId: "p1",
      variantId: "v1",
      variantName: "Fan Version",
      sizeId: "s1",
      sizeName: "S",
      quantity: 1,
    },
    {
      productId: "p1",
      variantId: "v1",
      variantName: "Fan Version",
      sizeId: "s1",
      sizeName: "S",
      quantity: 1,
    },
    {
      productId: "p1",
      variantId: "v2",
      variantName: "Player Version",
      sizeId: "s2",
      sizeName: "M",
      quantity: 2,
    },
  ]);

  assert.deepEqual(summary.byVariant[0], {
    variantName: "Fan Version",
    totalRequests: 2,
    sizes: [{ sizeName: "S", totalRequests: 2 }],
  });
  assert.equal(summary.totalRequests, 4);
  assert.equal(summary.byVariant[1].sizes[0].totalRequests, 2);
});
