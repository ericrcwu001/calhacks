// server.js
// A tiny Node.js API that proxies & normalizes Open Food Facts,
// with CORS allowlist, caching, and consistent error responses.
//
// Usage:
//   npm i express axios lru-cache cors
//   node server.js
//
// Env vars (optional):
//   PORT=8080
//   OFF_BASE=https://world.openfoodfacts.org
//   USER_AGENT="my-app/1.0 (you@domain.com)"
//   ALLOWED_ORIGINS="https://yourapp.creao.ai,http://localhost:5173"

import express from "express";
import axios from "axios";
import { LRUCache } from "lru-cache";
import cors from "cors";

const app = express();
app.disable("x-powered-by");

// ---------- Config ----------
const PORT = process.env.PORT || 8080;
const OFF_BASE = process.env.OFF_BASE || "https://world.openfoodfacts.org";
const USER_AGENT = process.env.USER_AGENT || "off-proxy/1.0 (contact@example.com)";
const ALLOWED = (process.env.ALLOWED_ORIGINS ||
  "https://yourapp.creao.ai,https://yourdomain.com,https://dede3phc22dgx.cloudfront.net,https://*.creao.ai,http://localhost:5173,http://localhost:5174")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

// HTTP client
const http = axios.create({
  baseURL: OFF_BASE,
  headers: { "User-Agent": USER_AGENT, "Accept": "application/json" },
  timeout: 8000,
});

// Simple in-memory cache
const cache = new LRUCache({
  max: 1000,
  ttl: 1000 * 60 * 10, // 10 minutes
});

// ---------- CORS (allowlist) ----------
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (ALLOWED.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow all creao.ai subdomains
    if (origin.includes('creao.ai') || origin.includes('cloudfront.net')) {
      return callback(null, true);
    }
    
    // For development, allow localhost
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    console.log('CORS blocked origin:', origin);
    return callback(new Error("CORS: Origin not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  exposedHeaders: ["Content-Length", "ETag"],
  maxAge: 86400,
}));
app.options("*", cors());

// ---------- Middleware ----------
app.use(express.json());

// ---------- Helpers ----------
function normalizeProduct(p) {
  if (!p) return null;
  const frontImage = p.selected_images?.front?.display;
  const imageUrl = frontImage ? Object.values(frontImage)[0] : null;
  return {
    code: p.code ?? null,
    product_name_en: p.product_name_en ?? null,
    generic_name_en: p.generic_name_en ?? null,
    quantity: p.quantity ?? null,
    product_quantity: p.product_quantity ?? null,
    product_quantity_unit: p.product_quantity_unit ?? null,
    serving_size: p.serving_size ?? null,
    serving_quantity: p.serving_quantity ?? null,
    serving_quantity_unit: p.serving_quantity_unit ?? null,
    ingredients: p.ingredients ?? null,
    ingredients_text_en: p.ingredients_text_en ?? null,
    ingredients_analysis_tags: p.ingredients_analysis_tags ?? null,
    allergens_tags: p.allergens_tags ?? null,
    image_url: imageUrl,
    source: "openfoodfacts",
  };
}

function problem({ status = 500, title = "Internal Server Error", detail, instance }) {
  return {
    type: "about:blank",
    title,
    status,
    detail: detail || undefined,
    instance: instance || undefined,
  };
}

// ---------- Routes ----------

// Health check
app.get("/v1/health", (req, res) => {
  res.json({ status: "ok", upstream: OFF_BASE });
});

// Get a single product by barcode
app.get("/v1/products/:barcode", async (req, res, next) => {
  try {
    const { barcode } = req.params;
    const key = `prod:${barcode}`;
    if (cache.has(key)) return res.json(cache.get(key));

    const fields = [
      "code",
      "product_name_en",
      "generic_name_en",
      "quantity",
      "product_quantity",
      "product_quantity_unit",
      "serving_size",
      "serving_quantity",
      "serving_quantity_unit",
      "ingredients",
      "ingredients_text_en",
      "ingredients_analysis_tags",
      "allergens_tags",
      "selected_images",
    ].join(",");

    const { data } = await http.get(`/api/v2/product/${encodeURIComponent(barcode)}.json`, {
      params: { fields },
    });

    if (!data || !data.product) {
      return res.status(404).json(problem({
        status: 404,
        title: "Not Found",
        detail: `Barcode ${barcode} not found`,
        instance: req.originalUrl,
      }));
    }

    const normalized = normalizeProduct(data.product);
    cache.set(key, normalized);
    res.json(normalized);
  } catch (err) {
    next(err);
  }
});

// Batch lookup by codes (?codes=comma,separated)
app.get("/v1/products", async (req, res, next) => {
  try {
    const codes = String(req.query.codes || "").trim();
    if (!codes) {
      return res.status(400).json(problem({
        status: 400,
        title: "Bad Request",
        detail: "Provide ?codes=comma,separated barcodes",
        instance: req.originalUrl,
      }));
    }

    const key = `batch:${codes}`;
    if (cache.has(key)) return res.json(cache.get(key));

    // OFF v2 search supports filtering by code (comma-separated)
    const fields = "code,product_name_en,generic_name_en,quantity,product_quantity,product_quantity_unit,serving_size,serving_quantity,serving_quantity_unit,ingredients,ingredients_text_en,ingredients_analysis_tags,allergens_tags,selected_images";
    const { data } = await http.get("/api/v2/search", {
      params: { code: codes, fields, page_size: 100 },
    });

    const products = Array.isArray(data?.products) ? data.products : [];
    const normalized = products.map(normalizeProduct).filter(Boolean);

    cache.set(key, normalized);
    res.json(normalized);
  } catch (err) {
    next(err);
  }
});

// ---------- 404 fallback ----------
app.use((req, res) => {
  res.status(404).json(problem({
    status: 404,
    title: "Not Found",
    detail: `No route matches ${req.method} ${req.originalUrl}`,
    instance: req.originalUrl,
  }));
});

// ---------- Error handler ----------
app.use((err, req, res, _next) => {
  // Handle CORS allowlist errors
  if (err?.message?.startsWith("CORS:")) {
    return res.status(403).json(problem({
      status: 403,
      title: "CORS Forbidden",
      detail: err.message,
      instance: req.originalUrl,
    }));
  }

  const status = err?.response?.status || 502;
  const detail =
    err?.response?.data?.message ||
    err?.message ||
    "Upstream request failed";

  res.status(status).json(problem({
    status,
    title: status === 502 ? "Bad Gateway" : "Error",
    detail,
    instance: req.originalUrl,
  }));
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
