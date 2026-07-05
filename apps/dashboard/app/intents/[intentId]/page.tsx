import type { DepositIntent } from "../../../lib/flarerail-api";

export const dynamic = "force-dynamic";

export default async function IntentDetailPage(props: {
  params: Promise<{ intentId: string }>;
}) {
  const params = await props.params;
  const { intentId } = params;
  let intent: DepositIntent | null = null;
  let error: string | null = null;

  try {
    const { getDepositIntent } = await import("../../../lib/flarerail-api");
    intent = await getDepositIntent(intentId);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load deposit intent";
  }

  if (error) {
    return (
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1rem" }}>
        <h1>Deposit Intent</h1>
        <div
          style={{
            background: "#fff3f3",
            border: "1px solid #ffcccc",
            borderRadius: "8px",
            padding: "1.5rem",
            marginTop: "1rem",
            color: "#cc0000",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
        <p style={{ marginTop: "1rem" }}>
          <a href="/intents" style={{ color: "#0066cc" }}>
            &larr; Back to intents
          </a>
        </p>
      </main>
    );
  }

  if (!intent) {
    return (
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1rem" }}>
        <h1>Deposit Intent</h1>
        <p>Intent not found.</p>
        <p>
          <a href="/intents" style={{ color: "#0066cc" }}>
            &larr; Back to intents
          </a>
        </p>
      </main>
    );
  }

  const statusColors: Record<string, { bg: string; color: string }> = {
    awaiting_user_action: { bg: "#fff3cd", color: "#856404" },
    observed: { bg: "#cce5ff", color: "#004085" },
    activating: { bg: "#d6d8db", color: "#383d41" },
    active_position_created: { bg: "#d4edda", color: "#155724" },
    expired: { bg: "#f8d7da", color: "#721c24" },
    failed: { bg: "#f8d7da", color: "#721c24" },
    cancelled: { bg: "#f8f9fa", color: "#383d41" },
  };

  const statusStyle = statusColors[intent.status] ?? { bg: "#f8f9fa", color: "#383d41" };

  return (
    <main style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1rem" }}>
      <p style={{ marginBottom: "1rem" }}>
        <a href="/intents" style={{ color: "#0066cc" }}>
          &larr; Back to intents
        </a>
      </p>

      <h1>Deposit Intent Details</h1>

      <div
        style={{
          background: "white",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          padding: "1.5rem",
          marginTop: "1rem",
        }}
      >
        {/* Status Badge */}
        <div style={{ marginBottom: "1.5rem" }}>
          <span
            style={{
              display: "inline-block",
              padding: "0.3rem 0.75rem",
              borderRadius: "12px",
              fontSize: "0.9rem",
              fontWeight: 600,
              background: statusStyle.bg,
              color: statusStyle.color,
            }}
          >
            {intent.status}
          </span>
        </div>

        {/* Details Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            gap: "0.75rem",
            fontSize: "0.95rem",
          }}
        >
          <div style={{ color: "#666", fontWeight: 500 }}>ID</div>
          <div style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{intent.id}</div>

          <div style={{ color: "#666", fontWeight: 500 }}>Trace ID</div>
          <div style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
            {intent.traceId ?? "N/A"}
          </div>

          <div style={{ color: "#666", fontWeight: 500 }}>Status</div>
          <div>{intent.status}</div>

          <div style={{ color: "#666", fontWeight: 500 }}>User Message</div>
          <div>{intent.userMessage ?? "N/A"}</div>

          <div style={{ color: "#666", fontWeight: 500 }}>Created</div>
          <div>
            {intent.createdAt ? new Date(intent.createdAt).toLocaleString() : "N/A"}
          </div>

          <div style={{ color: "#666", fontWeight: 500 }}>Updated</div>
          <div>
            {intent.updatedAt ? new Date(intent.updatedAt).toLocaleString() : "N/A"}
          </div>
        </div>
      </div>

      {/* User Instructions */}
      {intent.userInstructions && intent.userInstructions.length > 0 && (
        <div
          style={{
            background: "white",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "1.5rem",
            marginTop: "1rem",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
            User Instructions
          </h2>
          {intent.userInstructions.map((instruction, i) => (
            <div
              key={i}
              style={{
                padding: "0.75rem",
                background: "#f8f9fa",
                borderRadius: "6px",
                marginBottom: "0.5rem",
              }}
            >
              <div style={{ fontWeight: 600 }}>{instruction.title}</div>
              <div style={{ marginTop: "0.25rem", color: "#555" }}>
                {instruction.description}
              </div>
              {instruction.expiresAt && (
                <div style={{ marginTop: "0.25rem", fontSize: "0.85rem", color: "#999" }}>
                  Expires: {new Date(instruction.expiresAt).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* External References */}
      {intent.externalReferences && intent.externalReferences.length > 0 && (
        <div
          style={{
            background: "white",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "1.5rem",
            marginTop: "1rem",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
            External References
          </h2>
          {intent.externalReferences.map((ref, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.5rem 0",
                borderBottom:
                  i < intent.externalReferences.length - 1 ? "1px solid #eee" : "none",
              }}
            >
              <span style={{ color: "#666" }}>{ref.type}</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                {ref.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Position Summary */}
      {intent.position && (
        <div
          style={{
            background: "#d4edda",
            border: "1px solid #c3e6cb",
            borderRadius: "8px",
            padding: "1.5rem",
            marginTop: "1rem",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "#155724" }}>
            Active Position
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "180px 1fr",
              gap: "0.5rem",
              fontSize: "0.95rem",
            }}
          >
            <div style={{ color: "#155724", fontWeight: 500 }}>Position ID</div>
            <div style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
              {intent.position.id}
            </div>

            <div style={{ color: "#155724", fontWeight: 500 }}>Status</div>
            <div>{intent.position.status}</div>

            <div style={{ color: "#155724", fontWeight: 500 }}>Strategy</div>
            <div>{intent.position.strategyCode}</div>

            <div style={{ color: "#155724", fontWeight: 500 }}>Active Amount</div>
            <div>{intent.position.activeAmount}</div>
          </div>
        </div>
      )}
    </main>
  );
}
