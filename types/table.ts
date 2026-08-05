import React from "react";

export interface Column<T> {
  key: keyof T | string;

  label: string;

  render?: (
    value: unknown,
    row: T
  ) => React.ReactNode;
}