// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * Import necessary types for type safety
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 * @typedef {import("../generated/api").Target} Target
 */

const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: []
};

export function run(input) {
  const discounts = input.cart.lines
    .map((line) => {
      if (line.merchandise.__typename !== "ProductVariant") return null; // Ensure it's a product variant

      const product = line.merchandise.product;
      const hasTiredDiscountTag = product?.hasAnyTag;

      if (!product?.metafield || !hasTiredDiscountTag) return null; // Ensure both tag & metafield exist

      try {
        const tiredDiscounts = JSON.parse(product.metafield.value);
        const exactTierDiscount = tiredDiscounts.find((eachTier) => eachTier.quantity === line.quantity);

        if (exactTierDiscount) {
          return {
            targets: [{ cartLine: { id: line.id } }],
            value: { percentage: { value: exactTierDiscount.discount.toString() } },
            message: exactTierDiscount.message
          };
        }
      } catch (error) {
        console.error("Error parsing metafield:", error);
      }

      return null;
    })
    .filter(Boolean);

  if (discounts.length === 0) return EMPTY_DISCOUNT;

  return {
    discounts,
    discountApplicationStrategy: DiscountApplicationStrategy.First
  };
}
