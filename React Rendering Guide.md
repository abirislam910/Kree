# React Rendering: A Conceptual Guide

## What "Rendering" Actually Means

When people talk about React "rendering," they're really talking about two distinct phases that happen in sequence.

The first phase is the **render phase**, where React calls your component functions to figure out what the UI *should* look like. Your component returns JSX, and React builds a virtual representation of the DOM from it — a lightweight JavaScript object tree that describes the structure of your UI. This is sometimes called the "virtual DOM." Importantly, nothing has changed on screen yet during this phase.

The second phase is the **commit phase**, where React takes that virtual representation and actually updates the real DOM to match it. This is when the user sees changes on screen. React is smart about this — it compares the new virtual tree with the previous one (a process called "reconciliation" or "diffing") and only touches the specific DOM nodes that actually changed. So even if your component re-renders and produces a full tree of JSX, React might only update a single text node in the browser.

The key insight is that a "re-render" of your component (the render phase) does not necessarily mean the DOM gets updated (the commit phase). If your component re-renders but produces the exact same output, React sees no differences during reconciliation and skips the commit entirely.

---

## What Triggers the First Render

When your application starts, React needs to do an **initial render**. This is the very first time React calls your component functions and builds the virtual DOM from scratch. It happens when you call something like `createRoot(domNode).render(<App />)`. React starts at the root component, calls it, then calls every child component that appears in the returned JSX, then their children, and so on — all the way down the tree. Every component renders once to build the initial UI.

---

## What Triggers a Re-Render

After the initial render, React only re-renders components when it has a reason to believe the output might have changed. There are three triggers for re-renders.

### 1. State Changes

This is the most common trigger. When you call a state setter function (from `useState` or a `useReducer` dispatch), React schedules a re-render of that component. This is React's fundamental contract: state is the mechanism by which you tell React "something changed, please re-evaluate what this component should look like."

It's important to understand that React **batches** state updates. If you call multiple setters in the same event handler, React doesn't re-render after each one. It waits until your handler finishes, processes all the state updates together, and then does a single re-render. This prevents unnecessary intermediate renders.

Also worth noting: if you call a setter with the exact same value as the current state (checked by `Object.is`), React may bail out and skip the re-render entirely. This is an optimization — if nothing changed, there's no work to do.

### 2. Parent Re-Renders

When a component re-renders, **all of its children re-render too**, regardless of whether their props changed. This is one of the most misunderstood aspects of React. Many people assume React only re-renders a child if its props changed — that's not the default behavior.

When your parent re-renders, React calls your child component function again, gets the new JSX, diffs it against the old output, and only commits actual DOM changes. So even though the child "re-rendered" (its function ran), the DOM might not change at all. The re-render is cheap if the output is the same — but the function still ran, and any logic inside it still executed.

This is the cascade effect: a state change at the top of your tree can cause every component below it to re-render. The farther up the tree the state lives, the more components re-render. This is why state placement matters — putting state as close as possible to where it's used limits the blast radius of re-renders.

### 3. Context Changes

When a context value changes, **every component that consumes that context re-renders**, no matter how deep in the tree it is. This bypasses the normal parent-child cascade — React directly notifies each consumer. This is powerful but also why context optimization matters. If your context value changes frequently and many components consume it, you can get a lot of re-renders.

The way React detects a context change is by comparing the new value to the old value using `Object.is`. This is reference equality, not deep equality. So if your context value is an object and you create a new object on every render (even with the same contents), React sees it as a change and re-renders all consumers. This is exactly the problem that `useMemo` solves when applied to context values.

---

## The Parent Re-Render Cascade in Detail

Understanding the cascade is critical, so let's walk through it more carefully.

Imagine a tree: App renders Header and Main. Main renders Sidebar and Content. Content renders a list of Card components.

