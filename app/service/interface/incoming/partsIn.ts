export interface FindPartNumberInterface {
  partNumber: string;
}

export interface PartsInStockInterface {
  id: string;
  receiptNumber: string;
  multipleSticker?: number;
  internalPartNo: string;
  partNumber: string;
  lotNumber: [];
  manufacturer: string;
  partLocation: string;
  quantity: number;
  manufacureDate: string;
  dateOfReceipt: string;
  image?: string;
  entryPreferences?: string;
  manufDate: string;
  uniqIdData?: string;
  uniqueId: string;
  image_base64?: string;
  extracted_sticker: string;
  expireDate: string;
  description: string;
  partType: string;
}

export interface CaptureInterface {
  eciaID: string;
  type: string;
  trialRun?: boolean;
  image_base64?: string;
}

export type CreateCaptureStock = PartsInStockInterface & CaptureInterface;

export interface MasterInvoiceInterface {
  partNumber: string;
  receiptNumber?: string;
}

export interface partsInListUpdateInterface {
  internalPartNo: string;
  partLocation: string;
  lotNumber: [];
  manufacureDate: string;
  expireDate: string;
  quantity: number;
  dateOfReceipt: string;
  uniqueId?: string;
  manufacturer: string;
  isReturn: boolean;
  isScraped: boolean;
  status: string;
  description: string;
}

export interface partsListReturn {
  id: string;
}
export interface PrinterData {
  ipAddress: string;
  port: number;
}
