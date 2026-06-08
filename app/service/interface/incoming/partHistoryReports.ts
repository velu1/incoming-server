export interface SearchCriteria {
  [key: string]: any;
}

export interface Sort {
  [key: string]: 1 | -1;
}

export interface PopulateData {
  path: string;
  select: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  searchQuery?: string;
  sortColumn: string;
  sortOrder: 1 | -1;
  startDate?: string;
  endDate?: string;
  download?: boolean;
}

export interface RequestBody {
  pagination: Pagination;
}
