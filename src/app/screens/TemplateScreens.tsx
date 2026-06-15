import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Copy, CheckCircle2, AlertTriangle, Layers, Calendar, FolderOpen, DollarSign, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { Modal } from '../components/shared/Modal';

function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-7">
      <div>
        <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

const criteriaTemplates = [
  {
    id: 1,
    name: 'Standard SE Hackathon',
    description: 'General-purpose template for software engineering competitions. Balances technical quality, innovation, UX, and presentation.',
    usedIn: 4,
    criteria: [
      { name: 'Technical Quality', description: 'Code quality, architecture, performance, scalability', maxScore: 10, weight: 40, order: 1, active: true },
      { name: 'Innovation', description: 'Originality, creative use of technology, novelty of approach', maxScore: 10, weight: 25, order: 2, active: true },
      { name: 'UI/UX Design', description: 'Interface usability, visual design, user experience quality', maxScore: 10, weight: 20, order: 3, active: true },
      { name: 'Presentation', description: 'Demo clarity, Q&A responses, communication effectiveness', maxScore: 10, weight: 15, order: 4, active: true },
    ],
  },
  {
    id: 2,
    name: 'AI-Focused Template',
    description: 'Tailored for AI/ML competitions. Emphasizes model accuracy, data handling, and ethical AI considerations.',
    usedIn: 2,
    criteria: [
      { name: 'Model Performance', description: 'Accuracy, precision, recall, F1 or relevant metrics', maxScore: 10, weight: 35, order: 1, active: true },
      { name: 'Innovation', description: 'Novelty of AI approach, use of cutting-edge techniques', maxScore: 10, weight: 25, order: 2, active: true },
      { name: 'Data Engineering', description: 'Data pipeline quality, preprocessing, feature engineering', maxScore: 10, weight: 20, order: 3, active: true },
      { name: 'Presentation & Ethics', description: 'Demo clarity, explainability, responsible AI considerations', maxScore: 10, weight: 20, order: 4, active: true },
    ],
  },
  {
    id: 3,
    name: 'Ideathon Lite',
    description: 'Lightweight template for idea-stage competitions. Less emphasis on code, more on vision and business impact.',
    usedIn: 1,
    criteria: [
      { name: 'Problem-Solution Fit', description: 'Clarity of problem identification and appropriateness of solution', maxScore: 10, weight: 30, order: 1, active: true },
      { name: 'Innovation & Creativity', description: 'Originality and creativity of the proposed solution', maxScore: 10, weight: 30, order: 2, active: true },
      { name: 'Feasibility', description: 'Technical and business feasibility of implementation', maxScore: 10, weight: 25, order: 3, active: true },
      { name: 'Presentation', description: 'Pitch quality, visual aids, Q&A performance', maxScore: 10, weight: 15, order: 4, active: true },
    ],
  },
];

const budgetPresets = [
  { id: 1, name: 'Standard Prize Set', items: [{ desc: 'First Place', qty: 1, unit: '15,000,000' }, { desc: 'Second Place', qty: 1, unit: '10,000,000' }, { desc: 'Third Place', qty: 1, unit: '5,000,000' }] },
  { id: 2, name: 'Catering Package', items: [{ desc: 'Meals & Drinks (per person)', qty: 60, unit: '80,000' }, { desc: 'Coffee Station', qty: 1, unit: '1,500,000' }] },
  { id: 3, name: 'Judge Honorarium', items: [{ desc: 'Guest Judge (per person)', qty: 2, unit: '2,000,000' }, { desc: 'Internal Judge Token', qty: 3, unit: '500,000' }] },
  { id: 4, name: 'Event Promotion', items: [{ desc: 'Poster Printing', qty: 1, unit: '800,000' }, { desc: 'Social Media Campaign', qty: 1, unit: '1,200,000' }, { desc: 'Email Campaign', qty: 1, unit: '500,000' }] },
];

