const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ============================================================
// UPLOAD DIRECTORIES
// ============================================================

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

// ============================================================
// CREATE DIRECTORIES
// ============================================================

[
  categoryUploadDir,
  subCategoryUploadDir,
  productUploadDir,
].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
      recursive: true,
    });
  }
});

// ============================================================
// GENERATE UNIQUE FILE NAME
// ============================================================

const generateFileName = (file) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  return (
    Date.now() +
    "-" +
    Math.round(Math.random() * 1e9) +
    extension
  );
};

// ============================================================
// IMAGE FILE FILTER
// CATEGORY / SUBCATEGORY
// ============================================================

const imageFileFilter = (req, file, cb) => {
  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
  ];

  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  console.log("==========================================");
  console.log("IMAGE UPLOAD");
  console.log("File name :", file.originalname);
  console.log("Extension :", extension);
  console.log("MIME type :", file.mimetype);
  console.log("==========================================");

  if (allowedExtensions.includes(extension)) {
    return cb(null, true);
  }

  return cb(
    new Error(
      "Only JPG, JPEG, PNG and WEBP images are allowed"
    ),
    false
  );
};

// ============================================================
// PRODUCT MEDIA FILE FILTER
// IMAGE + VIDEO
// ============================================================

const productMediaFileFilter = (req, file, cb) => {
  const allowedImageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
  ];

  const allowedVideoExtensions = [
    ".mp4",
    ".webm",
    ".mov",
  ];

  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  console.log("==========================================");
  console.log("PRODUCT MEDIA UPLOAD");
  console.log("File name :", file.originalname);
  console.log("Extension :", extension);
  console.log("MIME type :", file.mimetype);
  console.log("==========================================");

  // ----------------------------------------------------------
  // IMAGE
  // ----------------------------------------------------------

  if (allowedImageExtensions.includes(extension)) {
    return cb(null, true);
  }

  // ----------------------------------------------------------
  // VIDEO
  // ----------------------------------------------------------

  if (allowedVideoExtensions.includes(extension)) {
    return cb(null, true);
  }

  // ----------------------------------------------------------
  // INVALID FILE
  // ----------------------------------------------------------

  return cb(
    new Error(
      "Only JPG, JPEG, PNG, WEBP images and MP4, WEBM, MOV videos are allowed"
    ),
    false
  );
};

// ============================================================
// CATEGORY STORAGE
// ============================================================

const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, categoryUploadDir);
  },

  filename: (req, file, cb) => {
    cb(null, generateFileName(file));
  },
});

// ============================================================
// SUBCATEGORY STORAGE
// ============================================================

const subCategoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, subCategoryUploadDir);
  },

  filename: (req, file, cb) => {
    cb(null, generateFileName(file));
  },
});

// ============================================================
// PRODUCT STORAGE
// ============================================================

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productUploadDir);
  },

  filename: (req, file, cb) => {
    cb(null, generateFileName(file));
  },
});

// ============================================================
// UPLOAD LIMITS
// ============================================================

// Category / Subcategory
const imageUploadLimits = {
  fileSize: 5 * 1024 * 1024, // 5 MB
};

// Product media
const productMediaUploadLimits = {
  fileSize: 100 * 1024 * 1024, // 100 MB
};

// ============================================================
// CATEGORY IMAGE UPLOAD
// ============================================================

const uploadCategoryImage = multer({
  storage: categoryStorage,

  fileFilter: imageFileFilter,

  limits: {
    ...imageUploadLimits,
    files: 1,
  },
});

// ============================================================
// SUBCATEGORY IMAGE UPLOAD
// ============================================================

const uploadSubCategoryImage = multer({
  storage: subCategoryStorage,

  fileFilter: imageFileFilter,

  limits: {
    ...imageUploadLimits,
    files: 1,
  },
});

// ============================================================
// PRODUCT MEDIA UPLOAD
// ============================================================

const uploadProductMedia = multer({
  storage: productStorage,

  fileFilter: productMediaFileFilter,

  limits: {
    ...productMediaUploadLimits,
    files: 10,
  },
});

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  uploadCategoryImage,
  uploadSubCategoryImage,
  uploadProductMedia,
};