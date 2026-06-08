/*
 * Created: Aiyappa@026-06-2024
 * Name: Part History
 * Dependencies:
 * Last Update: Aiyappa@026-06-2024
 */

export interface IPartsInDetails {
  operatorId: string;
}

export interface IStoresInDetails {
  uniqueId: string;
  userId: string;
  operatorId: string;
  location: string;
  rackId: string;
  rackLocation: {
    rackType: string;
    internalPartNo: string;
    quantity: number;
  };
  type: string;
  quantity: number;
  internalPartNo: string;
  partNumber: string;
  workOrderId: string;
  createdAt: Date;
  droppage?: number;
  previousQty?: string;
}

export interface IStoresOutDetails {
  uniqueId: string;
  userId: string;
  operatorId?: string;
  rackLocation?: {
    rackType: string;
    internalPartNo: string;
    quantity: number;
  };
  createdAt: Date;
  quantity: Number;
  side?: string;
  type?: string;
}

export interface IPartHistory {
  uniqueId?: string;
  reelId: string;
  internalPartNo: string;
  partsInDetails: IPartsInDetails;
}