export function TemplateCenter() {
  const [activeTab, setActiveTab] = useState<'criteria' | 'budget' | 'event' | 'round'>('criteria');
  const [editingTemplate, setEditingTemplate] = useState<typeof criteriaTemplates[0] | null>(null);
  const [editCriteria, setEditCriteria] = useState(criteriaTemplates[0].criteria);

  const tabs = [
    { id: 'criteria', label: 'Criteria Templates', icon: Layers },
    { id: 'budget', label: 'Budget Presets', icon: DollarSign },
    { id: 'event', label: 'Event Presets', icon: Calendar },
    { id: 'round', label: 'Round Presets', icon: FolderOpen },
  ] as const;

  const totalWeight = editCriteria.reduce((s, c) => s + c.weight, 0);

  if (editingTemplate) {
    return (
      <div className="p-7 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setEditingTemplate(null)} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">← Back to Templates</button>
        </div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Edit: {editingTemplate.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">Reusable template — changes apply to all future events using this template</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold ${totalWeight === 100 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
              {totalWeight === 100 ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              Total Weight: {totalWeight}%
            </div>
            <button onClick={() => setEditingTemplate(null)} className="bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Save Template</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" defaultValue={editingTemplate.name} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700" defaultValue={editingTemplate.description} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 text-sm">Criteria Rows</h3>
              <button
                onClick={() => setEditCriteria([...editCriteria, { name: 'New Criterion', description: '', maxScore: 10, weight: 0, order: editCriteria.length + 1, active: true }])}
                className="flex items-center gap-1.5 text-xs text-blue-700 font-medium hover:text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" /> Add Criterion
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Order', 'Name', 'Description', 'Max Score', 'Weight (%)', 'Active', ''].map(c => (
                      <th key={c} className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {editCriteria.map((c, i) => (
                    <tr key={i} className={`hover:bg-slate-50 transition-colors ${!c.active ? 'opacity-50' : ''}`}>
                      <td className="px-3 py-2.5">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 w-6 h-6 rounded flex items-center justify-center">{c.order}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700"
                          value={c.name}
                          onChange={e => {
                            const copy = [...editCriteria];
                            copy[i] = { ...copy[i], name: e.target.value };
                            setEditCriteria(copy);
                          }}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-700"
                          value={c.description}
                          onChange={e => {
                            const copy = [...editCriteria];
                            copy[i] = { ...copy[i], description: e.target.value };
                            setEditCriteria(copy);
                          }}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="number" min={1} max={100}
                          className="w-16 border border-slate-200 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-700"
                          value={c.maxScore}
                          onChange={e => {
                            const copy = [...editCriteria];
                            copy[i] = { ...copy[i], maxScore: Number(e.target.value) };
                            setEditCriteria(copy);
                          }}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number" min={0} max={100}
                            className={`w-16 border rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 ${totalWeight > 100 ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-700'}`}
                            value={c.weight}
                            onChange={e => {
                              const copy = [...editCriteria];
                              copy[i] = { ...copy[i], weight: Number(e.target.value) };
                              setEditCriteria(copy);
                            }}
                          />
                          <span className="text-xs text-slate-400">%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => {
                            const copy = [...editCriteria];
                            copy[i] = { ...copy[i], active: !copy[i].active };
                            setEditCriteria(copy);
                          }}
                          className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${c.active ? 'bg-blue-700' : 'bg-slate-300'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${c.active ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => setEditCriteria(editCriteria.filter((_, j) => j !== i))}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalWeight !== 100 && (
              <div className="flex items-center gap-2 mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">Total weight is <strong>{totalWeight}%</strong>. Must equal exactly <strong>100%</strong> before saving.</p>
              </div>
            )}
            {totalWeight === 100 && (
              <div className="flex items-center gap-2 mt-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <p className="text-sm text-emerald-700">Total weight is exactly 100%. Template is valid and can be saved.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-7 space-y-6">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Template & Configuration Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">Reusable setup templates — separate from live event data</p>
        </div>
      </div>

      {/* Important note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 flex items-start gap-3">
        <Layers className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Template Data vs Event Data</p>
          <p className="text-sm text-blue-700 mt-0.5">Templates here are reusable blueprints. When applied to an event, a copy is made and configured independently. Changes to a template do not affect existing events.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-slate-200 p-1.5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'criteria' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> New Criteria Template
            </button>
          </div>
          {criteriaTemplates.map(tmpl => (
            <div key={tmpl.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{tmpl.name}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{tmpl.description}</p>
                  <p className="text-xs text-slate-400 mt-1">Used in <strong>{tmpl.usedIn}</strong> events</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors" title="Duplicate">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setEditingTemplate(tmpl); setEditCriteria(tmpl.criteria); }} className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-100">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Criterion', 'Max Score', 'Weight', 'Active'].map(c => (
                        <th key={c} className="text-left px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tmpl.criteria.map((c, i) => (
                      <tr key={i} className={!c.active ? 'opacity-40' : ''}>
                        <td className="px-3 py-2">
                          <p className="text-sm font-medium text-slate-900">{c.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                        </td>
                        <td className="px-3 py-2 text-sm font-mono text-slate-700">{c.maxScore}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full">
                              <div className="h-1.5 bg-blue-600 rounded-full" style={{ width: `${c.weight}%` }} />
                            </div>
                            <span className="text-sm font-mono font-semibold text-blue-700">{c.weight}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {c.active
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            : <span className="text-xs text-slate-400">Inactive</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200">
                      <td className="px-3 py-2 text-xs font-semibold text-slate-600">Total Weight</td>
                      <td />
                      <td className="px-3 py-2">
                        <span className={`text-sm font-mono font-bold ${tmpl.criteria.reduce((s, c) => s + c.weight, 0) === 100 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {tmpl.criteria.reduce((s, c) => s + c.weight, 0)}%
                        </span>
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'budget' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> New Budget Preset
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {budgetPresets.map(preset => (
              <div key={preset.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{preset.name}</h3>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"><Copy className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100"><th className="text-left py-1.5 text-xs text-slate-400 font-medium">Description</th><th className="text-left py-1.5 text-xs text-slate-400 font-medium">Qty</th><th className="text-right py-1.5 text-xs text-slate-400 font-medium">Unit (VND)</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {preset.items.map((item, i) => (
                      <tr key={i}>
                        <td className="py-1.5 text-slate-700">{item.desc}</td>
                        <td className="py-1.5 text-slate-500 font-mono">{item.qty}</td>
                        <td className="py-1.5 text-right font-mono text-slate-700">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeTab === 'event' || activeTab === 'round') && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            {activeTab === 'event' ? <Calendar className="w-6 h-6 text-slate-400" /> : <FolderOpen className="w-6 h-6 text-slate-400" />}
          </div>
          <h3 className="font-semibold text-slate-700 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            {activeTab === 'event' ? 'Event Presets' : 'Round Presets'}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-5">
            {activeTab === 'event'
              ? 'Pre-configured event blueprints for common event types (Summer SE, AI Sprint, IoT Challenge). Coordinators can apply these when creating events.'
              : 'Reusable round configurations with preset names, promotion rules, and deadline templates for Preliminary and Final rounds.'}
          </p>
          <button className="inline-flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Create First {activeTab === 'event' ? 'Event' : 'Round'} Preset
          </button>
        </div>
      )}
    </div>
  );
}
