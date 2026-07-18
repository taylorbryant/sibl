export default function NotFound() {
  return (
    <main
      style={{
        display: "grid",
        minHeight: "100vh",
        placeItems: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div>
        <p style={{ color: "#6658d3", fontWeight: 700 }}>404</p>
        <h1>That page is not in the manifest.</h1>
        <a href="/docs">Return to the documentation</a>
      </div>
    </main>
  );
}
