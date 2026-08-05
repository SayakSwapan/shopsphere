"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  sizeSchema,
} from "@/lib/validations/size.validation";

import {
  SIZE_UNITS,
} from "@/lib/constants/size-units";
import { z } from "zod";

import {
  useRouter,
} from "next/navigation";

import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";

type FormData = z.infer<
  typeof sizeSchema
>;

interface Props {
  initialData?: {
    id: string;

    genderId: string;

    sizeName: string;

    sizeCode: string;

    sizeUnit: string;

    isActive: boolean;
  };
}

interface Gender {
  id: string;

  name: string;
}

export default function SizeForm({
  initialData,
}: Props) {
  const router =
    useRouter();

  const [
    genders,
    setGenders,
  ] = useState<
    Gender[]
  >([]);

  const {
    register,
    handleSubmit,
  } = useForm<FormData>({
    resolver:
      zodResolver(
        sizeSchema
      ),

    defaultValues: {
      genderId:
        initialData?.genderId ||
        "",

      sizeName:
        initialData?.sizeName ||
        "",

      sizeCode:
        initialData?.sizeCode ||
        "",

      sizeUnit:
        initialData?.sizeUnit ||
        "",

      isActive:
        initialData?.isActive ??
        true,
    },
  });

  useEffect(() => {
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

    fetchGenders();
  }, []);

  const onSubmit =
    async (
      values: FormData
    ) => {
      try {
        const url =
          initialData
            ? `/api/sizes/${initialData.id}`
            : "/api/sizes";

        const method =
          initialData
            ? "PUT"
            : "POST";

        const response =
          await fetch(url, {
            method,

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              values
            ),
          });

        const data =
          await response.json();

        if (!data.success) {
          toast.error(
            "Failed"
          );

          return;
        }

        toast.success(
          initialData
            ? "Updated"
            : "Created"
        );

        router.push(
          "/admin/masters/sizes"
        );

        router.refresh();
      } catch {
        toast.error(
          "Something went wrong"
        );
      }
    };

  return (
    <form
      onSubmit={handleSubmit(
        onSubmit
      )}
      className="space-y-6"
    >
      <div>
        <label>
          Gender
        </label>

        <select
          {...register(
            "genderId"
          )}
          className="w-full border rounded-lg p-3"
        >
          <option value="">
            Select Gender
          </option>

          {genders.map(
            (gender) => (
              <option
                key={gender.id}
                value={gender.id}
              >
                {gender.name}
              </option>
            )
          )}
        </select>
      </div>

      <div>
        <label>
          Size Name
        </label>

        <input
          {...register(
            "sizeName"
          )}
          className="w-full border rounded-lg p-3"
        />
      </div>

      <div>
        <label>
          Size Code
        </label>

        <input
          {...register(
            "sizeCode"
          )}
          className="w-full border rounded-lg p-3"
        />
      </div>

      <div>
        <label>
          Size Unit
        </label>

        <select
          {...register(
            "sizeUnit"
          )}
          className="w-full border rounded-lg p-3"
        >
          <option value="">
            Select Unit
          </option>

          {SIZE_UNITS.map(
            (unit) => (
              <option
                key={unit}
                value={unit}
              >
                {unit}
              </option>
            )
          )}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register(
            "isActive"
          )}
        />

        <label>
          Active
        </label>
      </div>

      <Button type="submit">
        {initialData
          ? "Update Size"
          : "Create Size"}
      </Button>
    </form>
  );
}