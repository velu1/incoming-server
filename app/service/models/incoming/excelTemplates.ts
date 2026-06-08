import mongoose from "mongoose";

module.exports = (connection: any) => {
  const schema = new mongoose.Schema( // <-- use mongoose.Schema here
    {
      templateName: {
        type: String,
      },
      numberOfRowsToSkip: {
        type: Number,
      },
      templateMapping: [
        {
          label: {
            type: String,
          },
          path: {
            type: String,
          },
        },
      ],
      isDeleted: {
        type: Boolean,
        default: false,
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    },
    { timestamps: true, strict: false }
  );

  schema.method("toJSON", function (this: any) {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const ExcelTemplate = connection.model("exceltemplate", schema);
  return ExcelTemplate;
};
