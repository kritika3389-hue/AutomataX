// Pushdown Automaton Execution Engine
export class PDAEngine {
  constructor(pdaDef) {
    this.pda = pdaDef;
    this.reset('');
  }

  setPDA(pdaDef) {
    this.pda = pdaDef;
    this.reset(this.originalInput);
  }

  reset(inputString = '') {
    this.originalInput = String(inputString);
    this.currentState = this.pda.startState;
    this.stack = [this.pda.startStack || 'Z0']; // index 0 is top of stack
    this.inputIndex = 0;
    this.stepCount = 0;
    this.status = 'ready'; // ready, running, accepted, rejected
    this.lastTransition = null;
    this.history = [];
    
    // Save initial state snapshot
    this.saveSnapshot('Initial configuration');

    // Precompute the optimal execution path (trace) using BFS
    this.precomputedTrace = this.computeTrace(this.originalInput);
    this.currentTraceIndex = 0;
  }

  getCurrentConfig() {
    return {
      step: this.stepCount,
      state: this.currentState,
      remainingInput: this.originalInput.slice(this.inputIndex),
      headIndex: this.inputIndex,
      stack: [...this.stack],
      stackTop: this.stack.length > 0 ? this.stack[0] : null,
      status: this.status,
      transition: this.lastTransition,
      isAccepting: this.checkAcceptance()
    };
  }

  saveSnapshot(reason = '') {
    this.history.push({
      step: this.stepCount,
      state: this.currentState,
      inputIndex: this.inputIndex,
      stack: [...this.stack],
      status: this.status,
      transition: this.lastTransition,
      reason: reason
    });
  }

  checkAcceptance() {
    const isInputConsumed = this.inputIndex >= this.originalInput.length;
    const isStateAccept = this.pda.acceptStates.includes(this.currentState);
    const isEmptyStack = this.stack.length === 0 || (this.stack.length === 1 && this.stack[0] === 'Z0' && this.pda.acceptMode === 'empty');

    if (this.pda.acceptMode === 'empty') {
      return isInputConsumed && (this.stack.length === 0);
    } else if (this.pda.acceptMode === 'both') {
      return isInputConsumed && isStateAccept && this.stack.length === 0;
    } else {
      // Default: accept by final state
      return isInputConsumed && isStateAccept;
    }
  }

  /**
   * BFS solver that finds the valid execution path for non-deterministic or ε-transitions
   */
  computeTrace(inputString) {
    const maxSteps = 150;
    
    // Node in BFS: { state, stack, inputIndex, parent, transition, step }
    const initialNode = {
      state: this.pda.startState,
      stack: [this.pda.startStack || 'Z0'],
      inputIndex: 0,
      parent: null,
      transition: null,
      step: 0,
      note: 'Start configuration'
    };

    const isAccepted = (node) => {
      const inputDone = node.inputIndex >= inputString.length;
      if (!inputDone) return false;
      if (this.pda.acceptMode === 'empty') {
        return node.stack.length === 0;
      }
      return this.pda.acceptStates.includes(node.state);
    };

    if (isAccepted(initialNode)) {
      return [initialNode];
    }

    const queue = [initialNode];
    const visited = new Set();
    let bestFailurePath = [initialNode];
    let maxCoveredInput = -1;

    let iterations = 0;
    while (queue.length > 0 && iterations < 3000) {
      iterations++;
      const current = queue.shift();
      if (current.step > maxSteps) continue;

      const stateKey = `${current.state}|${current.inputIndex}|${current.stack.join(',')}`;
      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      // Track progress for informative failure traces
      if (current.inputIndex > maxCoveredInput) {
        maxCoveredInput = current.inputIndex;
        bestFailurePath = this.reconstructPath(current);
      }

      // Check all possible transitions
      const stackTop = current.stack[0] || '';
      const nextChar = current.inputIndex < inputString.length ? inputString[current.inputIndex] : null;

      const matchingTransitions = this.pda.transitions.filter(t => {
        if (t.from !== current.state) return false;
        if (t.pop !== stackTop) return false;
        // Either match current input character or ε-transition
        if (t.input === 'ε' || t.input === '') return true;
        return nextChar !== null && t.input === nextChar;
      });

      for (const t of matchingTransitions) {
        const isEpsilon = t.input === 'ε' || t.input === '';
        const nextInputIndex = isEpsilon ? current.inputIndex : current.inputIndex + 1;
        
        // Stack transformation: pop top, then push replacement
        const nextStack = [...current.stack];
        nextStack.shift(); // pop
        if (t.push && t.push.length > 0) {
          nextStack.unshift(...t.push);
        }

        const nextNode = {
          state: t.to,
          stack: nextStack,
          inputIndex: nextInputIndex,
          parent: current,
          transition: t,
          step: current.step + 1,
          note: isEpsilon 
            ? `ε-move: ${t.label}` 
            : `Read '${t.input}': ${t.label}`
        };

        if (isAccepted(nextNode)) {
          return this.reconstructPath(nextNode);
        }

        queue.push(nextNode);
      }
    }

    // If no accepting path found, return the deepest path followed by a rejection node
    const failPath = [...bestFailurePath];
    const lastNode = failPath[failPath.length - 1];
    failPath.push({
      state: lastNode.state,
      stack: [...lastNode.stack],
      inputIndex: lastNode.inputIndex,
      parent: lastNode,
      transition: null,
      step: lastNode.step + 1,
      isRejected: true,
      note: lastNode.inputIndex < inputString.length 
        ? `No transition on '${inputString[lastNode.inputIndex]}' with stack top '${lastNode.stack[0] || 'empty'}' (Halted & Rejected)`
        : `Input consumed but state '${lastNode.state}' is not an accepting state (Rejected)`
    });

    return failPath;
  }

