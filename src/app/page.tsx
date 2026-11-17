import Chat from "../components/Chat";

export default function HomePage() {
  return (
    <main className="shell">
      <header className="brand-bar">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ghost.svg" alt="" width={52} height={52} />
          <div>
            <h1>GhostGPT</h1>
            <p>ghostgpt.live · Fireworks gpt-oss-120b</p>
          </div>
        </div>
        <div className="pill">Nano · Pro · Ultra ready</div>
      </header>
      <Chat />
    </main>
  );
}
