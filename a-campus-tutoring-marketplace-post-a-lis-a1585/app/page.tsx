"use client";

import { FormEvent, useEffect, useState } from "react";

interface Listing {
  id: string;
  tutorName: string;
  subject: string;
  hourlyRate: number;
  availableSlot: string;
  description: string;
  createdAt: string;
}

interface FormState {
  tutorName: string;
  subject: string;
  hourlyRate: string;
  availableSlot: string;
  description: string;
}

const emptyForm: FormState = {
  tutorName: "",
  subject: "",
  hourlyRate: "",
  availableSlot: "",
  description: "",
};

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  async function fetchListings() {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/items", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Couldn't load listings.");
      }
      setListings(data.listings as Listing[]);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Couldn't load listings."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchListings();
  }, []);

  function handleChange(
    field: keyof FormState
  ): (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const hourlyRate = Number(form.hourlyRate);
    if (
      !form.tutorName.trim() ||
      !form.subject.trim() ||
      !form.availableSlot.trim() ||
      !Number.isFinite(hourlyRate) ||
      hourlyRate <= 0
    ) {
      setFormError(
        "Add your name, subject, an hourly rate, and an available slot."
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorName: form.tutorName.trim(),
          subject: form.subject.trim(),
          hourlyRate,
          availableSlot: form.availableSlot.trim(),
          description: form.description.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Couldn't post your listing.");
      }
      setListings((prev) => [data.listing as Listing, ...prev]);
      setForm(emptyForm);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Couldn't post your listing."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBook(id: string) {
    setBookingError(null);
    setBookingId(id);
    try {
      const res = await fetch(`/api/items?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Couldn't book that slot.");
      }
      setListings((prev) => prev.filter((listing) => listing.id !== id));
    } catch (error) {
      setBookingError(
        error instanceof Error ? error.message : "Couldn't book that slot."
      );
    } finally {
      setBookingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <header className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Campus marketplace
          </p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-4xl">
            Find your next study session
          </h1>
          <p className="text-base leading-7 text-zinc-600">
            Post a listing if you tutor, or grab an open slot from a fellow
            student. No fees, no faculty gatekeeping — just people helping
            people pass their classes.
          </p>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[360px_1fr] lg:items-start">
          <section className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Post a listing
              </h2>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Share what you can teach, your rate, and when you&apos;re
                free.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label
                  htmlFor="tutorName"
                  className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
                >
                  Your name
                </label>
                <input
                  id="tutorName"
                  name="tutorName"
                  type="text"
                  autoComplete="name"
                  placeholder="Priya Sharma"
                  value={form.tutorName}
                  onChange={handleChange("tutorName")}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="subject"
                  className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
                >
                  Subject
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="Organic Chemistry"
                  value={form.subject}
                  onChange={handleChange("subject")}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="hourlyRate"
                  className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
                >
                  Rate ($ / hour)
                </label>
                <input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="25"
                  value={form.hourlyRate}
                  onChange={handleChange("hourlyRate")}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="availableSlot"
                  className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
                >
                  Available slot
                </label>
                <input
                  id="availableSlot"
                  name="availableSlot"
                  type="text"
                  placeholder="Tue 4–5pm, Library rm 210"
                  value={form.availableSlot}
                  onChange={handleChange("availableSlot")}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="description"
                  className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
                >
                  A note for students (optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Third-year Chem major, TA'd for CHEM 201 last spring."
                  value={form.description}
                  onChange={handleChange("description")}
                  className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600" role="alert">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition duration-150 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Posting…" : "Post listing"}
              </button>
            </form>
          </section>

          <section className="space-y-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">
                Open slots
              </h2>
              {!loading && !loadError && (
                <span className="text-sm text-zinc-500">
                  {listings.length}{" "}
                  {listings.length === 1 ? "listing" : "listings"}
                </span>
              )}
            </div>

            {bookingError && (
              <div
                className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                role="alert"
              >
                {bookingError}
              </div>
            )}

            {loading && (
              <div
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                role="status"
                aria-live="polite"
              >
                <span className="sr-only">Loading nearby tutoring slots…</span>
                {[0, 1, 2, 3].map((key) => (
                  <div
                    key={key}
                    aria-hidden="true"
                    className="h-44 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100"
                  />
                ))}
              </div>
            )}

            {!loading && loadError && (
              <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <span>{loadError}</span>
                <button
                  type="button"
                  onClick={fetchListings}
                  className="font-semibold underline underline-offset-2 transition duration-150 hover:text-red-800"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !loadError && listings.length === 0 && (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
                <p className="text-base font-semibold text-zinc-900">
                  No open slots right now
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                  Be the first to post one — tutors usually get booked within
                  a day.
                </p>
              </div>
            )}

            {!loading && !loadError && listings.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {listings.map((listing) => (
                  <article
                    key={listing.id}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-6 transition duration-150 hover:shadow-md"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                          {listing.subject}
                        </span>
                        <span className="text-sm font-semibold text-zinc-900">
                          ${listing.hourlyRate}/hr
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-semibold text-zinc-900">
                          {listing.tutorName}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-500">
                          {listing.availableSlot}
                        </p>
                      </div>

                      {listing.description && (
                        <p className="text-sm leading-6 text-zinc-600">
                          {listing.description}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBook(listing.id)}
                      disabled={bookingId === listing.id}
                      className="w-full rounded-lg border border-zinc-200 py-2 text-sm font-semibold text-zinc-900 transition duration-150 hover:border-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {bookingId === listing.id
                        ? "Booking…"
                        : "Book this slot"}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
