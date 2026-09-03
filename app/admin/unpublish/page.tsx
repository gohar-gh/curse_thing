import { UnpublishForm } from "./UnpublishForm";

export const metadata = { title: "Admin — Unpublish certificate", robots: { index: false, follow: false } };

export default function AdminUnpublishPage() {
  return (
    <div className="min-h-screen bg-white text-black p-8 font-sans">
      <div className="max-w-sm mx-auto pt-16">
        <h1 className="text-lg font-semibold mb-1">Unpublish a certificate</h1>
        <p className="text-sm text-gray-500 mb-6">
          Removes a certificate from public view. Does not delete the underlying record.
        </p>
        <UnpublishForm />
      </div>
    </div>
  );
}
