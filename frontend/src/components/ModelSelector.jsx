import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

function ScoreBars({ label, value }) {
  return (
    <div className="score-row">
      <span className="score-label">{label}</span>
      <div className="score-bars" aria-label={`${label} ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`score-bar ${i <= value ? 'filled' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

export function ModelSelector({ selectedModelId, onSelect }) {
  const [models, setModels] = useState([]);
  const [open, setOpen] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.getModels()
      .then((list) => {
        if (cancelled) return;
        setModels(list);
        if (!selectedModelId && list.length > 0) {
          const implemented = list.find((m) => m.implemented) || list[0];
          onSelect(implemented.id);
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => { cancelled = true; };
  }, []);

  const selected = models.find((m) => m.id === selectedModelId) || models[0];

  if (loadError) {
    return (
      <div className="model-selector model-selector-error" title={loadError}>
        <span className="model-label">Model</span>
        <span className="model-error">Unavailable</span>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="model-selector model-selector-loading">
        <span className="model-label">Model</span>
        <span className="model-placeholder">Loading…</span>
      </div>
    );
  }

  return (
    <div className="model-selector-wrapper">
      <button
        type="button"
        className="model-selector"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="model-label">Model</span>
        <span className="model-name">{selected.display_name}</span>
        <svg
          className={`chevron ${open ? 'up' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="model-dropdown" role="listbox">
          {models.map((m) => {
            const isSelected = m.id === selected.id;
            return (
              <button
                key={m.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`model-option ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onSelect(m.id);
                  setOpen(false);
                }}
              >
                <div className="model-option-header">
                  <span className="model-option-name">{m.display_name}</span>
                  <span className="model-option-size">{m.parameters}</span>
                  {!m.implemented && (
                    <span
                      className="model-option-preview"
                      title="Preview — requests fall back to the default model until multi-model loading lands."
                    >
                      Preview
                    </span>
                  )}
                </div>
                <p className="model-option-desc">{m.description}</p>
                {m.notes && (
                  <p className="model-option-notes">{m.notes}</p>
                )}
                <div className="model-option-scores">
                  <ScoreBars label="Speed" value={m.speed_score} />
                  <ScoreBars label="Quality" value={m.quality_score} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
