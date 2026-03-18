import mongoose from "mongoose";

module.exports = (connection: any) => {
  const prioritySchema = new mongoose.Schema({
    priority: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
  });

  const schema = new mongoose.Schema(
    {
      type: {
        type: String,
      },
      partsInNamingSeries: {
        type: String,
        require: true,
      },
      namingSeries: {
        type: String,
      },
      delimiter: {
        type: String,
      },

      printType: {
        type: String,
      },

      priority: {
        type: [prioritySchema],
      },
      audit: {
        type: Boolean,
        default: false,
      },
      auditType: {
        type: String,
      },
      invoice: {
        type: Boolean,
        default: false,
      },
      entityTableRows: {
        type: Array,
      },
      labelData: {
        type: Object,
      },
    },
    { timestamps: true, strict: true }
  );

  schema.method("toJSON", function (this: any) {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const PrinterConfiguration = connection.model("printerConfigs", schema);
  return PrinterConfiguration;
};