  reconstructPath(node) {
    const path = [];
    let cur = node;
    while (cur) {
      path.unshift(cur);
      cur = cur.parent;
    }
    return path;
  }

  /**
   * Advance one step in the precomputed optimal trace
   */
  stepForward() {
    if (this.currentTraceIndex >= this.precomputedTrace.length - 1) {
      // Already at the end
      if (this.checkAcceptance()) {
        this.status = 'accepted';
      } else {
        this.status = 'rejected';
      }
      return false;
    }

    this.currentTraceIndex++;
    const nextNode = this.precomputedTrace[this.currentTraceIndex];
    
    this.currentState = nextNode.state;
    this.stack = [...nextNode.stack];
    this.inputIndex = nextNode.inputIndex;
    this.stepCount = nextNode.step;
    this.lastTransition = nextNode.transition;

    if (nextNode.isRejected) {
      this.status = 'rejected';
    } else if (this.checkAcceptance()) {
      this.status = 'accepted';
    } else {
      this.status = 'running';
    }

    this.saveSnapshot(nextNode.note);
    return true;
  }

  stepBackward() {
    if (this.currentTraceIndex <= 0) return false;
    
    this.currentTraceIndex--;
    const prevNode = this.precomputedTrace[this.currentTraceIndex];

    this.currentState = prevNode.state;
    this.stack = [...prevNode.stack];
    this.inputIndex = prevNode.inputIndex;
    this.stepCount = prevNode.step;
    this.lastTransition = prevNode.transition;

    if (this.currentTraceIndex === 0) {
      this.status = 'ready';
    } else {
      this.status = 'running';
    }

    return true;
  }

  jumpToStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= this.precomputedTrace.length) return false;
    
    this.currentTraceIndex = stepIndex;
    const node = this.precomputedTrace[this.currentTraceIndex];

    this.currentState = node.state;
    this.stack = [...node.stack];
    this.inputIndex = node.inputIndex;
    this.stepCount = node.step;
    this.lastTransition = node.transition;

    if (node.isRejected) {
      this.status = 'rejected';
    } else if (this.checkAcceptance()) {
      this.status = 'accepted';
    } else if (this.currentTraceIndex === 0) {
      this.status = 'ready';
    } else {
      this.status = 'running';
    }

    return true;
  }

  runToEnd() {
    while (this.currentTraceIndex < this.precomputedTrace.length - 1) {
      this.stepForward();
    }
  }

  /**
   * Generate textbook-style Instantaneous Description (ID) string: (q, w, γ)
   */
  getInstantaneousDescription(node = null) {
    const n = node || {
      state: this.currentState,
      inputIndex: this.inputIndex,
      stack: this.stack
    };
    const remaining = this.originalInput.slice(n.inputIndex) || 'ε';
    const stackStr = n.stack.length > 0 ? n.stack.join('') : 'ε';
    return `(${n.state}, ${remaining}, ${stackStr})`;
  }
}
