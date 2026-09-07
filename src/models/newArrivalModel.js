const mongoose = require("mongoose");

const NewArrivalProductSchema =
  new mongoose.Schema(
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },

      displayOrder: {
        type: Number,
        default: 1,
        min: 1,
      },

      isFeatured: {
        type: Boolean,
        default: false,
      },

      image: {
        type: String,
        default: null,
      },
    },
    {
      _id: true,
    }
  );

const NewArrivalSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },

      subtitle: {
        type: String,
        trim: true,
        default: "",
      },

      description: {
        type: String,
        trim: true,
        default: "",
      },

      featuredProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: null,
      },

      products: {
        type: [NewArrivalProductSchema],

        validate: {
          validator: function (value) {
            return value.length <= 3;
          },

          message:
            "Maximum 3 products are allowed",
        },
      },

      heroImage: {
        type: String,
        default: null,
      },
    },

    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "NewArrival",
    NewArrivalSchema
  );