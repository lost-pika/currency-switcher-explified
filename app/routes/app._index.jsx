// app/routes/app._index.jsx (or wherever your settings component is)
import React, { useState, useCallback, useEffect } from "react";
import { useLoaderData } from "react-router";

const ALL_CURRENCIES = [
  { code: "USD", label: "USD - US Dollar" },
  { code: "EUR", label: "EUR - Euro" },
  { code: "GBP", label: "GBP - British Pound" },
  { code: "INR", label: "INR - Indian Rupee" },
  { code: "AUD", label: "AUD - Australian Dollar" },
  { code: "CAD", label: "CAD - Canadian Dollar" },
  { code: "JPY", label: "JPY - Japanese Yen" },
  { code: "CNY", label: "CNY - Chinese Yuan" },
  { code: "MXN", label: "MXN - Mexican Peso" },
  { code: "BRL", label: "BRL - Brazilian Real" },
];

const DEFAULT_SELECTED = ["USD", "EUR", "INR", "CAD"];

const MOCK_CHECKBOX_DATA = [
  { code: "USD_1", label: "USD - US Dollar", actualCode: "USD" },
  { code: "EUR_1", label: "EUR - Euro", actualCode: "EUR" },
  { code: "GBP_1", label: "GBP - British Pound", actualCode: "GBP" },
  { code: "INR_1", label: "INR - Indian Rupee", actualCode: "INR" },
  { code: "JPY_1", label: "JPY - Japanese Yen", actualCode: "JPY" },
  { code: "AUD_1", label: "AUD - Australian Dollar", actualCode: "AUD" },
];

export async function loader({ request }) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "unknown-shop";

  return {
    shop,
  };
}

