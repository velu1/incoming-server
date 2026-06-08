export interface CreateInterface {
  templateName: string;
  numberOfRowsToSkip: number;
  templateMapping: { label: string; path: string }[];
  type: string;
}

export interface FindTypeInterface {
  type: string;
}
export interface FindIDInterface {
  id: string;
}
