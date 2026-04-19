"use client";

import { useState }  from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppLogo }   from "@/components/ui/AppLogo";
import { Button }    from "@/components/ui/Button";
import {
  BUSINESS_TYPE_PRESETS,
  BUSINESS_TYPE_LABELS,
  BUSINESS_TYPE_DESCRIPTIONS,
  RETAIL_SUB_TYPES,
  RETAIL_SUB_TYPE_LABELS,
  RETAIL_SUB_TYPE_DESCRIPTIONS,
  type BusinessType,
  type RetailSubType,
} from "@/lib/business-config";
import {
  MODULE_LIST,
  MODULE_TEMPLATES,
  BUSINESS_TYPE_TO_TEMPLATE,
  applyDependencies,
  type ModuleConfig,
} from "@/lib/modules";

const TYPES = Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[];

export default function OnboardingPage() {
  const router     = useRouter();
  const { update } = useSession();

  const [step,            setStep]            = useState<1 | 2>(1);
  const [businessType,    setBusinessType]    = useState<BusinessType>("retail");
  const [businessSubType, setBusinessSubType] = useState<RetailSubType>("GROCERY");
  const [setupMode,       setSetupMode]       = useState<"template" | "customize">("template");
  const [customModules,   setCustomModules]   = useState<ModuleConfig>(
    MODULE_TEMPLATES.retail.modules
  );
  const [businessName,    setBusinessName]    = useState("");
  const [businessPhone,   setBusinessPhone]   = useState("");
  const [businessCity,    setBusinessCity]    = useState("");
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState("");

  const preset = BUSINESS_TYPE_PRESETS[businessType];

  // The active template for the current business type
  const templateKey     = BUSINESS_TYPE_TO_TEMPLATE[businessType] ?? "retail";
  const activeTemplate  = MODULE_TEMPLATES[templateKey];

  // The modules that will actually be saved
  const effectiveModules: ModuleConfig =
    setupMode === "template" ? activeTemplate.modules : customModules;

  const handleTypeChange = (type: BusinessType) => {
    setBusinessType(type);
    // Re-seed custom modules from the new type's template
    const key = BUSINESS_TYPE_TO_TEMPLATE[type] ?? "retail";
    setCustomModules(MODULE_TEMPLATES[key].modules);
  };

  const handleModeSwitch = (mode: "template" | "customize") => {
    if (mode === "customize" && setupMode === "template") {
      // Seed customize state from the current template
      setCustomModules(activeTemplate.modules);
    }
    setSetupMode(mode);
  };

  const toggleModule = (id: keyof ModuleConfig) => {
    setCustomModules((prev) => applyDependencies({ ...prev, [id]: !prev[id] }));
  };

  const handleFinish = async () => {
    if (!businessName.trim()) {
      setError("Business name is required");
      return;
    }
    setSaving(true);
    setError("");

    const res = await fetch("/api/onboarding", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        businessType,
        businessSubType: businessType === "retail" ? businessSubType : null,
        modules:         effectiveModules,
        businessName,
        businessPhone,
        businessCity,
      }),
    });

    if (!res.ok) {
      setError("Failed to save — please try again");
      setSaving(false);
      return;
    }

    await update({ onboardingDone: true });
    router.replace("/dashboard");
  };

  const enabledCount = Object.values(effectiveModules).filter(Boolean).length;

  return (
    <div className="w-full max-w-lg">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <AppLogo href="#" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>

        <div className="p-8">
          {/* ── Step 1: Business type + modules ──────────────────── */}
          {step === 1 && (
            <>
              <div className="mb-6">
                <p className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-1">
                  Step 1 of 2
                </p>
                <h1 className="text-xl font-bold text-gray-900">What kind of business do you run?</h1>
                <p className="text-sm text-gray-500 mt-1">
                  This sets up the right features and labels for you.
                </p>
              </div>

              {/* Business type list */}
              <div className="space-y-2.5">
                {TYPES.map((type) => (
                  <div key={type}>
                    <button
                      type="button"
                      onClick={() => handleTypeChange(type)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
                        businessType === type
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-semibold text-sm ${businessType === type ? "text-primary-700" : "text-gray-800"}`}>
                            {BUSINESS_TYPE_LABELS[type]}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{BUSINESS_TYPE_DESCRIPTIONS[type]}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ml-3 ${
                          businessType === type ? "border-primary-500 bg-primary-500" : "border-gray-300"
                        }`}>
                          {businessType === type && (
                            <svg className="w-full h-full p-0.5" viewBox="0 0 16 16">
                              <path d="M13.5 4.5l-7 7L3 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Retail sub-type picker */}
                    {type === "retail" && businessType === "retail" && (
                      <div className="mt-2 ml-4 pl-4 border-l-2 border-primary-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          What kind of shop?
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {RETAIL_SUB_TYPES.map((sub) => (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => setBusinessSubType(sub)}
                              className={`text-left px-3 py-2.5 rounded-lg border-2 transition-all ${
                                businessSubType === sub
                                  ? "border-primary-400 bg-primary-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <p className={`text-xs font-semibold ${businessSubType === sub ? "text-primary-700" : "text-gray-700"}`}>
                                {RETAIL_SUB_TYPE_LABELS[sub]}
                              </p>
                              <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                                {RETAIL_SUB_TYPE_DESCRIPTIONS[sub]}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Template vs Customize toggle */}
              <div className="mt-5 border border-gray-200 rounded-xl overflow-hidden">
                {/* Mode switcher */}
                <div className="flex border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => handleModeSwitch("template")}
                    className={`flex-1 py-2.5 text-xs font-semibold transition ${
                      setupMode === "template"
                        ? "bg-primary-50 text-primary-700 border-b-2 border-primary-500"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Use template
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch("customize")}
                    className={`flex-1 py-2.5 text-xs font-semibold transition ${
                      setupMode === "customize"
                        ? "bg-primary-50 text-primary-700 border-b-2 border-primary-500"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Customize manually
                  </button>
                </div>

                <div className="p-4">
                  {setupMode === "template" ? (
                    /* Template view: show included modules as chips */
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2.5">
                        {activeTemplate.label} includes:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {MODULE_LIST.map((mod) => {
                          const on = activeTemplate.modules[mod.id as keyof ModuleConfig];
                          return (
                            <span
                              key={mod.id}
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                on
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-400 line-through"
                              }`}
                            >
                              {mod.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Customize view: module checkboxes */
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-3">
                        Choose which features to enable:
                      </p>
                      <div className="space-y-2">
                        {MODULE_LIST.map((mod) => {
                          const isOn      = customModules[mod.id as keyof ModuleConfig];
                          const parentOff = mod.dependsOn && !customModules[mod.dependsOn as keyof ModuleConfig];
                          return (
                            <label
                              key={mod.id}
                              className={`flex items-start gap-3 cursor-pointer ${parentOff ? "opacity-40 cursor-not-allowed" : ""}`}
                            >
                              <input
                                type="checkbox"
                                checked={isOn}
                                disabled={!!parentOff}
                                onChange={() => toggleModule(mod.id as keyof ModuleConfig)}
                                className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-700 leading-none">
                                  {mod.label}
                                  {mod.dependsOn && (
                                    <span className="text-[10px] font-normal text-gray-400 ml-1">
                                      requires {mod.dependsOn}
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">{mod.description}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="mt-3 px-1 flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {enabledCount} of {MODULE_LIST.length} modules enabled
                  {businessType === "retail" && businessSubType === "MEAT" && setupMode === "template" && (
                    <span className="ml-1 text-orange-600 font-medium">· Default unit: kg</span>
                  )}
                </p>
              </div>

              <div className="mt-5 flex justify-end">
                <Button onClick={() => setStep(2)}>Continue →</Button>
              </div>
            </>
          )}

          {/* ── Step 2: Business info ─────────────────────────────── */}
          {step === 2 && (
            <>
              <div className="mb-6">
                <p className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-1">
                  Step 2 of 2
                </p>
                <h1 className="text-xl font-bold text-gray-900">Tell us about your business</h1>
                <p className="text-sm text-gray-500 mt-1">
                  This will appear on your invoices. You can change it later in Settings.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g. Sharma Enterprises"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="+977-98XXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                  <input
                    type="text"
                    value={businessCity}
                    onChange={(e) => setBusinessCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g. Kathmandu"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); }}
                  className="text-sm text-gray-500 hover:text-gray-800 transition"
                >
                  ← Back
                </button>
                <div className="flex-1" />
                <Button onClick={handleFinish} loading={saving}>Finish Setup</Button>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        You can always update these settings later from the Settings page.
      </p>
    </div>
  );
}
