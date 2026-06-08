/*
 * Created: Aiyappa@11-06-2024
 * Name: invoice Transcation data
 * Dependencies:
 * Last Update: Aiyappa@11-06-2024
 */
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
      internalPartNo: {
        type: String,
        uppercase: true,
      },
      receiptQuantity: {
        type: Number,
      },
      inwardQty: {
        type: Number,
        default: 0,
      },
    },
    { timestamps: true, strict: true }
  );
  schema.method("toJSON", function (this: any) {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const InvoiceTranscationData = connection.model("invoiceTranscation", schema);
  return InvoiceTranscationData;
};
