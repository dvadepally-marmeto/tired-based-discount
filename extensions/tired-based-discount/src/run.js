// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * Import necessary types for type safety
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 * @typedef {import("../generated/api").Target} Target
 */

// Define an empty discount result to return when no discounts apply
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

/**
 * Function to apply a tiered volume-based discount
 *
 * @param {RunInput} input - The input data containing cart details
 * @returns {FunctionRunResult} - The result containing applicable discounts
 */
export function run(input) {
  /** @type {Array<{ targets: Target[], value: { percentage: { value: string } } }>} */
  const discounts = [];

  input.cart.lines.forEach((line) => {
    if (line.merchandise.__typename !== "ProductVariant") return; // Ensure it's a product variant

    const product = line.merchandise.product; // Get product object

    const hasTiredDiscountTag = product?.hasAnyTag;

    if (!product?.metafield || !hasTiredDiscountTag) return; // Skip if no metafield or tag is found

    try {
      const tiredDiscounts = JSON.parse(product.metafield.value);

      const exactTierDiscount = tiredDiscounts.find((eachTier) => eachTier.quantity === line.quantity);

      if (exactTierDiscount) {
        discounts.push({
          targets: [{ cartLine: { id: line.id } }], // Apply to this line item
          value: { percentage: { value: exactTierDiscount.discount.toString() } } // Apply discount
        });
      }
    } catch (error) {
      console.error("Error parsing metafield:", error);
    }
  });

  // If no discounts apply, return an empty result
  if (discounts.length === 0) return EMPTY_DISCOUNT;

  return {
    discounts,
    discountApplicationStrategy: DiscountApplicationStrategy.First,
  };
}
