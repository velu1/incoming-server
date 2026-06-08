import mongoose from "mongoose";

module.exports = (connection: any) => {
  const schema = new mongoose.Schema(
    {
      keyCategory: {
        type: String,
      },
      templateName: {
        type: String,
        uppercase: true,
      },
      ocr: {
        disable: { type: Boolean }, //to enable or disable ocr data for extraction
        entityDetails: {
          partNumber: {
            value: { type: String },
            isSelected: { type: Boolean },
          },
          quantity: {
            value: { type: String },
            isSelected: { type: Boolean },
          },
          lotNumber: {
            value: { type: String },
            isSelected: { type: Boolean },
          },
          manufDate: {
            value: { type: String },
            isSelected: { type: Boolean },
          },
          tertiaryData: [
            {
              MPN: { type: String, uppercase: true },
              TertiaryMPN: { type: String, uppercase: true },
            },
          ],
        },
      },
      barcode: {
        disable: { type: Boolean },
        selectedData: { type: String }, // type of selected sticker
        type: { type: String }, //to select delimiter or barcode
        delimiter: {
          type: { type: String },
          totalField: { type: Number }, //total number of data when split
          identifier: { type: Boolean },
          partNumber: {
            position: { type: Number },
            identifier: { type: String },
          },
          quantity: {
            position: { type: Number },
            identifier: { type: String },
          },
          manufDate: {
            position: { type: Number },
            identifier: { type: String },
          },
          lotNumber: {
            position: { type: Number },
            identifier: { type: String },
          },
        },
        positional: {
          totalLength: { type: Number },
          partNumber: {
            startIndex: { type: Number },
            endIndex: { type: Number },
          },
          quantity: {
            startIndex: { type: Number },
            endIndex: { type: Number },
          },
          manufDate: {
            startIndex: { type: Number },
            endIndex: { type: Number },
          },
          lotNumber: {
            startIndex: { type: Number },
            endIndex: { type: Number },
          },
        },
      },

      manufacturer: {
        type: String,
        uppercase: true,
      },
      createdBy: {
        type: String,
      },
      isDelete: {
        type: Boolean,
        default: false,
      },
    },
    { timestamps: true, strict: false }
  );

  schema.method("toJSON", function (this: any) {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const InwordTemplate = connection.model("inwardTemplate", schema);
  return InwordTemplate;
};
