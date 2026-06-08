export interface CreateInterface {
  partNumber: string;
  partLocation: string;
  internalPartNo: string;
  description?: string;
  manufacturer?: string;
  uploadData?: [];
  type: string;
}
export interface FindIdInterface {
  id: string;
}
export interface UpdateByIDsInterface {
  id: string;
  partNumber: string;
  partLocation: string;
  internalPartNo: string;
  description: string;
  manufacturer: string;
  uploadData: [];
  type: string;
}
