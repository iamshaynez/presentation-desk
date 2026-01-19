export interface UnitContent {
  readme: string;
  update: string;
  image: string | null;
  html: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
