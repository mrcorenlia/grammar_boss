import type { BossState } from "../core/types";
import type { BossVisualState } from "../animation/effects";

type BossRendererProps = {
  bossState: BossState;
  visualState: BossVisualState;
};

/**
 * SVG renderer maps stable part ids to visual classes and removal rules.
 */
export const BossRenderer = ({ bossState, visualState }: BossRendererProps) => {
  return (
    <div className={`boss-renderer${visualState.shake ? " boss-renderer--shake" : ""}`}>
      <svg viewBox="0 0 400 220" role="img" aria-label={bossState.name}>
        {bossState.parts.map((part, index) => {
          const partVisualState = visualState.partStates[part.id];
          if (part.destroyed || part.currentHP <= 0 || partVisualState?.destroyed) {
            return null;
          }

          const classes = ["boss-part"];
          if (partVisualState?.cracked) {
            classes.push("boss-part--cracked");
          }
          if (partVisualState?.flash) {
            classes.push("boss-part--flash");
          }
          if (partVisualState?.exploding) {
            classes.push("boss-part--exploding");
          }

          return (
            <g
              key={part.id}
              id={part.svgElementId}
              data-testid={`boss-part-${part.id}`}
              className={classes.join(" ")}
              transform={`translate(${40 + index * 120}, 100)`}
            >
              <circle r="36" />
              <text y="6" textAnchor="middle" fill="currentColor">
                {part.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
