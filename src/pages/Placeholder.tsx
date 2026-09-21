import { Glass } from '../components/ui/Glass';

export function Placeholder({ name }: { name: string }) {
  return (
    <div className="placeholder">
      <Glass className="placeholder-card">
        <span className="eyebrow">MODULE READY</span>
        <h2>{name}</h2>
        <p>The dashboard foundation is connected. This surface is intentionally scaffolded for the next intelligence module.</p>
      </Glass>
    </div>
  );
}
