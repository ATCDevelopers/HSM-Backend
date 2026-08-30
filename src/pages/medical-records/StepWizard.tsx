import { ReactNode } from "react";

interface StepWizardProps {
  title: string;
  subtitle: string;
  stepLabels: string[];
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  submitting?: boolean;
  children: ReactNode;
}

export default function StepWizard({
  title,
  subtitle,
  stepLabels,
  currentStep,
  onNext,
  onBack,
  submitting = false,
  children,
}: StepWizardProps) {
  const isLastStep = currentStep === stepLabels.length - 1;

  return (
    <div className="mx-auto max-w-3xl rounded-2xl bg-white shadow-sm">
      <div className="border-b border-gray-100 px-8 pb-5 pt-6">
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>

      <div className="flex items-center px-8 pt-6">
        {stepLabels.map((label, idx) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`h-4 w-4 rounded-full ${
                  idx <= currentStep ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
              <span
                className={`mt-2 whitespace-nowrap text-xs font-medium ${
                  idx === currentStep
                    ? "text-blue-600"
                    : idx < currentStep
                      ? "text-gray-700"
                      : "text-gray-400"
                }`}
              >
                {idx + 1}.{label}
              </span>
            </div>
            {idx < stepLabels.length - 1 && (
              <div
                className={`mx-2 mb-5 h-0.5 flex-1 ${
                  idx < currentStep ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="px-8 py-8">{children}</div>

      <div className="flex justify-between border-t border-gray-100 px-8 py-5">
        <button
          type="button"
          onClick={onBack}
          disabled={currentStep === 0}
          className={`rounded-lg px-5 py-2.5 text-sm font-medium ${
            currentStep === 0
              ? "invisible"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Saving..." : isLastStep ? "Save" : "Next"}
        </button>
      </div>
    </div>
  );
}
