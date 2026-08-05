import NavbarWrapper from "@/components/store/layout/navbar-wrapper";
import Footer from "@/components/store/layout/footer";

import AddressForm from "@/components/store/address/address-form";

export default function NewAddressPage() {
  return (
    <div className="bg-bg-page min-h-screen">

      <NavbarWrapper />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-10 text-text-heading">
          Add New Address
        </h1>

        <AddressForm />

      </div>

      <Footer />

    </div>
  );
}