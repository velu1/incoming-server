import mongoose from "mongoose";

module.exports = (connection: any) => {
  const schema = new mongoose.Schema( // <-- use mongoose.Schema here
    {
      reelOrder: {
        type: String,
      },
      groupSeparator: {
        type: String,
      },
      incrementIdParts: {
        type: String,
      },
      Audit: {
        type: Boolean,
        default: false,
      },
      AuditType: {
        type: String,
      },
      // createdBy: {
      //   type: mongoose.Schema.Types.ObjectId,
      //   ref: "user",
      // },
      // updatedBy: {
      //   type: mongoose.Schema.Types.ObjectId,
      //   ref: "user",
      // },
    },
    { timestamps: true, strict: true }
  );
  schema.method("toJSON", function (this: any) {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });
  const settingTranscation = connection.model("setting", schema);
  return settingTranscation;
};
