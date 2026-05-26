export type ApiErrorType = 'network' | 'forbidden' | 'client' | 'server';

export class ApiError extends Error {
  readonly type: ApiErrorType;
  readonly status: number | null;

  constructor(type: ApiErrorType, status: number | null, message: string) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
  }
}
