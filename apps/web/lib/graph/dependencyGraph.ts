/**
 * Dependency Graph for Protocol Ordering
 *
 * Builds a directed acyclic graph (DAG) from protocol dependencies
 * and performs topological sort to determine execution order.
 */

export interface Protocol {
  title: string;
  category: string;
  description: string;
  priority: string;
  dependsOn?: string[];
  warnings?: string[];
  hacks?: string[];
  attribution?: {
    sourceUrl: string;
    authorName?: string;
    engagement?: number;
  };
}

export interface DependencyGraph {
  nodes: Map<string, Protocol>;
  edges: Map<string, string[]>; // title -> dependencies (what this node depends on)
  reverseEdges: Map<string, string[]>; // title -> dependents (what depends on this node)
}

/**
 * Build a dependency graph from protocols
 */
export function buildDependencyGraph(protocols: Protocol[]): DependencyGraph {
  const nodes = new Map<string, Protocol>();
  const edges = new Map<string, string[]>();
  const reverseEdges = new Map<string, string[]>();

  // Build nodes
  for (const protocol of protocols) {
    nodes.set(protocol.title, protocol);
    edges.set(protocol.title, []);
    reverseEdges.set(protocol.title, []);
  }

  // Build edges (validate that dependencies exist)
  for (const protocol of protocols) {
    const validDeps: string[] = [];
    for (const dep of protocol.dependsOn ?? []) {
      if (nodes.has(dep)) {
        validDeps.push(dep);
        // Add reverse edge (dep -> protocol that depends on it)
        const revDeps = reverseEdges.get(dep) ?? [];
        revDeps.push(protocol.title);
        reverseEdges.set(dep, revDeps);
      } else {
        console.warn(`Invalid dependency: "${protocol.title}" depends on non-existent "${dep}"`);
      }
    }
    edges.set(protocol.title, validDeps);
  }

  return { nodes, edges, reverseEdges };
}

/**
 * Perform topological sort on the dependency graph
 * Returns protocols in dependency order (dependencies first)
 */
export function topologicalSort(graph: DependencyGraph): Protocol[] {
  const { nodes, edges } = graph;
  const sorted: Protocol[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>(); // For cycle detection

  function visit(title: string): boolean {
    if (visited.has(title)) return true;

    if (visiting.has(title)) {
      // Circular dependency detected
      console.warn(`Circular dependency detected at: ${title}`);
      return false;
    }

    visiting.add(title);

    // Visit dependencies first
    const deps = edges.get(title) ?? [];
    for (const dep of deps) {
      if (!visit(dep)) {
        // Break the cycle by continuing without this dependency
        console.warn(`Breaking cycle by skipping dependency: ${dep} for ${title}`);
      }
    }

    visiting.delete(title);
    visited.add(title);

    const node = nodes.get(title);
    if (node) {
      sorted.push(node);
    }

    return true;
  }

  // Visit all nodes
  for (const title of Array.from(nodes.keys())) {
    visit(title);
  }

  return sorted;
}

/**
 * Detect cycles in the graph
 * Returns array of cycles found (each cycle is an array of titles)
 */
export function detectCycles(graph: DependencyGraph): string[][] {
  const { nodes, edges } = graph;
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function dfs(title: string): boolean {
    visited.add(title);
    recStack.add(title);
    path.push(title);

    const deps = edges.get(title) ?? [];
    for (const dep of deps) {
      if (!visited.has(dep)) {
        if (dfs(dep)) return true;
      } else if (recStack.has(dep)) {
        // Found a cycle
        const cycleStart = path.indexOf(dep);
        cycles.push(path.slice(cycleStart));
        return true;
      }
    }

    path.pop();
    recStack.delete(title);
    return false;
  }

  for (const title of Array.from(nodes.keys())) {
    if (!visited.has(title)) {
      dfs(title);
    }
  }

  return cycles;
}

/**
 * Get protocols with no dependencies (entry points)
 */
export function getEntryPoints(graph: DependencyGraph): Protocol[] {
  const { nodes, edges } = graph;
  const entryPoints: Protocol[] = [];

  for (const [title, deps] of Array.from(edges.entries())) {
    if (deps.length === 0) {
      const node = nodes.get(title);
      if (node) {
        entryPoints.push(node);
      }
    }
  }

  return entryPoints;
}

/**
 * Get protocols that nothing depends on (exit points)
 */
export function getExitPoints(graph: DependencyGraph): Protocol[] {
  const { nodes, reverseEdges } = graph;
  const exitPoints: Protocol[] = [];

  for (const [title, dependents] of Array.from(reverseEdges.entries())) {
    if (dependents.length === 0) {
      const node = nodes.get(title);
      if (node) {
        exitPoints.push(node);
      }
    }
  }

  return exitPoints;
}

/**
 * Get the critical path (longest path through dependencies)
 */
export function getCriticalPath(graph: DependencyGraph): Protocol[] {
  const { nodes, edges } = graph;
  const memo = new Map<string, Protocol[]>();

  function longestPath(title: string): Protocol[] {
    if (memo.has(title)) {
      return memo.get(title)!;
    }

    const deps = edges.get(title) ?? [];
    let longest: Protocol[] = [];

    for (const dep of deps) {
      const path = longestPath(dep);
      if (path.length > longest.length) {
        longest = path;
      }
    }

    const node = nodes.get(title);
    const result = node ? [...longest, node] : longest;
    memo.set(title, result);
    return result;
  }

  // Find the longest path starting from any node
  let criticalPath: Protocol[] = [];
  for (const title of Array.from(nodes.keys())) {
    const path = longestPath(title);
    if (path.length > criticalPath.length) {
      criticalPath = path;
    }
  }

  return criticalPath;
}
