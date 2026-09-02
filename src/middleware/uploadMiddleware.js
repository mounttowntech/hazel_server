const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==========================================================
// UPLOAD DIRECTORIES
// ==========================================================

const categoryUploadDir = path.join(
  process.cwd(),
  "uploads",
  "categories"
);

const subCategoryUploadDir = path.join(
  process.cwd(),
  "uploads",
  "subcategories"
);

const productUploadDir = path.join(
  process.cwd(),
  "uploads",
  "products"
);

const productVariantUploadDir = path.join(
  process.cwd(),
  "uploads",
  "product-variants"
);

// ==========================================================
// CREATE DIRECTORIES
// ==========================================================

[
  categoryUploadDir,
  subCategoryUploadDir,
  productUploadDir,
  productVariantUploadDir,
].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ==========================================================
// FILE FILTER
// ==========================================================

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
  ];

  const extension = path.extname(file.originalname).toLowerCase();

  console.log("========== IMAGE UPLOAD ==========");
  console.log("File name :", file.originalname);
  console.log("Extension :", extension);
  console.log("MIME type :", file.mimetype);
  console.log("==================================");

  if (allowedExtensions.includes(extension)) {
    return cb(null, true);
  }

  return cb(
    new Error("Only JPG, JPEG, PNG and WEBP images are allowed"),
    false
  );
};

// ==========================================================
// GENERATE FILE NAME
// ==========================================================

const generateFileName = (file) => {
  const extension = path.extname(file.originalname).toLowerCase();

  return (
    Date.now() +
    "-" +
    Math.round(Math.random() * 1e9) +
    extension
  );
};

// ==========================================================
// CATEGORY STORAGE
// ==========================================================

const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, categoryUploadDir);
  },

  filename: (req, file, cb) => {
    cb(null, generateFileName(file));
  },
});

// ==========================================================
// SUB CATEGORY STORAGE
// ==========================================================

const subCategoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, subCategoryUploadDir);
  },

  filename: (req, file, cb) => {
    cb(null, generateFileName(file));
  },
});

// ==========================================================
// PRODUCT STORAGE
// ==========================================================

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productUploadDir);
  },

  filename: (req, file, cb) => {
    cb(null, generateFileName(file));
  },
});

// ==========================================================
// PRODUCT VARIANT STORAGE
// ==========================================================

const productVariantStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productVariantUploadDir);
  },

  filename: (req, file, cb) => {
    cb(null, generateFileName(file));
  },
});

// ==========================================================
// UPLOAD LIMITS
// ==========================================================

const uploadLimits = {
  fileSize: 5 * 1024 * 1024,
};

// ==========================================================
// CATEGORY UPLOAD
// ==========================================================

const uploadCategoryImage = multer({
  storage: categoryStorage,
  fileFilter,
  limits: {
    ...uploadLimits,
    files: 1,
  },
});

// ==========================================================
// SUB CATEGORY UPLOAD
// ==========================================================

const uploadSubCategoryImage = multer({
  storage: subCategoryStorage,
  fileFilter,
  limits: {
    ...uploadLimits,
    files: 1,
  },
});

// ==========================================================
// PRODUCT UPLOAD
// ==========================================================

const uploadProductImage = multer({
  storage: productStorage,
  fileFilter,
  limits: {
    ...uploadLimits,
    files: 10,
  },
});

// ==========================================================
// PRODUCT VARIANT UPLOAD
// ==========================================================

const uploadProductVariantImage = multer({
  storage: productVariantStorage,
  fileFilter,
  limits: {
    ...uploadLimits,
    files: 10,
  },
});

// ==========================================================
// EXPORT
// ==========================================================

module.exports = {
  uploadCategoryImage,
  uploadSubCategoryImage,
  uploadProductImage,
  uploadProductVariantImage,
};