import mongoose from "mongoose";

module.exports = (connection: any) => {
  const schema = new mongoose.Schema(
    {
      partNumber: { type: String, uppercase: true },
      partLocation: { type: String },
      internalPartNo: { type: String },
      description: { type: String },
      manufacturer: { type: String, uppercase: true },
      quantity: { type: Number },
      isDeleted: { type: Boolean, default: false },
      expiredDate: { type: Date, default: new Date() },
      createdBy: { type: String },
    },
    { timestamps: true, strict: true }
  );

  schema.method("toJSON", function (this: any) {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const MasterData = connection.model("masterdata", schema);
  return MasterData;
};
