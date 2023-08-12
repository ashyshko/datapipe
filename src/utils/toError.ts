export function toError(e: unknown): Error {
  if (e instanceof Error) {
    return e;
  }

  return new Error(
    (typeof e === "object" ? (e as { message?: string }).message : undefined) ??
      "unknown error",
  );
}
