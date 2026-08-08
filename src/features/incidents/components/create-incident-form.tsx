"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useServicesQuery, useUsersQuery } from "@/features/users/queries";
import { INCIDENT_SEVERITIES, INCIDENT_STATUSES } from "@/lib/types";
import { useCreateIncidentMutation } from "../queries";
import { FIELD_CLASS } from "./field-styles";

// Radix reserves value="" as its own sentinel, so "no assignee" needs a
// real value to round-trip through the Select.
const UNASSIGNED_VALUE = "__unassigned__";

// Mirrors the server's own rules in src/mocks/store.ts. Client-side
// validation is for fast feedback only — the server still validates, and
// any field errors it returns are mapped back onto these same fields.
const schema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters.")
    .max(120, "Title must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters.")
    .max(2000, "Description must be 2,000 characters or fewer."),
  severity: z.enum(INCIDENT_SEVERITIES, { message: "Select a severity." }),
  service: z.string().min(1, "Select a service."),
  status: z.enum(INCIDENT_STATUSES, { message: "Select an initial status." }),
  assigneeId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const FIELD_LABELS: Record<keyof FormValues, string> = {
  title: "Title",
  description: "Description",
  severity: "Severity",
  service: "Service",
  status: "Initial status",
  assigneeId: "Assignee",
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-red-600">
      {message}
    </p>
  );
}

function Hint({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1 text-xs text-neutral-500">
      {children}
    </p>
  );
}

