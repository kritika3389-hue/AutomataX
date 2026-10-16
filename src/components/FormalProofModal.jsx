import React, { useEffect, useRef } from 'react';

export default function FormalProofModal({
  isOpen,
  onClose,
  preset,
  pumpingString,
  onToast
}) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !preset || !contentRef.current) return;

    const rawMd = preset.formalProofMarkdown || '';
    const lines = rawMd.split('\n');
    let html = '';

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('## ')) {
        html += `<h2>${trimmed.slice(3)}</h2>`;
      } else if (trimmed.startsWith('### ')) {
        html += `<h3>${trimmed.slice(4)}</h3>`;
      } else if (trimmed.startsWith('- ')) {
        html += `<li>${trimmed.slice(2)}</li>`;
      } else if (trimmed === '---') {
        html += `<hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 1rem 0;">`;
      } else if (trimmed.length > 0) {
        html += `<p>${trimmed}</p>`;
      }
    });

    contentRef.current.innerHTML = html;

    // Render KaTeX if available
    if (window.katex) {
      contentRef.current.querySelectorAll('p, h2, h3, li').forEach(el => {
        el.innerHTML = el.innerHTML.replace(/\$([^\$]+)\$/g, (match, math) => {
          try {
            return window.katex.renderToString(math, { throwOnError: false });
          } catch (e) {
            return match;
          }
        });
      });
    }
  }, [isOpen, preset]);

  if (!isOpen || !preset) return null;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(preset.formalProofMarkdown).then(() => {
      onToast('Formal Markdown proof copied to clipboard!', '📋');
    });
  };

  const handleCopyLatex = () => {
    const sVal = pumpingString || preset.defaultString || '000111222';
    const latexDoc = `\\documentclass{article}
\\usepackage{amsmath,amssymb}
\\begin{document}
\\section*{Proof: ${preset.name} is Not Context-Free}

\\textbf{Theorem:} The language ${preset.name} is not context-free.

\\begin{proof}
Suppose for contradiction that $L$ is context-free.
By the Pumping Lemma for Context-Free Languages, there exists a pumping length $p \\ge 1$.

Consider the string $s = \\text{"${sVal}"} \\in L$ with $|s| \\ge p$.
According to the Pumping Lemma, $s = uvwxy$ such that:
\\begin{enumerate}
    \\item $|vwx| \\le p$
    \\item $|vx| \\ge 1$
    \\item $\\forall i \\ge 0, \\; uv^i wx^i y \\in L$
\\end{enumerate}

Since $|vwx| \\le p$, the pumped substring $vx$ cannot maintain balance across all symbol blocks.
Pumping with $i \\ne 1$ results in a string $s_i \\notin L$.
Contradiction! Hence, the language is not context-free.
\\end{proof}
\\end{document}`;

    navigator.clipboard.writeText(latexDoc).then(() => {
      onToast('LaTeX document copied to clipboard!', '📋');
    });
  };

  return (
    <div
      id="formal-proof-modal"
      className="modal-overlay active"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target.id === 'formal-proof-modal') onClose();
      }}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title" id="proof-modal-title">
            Formal Proof: {preset.name} is Not Context-Free
          </h3>
          <button
            id="btn-close-proof-modal"
            className="btn-ghost"
            style={{ padding: '0.3rem 0.6rem' }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="modal-body" ref={contentRef} id="proof-modal-content">
          {/* Rendered proof */}
        </div>
        <div className="modal-footer">
          <button id="btn-copy-proof-markdown" className="btn-secondary" onClick={handleCopyMarkdown}>
            📋 Copy Markdown
          </button>
          <button id="btn-copy-proof-latex" className="btn-primary" onClick={handleCopyLatex}>
            📋 Copy LaTeX
          </button>
        </div>
      </div>
    </div>
  );
}
