## Dependency Rule

<!-- DEPENDENCY_RULE:START -->

```mermaid
flowchart TD
  pages --> layouts
  layouts --> containers
  containers -- Only Provider --> contexts
  containers --> components
  components --> hooks
  hooks -- Only Context --> contexts
  contexts --> services
  components --> icons
  icons --> styles
  styles --> utils
  services --> utils
```

This project follows a **One-way Dependency Flow** principle:

- Each folder may only import modules that lie downstream along the arrow direction
- Upstream or reverse imports are not allowed

> This rule is also enforced via **ESLint**.

<!-- DEPENDENCY_RULE:END -->

## Custom Marker Test

<!-- CUSTOM_MARKER:START -->

```mermaid
flowchart TD
  pages --> layouts
  layouts --> containers
  containers -- Only Provider --> contexts
  containers --> components
  components --> hooks
  hooks -- Only Context --> contexts
  contexts --> services
  components --> icons
  icons --> styles
  styles --> utils
  services --> utils
```

Custom Content

<!-- CUSTOM_MARKER:END -->

<!-- MISSINF_END_MARKER:START -->
