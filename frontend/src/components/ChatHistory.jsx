import logo from "../assets/ailo-logo.png";

export default function ChatHistory({ onBack }) {
  return (
    <section className="history-page">
      <div className="glass history-hero">
        <div className="history-hero__text">
          <img src={logo} alt="Ailo" className="history-logo" />
          <div>
            <p className="eyebrow">Chat history</p>
            <h1>Your past conversations, ready to revisit.</h1>
            <p className="muted">
              Pick a thread to reopen. Previous chat history will appear here.
            </p>
          </div>
        </div>
        <div className="history-hero__actions">
          <button className="btn btn-outline" type="button" onClick={onBack}>
            ← Back to chat
          </button>
        </div>
      </div>

      <div className="history-list" role="list">
        <article className="glass history-card history-card--empty" role="listitem">
          <div className="history-card__titles">
            <p className="eyebrow">Coming soon</p>
            <h3>Previous chat history will appear here.</h3>
          </div>
          <p className="history-card__preview">
            Once history is available, you’ll see your past conversations listed in this view.
          </p>
        </article>
      </div>
    </section>
  );
}
