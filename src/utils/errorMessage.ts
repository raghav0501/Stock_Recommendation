import { ApiError } from './apiError';

export function toastMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.type) {
      case 'network':   return 'No internet connection. Please check your network.';
      case 'forbidden': return "You don't have permission to access this.";
      case 'server':    return 'Something went wrong on our end. Please try again.';
      case 'client':    return err.message || 'Request failed. Please try again.';
    }
  }
  return 'An unexpected error occurred. Please try again.';
}
