export interface CreateEntityInterface {
  entityDetails: {
    lotNumber:string;
    manufDate:string;
    partNumber:string;
    quantity:string;
    tertiaryData: [];

  };
    keyCategory: string;
    templateName: string;
    manufacturer?: string;
    createdBy: string;
    partNumber: string;
  }
  
