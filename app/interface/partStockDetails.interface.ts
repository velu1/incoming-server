export interface Pagination {
  page: number;
  pageSize: number;
  searchQuery?: string;
  sortColumn: string;
  sortOrder: 1 | -1;
  startDate?: string;
  endDate?: string;
  download: boolean;
}

export interface RequestBody {
  pagination: Pagination;
}

export interface SearchCriteria {
  $or?: { [key: string]: { $regex: RegExp } }[];
  manufDate?: {
    $gte: Date;
    $lte: Date;
  };
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}
