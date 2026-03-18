import mongoose from "mongoose";

module.exports = (connection: any) => {
  const schema = new mongoose.Schema(
    {
      receiptNumber: {
        type: String,
        uppercase: true,
      },
      partNumber: {
        type: String,
        uppercase: true,
      },
      dateOfReceipt: {
        type: String,
      },
      status: {
        type: String,
        default: "Open",
      },
      receiptQuantity: {
        type: Number,
      },
      createdBy: { type: String },
      isDeleted: {
        type: Boolean,
        default: false,
      },
    },
    { timestamps: true, strict: true }
  );
  schema.method("toJSON", function (this: any) {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const InvoiceData = connection.model("invoicedata", schema);
  return InvoiceData;
};
