import { NextResponse } from "next/server";

export function success(
  data: unknown
) {
  return NextResponse.json(
    data
  );
}

export function failure(
  message: string,
  status = 400
) {
  return NextResponse.json(
    {
      error: message,
    },
    {
      status,
    }
  );
}