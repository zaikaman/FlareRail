export const dynamic = "force-dynamic";

export default async function IntentsPage() {
  return (
    <main style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Deposit Intents</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        View and manage deposit intents for your wallet users.
      </p>

      <section
        style={{
          background: "#f5f5f5",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
          Look up a Deposit Intent
        </h2>
        <form
          action="/intents/search"
          method="GET"
          style={{ display: "flex", gap: "0.5rem" }}
        >
          <input
            type="text"
            name="id"
            placeholder="Enter deposit intent ID..."
            required
            style={{
              flex: 1,
              padding: "0.5rem 0.75rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "1rem",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0.5rem 1.25rem",
              background: "#0066cc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Search
          </button>
        </form>
      </section>

      <section>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
          Demo Instructions
        </h2>
        <div
          style={{
            background: "#e8f4fd",
            borderRadius: "8px",
            padding: "1.25rem",
            lineHeight: 1.6,
          }}
        >
          <p>
            <strong>No list endpoint yet.</strong> Deposit intents can be
            inspected by ID. Use the search form above or navigate to{" "}
            <code>/intents/{"{intentId}"}</code> directly.
          </p>
          <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
            To create a deposit intent, use the API:
            <br />
            <code
              style={{
                display: "inline-block",
                marginTop: "0.25rem",
                padding: "0.25rem 0.5rem",
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            >
              POST /v1/deposit-intents {`{ quoteId: "..." }`}
            </code>
          </p>
        </div>
      </section>
    </main>
  );
}
