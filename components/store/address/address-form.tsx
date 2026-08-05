"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const AddressMap = dynamic(
  () => import("@/components/store/address/address-map"),
  {
    ssr: false,
  }
);

export default function AddressForm() {
  const [lat, setLat] =
    useState<number | null>(null);

  const [lng, setLng] =
    useState<number | null>(null);

  const [fullName, setFullName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [
    addressLine1,
    setAddressLine1,
  ] = useState("");

  const [
    addressLine2,
    setAddressLine2,
  ] = useState("");

  const [city, setCity] =
    useState("");

  const [
    stateName,
    setStateName,
  ] = useState("");

  const [pincode, setPincode] =
    useState("");

  return (
    <div className="space-y-8">

      <div className="bg-bg-card border border-border-card p-8" style={{ borderRadius: "var(--t-radius-card)" }}>

        <h2 className="text-2xl font-black mb-6 text-text-heading">
          Address Details
        </h2>

        <div className="grid md:grid-cols-2 gap-5">

          <input
            value={fullName}
            onChange={(e) =>
              setFullName(
                e.target.value
              )
            }
            placeholder="Full Name"
            className="border border-border-card p-4 bg-bg-card-nested text-text-heading placeholder:text-text-muted-2 outline-none focus:border-primary"
            style={{ borderRadius: "var(--t-radius-input)" }}
          />

          <input
            value={phone}
            onChange={(e) =>
              setPhone(
                e.target.value
              )
            }
            placeholder="Phone Number"
            className="border border-border-card p-4 bg-bg-card-nested text-text-heading placeholder:text-text-muted-2 outline-none focus:border-primary"
            style={{ borderRadius: "var(--t-radius-input)" }}
          />

          <input
            value={addressLine1}
            onChange={(e) =>
              setAddressLine1(
                e.target.value
              )
            }
            placeholder="Address Line 1"
            className="border border-border-card p-4 bg-bg-card-nested text-text-heading placeholder:text-text-muted-2 outline-none focus:border-primary md:col-span-2"
            style={{ borderRadius: "var(--t-radius-input)" }}
          />

          <input
            value={addressLine2}
            onChange={(e) =>
              setAddressLine2(
                e.target.value
              )
            }
            placeholder="Address Line 2"
            className="border border-border-card p-4 bg-bg-card-nested text-text-heading placeholder:text-text-muted-2 outline-none focus:border-primary md:col-span-2"
            style={{ borderRadius: "var(--t-radius-input)" }}
          />

          <input
            value={city}
            onChange={(e) =>
              setCity(
                e.target.value
              )
            }
            placeholder="City"
            className="border border-border-card p-4 bg-bg-card-nested text-text-heading placeholder:text-text-muted-2 outline-none focus:border-primary"
            style={{ borderRadius: "var(--t-radius-input)" }}
          />

          <input
            value={stateName}
            onChange={(e) =>
              setStateName(
                e.target.value
              )
            }
            placeholder="State"
            className="border border-border-card p-4 bg-bg-card-nested text-text-heading placeholder:text-text-muted-2 outline-none focus:border-primary"
            style={{ borderRadius: "var(--t-radius-input)" }}
          />

          <input
            value={pincode}
            onChange={(e) =>
              setPincode(
                e.target.value
              )
            }
            placeholder="Pincode"
            className="border border-border-card p-4 bg-bg-card-nested text-text-heading placeholder:text-text-muted-2 outline-none focus:border-primary"
            style={{ borderRadius: "var(--t-radius-input)" }}
          />

        </div>

      </div>

      <div className="bg-bg-card border border-border-card p-8" style={{ borderRadius: "var(--t-radius-card)" }}>

        <h2 className="text-2xl font-black mb-6 text-text-heading">
          Select Location On Map
        </h2>

        <AddressMap
          setLat={setLat}
          setLng={setLng}
          setAddressLine1={
            setAddressLine1
          }
          setCity={setCity}
          setStateName={
            setStateName
          }
          setPincode={
            setPincode
          }
        />

        <div className="mt-6 text-sm text-text-muted-1">

          <div>
            Latitude:
            {" "}
            {lat ?? "-"}
          </div>

          <div>
            Longitude:
            {" "}
            {lng ?? "-"}
          </div>

        </div>

      </div>

      <button
        className="
        bg-primary
        text-bg-page
        px-8
        py-5
        font-black
        uppercase
        "
        style={{ fontFamily: "var(--t-font-heading)", borderRadius: "var(--t-radius-button)" }}
      >
        Save Address
      </button>

    </div>
  );
}