export interface UploadRecord {
  receiptNumber: string;
  internalPartNo: string;
  partNumber: string;
  receiptQuantity: number;
  inwardQty: number;
  dateOfReceipt: string;
}

export interface CreateInterface {
  receiptNumber: string;
  dateOfReceipt: string;
  internalPartNo: string;
  partNumber: string;
  partName: string;
  receiptQuantity: number;
  manufacturer: string;
  uploadData: UploadRecord[];
  type: string;
}
export interface FindIdInterface {
  id: string;
}

export interface UpdateByIDsInterface {
  id: string;
  receiptNumber: string;
  dateOfReceipt: Date;
  internalPartNo: string;
  partNumber: string;
  partName: string;
  receiptQuantity: number;
  manufacturer: string;
}
