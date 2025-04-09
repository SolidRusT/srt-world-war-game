# CUSTOM INSTRUCTIONS FOR RISK-INSPIRED STRATEGY GAME DEVELOPMENT

This document provides guidelines for using Claude and MCP tools to develop our turn-based strategy game inspired by RISK.

## CRITICAL: WORKING WITH THE EXISTING CODEBASE

1. **ALWAYS check the existing file structure before any modifications**
   - Use `list_directory` and `directory_tree` to understand the current state
   - Review code before modifying it to maintain consistency
   - Do NOT recreate files or directories that already exist

2. **Respect the established architecture**
   - The project uses React with a Vite build system
   - Follow the existing patterns when adding new features
   - Maintain separation of concerns between game logic and UI

3. **Preserve existing functionality**
   - Test that changes don't break existing features
   - Use the REPL to validate before implementing in files
   - Add to the codebase, don't replace working components

## AVAILABLE TOOLS AND THEIR USAGE

### File System Operations
- **Reading Files**: Use `read_file` to examine individual files or `read_multiple_files` for batch operations.
- **Writing/Editing Files**: Use `write_file` for new content and `edit_file` for modifying existing files.
- **Directory Management**: Use `create_directory`, `list_directory`, and `directory_tree` to organize project assets.
- **File Management**: Use `move_file`, `search_files`, and `get_file_info` as needed.

### Knowledge Graph Tools
Use these tools to maintain project architecture and game design concepts:
- **Creating Information**: `create_entities`, `create_relations`, and `add_observations` to document game mechanics, rules, and components.
- **Managing Information**: `delete_entities`, `delete_observations`, `delete_relations` to refine concepts.
- **Retrieving Information**: `read_graph`, `search_nodes`, `open_nodes` to recall design decisions.

### Web Tools
Use these for research and reference:
- **Search**: `brave_web_search` and `brave_local_search` for game design research and inspiration.
- **Web Automation**: `puppeteer_*` tools for visual references or UI inspiration.
- **Content Fetching**: `fetch` for retrieving reference materials.

### Code Execution and Analysis
- **REPL**: Use the JavaScript REPL for testing game logic, algorithms, and data structures.
- **Artifacts**: Create artifacts for code snippets, diagrams, and UI mockups.

## DEVELOPMENT WORKFLOW

### Research Phase
1. Use web tools to gather information about RISK and similar games.
2. Create knowledge graph entities for key game concepts.
3. Document findings in markdown files.

### Design Phase
1. Define game rules and mechanics in dedicated files.
2. Use the knowledge graph to map relationships between game elements.
3. Create diagrams using artifacts for visual representation.

### Implementation Phase
1. Use the REPL to prototype and test game logic.
2. Write modular code with comprehensive documentation.
3. Create UI mockups using artifacts.
4. Implement game components progressively (board, units, combat, etc.).

### Testing Phase
1. Use the REPL to test individual functions and edge cases.
2. Implement integration tests for game systems.
3. Document bugs and fixes in the knowledge graph.

## FILE ORGANIZATION

```
risk-inspired-game/
├── docs/                 # Documentation
│   ├── game_rules.md     # Game rules and mechanics
│   ├── design_notes.md   # Design decisions and rationale
│   └── references.md     # References and inspiration
├── src/                  # Source code
│   ├── core/             # Core game logic
│   ├── ui/               # User interface
│   └── assets/           # Game assets
├── tests/                # Test cases
└── README.md             # Project overview
```

## CODING STANDARDS

1. Use clear, descriptive variable and function names.
2. Add comments for complex logic.
3. Maintain separation of concerns between game logic and UI.
4. Document public APIs and interfaces.
5. Follow modular design principles.

## ARTIFACT USAGE

1. Use code artifacts for standalone, reusable components.
2. Use markdown artifacts for detailed game documentation.
3. Use SVG artifacts for game board and UI mockups.
4. Use React artifacts for interactive UI prototypes.

## REPL BEST PRACTICES

1. Break down complex game logic into testable units.
2. Test randomized elements with fixed seeds for reproducibility.
3. Use console.log for debugging and verification.
4. Validate game state transitions and rule enforcement.

## DEVELOPMENT PRIORITIES

1. Game board representation and territory management
2. Turn-based mechanics and player actions
3. Combat resolution system
4. AI opponents (if applicable)
5. UI/UX design and implementation
6. Game state management (saving/loading)
7. Victory conditions and game progression

By following these instructions, we can efficiently develop our RISK-inspired strategy game using Claude's capabilities and the MCP toolset.
