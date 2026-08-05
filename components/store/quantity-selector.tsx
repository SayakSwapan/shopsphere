"use client";

import { useState } from "react";

export default function QuantitySelector() {
  const [qty, setQty] =
    useState(1);

  return (
    <div className="flex items-center gap-4 border rounded-2xl w-fit p-2">

      <button
        onClick={() =>
          setQty(
            Math.max(
              1,
              qty - 1
            )
          )
        }
        className="w-11 h-11 rounded-xl bg-slate-100"
      >
        -
      </button>

      <span className="font-bold text-lg min-w-[30px] text-center">
        {qty}
      </span>

      <button
        onClick={() =>
          setQty(qty + 1)
        }
        className="w-11 h-11 rounded-xl bg-slate-100"
      >
        +
      </button>

    </div>
  );
}