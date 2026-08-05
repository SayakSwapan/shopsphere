"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";

import { useState } from "react";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface AddressMapProps {
  setLat: (
    lat: number
  ) => void;

  setLng: (
    lng: number
  ) => void;

  setAddressLine1: (
    value: string
  ) => void;

  setCity: (
    value: string
  ) => void;

  setStateName: (
    value: string
  ) => void;

  setPincode: (
    value: string
  ) => void;
}

function LocationMarker({
  setLat,
  setLng,
  setAddressLine1,
  setCity,
  setStateName,
  setPincode,
}: AddressMapProps) {
  const [position, setPosition] =
    useState<L.LatLng | null>(null);

  useMapEvents({
    async click(e) {
      setPosition(
        e.latlng
      );

      setLat(
        e.latlng.lat
      );

      setLng(
        e.latlng.lng
      );

      try {
        const response =
          await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`
          );

        const data =
          await response.json();

        const address =
          data.address || {};

        setAddressLine1(
          data.display_name ||
            ""
        );

        setCity(
          address.city ||
            address.town ||
            address.village ||
            ""
        );

        setStateName(
          address.state ||
            ""
        );

        setPincode(
          address.postcode ||
            ""
        );
      } catch (
        error
      ) {
        console.log(
          error
        );
      }
    },
  });

  return position ? (
    <Marker
      position={
        position
      }
    />
  ) : null;
}

export default function AddressMap({
  setLat,
  setLng,
  setAddressLine1,
  setCity,
  setStateName,
  setPincode,
}: AddressMapProps) {
  return (
    <MapContainer
      center={[
        22.5726,
        88.3639,
      ]}
      zoom={12}
      style={{
        width: "100%",
        height: "500px",
      }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <LocationMarker
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
    </MapContainer>
  );
}