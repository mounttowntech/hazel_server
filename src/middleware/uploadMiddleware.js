const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==========================================================
// CREATE CATEGORY UPLOAD DIRECTORY
// ==========================================================

const categoryUploadDir = path.join(
  __dirname,
  "../uploads/categories"
);

if (!fs.existsSync(categoryUploadDir)) {
  fs.mkdirSync(categoryUploadDir, {
    recursive: true,
  });
}

// ==========================================================
// CREATE PRODUCT UPLOAD DIRECTORY
// ==========================================================

const productUploadDir = path.join(
  __dirname,
  "../uploads/products"
);

if (!fs.existsSync(productUploadDir)) {
  fs.mkdirSync(productUploadDir, {
    recursive: true,
  });
}

// ==========================================================
// CREATE PRODUCT VARIANT UPLOAD DIRECTORY
// ==========================================================

const productVariantUploadDir = path.join(
  __dirname,
  "../uploads/product-variants"
);

if (!fs.existsSync(productVariantUploadDir)) {
  fs.mkdirSync(productVariantUploadDir, {
    recursive: true,
  });
}

// ==========================================================
// COMMON FILE FILTER
// ==========================================================

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;

  const extension = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  const mimeType = allowedTypes.test(
    file.mimetype
  );

  if (extension && mimeType) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed"
      ),
      false
    );
  }
};

// ==========================================================
// CATEGORY STORAGE
// ==========================================================

const categoryStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, categoryUploadDir);
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

// ==========================================================
// PRODUCT STORAGE
// ==========================================================

const productStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, productUploadDir);
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

// ==========================================================
// PRODUCT VARIANT STORAGE
// ==========================================================

const productVariantStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, productVariantUploadDir);
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

// ==========================================================
// CATEGORY UPLOAD
// ==========================================================

const uploadCategoryImage = multer({
  storage: categoryStorage,

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ==========================================================
// PRODUCT UPLOAD
// ==========================================================

const uploadProductImage = multer({
  storage: productStorage,

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
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
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
});

// ==========================================================
// EXPORT
// ==========================================================

module.exports = {
  uploadCategoryImage,
  uploadProductImage,
  uploadProductVariantImage,
};