export type ErrorLike = {
  message?: string;
  stack?: string;
  name?: string;
  code?: number;
  data?: any;
  error?: any;
  errorSource?: string;
  parentError?: ErrorLike;
  isAdditinalValidationPassed?: boolean;
  additionalValidationType?: string;
  info?: {
    error?: ErrorLike;
  };
};


export function parseError(error: ErrorLike | string | undefined, errorDepth = 0): any | undefined {
  return {}
}

function hasMessage(error: unknown): error is { message: string } {
  return !!error && typeof error === "object" && typeof (error as { message: string }).message === "string";
}

function hasStack(error: unknown): error is { stack: string } {
  return !!error && typeof error === "object" && typeof (error as { stack: string }).stack === "string";
}

function hasName(error: unknown): error is { name: string } {
  return !!error && typeof error === "object" && typeof (error as { name: string }).name === "string";
}
