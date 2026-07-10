import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

interface Listing {
  id: string;
  tutorName: string;
  subject: string;
  hourlyRate: number;
  availableSlot: string;
  description: string;
  createdAt: string;
}

interface SupabaseRow {
  id: string;
  tutor_name: string;
  subject: string;
  hourly_rate: number;
  available_slot: string;
  description: string;
  created_at: string;
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Zero-config fallback store. Lives for the lifetime of the server process.
const memoryStore: Listing[] = [];

function supabaseHeaders(): Record<string, string> {
  return {
    apikey: SUPABASE_ANON_KEY as string,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

function rowToListing(row: SupabaseRow): Listing {
  return {
    id: row.id,
    tutorName: row.tutor_name,
    subject: row.subject,
    hourlyRate: row.hourly_rate,
    availableSlot: row.available_slot,
    description: row.description,
    createdAt: row.created_at,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function GET() {
  try {
    if (useSupabase) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/listings?select=*&order=created_at.desc`,
        { headers: supabaseHeaders(), cache: "no-store" }
      );
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
          { error: `Supabase error: ${text}` },
          { status: 500 }
        );
      }
      const rows = (await res.json()) as SupabaseRow[];
      return NextResponse.json({ listings: rows.map(rowToListing) });
    }

    const sorted = [...memoryStore].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return NextResponse.json({ listings: sorted });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const tutorName =
      typeof body.tutorName === "string" ? body.tutorName.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const availableSlot =
      typeof body.availableSlot === "string" ? body.availableSlot.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const hourlyRate = Number(body.hourlyRate);

    if (
      !tutorName ||
      !subject ||
      !availableSlot ||
      !Number.isFinite(hourlyRate) ||
      hourlyRate <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Please add your name, subject, rate, and an available slot.",
        },
        { status: 400 }
      );
    }

    if (useSupabase) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/listings`, {
        method: "POST",
        headers: { ...supabaseHeaders(), Prefer: "return=representation" },
        body: JSON.stringify({
          tutor_name: tutorName,
          subject,
          hourly_rate: hourlyRate,
          available_slot: availableSlot,
          description,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
          { error: `Supabase error: ${text}` },
          { status: 500 }
        );
      }
      const rows = (await res.json()) as SupabaseRow[];
      return NextResponse.json(
        { listing: rowToListing(rows[0]) },
        { status: 201 }
      );
    }

    const listing: Listing = {
      id: randomUUID(),
      tutorName,
      subject,
      hourlyRate,
      availableSlot,
      description,
      createdAt: new Date().toISOString(),
    };
    memoryStore.push(listing);
    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing listing id." },
        { status: 400 }
      );
    }

    if (useSupabase) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/listings?id=eq.${id}`,
        { method: "DELETE", headers: supabaseHeaders() }
      );
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
          { error: `Supabase error: ${text}` },
          { status: 500 }
        );
      }
      return NextResponse.json({ ok: true });
    }

    const index = memoryStore.findIndex((item) => item.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    memoryStore.splice(index, 1);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