If Main has a state update, here's what happens: React re-renders Main, which returns JSX containing Sidebar and Content. React then re-renders Sidebar (even if its props didn't change) and Content (even if its props didn't change). Since Content rendered Card components, all the Cards re-render too. Header does **not** re-render, because it's a sibling of Main, not a child.

The cascade always goes **downward** from the component that had the state change. It never goes upward (a child's state change doesn't re-render its parent) and it never goes sideways (a sibling's state change doesn't affect you — unless you share context or a common parent whose state changed).

---

## How React Decides What to Update in the DOM

After calling your component functions (the render phase), React has two virtual DOM trees: the previous one and the new one. It walks both trees simultaneously, comparing nodes at each position.

If a node is the **same type** (same HTML element or same component) in both trees, React keeps the existing DOM node and just updates any changed attributes or props.

If a node is a **different type**, React destroys the old DOM subtree entirely and builds a new one from scratch. This is why component identity matters — if React sees a different component type at the same position, it assumes the entire subtree is different and unmounts everything beneath it.

**Keys** help React identify which items in a list correspond to which items in the previous render. Without keys, React matches items by position — if you insert an item at the beginning of a list, React thinks every item shifted and updates all of them. With keys, React can match items by identity and only insert the new one, leaving the rest untouched.

---

## Where useEffect Fits In

Effects run **after** the render and commit phases are complete. The sequence is: React calls your component (render phase), updates the DOM (commit phase), the browser paints the screen, and then your effects run. This means effects always see the latest DOM and never block the visual update.

Effects are not part of the rendering process — they're side effects that happen in response to rendering. They run after the first render and after any re-render where their dependencies changed. If the dependency array is empty, the effect only runs once after the initial mount.

This is relevant to your UserContext design: the `useEffect` that fetches user data runs after the provider first renders with its initial state (username is null, loading is true). The fetch completes asynchronously, calls the state setter, which triggers a re-render with the actual username, which then propagates to consumers.

---

## Preventing Unnecessary Re-Renders

React gives you several tools to prevent re-renders when you know they're unnecessary.

### React.memo

Wrapping a component in `React.memo` changes the default behavior: instead of always re-rendering when the parent re-renders, React first checks whether the props changed (using shallow comparison). If the props are the same, the re-render is skipped entirely. This is useful for expensive components that receive the same props most of the time.

However, `React.memo` only works if the props are actually stable. If the parent passes a new object or function reference on every render, the shallow comparison will always find a difference, and `React.memo` does nothing.

### useMemo

`useMemo` caches a computed value between re-renders. React only recomputes it when one of the dependencies changes. This is useful for expensive calculations, but more importantly for your purposes, it's useful for **stabilizing references**. When you wrap your context value in `useMemo`, React reuses the same object reference unless the dependencies change, which prevents context consumers from seeing a "new" value and re-rendering.

### useCallback

`useCallback` is `useMemo` for functions. It returns the same function reference between re-renders unless the dependencies change. This is useful when passing functions as props to memoized children, or when functions appear in dependency arrays of effects.

### The Relationship Between These Tools

These tools work together as a system. `React.memo` on a child component says "don't re-render me if my props haven't changed." But for that to work, the parent needs to actually provide stable props — which means using `useMemo` for object props and `useCallback` for function props. If you use `React.memo` without stabilizing the props, it doesn't help. If you use `useMemo` and `useCallback` without `React.memo` on the child, the stable references aren't being checked by anything (except in the context value case, where React itself checks the reference).

---

## How This All Connects to Your UserContext

Your UserContext provider sits between ContentProvider and BrowserRouter. When ContentProvider's state changes, your UserProvider re-renders. Without `useMemo` on the context value, this creates a new value object, which React sees as a context change, causing every consumer (Home, Collection, Login, etc.) to re-render — even though the username didn't change.

With `useMemo`, the context value object stays the same reference unless username or loading actually changed. React compares the context value, sees it's the same object, and skips re-rendering the consumers. The cascade from ContentProvider stops at the UserProvider level instead of propagating through your entire app.

Your `useCallback`-wrapped login and logout functions stay stable across these parent-triggered re-renders. Since they're included in the `useMemo` dependency array for the context value, their stability contributes to the overall stability of the context value object.

The `useEffect` that fetches user data on mount is independent of all this optimization — it runs once after the initial render, recovers the session, and calls the state setter. That setter triggers a legitimate state change, which causes a legitimate re-render of the provider, which creates a legitimately new context value (because username changed), which legitimately re-renders all consumers with the actual username. That's the system working as intended.

---

## Summary of Key Principles

**Rendering is calling component functions**, not updating the DOM. React calls functions to figure out what changed, then surgically updates only the DOM nodes that differ.

**State changes are the engine.** Everything starts with a state update. No state change, no re-render (with the exception of parent-triggered cascades and context changes, which themselves originate from state changes higher up).

**Re-renders cascade downward.** A component's re-render causes all its children to re-render by default. This is intentional — React prioritizes correctness over performance.

**Context bypasses the tree.** Context changes directly notify consumers regardless of depth, which is powerful but means context values should be stabilized with `useMemo`.

**Optimization is opt-in.** React's default is to re-render freely and rely on fast diffing. `React.memo`, `useMemo`, and `useCallback` are escape hatches for when the default behavior causes noticeable performance issues or unnecessary work.
