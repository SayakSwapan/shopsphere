"use client";

import {
  useEffect,
  useState,
} from "react";

interface Product {
  id: string;

  name: string;
}

interface Gender {
  id: string;

  name: string;
}

interface Size {
  id: string;

  sizeName: string;

  genderId: string;
}

interface Props {
  initialData?: {
    id: string;

    productId: string;

    genderId: string;

    sizeId: string;

    stock: string;

    sku: string;
  };
}

export default function VariantForm({ initialData }: Props) {
  const [
    products,
    setProducts,
  ] = useState<
    Product[]
  >([]);

  const [
    genders,
    setGenders,
  ] = useState<
    Gender[]
  >([]);

  const [sizes, setSizes] =
    useState<Size[]>(
      []
    );



  const [
  formData,
  setFormData,
] = useState({
  productId:
    initialData?.productId ||
    "",

  genderId:
    initialData?.genderId ||
    "",

  sizeId:
    initialData?.sizeId ||
    "",

  stock:
    initialData?.stock ||
    "",

  sku:
    initialData?.sku ||
    "",
});
  const filteredSizes =
  sizes.filter(
    (size) =>
      size.genderId ===
      formData.genderId
  );

  useEffect(() => {
    const fetchProducts =
    async () => {
      const response =
        await fetch(
          "/api/products"
        );

      const data =
        await response.json();

      setProducts(
        data.products
      );
    };

  const fetchGenders =
    async () => {
      const response =
        await fetch(
          "/api/genders"
        );

      const data =
        await response.json();

      setGenders(
        data.genders
      );
    };

  const fetchSizes =
    async () => {
      const response =
        await fetch(
          "/api/sizes"
        );

      const data =
        await response.json();

      setSizes(data.sizes);
    };
    fetchProducts();

    fetchGenders();

    fetchSizes();
  }, []);

  

  

  const handleSubmit =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      const response =
        await fetch(
          initialData
  ? `/api/product-variants/${initialData.id}`
  : "/api/product-variants",
          {
            method: initialData ? "PUT" : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              formData
            ),
          }
        );

      const data =
        await response.json();

      if (
        data.success
      ) {
        alert(
          initialData
            ? "Variant updated"
            : "Variant created"
        );
      }
    };

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-6"
    >
      <select
        value={
          formData.productId
        }
        onChange={(e) =>
          setFormData({
            ...formData,

            productId:
              e.target.value,
          })
        }
        className="w-full border rounded-lg p-3"
      >
        <option value="">
          Select Product
        </option>

        {products.map(
          (product) => (
            <option
              key={
                product.id
              }
              value={
                product.id
              }
            >
              {product.name}
            </option>
          )
        )}
      </select>

      <select
        value={
          formData.genderId
        }
        onChange={(e) =>
          setFormData({
            ...formData,

            genderId:
              e.target.value,
          })
        }
        className="w-full border rounded-lg p-3"
      >
        <option value="">
          Select Gender
        </option>

        {genders.map(
          (gender) => (
            <option
              key={
                gender.id
              }
              value={
                gender.id
              }
            >
              {gender.name}
            </option>
          )
        )}
      </select>

      <select
        value={
          formData.sizeId
        }
        onChange={(e) =>
          setFormData({
            ...formData,

            sizeId:
              e.target.value,
          })
        }
        className="w-full border rounded-lg p-3"
      >
        <option value="">
          Select Size
        </option>

        {filteredSizes.map(
          (size) => (
            <option
              key={size.id}
              value={size.id}
            >
              {
                size.sizeName
              }
            </option>
          )
        )}
      </select>

      <input
        placeholder="Stock"
        value={
          formData.stock
        }
        onChange={(e) =>
          setFormData({
            ...formData,

            stock:
              e.target.value,
          })
        }
        className="w-full border rounded-lg p-3"
      />

      <input
        placeholder="SKU"
        value={
          formData.sku
        }
        onChange={(e) =>
          setFormData({
            ...formData,

            sku: e.target.value,
          })
        }
        className="w-full border rounded-lg p-3"
      />

      <button className="bg-black text-white px-5 py-3 rounded-xl">
        {initialData ? "Update Variant" : "Create Variant"}
      </button>
    </form>
  );
}