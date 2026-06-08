import { getDB } from "../dbInstance";
import { CreateEntityInterface } from "../../interface/incoming/entityMapping";
export interface SearchCriteria {
  [key: string]: any;
}

export interface Sort {
  [key: string]: 1 | -1;
}

const createInwardTemplate = async (
  input: CreateEntityInterface & { id?: string },
  mongoConnString: string
) => {
  try {
    const db = await getDB(mongoConnString);

    if (input.id) {
      // Update flow
      let masterData = await db.masterdata.findOne({
        partNumber: input.partNumber,
        isDeleted: false,
      });
      const existingByName = await db.inwardTemplate.findOne({
        _id: { $ne: input.id },
        templateName: input.templateName,
        isDelete: false,
      });

      if (existingByName) {
        return {
          status: false,
          message: `Another template with name '${input.templateName}' already exists.`,
        };
      }

      // const updatedTemplate = await db.inwardTemplate.findByIdAndUpdate(
      //   input.id,
      //   input,
      //   { new: true }
      // );
      const updatedTemplate = await db.inwardTemplate.findByIdAndUpdate(
        input.id,
        {
          ...input,
          manufacturer: masterData?.manufacturer,
        },
        { new: true }
      );

      if (!updatedTemplate) {
        return {
          status: false,
          message: "Template not found for update.",
        };
      }

      return {
        data: updatedTemplate,
        status: true,
        message: "Template updated",
      };
    } else {
      // Create flow
      let masterData = await db.masterdata.findOne({
        partNumber: input.partNumber,
        isDeleted: false,
      });
      const existingTemplate = await db.inwardTemplate.findOne({
        templateName: input.templateName,
        isDelete: false,
      });

      if (existingTemplate) {
        return {
          status: false,
          message: `Template name '${input.templateName}' already exists.`,
        };
      }

      // Soft delete existing entry with same partNumber
      await db.inwardTemplate.updateMany(
        { partNumber: input.partNumber, isDelete: false },
        { $set: { isDelete: true } }
      );

      // Create new inward template

      const templateResult = await db.inwardTemplate.create({
        ...input,
        manufacturer: masterData?.manufacturer,
      });

      // Create history entry
      const historyPayload = {
        templateId: templateResult._id,
        partNumber: input.partNumber,
      };
      await db.templatesHistories.create(historyPayload);

      return {
        data: templateResult,
        status: true,
        message: "Template created",
      };
    }
  } catch (error) {
    console.log("Error in createInwardTemplate service:", error);
    return { data: error, status: false, message: error.message };
  }
};

export const getAllInwardTemplates = async (
  searchCriteria: SearchCriteria,
  sort: Sort,
  page: number,
  pageSize: number,
  download: boolean,
  mongoConnString: string
): Promise<{ data?: any; status: boolean; error?: string; count: number }> => {
  try {
    const db = await getDB(mongoConnString);
    searchCriteria.isDelete = false;
    const pipeline: any[] = [
      {
        $lookup: {
          from: "templateshistories",
          localField: "_id",
          foreignField: "templateId",
          as: "historyData",
        },
      },
      {
        $addFields: {
          partNumber: {
            $cond: {
              if: {
                $eq: [
                  {
                    $setUnion: [
                      {
                        $map: {
                          input: "$historyData",
                          as: "h",
                          in: "$$h.partNumber",
                        },
                      },
                      [],
                    ],
                  },
                  [null],
                ],
              },
              then: [],
              else: {
                $setUnion: [
                  {
                    $map: {
                      input: "$historyData",
                      as: "h",
                      in: "$$h.partNumber",
                    },
                  },
                  [],
                ],
              },
            },
          },
        },
      },
      {
        $match: {
          ...Object.fromEntries(
            Object.entries(searchCriteria).filter(
              ([key]) => key !== "partNumber"
            )
          ),
          ...(searchCriteria.partNumber && {
            partNumber: {
              $elemMatch: { $regex: searchCriteria.partNumber, $options: "i" },
            },
          }),
        },
      },
    ];

    // Convert 'asc'/'desc' to 1/-1
    const mongoSort: Record<string, 1 | -1> = {};
    if (!download && sort && typeof sort === "object") {
      for (const [key, value] of Object.entries(sort)) {
        const direction = String(value).toLowerCase();
        if (direction === "asc" || direction === "desc") {
          mongoSort[key] = direction === "asc" ? 1 : -1;
        }
      }
    }

    // Apply sorting BEFORE skip/limit
    if (!download) {
      if (Object.keys(mongoSort).length > 0) {
        pipeline.push({ $sort: mongoSort });
      } else {
        pipeline.push({ $sort: { updatedAt: -1 } }); // default sort
      }
    }

    // Count total before pagination
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await db.inwardTemplate.aggregate(countPipeline);
    const totalCount = countResult[0]?.total || 0;

    // Apply pagination AFTER sorting
    if (!download) {
      pipeline.push({ $skip: (page - 1) * pageSize });
      pipeline.push({ $limit: pageSize });
    }

    const result = await db.inwardTemplate.aggregate(pipeline);

    return { data: result, status: true, count: totalCount };
  } catch (error) {
    return {
      error: (error as Error).message,
      status: false,
      count: 0,
    };
  }
};

const deleteInwardTemplate = async (id: string, mongoConnString: string) => {
  try {
    const db = await getDB(mongoConnString);
    const result = await db.inwardTemplate.findByIdAndDelete(id);
    return { data: result.id, status: true };
  } catch (error) {
    console.log("Error in inward template service:", error);
    return { data: error, status: false };
  }
};



//Get all EntityData details
const getTemplateManufacturer = async (_req: any, mongoConnString: string) => {
  try {
    const db = await getDB(mongoConnString);
    let result;
    let entitMAping;
    result = await db.masterdata.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$manufacturer",
          id: { $first: "$_id" },
        },
      },
      {
        $project: {
          _id: 0,
          manufacturer: "$_id",
          id: 1,
        },
      },
    ]);

    return { data: result, entityMAping: entitMAping };
  } catch (error) {
    console.log("Error in findEntityData service:", error);
    return { error: error, status: false };
  }
};

const associateTemplate = async (input: any, mongoConnString: string) => {
  try {
    const db = await getDB(mongoConnString);
    // Create history entry
    const historyPayload = {
      templateId: input?.template?.id,
      partNumber: input.partNumber,
    };
    await db.templatesHistories.create(historyPayload);

    return {
      status: true,
      message: "Template mapped successfully",
    };
  } catch (error) {
    console.log("Error in createInwardTemplate service:", error);
    return { data: error, status: false, message: error.message };
  }
};

module.exports = {
  getTemplateManufacturer,
  createInwardTemplate,
  deleteInwardTemplate,
  getAllInwardTemplates,
  associateTemplate,
};
