import { getDB } from "../dbInstance";

// export const getTemplateData = async (input: any) => {
//   try {
//     const db = await getDB(input?.tenantId);
//     let result: any = [];
//     if (input.MPN.length > 0) {
//       // Find inward template by partNumber
//       const inwardData = await db.inwardTemplate.findOne({
//         partNumber: input.MPN[0],
//         isDelete: false,
//       });
//       let tepmId = inwardData?._id;
//       if (!inwardData) {
//         const templatesHistoriesDataByPN = await db.templatesHistories
//           .findOne({ partNumber: input.MPN[0] })
//           .lean();
//         tepmId = templatesHistoriesDataByPN?.templateId;
//       }
//       // Step 1: Fetch TemplatesHistories data based on the input partNumber
//       const templatesHistories = await db.templatesHistories
//         .findOne({ templateId: tepmId })
//         .lean();
//       result = await db.inwardTemplate
//         .find({ _id: templatesHistories?.templateId, isDelete: false })
//         .lean();
//       result[0].trialRun = false;

 export const getTemplateData = async (input: any ) => {
  try {
    const db = await getDB(input?.tenantId);
    let result: any = [];
    if (input.MPN.length > 0) {
      // Find inward template by partNumber
      // const inwardData = await db.inwardTemplate.findOne({
      //   partNumber: input.MPN[0],
      //   isDelete: false,
      // });
      // if(!inwardData){
      // }
      // let tepmId = inwardData?._id;
      const templatesHistoriesDataByPN = await db.templatesHistories
      .findOne({ partNumber: input.MPN[0] })
      .lean();
      let tepmId = templatesHistoriesDataByPN?.templateId;
      // Step 1: Fetch TemplatesHistories data based on the input partNumber
      const templatesHistories = await db.templatesHistories
        .findOne({ templateId: tepmId })
        .lean();

      // Step 2: Fetch IncomingTemplates data
      // const templateIds = templatesHistories.map((history: any) => history.templateId);
      // const incomingTemplates = await db.incomingTemplate.find(
      //   { _id: { $in: templateIds } },
      //   { templateName: 1, templateId: 1, partNumber: 1, ocr: 1, barcode: 1 }
      // ).lean();
      result = await db.inwardTemplate
        .find({ _id: templatesHistories?.templateId, isDelete: false })
        .lean();
      result[0].trialRun = false;
    } else if (input.UUID) {
      // Step 1: Fetch TemplatesHistories data based on the input partNumber
      const templatesHistories = await db.templatesHistories
        .find({ uniqueId: input.UUID }, { templateId: 1, partNumber: 1 })
        .lean();
      const templateIds = templatesHistories.map(
        (history: any) => history.templateId
      );
      const incomingTemplates = await db.incomingTemplate
        .find(
          { _id: { $in: templateIds } },
          { templateName: 1, ocr: 1, barcode: 1 }
        )
        .lean();

      result = templatesHistories.map((history: any) => {
        const matchedTemplate = incomingTemplates.find(
          (template: any) =>
            template._id.toString() === history.templateId.toString()
        );

        if (matchedTemplate) {
          return {
            ...matchedTemplate,
            ocr: {
              ...matchedTemplate.ocr,
              data: matchedTemplate.ocr?.entityDetails || null,
              entityDetails: null,
            },
            barcode: {
              ...matchedTemplate.barcode,
              delimiter: {
                ...matchedTemplate.barcode?.delimiter,
                data: matchedTemplate.barcode?.delimiter?.entityDetails || null,
                entityDetails: null,
              },
            },
          };
        }
        return { data: "No template found for this UUID", status: false };
      });
    }
    let templateData: any;
    if (result.length === 0) {
      let invoice: any;
      invoice = await db.masterdata.findOne({
        partNumber: input.MPN[0],
      });
      if (invoice) {
        templateData = await db.incomingTemplate.aggregate([
          {
            $match: { manufacturer: invoice.manufacturer },
          },
          {
            $addFields: {
              "ocr.data": "$ocr.entityDetails",
              "ocr.entityDetails": null,
              "barcode.delimiter.data": "$barcode.delimiter.entityDetails",
              "barcode.delimiter.entityDetails": null,
            },
          },
          {
            $project: {
              "ocr.entityDetails": 0,
              "barcode.delimiter.entityDetails": 0,
            },
          },
        ]);

        if (!templateData || templateData.length === 0) {
          return {
            data: "No Template found in template Histories",
            status: false,
          };
        }
        return { data: templateData, status: true };
      } else {
        return { data: "No Manufacture in Invoice Template", status: false };
      }
    }

    return { data: result ? result : result, status: true };
  } catch (error) {
    return { data: error, status: false };
  }
};

export const createTemplateHistory = async (
  input: any,
  mongoConnString: string
) => {
  try {
    const db = await getDB(mongoConnString);
    const masterPartNumber = await db.masterdata.findOne({
      partNumber: input.partNumber,
    });
    if (!masterPartNumber) {
      return {
        data: { message: "Part Number not found in master data" },
        status: false,
      };
    }
    const inwardData = await db.templatesHistories.findOne({
      partNumber: input.partNumber,
    });
    if (inwardData) {
      return { data: { message: "Part Number already exixts" }, status: false };
    }
    const result = await db.templatesHistories.create(input);
    return { data: result, status: true };
  } catch (error) {
    console.log("Error in creating template history:", error);
    return { data: error, status: false };
  }
};

export const deletePartNumber = async (
  partNumber: string,
  mongoConnString: string
) => {
  try {
    const db = await getDB(mongoConnString);

    // Delete from templatesHistories using templateId instead of _id if required
    const result = await db.templatesHistories.deleteOne({
      partNumber: partNumber,
    });

    if (result.deletedCount === 0) {
      return {
        data: {
          status: "error",
          message: "No matching template history found to delete",
        },
        status: false,
      };
    } else {
      return {
        data: {
          status: "success",
          message: "Part number deleted successfully",
        },
        status: true,
      };
    }
  } catch (error) {
    console.error("Error in deleting template history:", error);
    return {
      data: {
        status: "error",
        message: (error as Error).message,
      },
      status: false,
    };
  }
};
