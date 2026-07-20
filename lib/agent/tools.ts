// Ported from server/tool_specs.py — the tool menu handed to the agent.
// ADK's FunctionTool takes a zod schema instead of a hand-written JSON
// schema, but the names / types / descriptions match the original 1:1 so
// the model sees the same tool surface.

import { FunctionTool } from "@google/adk";
import { z } from "zod";
import { findProducts, findBrands } from "./db";

const AESTHETIC_TAGS = [
  "Old Money",
  "Minimalist",
  "Clean Girl",
  "Streetwear",
  "Y2K",
  "Athleisure",
  "Boho",
  "Cottagecore",
  "Vintage",
  "Gothic",
  "Avant-Garde",
  "Korean",
  "Office Wear",
  "Preppy",
  "Coquette",
];

export const findProductsTool = new FunctionTool({
  name: "find_products",
  description:
    "Search Dobaeni's real, in-stock, published product catalog. " +
    "Use this BEFORE recommending any specific product, outfit " +
    "idea, or answering 'what should I buy/wear' style questions. " +
    "Never invent a product, price, or link — always call this " +
    "first and only describe what it returns.",
  parameters: z.object({
    query: z
      .string()
      .optional()
      .describe("Free-text search, e.g. 'linen shirt'. Optional."),
    aesthetics: z
      .array(z.string())
      .optional()
      .describe(
        "Style/aesthetic tags to match. Use EXACT tags from " +
          "this catalog's vocabulary: " +
          AESTHETIC_TAGS.join(", ") +
          ". Any one match is " +
          "enough. e.g. ['Boho'] or ['Old Money','Minimalist']. Optional."
      ),
    category: z
      .string()
      .optional()
      .describe(
        "A type of item the shopper said, e.g. 'Dresses', " +
          "'Kurta', 'Hoodie', 'Blazer', 'Lehenga', 'Sneakers'. " +
          "Matched against product names/tags (not a strict " +
          "category table), so 'Dresses' finds wrap/slip/blazer " +
          "dresses. Optional."
      ),
    gender: z
      .enum(["male", "female", "unisex"])
      .optional()
      .describe("Optional gender filter."),
    occasion: z
      .string()
      .optional()
      .describe("e.g. 'Wedding', 'Work', 'Party', 'Daily'. Optional."),
    min_price: z
      .number()
      .optional()
      .describe("Minimum price in NPR. Optional."),
    max_price: z
      .number()
      .optional()
      .describe("Maximum price in NPR. Optional."),
    sort_by: z
      .enum(["trending", "rating", "newest", "price_low", "price_high"])
      .optional()
      .describe("Ranking metric. Defaults to 'trending'."),
    limit: z
      .number()
      .int()
      .optional()
      .describe("Max results to return, 1-12. Defaults to 6."),
  }),
  execute: (args: any) => findProducts(args),
});

export const findBrandsTool = new FunctionTool({
  name: "find_brands",
  description:
    "Search Dobaeni's real, published, active brands/sellers. Use " +
    "this when a shopper wants a brand or store recommendation " +
    "rather than a single product, e.g. 'which brand has the best " +
    "streetwear'. Never invent a brand name or link.",
  parameters: z.object({
    aesthetic: z
      .string()
      .optional()
      .describe("Style the brand's catalog should carry, e.g. 'Y2K'. Optional."),
    name: z
      .string()
      .optional()
      .describe(
        "Brand/store name (or a close spelling of it), e.g. " +
          "'Maison Lustre', 'Neon Kathmandu'. Matched loosely " +
          "so minor typos still resolve to the right seller. Optional."
      ),
    business_type: z
      .string()
      .optional()
      .describe(
        "One of Boutique, Designer, Streetwear, Thrift, " +
          "Label, Handmade. Optional."
      ),
    city: z
      .string()
      .optional()
      .describe("e.g. 'Kathmandu'. Optional."),
    sort_by: z
      .enum(["trending", "most_followed", "top_rated"])
      .optional()
      .describe("Ranking metric. Defaults to 'trending'."),
    limit: z
      .number()
      .int()
      .optional()
      .describe("Max results to return, 1-10. Defaults to 5."),
  }),
  execute: (args: any) => findBrands(args),
});
