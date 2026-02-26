type TimerProps = {
  elapsedMs: number;
};

const formatElapsed = (elapsedMs: number): string => {
  return `${(elapsedMs / 1000).toFixed(1)}s`;
};

const getPaceClass = (elapsedMs: number): string => {
  if (elapsedMs >= 10_000 && elapsedMs <= 30_000) {
    return "timer--good";
  }
  if (elapsedMs < 10_000) {
    return "timer--fast";
  }
  return "timer--slow";
};

/**
 * Timer is presentational; App owns interval/timing state.
 */
export const Timer = ({ elapsedMs }: TimerProps) => {
  return <div className={`timer ${getPaceClass(elapsedMs)}`}>{formatElapsed(elapsedMs)}</div>;
};
