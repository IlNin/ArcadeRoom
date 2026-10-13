import type { Difficulty } from '../core/difficulty';

export interface TickerRecord {
  difficulty: Difficulty;
  label: string;
  value: number;
}

interface RecordTickerProps {
  records: TickerRecord[];
}

const VISIBLE_COPIES = 4;

function buildSummary(records: TickerRecord[]): string {
  const summary = records.map((record) => `${record.label} ${record.value}`).join(', ');
  return summary;
}

function TickerGroup({ records }: RecordTickerProps) {
  return (
    <span className="ticker__group">
      {records.map((record) => (
        <span key={record.difficulty} className={`ticker__item ticker__item--${record.difficulty}`}>
          {record.label} <strong>{record.value}</strong>
          <span className="ticker__separator">◆</span>
        </span>
      ))}
    </span>
  );
}

export function RecordTicker({ records }: RecordTickerProps) {
  const copies = Array.from({ length: VISIBLE_COPIES }, (_, index) => index);
  return (
    <span className="ticker">
      <span className="visually-hidden">Record: {buildSummary(records)}</span>
      <span className="ticker__badge" aria-hidden="true">
        Record
      </span>
      <span className="ticker__viewport" aria-hidden="true">
        <span className="ticker__track">
          {copies.map((copy) => (
            <TickerGroup key={copy} records={records} />
          ))}
        </span>
      </span>
    </span>
  );
}
