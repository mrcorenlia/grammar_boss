type HPBarProps = {
  current: number;
  max: number;
};

/**
 * Shared HP visualization used by boss and engine integration views.
 */
export const HPBar = ({ current, max }: HPBarProps) => {
  const safeMax = Math.max(1, max);
  const safeCurrent = Math.max(0, Math.min(current, safeMax));
  const percentage = Math.round((safeCurrent / safeMax) * 100);

  return (
    <div className="hp-bar" aria-label="Boss HP">
      <div className="hp-bar__track">
        <div className="hp-bar__fill" data-testid="hp-fill" style={{ width: `${percentage}%` }} />
      </div>
      <div className="hp-bar__label">{safeCurrent} / {safeMax} HP</div>
    </div>
  );
};
