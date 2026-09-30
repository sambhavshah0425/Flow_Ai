import React from 'react';

/**
 * A landing-page section rendered as a rounded panel that rides up over the
 * section before it — the stacking "sheet" transition the reference uses
 * between its dark hero and the light content panels.
 *
 * Deliberately a plain wrapper: it never wraps the Live Demo section, whose
 * own 270vh sticky scroll would fight an overlapping stacking context.
 */
export function Slab({
  tone = 'dark',
  as: Tag = 'section',
  className = '',
  children,
  ...rest
}) {
  return (
    <Tag className={`lp-slab lp-slab--${tone} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