export function CreateIncidentForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const mutation = useCreateIncidentMutation();
  const servicesQuery = useServicesQuery();
  const usersQuery = useUsersQuery();
  const summaryRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitted },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    // RHF's own error focusing only reaches native inputs — it can't focus
    // a Radix Select trigger, so if the only invalid field were Service,
    // focus would go nowhere. Disabled so the summary below is the single,
    // uniform focus target for every kind of field.
    shouldFocusError: false,
    defaultValues: {
      title: "",
      description: "",
      severity: "high",
      service: "",
      status: "triggered",
      assigneeId: UNASSIGNED_VALUE,
    },
  });

  // useWatch rather than watch(): watch() returns a function the React
  // Compiler can't safely memoize, so it bails out of optimizing this
  // component entirely (react-hooks/incompatible-library).
  const titleValue = useWatch({ control, name: "title" }) ?? "";
  const descriptionValue = useWatch({ control, name: "description" }) ?? "";
  const errorEntries = Object.entries(errors) as [keyof FormValues, { message?: string }][];
  const showSummary = isSubmitted && errorEntries.length > 0;

  // The requirement is focus moves to the first invalid field *or* a
  // validation summary. The summary is the reliable choice here: RHF's
  // built-in shouldFocusError only reaches native inputs, not the Radix
  // Select triggers, so a summary covers every field uniformly.
  //
  // Focusing can't happen inside the invalid handler itself — the summary
  // is conditionally rendered, so at that point it isn't in the DOM and
  // summaryRef.current is still null. It also can't depend on the counter
  // alone: on the *first* failed submit, RHF's errors/isSubmitted commit
  // in a separate render pass, so the summary still isn't mounted when
  // that effect fires. Depending on showSummary too means the focus lands
  // once the summary actually renders, and the counter (rather than a
  // boolean) makes a repeat failed submit re-focus it.
  const [failedSubmitCount, setFailedSubmitCount] = useState(0);

  useEffect(() => {
    if (failedSubmitCount > 0 && showSummary) summaryRef.current?.focus();
  }, [failedSubmitCount, showSummary]);

  function focusSummary() {
    setFailedSubmitCount((count) => count + 1);
  }

  function onSubmit(values: FormValues) {
    mutation.mutate(
      {
        title: values.title.trim(),
        description: values.description.trim(),
        severity: values.severity,
        service: values.service,
        status: values.status,
        assigneeId: values.assigneeId === UNASSIGNED_VALUE ? null : values.assigneeId,
      },
      {
        onSuccess: (incident) => {
          showToast({ variant: "success", title: `${incident.id} created` });
          router.push(`/incidents/${incident.id}`);
        },
        onError: (error) => {
          // Map server-side field errors back onto the form so they show
          // inline, next to the field they belong to. Everything the user
          // typed stays put — RHF holds the values regardless.
          if (error.fieldErrors) {
            for (const [field, messages] of Object.entries(error.fieldErrors)) {
              if (field in FIELD_LABELS && messages?.[0]) {
                setError(field as keyof FormValues, { type: "server", message: messages[0] });
              }
            }
            focusSummary();
          }
          showToast({
            variant: "error",
            title: "Couldn't create incident",
            description: error.userMessage,
          });
        },
      },
    );
  }

  return (
    <form
      // handleSubmit(...) is invoked inside the event handler rather than
      // during render: both callbacks read summaryRef, and building the
      // handler at render time trips react-hooks/refs (refs must not be
      // read during render).
      onSubmit={(event) => handleSubmit(onSubmit, focusSummary)(event)}
      noValidate
      className="flex flex-col gap-5"
    >
      {/* Summary only after a failed submit — not while the user is still
          filling things in for the first time. */}
      {showSummary && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 focus-visible:outline-2 focus-visible:outline-red-600"
        >
          <p className="flex items-center gap-1.5 text-sm font-medium text-red-800">
            <AlertCircle aria-hidden="true" className="h-4 w-4" />
            {errorEntries.length === 1
              ? "There is 1 problem with this form"
              : `There are ${errorEntries.length} problems with this form`}
          </p>
          <ul className="mt-1.5 list-inside list-disc text-xs text-red-700">
            {errorEntries.map(([field, error]) => (
              <li key={field}>
                <span className="font-medium">{FIELD_LABELS[field]}:</span> {error?.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label htmlFor="title" className="text-sm font-medium text-neutral-900">
          Title
        </label>
        <input
          id="title"
          type="text"
          {...register("title")}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "title-error" : "title-hint"}
          placeholder="Short summary of what's happening"
          className={`${FIELD_CLASS} mt-1 w-full px-2.5 placeholder:text-neutral-400`}
        />
        {errors.title ? (
          <FieldError id="title-error" message={errors.title.message} />
        ) : (
          <Hint id="title-hint">{titleValue.trim().length} / 120 characters (minimum 5)</Hint>
        )}
      </div>

      <div>
        <label htmlFor="description" className="text-sm font-medium text-neutral-900">
          Description
        </label>
        <textarea
          id="description"
          rows={5}
          {...register("description")}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? "description-error" : "description-hint"}
          placeholder="What's the impact, and what's known so far?"
          className="mt-1 w-full rounded-md border border-neutral-300 bg-white p-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        {errors.description ? (
          <FieldError id="description-error" message={errors.description.message} />
        ) : (
          <Hint id="description-hint">
            {descriptionValue.trim().length} / 2,000 characters (minimum 20)
          </Hint>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="severity" className="text-sm font-medium text-neutral-900">
            Severity
          </label>
          <Controller
            control={control}
            name="severity"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="severity"
                  aria-invalid={errors.severity ? true : undefined}
                  aria-describedby={errors.severity ? "severity-error" : undefined}
                  className="mt-1 w-full capitalize"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCIDENT_SEVERITIES.map((severity) => (
                    <SelectItem key={severity} value={severity} className="capitalize">
                      {severity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError id="severity-error" message={errors.severity?.message} />
        </div>

        <div>
          <label htmlFor="status" className="text-sm font-medium text-neutral-900">
            Initial status
          </label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="status"
                  aria-invalid={errors.status ? true : undefined}
                  aria-describedby={errors.status ? "status-error" : undefined}
                  className="mt-1 w-full capitalize"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCIDENT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError id="status-error" message={errors.status?.message} />
        </div>

        <div>
          <label htmlFor="service" className="text-sm font-medium text-neutral-900">
            Service
          </label>
          <Controller
            control={control}
            name="service"
            // field.value is always passed through as a string, never
            // undefined: flipping between the two makes Radix switch from
            // uncontrolled to controlled and warn. "" still shows the
            // placeholder.
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="service"
                  aria-invalid={errors.service ? true : undefined}
                  aria-describedby={errors.service ? "service-error" : undefined}
                  className="mt-1 w-full"
                >
                  <SelectValue placeholder="Select a service…" />
                </SelectTrigger>
                <SelectContent>
                  {servicesQuery.data?.items.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError id="service-error" message={errors.service?.message} />
        </div>

        <div>
          <label htmlFor="assigneeId" className="text-sm font-medium text-neutral-900">
            Assignee <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <Controller
            control={control}
            name="assigneeId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="assigneeId" className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                  {usersQuery.data?.items.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-neutral-100 pt-4">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          {mutation.isPending ? "Creating…" : "Create incident"}
        </button>
        <Link
          href="/incidents"
          className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
