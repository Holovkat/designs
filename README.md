# Designs

Reusable project-design templates, agent workflow commands, project-local skills, and delivery operating model guidance.

This repository is documentation-first. The README is the GitHub index. The detailed workflow meta and stage-gate guidance lives in the HTML guide under `docs/workflow-guide/`.

## Start Here

| Destination | Purpose |
| --- | --- |
| [Rendered Pages site](https://holovkat.github.io/designs/) | GitHub Pages entrypoint that redirects to the rendered workflow guide. |
| [Workflow guide](https://holovkat.github.io/designs/workflow-guide/) | Canonical detailed operating model for planning, approvals, CI/CD, QA, production approval, and closeout. |
| [Install and harness setup](https://holovkat.github.io/designs/workflow-guide/install.html) | Instructions and common prompt for installing commands and skills globally or into a project. |
| [Command pack](templates/instructional-documents/commands/) | Slash-command templates such as `/plan-feature`, `/plan-bugfix`, `/plan-github`, `/plan-review`, `/compliance-review`, `/uat`, and closeout flows. |
| [Project skills](templates/instructional-documents/skills/) | Project-local skills for worktree/session lifecycle support. |
| [Workflow installer](templates/instructional-documents/install-session-workflows.sh) | Installer for refreshing commands, hooks, scripts, skills, and worktree guidance into another project. |
| [Functional design templates](templates/functional-design/) | Planning and implementation checklist templates. |
| [Instructional documents](templates/instructional-documents/) | GitHub, deployment, architecture, auth, payment, and workflow references. |
| [UI/UX guidelines](templates/ui-ux-guidelines/) | Design-token and interface-pattern references. |

## Planning Decomposition

```mermaid
flowchart TD
  A["User request or existing GitHub issue"] --> B{"Planning entrypoint"}
  B -->|"New feature"| C["/plan-feature"]
  B -->|"Bug investigation"| D["/plan-bugfix"]
  B -->|"Existing issue or PR"| E["/plan-github"]
  C --> F["Planning orchestrator"]
  D --> F
  E --> F
  F --> G["Requirements analysis"]
  F --> H["UX and workflow analysis"]
  F --> I["Scenario and regression analysis"]
  F --> J["Technical feasibility analysis"]
  G --> K["Issue-ready specification"]
  H --> K
  I --> K
  J --> K
  K --> L["Plan vs Q&A review"]
  L --> M{"Plan complete?"}
  M -->|"Gaps found"| F
  M -->|"Approved"| N["Epic or parent issue"]
  N --> O["Phase / sprint issue"]
  O --> P["Task issues with acceptance criteria"]
  P --> Q["Local checklist mirrors issue numbers"]
  Q --> R{"Planning approved?"}
  R -->|"Needs clarification"| F
  R -->|"Approved"| S["Ready for build session"]
```

## Delivery Lifecycle

```mermaid
flowchart TD
  A["Planning approved"] --> B["Start governed build session"]
  B --> C["Freeze task packet"]
  C --> D["Implementation"]
  D --> E["Review, tests, compliance"]
  E --> F["Compliance and DoD review"]
  F --> G{"DoD rank passes?"}
  G -->|"No"| D
  G -->|"Conditional"| H{"Owner accepts caveats?"}
  H -->|"No"| D
  H -->|"Yes"| I
  G -->|"Yes"| I["Project-defined CI/CD authority"]
  I --> J["QA readiness manifest"]
  J --> K{"QA / UAT approved?"}
  K -->|"No"| L["Rework or replan"]
  L --> D
  K -->|"Yes"| M["Production approval gate"]
  M --> N{"Owner approved promotion?"}
  N -->|"No"| M
  N -->|"Yes"| O["Governed production promotion"]
  O --> P["Production smoke"]
  P --> Q{"Final signoff?"}
  Q -->|"No"| L
  Q -->|"Yes"| R["Closeout and lessons learned"]
```

## Workflow Detail

See the [rendered workflow guide](https://holovkat.github.io/designs/workflow-guide/) for the full guidance covering planning, plan review, Definition of Done ranking, approvals, CI/CD authority, QA/UAT, production approval, closeout, installation, and project-specific overlays.

## Repository Structure

```text
docs/workflow-guide/               Persistent HTML operating guide
templates/                         Reusable planning and instructional library
templates/instructional-documents/  Commands, skills, hooks, scripts, and workflow references
templates/functional-design/        Planning and implementation checklist templates
templates/ui-ux-guidelines/         UI/UX and design-system references
project snapshots/                  Project-specific design snapshots or folders
*.zip                               Archived exports and handoff bundles
```

## Validation

There is no build pipeline in this repo. Useful checks before committing documentation changes:

```bash
git diff --check
```

Review changed Markdown links and open `docs/workflow-guide/index.html` locally when the HTML guide changes.
