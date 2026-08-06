"use client";

import { useUsersQuery } from "@/features/users/queries";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { Incident } from "@/lib/types";
import { useUpdateAssigneeMutation } from "../queries";

// Radix reserves value="" internally — "Unassigned" needs a real sentinel.
const UNASSIGNED_VALUE = "__unassigned__";

export function AssigneeControl({ incident }: { incident: Incident }) {
  const usersQuery = useUsersQuery();
  const mutation = useUpdateAssigneeMutation(incident.id);
  const { showToast } = useToast();

  const currentValue = incident.assignee?.id ?? UNASSIGNED_VALUE;

  function handleChange(value: string) {
    if (value === currentValue) return;

    const assigneeId = value === UNASSIGNED_VALUE ? null : value;
    const assigneeSnapshot = assigneeId
      ? (usersQuery.data?.items.find((u) => u.id === assigneeId) ?? null)
      : null;

    mutation.mutate(
      { assigneeId, assigneeSnapshot },
      {
        onSuccess: () => {
          showToast({
            variant: "success",
            title: assigneeSnapshot ? `Assigned to ${assigneeSnapshot.name}` : "Unassigned",
          });
        },
        onError: (error) => {
          showToast({
            variant: "error",
            title: "Couldn't update assignee",
            description: error.userMessage,
          });
        },
      },
    );
  }

  return (
    <div>
      <label htmlFor="assignee-control" className="sr-only">
        Assignee
      </label>
      <Select value={currentValue} onValueChange={handleChange} disabled={mutation.isPending}>
        <SelectTrigger id="assignee-control" className="w-full max-w-56">
          {/* Explicit children rather than letting SelectValue look up
              display text by matching currentValue against loaded
              SelectItems — that lookup shows blank until useUsersQuery
              resolves, even though we already know the display name
              directly from the incident itself. */}
          <SelectValue>{incident.assignee?.name ?? "Unassigned"}</SelectValue>
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
    </div>
  );
}
