import mongoose from "mongoose";

module.exports = (connection: any) => {
  const schema = new mongoose.Schema( // <-- use mongoose.Schema here
    {
      templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "incomingTemplate",
      },
      partNumber: {
        type: String,
      },
    },
    { timestamps: true, strict: false }
  );
  schema.method("toJSON", function (this: any) {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });
  const templatesHistories = connection.model("templatesHistories", schema);
  return templatesHistories;
};
