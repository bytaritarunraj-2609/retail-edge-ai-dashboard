# Retail Edge AI — UI Design Rules

## Overall Design Direction

The Retail Edge AI dashboard should feel like a:

- premium edge-AI control console
- intelligent retail operations system
- cinematic technical dashboard
- commercial-grade monitoring interface

The visual language is inspired conceptually by premium hardware interfaces, automotive dashboards, and Apple Liquid Glass.

Do not copy any specific product interface.

## Liquid Glass Material

Glass surfaces should feel:

- translucent
- dimensional
- layered
- reflective
- refractive
- responsive to the user's cursor

Use:

- transparency
- backdrop blur
- subtle edge highlights
- soft reflections
- specular highlights
- layered shadows
- ambient light
- subtle depth

Avoid:

- flat matte glass
- completely opaque cards
- excessive blur
- excessive glow
- excessive gradients
- gaming-style neon interfaces

## Color System

Primary environment:

- deep charcoal
- deep navy
- near-black blue

Ambient accents:

- cyan
- blue
- subtle violet

Semantic states:

- green = normal / healthy
- orange = restock required
- red = out of stock / critical
- purple = misplaced item
- cyan / blue = processing
- neutral / dim = inactive

Never communicate an important state using color alone.

Also use:

- text labels
- icons
- borders
- indicators
- state descriptions

## Information Hierarchy

Important information should receive stronger visual hierarchy.

Use:

- large typography for major KPIs
- medium typography for section titles
- smaller typography for supporting information
- compact metadata for technical details

The dashboard should be easy to scan.

A manager should understand the important store conditions quickly without reading every element.

## Layout

Prefer:

- strong information hierarchy
- clean spacing
- large analytical visualizations
- compact operational information
- organized panels
- consistent alignment
- desktop-first responsive design

Avoid unnecessary empty space.

Do not make every component visually equal.

Important information should have more visual weight.

## Motion

Motion should communicate:

- state
- hierarchy
- cause and effect
- spatial relationships
- transitions between system states

Prefer:

- smooth spring motion
- subtle parallax
- opacity transitions
- depth transitions
- controlled interpolation
- soft glass reflection movement

Avoid:

- excessive bouncing
- giant scaling
- flashing
- unnecessary spinning
- gaming-style animations
- continuous animation that does not communicate information

## Cursor Interaction

Glass surfaces may respond subtly to cursor movement.

Possible effects include:

- moving glass reflection
- shifting highlight
- subtle surface illumination
- small depth change
- subtle shadow direction change
- restrained refraction

The effect must remain subtle.

It should make the interface feel physically responsive rather than distracting the user.

## Hover States

Hovering an interactive glass surface may produce:

- slight brightness increase
- reflection movement
- border highlight
- small elevation change
- slightly deeper shadow

Keep transitions smooth.

Do not use exaggerated scaling.

## Panels and Drawers

Panels should feel layered above the interface.

Opening a panel should preferably follow:

1. slight movement toward the user
2. opacity increase
3. blur transition
4. content reveal
5. subtle settling motion

Panels should feel connected to the element that opened them.

## Depth

Use a layered depth system.

Possible depth levels:

- background
- ambient layer
- primary glass
- elevated glass
- floating panel
- focused interaction

Do not make every element appear to float.

Depth should communicate hierarchy.

## Responsive Design

The primary target is desktop and laptop screens.

The interface must still remain usable on smaller screens.

Do not allow:

- text overflow
- broken grids
- overlapping panels
- inaccessible controls
- unreadable charts

Responsive changes should preserve the information hierarchy.

## Accessibility

Interactive states should remain understandable without relying only on color.

Maintain:

- readable contrast
- visible focus states
- meaningful labels
- appropriate button semantics
- keyboard-accessible interactions where practical

## Performance

Prefer performant visual techniques.

Use:

- CSS transforms
- opacity transitions
- controlled blur
- memoized components where useful

Avoid unnecessary:

- continuous JavaScript animation loops
- excessive canvas rendering
- expensive effects on every component
- unnecessary WebGL
- Three.js unless explicitly required

Visual quality must not come at the expense of dashboard responsiveness.

## Consistency

Reuse the existing design system.

Do not create a completely different visual language for each page.

Overview, Store Map, Inventory, Team, Footfall, and Heatmap should feel like parts of the same operating system.

When creating new components:

- reuse existing Glass primitives
- reuse existing design tokens
- reuse existing spacing
- reuse existing typography
- reuse existing semantic colors
- reuse existing motion principles

Do not create isolated one-off styling systems unless there is a strong architectural reason.