# Coding & Workflow
- Keep changes minimal and focused; avoid refactors outside the task.
- Match existing style and structure.
- Prefer root‑cause fixes over band‑aids.
- Ask before making destructive changes.
### Context - Codebase - information indexed search **- MUST DO **
- To aid in locating sources of code, a semantic search pre-result might be provided. You **MUST** use those results first before any other tools to find other places of concern or investigation in the code.
- If no pre results or list of files are provided then you must also utilise the semantic search on the codebase index by running the following tool with a natural language request you will need to run this bash command `codex-agentic search-codebase <query prompt> -k 8 --show-snippets --output json`
- or - To just locate the files in the codebase run `codex-agentic search-codebase <query prompt> --output json` : example : `codex-agentic search-code "where is santa clause ?" -k 8 --show-snippets  --diff`
- use the search information to quickly find documents, code and information in the system quickly without grep'ing. use grep or other approved tools as a last resort. ** IMPORTANT ** for Local code references make sure you read these first.Treat the files from the search as the primary sources for answering. Read them carefully before any grep/other searches. Only if these sources are insufficient, you may run additional searches. Do not include low-confidence references (< threshold) in your reasoning.Cite file paths and line ranges when you reference code.


### Build and Install **- MUST DO**
The user will operate as the code and build gate. they will expect that the changes are built, compiled and installed. eg for rust build and install globally to test. For website make sure you npm build and lint check, assuming that the user is already running the dev environment as part of the testing.

###Always look to delegate complex tasks to another agent thereby acting as the orchestrator, and making sure the tasks are completed and status reported back to the user. To do this you must call the bash command `codex  exec -m "gpt-5" {prompt}`
