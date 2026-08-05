"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Trash2,
} from "lucide-react";

interface Gender {
  id: string;

  name: string;

  isActive: boolean;
}

interface Size {
  
  id: string;

  name: string;

  genderId: string;

  sizeNumber: string;
  sizeName: string;

  sizeUnit: string;
  sizeCode: string;

  unit: string;

  isActive: boolean;
}

export interface Variant {
  genderId: string;

  sizeId: string;

  sku: string;

  stock: number;
}

interface Props {
  variants: Variant[];

  setVariants: (
    variants: Variant[]
  ) => void;

  totalStock: number;
}

export default function VariantSection({
  variants,
  setVariants,
  totalStock,
}: Props) {
  const [genders, setGenders] =
    useState<Gender[]>(
      []
    );

  const [sizes, setSizes] =
    useState<Size[]>(
      []
    );

  useEffect(() => {
    async function fetchMasters() {
      try {
        const [
          genderRes,
          sizeRes,
        ] = await Promise.all([
          fetch(
            "/api/genders"
          ),

          fetch(
            "/api/sizes"
          ),
        ]);

        const genderData =
          await genderRes.json();

        const sizeData =
          await sizeRes.json();

        setGenders(
          (genderData.genders || []).filter(
            (gender: Gender) =>
              gender.isActive
          )
        );

        setSizes(
          (sizeData.sizes || []).filter(
            (size: Size) =>
              size.isActive
          )
        );
      } catch (
      error
      ) {
        console.log(error);
      }
    }
    fetchMasters();
  }, []);



  function addVariant() {
    setVariants([
      ...variants,

      {
        genderId: "",

        sizeId: "",

        sku: "",

        stock: 0,
      },
    ]);
  }

  function removeVariant(
    index: number
  ) {
    const updated =
      variants.filter(
        (_, i) =>
          i !== index
      );

    setVariants(updated);
  }

  function updateVariant(
    index: number,
    key: keyof Variant,
    value:
      | string
      | number
  ) {
    const updated =
      [...variants];

    updated[index] = {
      ...updated[index],

      [key]: value,
    };

    /*
      RESET SIZE IF GENDER CHANGED
    */

    if (
      key ===
      "genderId"
    ) {
      updated[index]
        .sizeId = "";
    }

    /*
      INVENTORY VALIDATION
    */

    const totalVariantStock =
      updated.reduce(
        (
          total,
          variant
        ) =>
          total +
          Number(
            variant.stock
          ),
        0
      );

    if (
      totalVariantStock >
      totalStock &&
      key === "stock"
    ) {
      alert(
        `Total variant stock cannot exceed main stock (${totalStock})`
      );

      return;
    }

    setVariants(updated);
  }

  /*
    TOTAL USED STOCK
  */

  const usedStock =
    useMemo(() => {
      return variants.reduce(
        (
          total,
          variant
        ) =>
          total +
          Number(
            variant.stock
          ),
        0
      );
    }, [variants]);

  return (
    <div className="space-y-5">
      {/* HEADER */}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Product Variants
          </h2>

          <p className="text-slate-500 mt-1">
            Add sizes based on selected genders
          </p>
        </div>

        <button
          type="button"
          onClick={
            addVariant
          }
          className="bg-black text-white px-5 py-3 rounded-2xl flex items-center gap-2"
        >
          <Plus size={18} />

          Add Variant
        </button>
      </div>

      {/* STOCK STATUS */}

      <div className="bg-slate-50 border rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            Total Product Stock
          </p>

          <h3 className="text-2xl font-bold">
            {totalStock}
          </h3>
        </div>

        <div>
          <p className="text-sm text-slate-500">
            Variant Used Stock
          </p>

          <h3 className="text-2xl font-bold">
            {usedStock}
          </h3>
        </div>

        <div>
          <p className="text-sm text-slate-500">
            Remaining Stock
          </p>

          <h3 className="text-2xl font-bold">
            {totalStock -
              usedStock}
          </h3>
        </div>
      </div>

      {/* VARIANTS */}

      <div className="space-y-4">
        {variants.map(
          (
            variant,
            index
          ) => {
            /*
              DYNAMIC SIZE FILTER
            */

            const filteredSizes =
              sizes.filter(
                (size) =>
                  String(
                    size.genderId
                  ).trim() ===
                  String(
                    variant.genderId
                  ).trim() &&
                  size.isActive
              );
console.log(filteredSizes);
            return (
              <div
                key={index}
                className="border rounded-3xl p-5 bg-slate-50 grid grid-cols-1 md:grid-cols-4 gap-4"
              >
                {/* GENDER */}

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Gender
                  </label>

                  <select
                    value={
                      variant.genderId
                    }
                    onChange={(
                      e
                    ) =>
                      updateVariant(
                        index,
                        "genderId",
                        e.target
                          .value
                      )
                    }
                    className="w-full border rounded-2xl p-3 bg-white"
                  >
                    <option value="">
                      Select Gender
                    </option>

                    {genders.map(
                      (
                        gender
                      ) => (
                        <option
                          key={
                            gender.id
                          }
                          value={
                            gender.id
                          }
                        >
                          {
                            gender.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* SIZE */}

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Size
                  </label>

                  <select
                    value={variant.sizeId}
                    disabled={!variant.genderId}
                    onChange={(e) =>
                      updateVariant(
                        index,
                        "sizeId",
                        e.target.value
                      )
                    }
                    className="w-full border rounded-2xl p-3 bg-white disabled:bg-slate-100"
                  >
                    <option value="">
                      {variant.genderId
                        ? "Select Size"
                        : "Select Gender First"}
                    </option>

                    {filteredSizes.map(
                      (size) => (
                       <option
                          key={size.id}
                          value={size.id}
                        >
                          {size.sizeName}
                          {" • "}
                          {size.sizeCode}
                          {size.sizeUnit}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* SKU */}

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    SKU
                  </label>

                  <input
                    type="text"
                    value={
                      variant.sku
                    }
                    onChange={(
                      e
                    ) =>
                      updateVariant(
                        index,
                        "sku",
                        e.target
                          .value
                      )
                    }
                    placeholder="SKU"
                    className="w-full border rounded-2xl p-3"
                  />
                </div>

                {/* STOCK */}

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Stock
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={
                        variant.stock
                      }
                      onChange={(
                        e
                      ) =>
                        updateVariant(
                          index,
                          "stock",
                          Number(
                            e
                              .target
                              .value
                          )
                        )
                      }
                      placeholder="Stock"
                      className="w-full border rounded-2xl p-3"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeVariant(
                          index
                        )
                      }
                      className="bg-red-500 text-white px-4 rounded-2xl"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}