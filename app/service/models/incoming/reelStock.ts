import mongoose from "mongoose";

module.exports = (connection: any) => {
  const schema = new mongoose.Schema( // <-- use mongoose.Schema here
    {
      uniqueId: {
        type: String,
      },
      manufacturer: {
        type: String,
      },
      quantity: {
        type: Number,
      },
      manufactureDate: {
        type: mongoose.Schema.Types.Mixed,
      },
      lotNumber: {
        type: Array,
      },
      partLocation: {
        type: String,
      },
      isScraped: {
        type: Boolean,
        default: false,
      },
      auditStatus: {
        type: String,
        default: "Not Done",
      },
      partNumber: {
        type: String,
      },
      receiptNumber: {
        type: String,
      },
      description: {
        type: String,
      },
      entryPreferences: {
        type: String,
      },
      internalPartNo: {
        type: String,
      },
      extractedImage: {
        type: String,
      },
      expireDate: {
        type: Date,
      },
      updatedBy: {
        type: String,
      },
      status: {
        type: String,
      },
      isDeleted: {
        type: Boolean,
        default: false,
      },
      isReturn: {
        type: Boolean,
        default: false,
      },
      partType: {
        type: String,
      },
    },
    { timestamps: true, strict: false }
  );
  //
  schema.method("toJSON", function (this: any) {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const IncomingStock = connection.model("stock", schema);
  return IncomingStock;
};
