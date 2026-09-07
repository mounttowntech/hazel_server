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

const newArrivalUploadDir = path.join(
  process.cwd(),
  "uploads",
  "new-arrivals"
);

// ============================================================
// CREATE UPLOAD DIRECTORIES
// ============================================================

[
  categoryUploadDir,
  subCategoryUploadDir,
  productUploadDir,
  newArrivalUploadDir,
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
// CATEGORY / SUBCATEGORY / NEW ARRIVAL
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
  console.log("Field name :", file.fieldname);
  console.log("File name  :", file.originalname);
  console.log("Extension  :", extension);
  console.log("MIME type  :", file.mimetype);
  console.log("==========================================");

  // ----------------------------------------------------------
  // VALID IMAGE EXTENSION
  // ----------------------------------------------------------

  if (allowedExtensions.includes(extension)) {
    return cb(null, true);
  }

  // ----------------------------------------------------------
  // INVALID FILE
  // ----------------------------------------------------------

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
  console.log("Field name :", file.fieldname);
  console.log("File name  :", file.originalname);
  console.log("Extension  :", extension);
  console.log("MIME type  :", file.mimetype);
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
// NEW ARRIVAL STORAGE
// ============================================================

const newArrivalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, newArrivalUploadDir);
  },

  filename: (req, file, cb) => {
    cb(null, generateFileName(file));
  },
});

// ============================================================
// UPLOAD LIMITS
// ============================================================

// ------------------------------------------------------------
// CATEGORY / SUBCATEGORY / NEW ARRIVAL
// Maximum file size = 5 MB
// ------------------------------------------------------------

const imageUploadLimits = {
  fileSize: 5 * 1024 * 1024,
};

// ------------------------------------------------------------
// PRODUCT MEDIA
// Maximum file size = 100 MB
// ------------------------------------------------------------

const productMediaUploadLimits = {
  fileSize: 100 * 1024 * 1024,
};

// ============================================================
// CATEGORY IMAGE UPLOAD
// ============================================================

const uploadCategoryImage = multer({
  storage: categoryStorage,

  fileFilter: imageFileFilter,

  limits: {
    ...imageUploadLimits,

    // Only one category image
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

    // Only one subcategory image
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

    // Maximum 10 product media files
    files: 10,
  },
});

// ============================================================
// NEW ARRIVAL IMAGE UPLOAD
// ============================================================
//
// NEW ARRIVAL SUPPORTS:
//
// heroImage      = 1 file
// productImages  = maximum 3 files
//
// TOTAL           = maximum 4 files
//
// IMPORTANT:
// The route must use:
//
// uploadNewArrivalImage.fields([
//   { name: "heroImage", maxCount: 1 },
//   { name: "productImages", maxCount: 3 }
// ])
//
// ============================================================

const uploadNewArrivalImage = multer({
  storage: newArrivalStorage,

  fileFilter: imageFileFilter,

  limits: {
    ...imageUploadLimits,

    // 1 hero image + 3 product images
    files: 4,
  },
});

// ============================================================
// MULTER ERROR HANDLER
// ============================================================
//
// Optional middleware that can be used after Multer
// to return clean JSON errors instead of HTML.
//
// ============================================================

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("==========================================");
    console.error("MULTER ERROR");
    console.error("Code    :", err.code);
    console.error("Message :", err.message);
    console.error("==========================================");

    // --------------------------------------------------------
    // TOO MANY FILES
    // --------------------------------------------------------

    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files uploaded",
        error: err.message,
      });
    }

    // --------------------------------------------------------
    // FILE TOO LARGE
    // --------------------------------------------------------

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size is too large",
        error: "Maximum allowed file size is 5 MB",
      });
    }

    // --------------------------------------------------------
    // UNEXPECTED FIELD
    // --------------------------------------------------------

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected file field",
        field: err.field,
      });
    }

    // --------------------------------------------------------
    // OTHER MULTER ERROR
    // --------------------------------------------------------

    return res.status(400).json({
      success: false,
      message: "File upload failed",
      error: err.message,
    });
  }

  // ----------------------------------------------------------
  // CUSTOM FILE FILTER ERROR
  // ----------------------------------------------------------

  if (err) {
    console.error("==========================================");
    console.error("UPLOAD ERROR");
    console.error("Message :", err.message);
    console.error("==========================================");

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next();
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  uploadCategoryImage,
  uploadSubCategoryImage,
  uploadProductMedia,
  uploadNewArrivalImage,
  handleUploadError,
};