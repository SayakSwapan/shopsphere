"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  Loader2,
  MessageSquare,
} from "lucide-react";

interface ContactSettings {
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  business_hours: string;
}

const FALLBACK_SETTINGS: ContactSettings = {
  contact_email: "support@shopsphere.com",
  contact_phone: "+91 98765 43210",
  contact_address: "Mumbai, Maharashtra, India",
  business_hours: "Monday - Friday|9:00 AM - 6:00 PM\nSaturday|10:00 AM - 4:00 PM\nSunday|Closed",
};

function parseBusinessHours(raw: string): { day: string; hours: string }[] {
  if (!raw) return [];
  const lines = raw.split("|");
  const pairs: { day: string; hours: string }[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    const day = lines[i]?.trim();
    const hours = lines[i + 1]?.trim();
    if (day && hours) {
      pairs.push({ day, hours });
    }
  }
  return pairs;
}

export default function ContactForm() {
  const [settings, setSettings] = useState<ContactSettings>(FALLBACK_SETTINGS);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings({
          contact_email: data.contact_email || FALLBACK_SETTINGS.contact_email,
          contact_phone: data.contact_phone || FALLBACK_SETTINGS.contact_phone,
          contact_address: data.contact_address || FALLBACK_SETTINGS.contact_address,
          business_hours: data.business_hours || FALLBACK_SETTINGS.business_hours,
        });
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        return;
      }

      setSuccess(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (success) {
    return (
      <div className="py-12 text-center">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center"
          style={{ borderRadius: "var(--t-radius-card)", background: "color-mix(in srgb, var(--t-success) 15%, transparent)" }}
        >
          <CheckCircle size={32} style={{ color: "var(--t-success)" }} />
        </div>
        <h3 className="mt-6 text-xl font-bold text-text-heading">
          Message Sent!
        </h3>
        <p className="mt-3 text-text-muted-1 max-w-sm mx-auto">
          Thank you for reaching out. Our team will review
          your message and get back to you shortly.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 px-6 py-2.5 bg-primary hover:opacity-90 text-sm font-bold transition-colors"
          style={{ borderRadius: "var(--t-radius-button)", color: "var(--t-bg-page)" }}
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Contact Info */}
      <div className="lg:col-span-4 space-y-4">
        <div
          className="border border-border-card bg-bg-card p-5 sm:p-8"
          style={{ borderRadius: "var(--t-radius-card)" }}
        >
          <h2 className="text-lg font-bold text-text-heading mb-6">
            Contact Information
          </h2>
          <div className="space-y-6">
            {[
              {
                icon: Mail,
                label: "Email",
                value: settings.contact_email,
              },
              {
                icon: Phone,
                label: "Phone",
                value: settings.contact_phone,
              },
              {
                icon: MapPin,
                label: "Address",
                value: settings.contact_address,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-4"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center"
                  style={{ borderRadius: "var(--t-radius-card)", background: "color-mix(in srgb, var(--t-primary) 15%, transparent)" }}
                >
                  <item.icon size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-text-muted-2 uppercase tracking-wider">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm text-text-body">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="border border-border-card bg-bg-card p-5 sm:p-8"
          style={{ borderRadius: "var(--t-radius-card)" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare size={20} className="text-primary" />
            <h3 className="text-sm font-bold text-text-heading">
              Business Hours
            </h3>
          </div>
          <div className="space-y-2 text-sm text-text-muted-1">
            {parseBusinessHours(settings.business_hours).map((item) => (
              <div key={item.day} className="flex justify-between">
                <span>{item.day}</span>
                <span className="text-text-body">{item.hours}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="lg:col-span-8">
        <div
          className="border border-border-card bg-bg-card overflow-hidden"
          style={{ borderRadius: "var(--t-radius-card)" }}
        >
          <div className="border-b border-border-subtle px-4 sm:px-8 py-4 sm:py-6 flex items-center gap-3">
            <Send size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-text-heading">
              Send a Message
            </h2>
          </div>

          <div className="p-5 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    required
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Message *</label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us more about your inquiry..."
                  className="textarea"
                />
              </div>

              {error && (
                <p
                  className="text-sm px-4 py-2.5"
                  style={{ borderRadius: "var(--t-radius-input)", color: "var(--t-danger)", background: "color-mix(in srgb, var(--t-danger) 10%, transparent)" }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="primary-btn flex items-center gap-2 px-8 py-3.5 font-bold text-sm"
                style={{ borderRadius: "var(--t-radius-button)", color: "var(--t-bg-page)" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
