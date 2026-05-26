export type ApiErrorType = 'network' | 'forbidden' | 'client' | 'server';

export class ApiError extends Error {
  constructor(
    public readonly type: ApiErrorType,
    public readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
