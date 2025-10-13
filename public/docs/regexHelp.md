# Regex Quick Help

## Basics

* **Anchors:** `^` start, `$` end
* **Quantifiers:** `*` (0+), `+` (1+), `?` (0/1), `{m,n}`
* **Character classes:** `\d` digits, `\w` word (letters/digits/`_`), `\s` whitespace, `.` any char
* **Negated class:** `[^…]` everything except…
* **Groups:** `( … )` capture, `(?: … )` non-capturing
* **Alternation:** `A|B` (A or B)
* **Word boundaries:** `\b` word edge, `\B` non-edge

## JavaScript Flags

* `i` case-insensitive
* `g` global (find all matches)
* `m` multiline (`^`/`$` match line boundaries)
* `u` Unicode (better with emojis/accents, enables `\p{…}`)
* `s` dotAll (`.` matches newlines)

> Tip: Prefer `u` when dealing with accents/emoji or using `\p{L}`, `\p{N}`, etc.

---

## Ready-to-Use Patterns

### 1) Contains a substring

```js
tenant
```

### 2) Does **not** contain “tenant”

``` 
^(?!.*tenant).*$
```

* Allow empty string:

``` js
^(?!.*tenant).*$
```

### 3) Whole word “tenant” (avoid “lieutenant”)

```
\btenant\b
```

### 4) Starts / Ends with

```
^prefix
suffix$
```

### 5) One of several words

```
\b(tenant|owner|admin)\b
```

### 6) Exclude several words anywhere

```
^(?!.*\b(tenant|test|tmp)\b).+$
```

### 7) Letters / spaces / apostrophes / dashes (Latin + accents)

```
^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$
```

Unicode version (needs `u` flag):

```
^\p{L}[\p{L}' -]*$
```

### 8) Digits only

```
^\d+$
```

### 9) Simple email (pragmatic)

```
^[^\s@]+@[^\s@]+\.[^\s@]+$
```

### 10) UUID v4

```
^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$
```

### 11) ISO date `YYYY-MM-DD`

```
^\d{4}-\d{2}-\d{2}$
```

### 12) Filename ending with `.json`

```
^.+\.json$
```

---

## Node & Browser Usage

### Testing a string

```js
/^(?!.*tenant).+$/i.test(name);  // true if name does NOT contain "tenant" (case-insensitive)
```

### With variables

```js
const term = 'tenant';
const rx = new RegExp(`^(?!.*${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}).+$`, 'i');
rx.test(name);
```

### Matching all occurrences

```js
const matches = str.match(/\b(tenant|owner|admin)\b/gi) ?? [];
```

### Replacing

```js
const out = str.replace(/\btenant\b/gi, 'user');
```

### Unicode names (front-end or Node)

```js
/^\p{L}[\p{L}' -]*$/u.test(displayName);
```

---

## Tips & Pitfalls

* **Escape specials** when building from user input:
  `.[*+?^${}()|[\]\\` → use:

  ```js
  const escapeRx = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  ```

* **Whole words:** Prefer `\b…\b`, but note `\b` depends on `\w`. For non-ASCII words, use Unicode and `\p{L}` with `u`.

* **Performance:** Avoid overly greedy `.*`. Constrain if possible (e.g., `[^/]*` inside paths).

* **Lookarounds:** Negative lookahead `(?! … )` is widely supported. Negative lookbehind `(?<! … )` also works in modern Node and evergreen browsers, but verify if you target very old environments.

* **Multiline content:** Use `m` if you want `^`/`$` to match the start/end of each **line** rather than the entire string.

---

## Quick Copy Block (for your UI)

* **Contains:** `tenant`
* **Doesn’t contain “tenant”:** `^(?!.*tenant).+$`
* **Whole word:** `\btenant\b`
* **Starts / Ends:** `^prefix` · `suffix$`
* **One of:** `\b(foo|bar|baz)\b`
* **Exclude words:** `^(?!.*\b(foo|bar)\b).+$`
* **Letters & spaces (Unicode):** `^\p{L}[\p{L}' -]*$` *(use flag `u`)*
* **Escape a dot:** `file\.json`

---