// =========================================================================
// STEP 1: CURRENCY SELECTOR COMPONENT
// =========================================================================
function CurrencySelector({
  onNext,
  initialSelected = DEFAULT_SELECTED,
  initialDefault = "INR",
}) {
  const safeInitialSelected =
    Array.isArray(initialSelected) && initialSelected.length
      ? initialSelected
      : DEFAULT_SELECTED;

  const safeInitialDefault = initialDefault || "INR";

  const [selectedCodes, setSelectedCodes] = useState(safeInitialSelected);
  const [defaultCode, setDefaultCode] = useState(safeInitialDefault);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (Array.isArray(initialSelected) && initialSelected.length) {
      setSelectedCodes(initialSelected);
    }
  }, [initialSelected]);

  useEffect(() => {
    if (initialDefault) setDefaultCode(initialDefault);
  }, [initialDefault]);

  const selectedCurrencies = ALL_CURRENCIES.filter((c) =>
    selectedCodes.includes(c.code)
  );

  const toggleCode = useCallback(
    (code, checked) => {
      setSelectedCodes((prev) => {
        let next = checked ? [...prev, code] : prev.filter((c) => c !== code);

        if (defaultCode === code && !checked) {
          setDefaultCode(next.length > 0 ? next[0] : "");
        } else if (next.length === 0) {
          setDefaultCode("");
        }

        return Array.from(new Set(next));
      });
    },
    [defaultCode]
  );

  const handleRemoveAll = useCallback(() => {
    setSelectedCodes([]);
    setDefaultCode("");
  }, []);

  const handleSaveAndNext = () => {
    const dataToSave = {
      selectedCurrencies: selectedCodes,
      defaultCurrency: defaultCode,
      placement: "bottom-right",
    };
    console.log("💾 [Step1] Data being sent:", dataToSave);
    onNext(dataToSave);
  };

  const availableToAdd = ALL_CURRENCIES.filter(
    (c) => !selectedCodes.includes(c.code)
  );
  const isDisabled = selectedCodes.length === 0 || !defaultCode;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-5 items-start md:items-end mb-8 px-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1 cursor-pointer">
              <span className="text-xl">←</span>
              <span className="hover:underline">Settings</span>
            </div>
            <h1 className="text-3xl font-semibold text-gray-800">
              Auto Currency Converter
            </h1>
          </div>
          <div className="flex items-center gap-3 mt-2 md:mt-0">
            <span className="text-lg font-medium text-gray-500 whitespace-nowrap">
              Step 1/2
            </span>
            <div className="w-32 h-2 rounded-full bg-gray-300 overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all duration-300"
                style={{ width: "50%" }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <section className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-semibold">Choose Currencies</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Select which currencies your customers can switch between
                </p>
              </div>
              <button
                className="text-sm text-red-600 font-medium p-1 cursor-pointer hover:underline"
                onClick={handleRemoveAll}
              >
                Remove all
              </button>
            </div>

            <div className="min-h-12 rounded-lg bg-gray-50 p-3 flex flex-wrap gap-2 items-center border border-gray-300">
              {selectedCurrencies.length === 0 ? (
                <span className="text-sm text-gray-400">
                  No currencies selected
                </span>
              ) : (
                selectedCurrencies.map((c) => (
                  <div
                    key={c.code}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-300 text-sm text-gray-700 shadow-sm transition-all hover:bg-gray-100"
                  >
                    <span>{c.label}</span>
                    <button
                      className="border-none bg-transparent cursor-pointer text-gray-500 text-sm font-bold leading-none p-0 hover:text-gray-700"
                      onClick={() => toggleCode(c.code, false)}
                    >
                      &times;
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3 mt-6">
              {MOCK_CHECKBOX_DATA.map((item) => (
                <label
                  key={item.code}
                  className="flex items-center gap-2 text-sm text-gray-800 p-1 cursor-pointer hover:bg-gray-100 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer accent-teal-500 border-gray-300 rounded"
                    checked={selectedCodes.includes(item.actualCode)}
                    onChange={(e) =>
                      toggleCode(item.actualCode, e.target.checked)
                    }
                  />
                  <span className="select-none">{item.label}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-center w-full mt-4">
              <div className="relative">
                <button
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm font-medium cursor-pointer hover:bg-gray-50 shadow-sm"
                  onClick={() => setAddOpen((open) => !open)}
                  aria-expanded={addOpen}
                >
                  + Add currencies
                </button>

                {addOpen && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-20 w-80 max-h-64 overflow-y-auto bg-white rounded-lg shadow-2xl p-2 border border-gray-200">
                    {availableToAdd.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500 text-center">
                        All available currencies added.
                      </div>
                    ) : (
                      ALL_CURRENCIES.map((currency) => (
                        <label
                          key={currency.code}
                          className={`flex items-center gap-3 p-2 text-sm cursor-pointer rounded-md transition-colors ${
                            selectedCodes.includes(currency.code)
                              ? "text-gray-400 bg-gray-50"
                              : "hover:bg-gray-100"
                          }`}
                          onClick={
                            !selectedCodes.includes(currency.code)
                              ? () => toggleCode(currency.code, true)
                              : null
                          }
                        >
                          <input
                            type="checkbox"
                            checked={selectedCodes.includes(currency.code)}
                            readOnly
                            className="w-4 h-4 accent-teal-500 border-gray-300 rounded"
                          />
                          <span className="select-none">{currency.label}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold">Default Currency</h2>
            <p className="mt-1 text-sm text-gray-500">
              This currency will be selected by default for your store visitors.
            </p>

            <div className="mt-4 max-w-sm">
              <div className="relative rounded-lg border border-gray-300 bg-white shadow-sm overflow-hidden">
                <select
                  className="w-full border-none outline-none text-sm px-4 py-2.5 bg-transparent appearance-none cursor-pointer text-gray-700"
                  value={defaultCode}
                  onChange={(e) => setDefaultCode(e.target.value)}
                  disabled={selectedCurrencies.length === 0}
                >
                  <option value="" disabled>
                    Select default currency
                  </option>
                  {selectedCurrencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              {selectedCurrencies.length === 0 && (
                <p className="mt-2 text-xs text-red-500">
                  Please select at least one currency above to set a default.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="mt-8 flex justify-end gap-3 bg-gray-50 sticky bottom-0">
          <button className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors shadow-sm">
            Back
          </button>
          <button
            className="px-6 py-2.5 rounded-lg border-none bg-teal-500 text-white text-sm font-medium cursor-pointer hover:bg-teal-600 transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={handleSaveAndNext}
            disabled={isDisabled}
          >
            Save and Next
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// STEP 2: PLACEMENT SELECTOR COMPONENT
// =========================================================================
function PlacementSelector({
  onBack,
  onSave,
  initialPlacement = "Fixed Position",
  initialFixedCorner = "bottom-left",
  initialDistanceTop = 16,
  initialDistanceRight = 16,
  initialDistanceBottom = 16,
  initialDistanceLeft = 16,
}) {
  const [placement, setPlacement] = useState(initialPlacement);
  const [fixedCorner, setFixedCorner] = useState(initialFixedCorner);
  const [distanceTop, setDistanceTop] = useState(initialDistanceTop);
  const [distanceRight, setDistanceRight] = useState(initialDistanceRight);
  const [distanceBottom, setDistanceBottom] = useState(initialDistanceBottom);
  const [distanceLeft, setDistanceLeft] = useState(initialDistanceLeft);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPlacement(initialPlacement);
  }, [initialPlacement]);

  useEffect(() => {
    setFixedCorner(initialFixedCorner);
  }, [initialFixedCorner]);

  useEffect(() => setDistanceTop(initialDistanceTop), [initialDistanceTop]);
  useEffect(
    () => setDistanceRight(initialDistanceRight),
    [initialDistanceRight]
  );
  useEffect(
    () => setDistanceBottom(initialDistanceBottom),
    [initialDistanceBottom]
  );
  useEffect(() => setDistanceLeft(initialDistanceLeft), [initialDistanceLeft]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        placement,
        fixedCorner,
        distanceTop,
        distanceRight,
        distanceBottom,
        distanceLeft,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDistanceChange = (setter) => (event) => {
    const value = event.target.value.replace(/[^0-9]/g, "");
    setter(parseInt(value) || 0);
  };

  const handleArrowClick = (setter, increment) => (e) => {
    e.preventDefault();
    setter((prev) => Math.max(0, prev + increment));
  };

  const getCornerDistance = (corner) => {
    switch (corner) {
      case "top-right":
        return { top: `${distanceTop}px`, right: `${distanceRight}px` };
      case "top-left":
        return { top: `${distanceTop}px`, left: `${distanceLeft}px` };
      case "bottom-right":
        return { bottom: `${distanceBottom}px`, right: `${distanceRight}px` };
      case "bottom-left":
        return { bottom: `${distanceBottom}px`, left: `${distanceLeft}px` };
      default:
        return {};
    }
  };

  const isCornerChecked = (corner) =>
    placement === "Fixed Position" && fixedCorner === corner;

  const CornerCheckbox = ({ corner, initialPosition }) => {
    const isChecked = isCornerChecked(corner);

    const dynamicStyle = isChecked
      ? getCornerDistance(corner)
      : initialPosition;

    const handleClick = (e) => {
      e.preventDefault();
      if (placement !== "Fixed Position") {
        setPlacement("Fixed Position");
      }
      setFixedCorner(corner);
    };

    return (
      <div
        className={`absolute cursor-pointer p-1 transition-all duration-300 ${
          isChecked ? "shadow-md z-10" : ""
        }`}
        style={dynamicStyle}
        onClick={handleClick}
      >
        <div
          className={`w-4 h-4 rounded border border-gray-400 flex justify-center items-center transition-colors ${
            isChecked
              ? "bg-teal-500 border-teal-500"
              : "bg-white hover:bg-gray-100"
          }`}
        >
          {isChecked && (
            <span className="text-sm font-bold text-white mt-[-2px]">✓</span>
          )}
        </div>
      </div>
    );
  };

  const SpinButtonInput = ({ label, value, setter }) => {
    const textInputClasses =
      "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center appearance-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors";

    return (
      <div className="text-center">
        <span className="block text-sm text-gray-600 mb-2 font-medium">
          {label} (px)
        </span>
        <div className="relative w-32 mx-auto">
          <input
            type="text"
            value={`${value}px`}
            onChange={handleDistanceChange(setter)}
            className={textInputClasses}
          />
          <div className="absolute inset-y-0 right-0 flex flex-col justify-center border-l border-gray-300 rounded-r-lg overflow-hidden">
            <button
              onClick={handleArrowClick(setter, 1)}
              className="h-1/2 w-6 text-xs text-gray-600 hover:bg-gray-100 transition-colors"
            >
              ▲
            </button>
            <button
              onClick={handleArrowClick(setter, -1)}
              className="h-1/2 w-6 text-xs text-gray-600 hover:bg-gray-100 transition-colors border-t border-gray-300"
            >
              ▼
            </button>
          </div>
        </div>
      </div>
    );
  };

  const currentDistanceName =
    fixedCorner.split("-")[0].charAt(0).toUpperCase() +
    fixedCorner.split("-")[0].slice(1);
  const currentOppositeDistanceName =
    fixedCorner.split("-")[1].charAt(0).toUpperCase() +
    fixedCorner.split("-")[1].slice(1);

  const getMainDistance = () =>
    fixedCorner.includes("top")
      ? [distanceTop, setDistanceTop]
      : [distanceBottom, setDistanceBottom];
  const getOppositeDistance = () =>
    fixedCorner.includes("right")
      ? [distanceRight, setDistanceRight]
      : [distanceLeft, setDistanceLeft];

  const [mainDistance, setMainDistance] = getMainDistance();
  const [oppositeDistance, setOppositeDistance] = getOppositeDistance();

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-5 items-start md:items-end mb-8 px-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1 cursor-pointer">
              <span className="text-xl">←</span>
              <span className="hover:underline" onClick={onBack}>
                Settings
              </span>
            </div>
            <h1 className="text-3xl font-semibold text-gray-800">
              Auto Currency Converter
            </h1>
          </div>
          <div className="flex items-center gap-3 mt-2 md:mt-0">
            <span className="text-lg font-medium text-gray-500 whitespace-nowrap">
              Step 2/2
            </span>
            <div className="w-32 h-2 rounded-full bg-gray-300 overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all duration-300"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <section className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Placement Location</h2>
              <p className="mt-1 text-sm text-gray-500">
                Choose where the currency selector will appear on your store.
              </p>
            </div>

            <div className="mt-4 max-w-lg mx-auto">
              <div className="relative rounded-lg border border-gray-300 bg-white shadow-sm overflow-hidden">
                <select
                  className="w-full border-none outline-none text-sm px-4 py-2.5 bg-transparent appearance-none cursor-pointer text-gray-700"
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value)}
                >
                  <option value="Fixed Position">Fixed Position</option>
                  <option value="Inline with the header">
                    Inline with the header
                  </option>
                  <option value="Don't show at all">Don't show at all</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex justify-center py-8">
              <div className="w-full max-w-xs h-60 border-4 border-gray-400 rounded-xl relative bg-white shadow-lg overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1/4 bg-white flex justify-center items-center border-b border-gray-200">
                  <span className="text-gray-400 text-sm font-semibold">
                    Store Header Placeholder
                  </span>
                </div>

                <div className="absolute top-1/4 left-0 w-full h-3/4 flex justify-center items-center bg-gray-50">
                  <span className="text-gray-400 text-sm">Store Content</span>
                </div>

                <CornerCheckbox
                  corner="top-left"
                  initialPosition={{ top: 8, left: 8 }}
                />
                <CornerCheckbox
                  corner="top-right"
                  initialPosition={{ top: 8, right: 8 }}
                />
                <CornerCheckbox
                  corner="bottom-left"
                  initialPosition={{ bottom: 8, left: 8 }}
                />
                <CornerCheckbox
                  corner="bottom-right"
                  initialPosition={{ bottom: 8, right: 8 }}
                />

                {placement === "Inline with the header" && (
                  <div className="absolute top-2 right-2 p-1">
                    <div
                      className={`w-4 h-4 rounded border border-gray-400 bg-teal-500 flex justify-center items-center shadow-md`}
                    >
                      <span className="text-sm font-bold text-white mt-[-2px]">
                        ✓
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {placement === "Fixed Position" && (
              <div className="flex flex-col sm:flex-row justify-center gap-8 mt-5">
                <SpinButtonInput
                  label={`Distance from ${currentDistanceName}`}
                  value={mainDistance}
                  setter={setMainDistance}
                />
                <SpinButtonInput
                  label={`Distance from ${currentOppositeDistanceName}`}
                  value={oppositeDistance}
                  setter={setOppositeDistance}
                />
              </div>
            )}
          </section>
        </div>

        <div className="mt-8 flex justify-end gap-3 bg-gray-50 sticky bottom-0">
          <button
            className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors shadow-sm"
            onClick={onBack}
          >
            Back
          </button>
          <button
            className="px-6 py-2.5 rounded-lg border-none bg-teal-500 text-white text-sm font-medium cursor-pointer hover:bg-teal-600 transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save and Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// STEP 3: CONFIRMATION COMPONENT
// =========================================================================
function ConfirmationScreen({ onReview }) {
  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50 font-sans flex justify-center items-center h-screen flex-col">
      <div className="bg-white rounded-xl p-12 text-center max-w-md shadow-2xl border border-gray-200">
        <div className="text-5xl mb-4">
          <span role="img" aria-label="Check Mark">
            ✅
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Setup Complete!
        </h1>
        <p className="text-base text-gray-600 mt-4">
          Your Auto Currency Converter settings have been successfully
          configured and are now active on your store.
        </p>
        <button
          className="mt-8 px-6 py-3 rounded-lg border border-teal-500 bg-teal-500 text-white text-sm font-semibold cursor-pointer hover:bg-teal-600 transition-colors shadow-lg"
          onClick={onReview}
        >
          Review Settings
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// MAIN EXPORT
// =========================================================================
export default function SettingsRoute() {
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState({});
  const [loading, setLoading] = useState(true);
// const { shop } = useLoaderData();
const shop = new URLSearchParams(window.location.search).get("shop");
console.log("loader data:", useLoaderData());

  // Load saved settings from backend on mount
  useEffect(() => {
  (async () => {
    try {
      if (!shop) {
        console.warn("No shop identifier");
        return;
      }

      console.log("📝 Loading settings for shop:", shop);

      const res = await fetch(
        `/api/merchant-settings?shop=${encodeURIComponent(shop)}`
      );

      console.log("🟢 fetch returned");

      if (!res.ok) {
        console.warn("Failed to fetch settings:", res.status);
        return;
      }

      const json = await res.json();
      console.log("✅ Loaded settings:", json);
      setStep1Data(json);
    } catch (err) {
      console.error("❌ Failed to load saved settings:", err);
    } finally {
      setLoading(false); // ✅ ALWAYS runs now
    }
  })();
}, [shop]);



  const handleStep1Save = useCallback((data) => {
    console.log("📝 [Step1] Saving:", data);
    setStep1Data((prev) => ({ ...prev, ...data }));
    setStep(2);
  }, []);

  const handleStep2Save = useCallback(
    async (data) => {
      const payloadForBackend = {
        currencies: step1Data.selectedCurrencies,
        defaultCurrency: step1Data.defaultCurrency,
        placement: data.placement,
        fixedCorner: data.fixedCorner,
        distanceTop: data.distanceTop,
        distanceRight: data.distanceRight,
        distanceBottom: data.distanceBottom,
        distanceLeft: data.distanceLeft,
      };

      console.log("📝 [Step2] Sending to /api/settings:", payloadForBackend);

      try {
        const res = await fetch("/api/merchant-settings", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    shop,
    currencies: step1Data.selectedCurrencies,
    defaultCurrency: step1Data.defaultCurrency,
    placement: data.placement,
  }),
});


        const text = await res.text();
        console.log("📝 [Step2] Response status:", res.status);
        console.log("📝 [Step2] Response body:", text);

        if (!res.ok) {
          console.error("❌ Save failed:", res.status, text);
          throw new Error(`Save failed: ${res.status}`);
        }

        const json = JSON.parse(text);
        console.log("✅ [Step2] Settings saved successfully");
        setStep(3);
      } catch (err) {
        console.error("❌ [Step2] Could not save settings", err);
        alert("Failed to save settings: " + (err.message || err));
      }
    },
    [step1Data]
  );

  if (loading) {
    return <div className="p-6">Loading settings…</div>;
  }

  if (step === 1) {
    return (
      <CurrencySelector
        onNext={handleStep1Save}
        initialSelected={step1Data.selectedCurrencies}
        initialDefault={step1Data.defaultCurrency || "INR"}
      />
    );
  }

  if (step === 2) {
    return (
      <PlacementSelector
        onBack={() => setStep(1)}
        onSave={handleStep2Save}
        initialPlacement={step1Data.placement || "Fixed Position"}
        initialFixedCorner={step1Data.fixedCorner || "bottom-left"}
        initialDistanceTop={step1Data.distanceTop ?? 16}
        initialDistanceRight={step1Data.distanceRight ?? 16}
        initialDistanceBottom={step1Data.distanceBottom ?? 16}
        initialDistanceLeft={step1Data.distanceLeft ?? 16}
      />
    );
  }

  if (step === 3) {
    return <ConfirmationScreen onReview={() => setStep(1)} />;
  }

  return null;
}
